<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { 
  getSchools, 
  getEquipmentOrders, 
  addEquipmentOrder,
  getStockReports,
  addStockReport
} from '@/services/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface EquipmentOrder {
  id: number;
  sku_name: string;
  qty: number;
  school_id: number;
  school_name: string;
  size: string;
  created_at: string;
  approve_ssgm: number | null;
  approve_admin: number | null;
  status_delivery: string | null;
  user_id: number;
  delivery_date: string | null;
  image_path: string | null;
}

interface StockReport {
  id: number;
  school_id: number;
  school_name: string;
  report_date: string;
  file_path: string;
  role_id: number;
  uploader_name: string;
}

interface School {
  id: number;
  name: string;
}

interface EquipmentItem {
  sku_name: string;
  qty: number | null;
  size: string;
}

// ─── State ───────────────────────────────────────────────────────────────────
const activeTab = ref<'order' | 'report'>('report');
const expandedOrderId = ref<number | null>(null);

// Orders
const orders = ref<EquipmentOrder[]>([]);
const ordersLoading = ref(false);
const ordersError = ref('');

// Pagination
const currentPage = ref(1);
const perPage = 5;

// Filter
const filterStatus = ref('all');
const filterSchool = ref('all');
const showFilterDropdown = ref(false);

// Stock Reports
const stockReports = ref<StockReport[]>([]);
const reportsLoading = ref(false);
const reportsError = ref('');
const filterMonth = ref('');
const filterDate = ref('');

// Schools dropdown
const schools = ref<School[]>([]);

// Order Modal
const isOrderModalOpen = ref(false);
const orderForm = ref({
  school_id: '' as string | number,
  items: [{ sku_name: '', qty: null as number | null, size: '' }] as EquipmentItem[],
  equipment_list_image: null as File | null,
});
const orderSubmitting = ref(false);
const orderSuccess = ref('');
const orderError = ref('');

// Report Modal
const isReportModalOpen = ref(false);
const reportForm = ref({
  school_id: '' as string | number,
  report_date: new Date().toISOString().split('T')[0],
  file_main: null as File | null,
});
const reportSubmitting = ref(false);
const reportSuccess = ref('');
const reportError = ref('');

// Template refs
const equipmentImageInput = ref<HTMLInputElement | null>(null);

const authStore = useAuthStore();
const BASE_URL = ''; // Base URL for static assets (uploads)

// ─── Tracker Steps ────────────────────────────────────────────────────────────
const trackerSteps = ['Requested', 'SSGM Verified', 'Admin Approved', 'Processing', 'Delivered'];

// ─── Computed ─────────────────────────────────────────────────────────────────
const processedOrders = computed(() => {
  return orders.value.map(row => {
    let step = 1;
    let status = 'Pending SSGM';
    let statusClass = 'status-pending';

    if (row.approve_ssgm === 1) {
      step = 2;
      status = 'Pending Admin';
      statusClass = 'status-pending';
      if (row.approve_admin === 1) {
        step = 3;
        status = 'Admin Approved';
        statusClass = 'status-processing';
        if (row.status_delivery === 'Processing') {
          step = 4;
          status = 'Processing Delivery';
          statusClass = 'status-processing';
        } else if (row.status_delivery === 'Delivered') {
          step = 5;
          status = 'Delivered';
          statusClass = 'status-delivered';
        }
      } else if (row.approve_admin === 0) {
        status = 'Rejected by Admin';
        statusClass = 'status-rejected';
      }
    } else if (row.approve_ssgm === 0) {
      status = 'Rejected by SSGM';
      statusClass = 'status-rejected';
    }

    const ssgmStatus = row.approve_ssgm === null ? 'pending' : row.approve_ssgm === 1 ? 'approved' : 'rejected';
    const adminStatus = row.approve_admin === null ? 'pending' : row.approve_admin === 1 ? 'approved' : 'rejected';
    const deliveryStatus = row.status_delivery === null ? 'pending' : row.status_delivery === 'Delivered' ? 'approved' : row.status_delivery === 'Rejected' ? 'rejected' : 'pending';
    const deliveryDate = row.delivery_date ? formatDate(row.delivery_date) : 'Admin Gives';

    return {
      ...row,
      step,
      status,
      statusClass,
      ssgmStatus,
      adminStatus,
      deliveryStatus,
      deliveryDate,
    };
  });
});

const filteredOrders = computed(() => {
  return processedOrders.value.filter(o => {
    const statusOk = filterStatus.value === 'all' || String(o.step) === filterStatus.value;
    const schoolOk = filterSchool.value === 'all' || String(o.school_id) === filterSchool.value;
    return statusOk && schoolOk;
  });
});

const totalPages = computed(() => Math.ceil(filteredOrders.value.length / perPage));

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredOrders.value.slice(start, start + perPage);
});

// ─── Stats ────────────────────────────────────────────────────────────────────
const stats = computed(() => ({
  total:      processedOrders.value.length,
  pendingSsgm: processedOrders.value.filter(o => o.step === 1).length,
  inLogistics: processedOrders.value.filter(o => o.step === 4).length,
  completed:   processedOrders.value.filter(o => o.step === 5).length,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(dateString: string) {
  if (!dateString) return 'Invalid Date';
  let date: Date = new Date(dateString);
  if (isNaN(date.getTime())) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleString('default', { month: 'long' });
}

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function goPage(p: number) {
  if (p < 1 || p > totalPages.value) return;
  currentPage.value = p;
}

function applyFilter() {
  currentPage.value = 1;
  showFilterDropdown.value = false;
}

function resetFilter() {
  filterStatus.value = 'all';
  filterSchool.value = 'all';
  currentPage.value = 1;
  showFilterDropdown.value = false;
}

// ─── API Calls ────────────────────────────────────────────────────────────────
async function fetchOrders() {
  ordersLoading.value = true;
  ordersError.value = '';
  try {
    const response = await getEquipmentOrders();
    orders.value = response.data || [];
  } catch (e: any) {
    ordersError.value = e || 'Error loading orders';
    orders.value = [];
  } finally {
    ordersLoading.value = false;
  }
}

async function fetchStockReports() {
  reportsLoading.value = true;
  reportsError.value = '';
  try {
    const data = await getStockReports(filterMonth.value, filterDate.value);
    stockReports.value = Array.isArray(data) ? data : [];
  } catch (e: any) {
    reportsError.value = e.message || 'Error loading reports';
    stockReports.value = [];
  } finally {
    reportsLoading.value = false;
  }
}

// Local fetch logic removed in favor of @/services/api

async function fetchSchools() {
  try {
    const data = await getSchools();
    schools.value = data || [];
  } catch {
    schools.value = [];
  }
}

// ─── Order Modal ──────────────────────────────────────────────────────────────
function addEquipmentRow() {
  orderForm.value.items.push({ sku_name: '', qty: null, size: '' });
}

function removeEquipmentRow(index: number) {
  if (orderForm.value.items.length > 1) {
    orderForm.value.items.splice(index, 1);
  }
}

function onEquipmentImageChange(e: Event) {
  const input = e.target as HTMLInputElement;
  orderForm.value.equipment_list_image = input.files?.[0] ?? null;
}

function openOrderModal() {
  orderForm.value = { school_id: '', items: [{ sku_name: '', qty: null, size: '' }], equipment_list_image: null };
  orderError.value = '';
  orderSuccess.value = '';
  isOrderModalOpen.value = true;
}

function closeOrderModal() {
  isOrderModalOpen.value = false;
}

async function submitOrderForm() {
  orderError.value = '';
  orderSuccess.value = '';

  if (!orderForm.value.school_id) { orderError.value = 'Please select a school.'; return; }

  const hasValidItems = orderForm.value.items.some(
    i => i.sku_name.trim() !== '' && (i.qty ?? 0) > 0 && i.size.trim() !== ''
  );

  if (!hasValidItems && !orderForm.value.equipment_list_image) {
    orderError.value = 'Please add equipment items or upload an image.';
    return;
  }

  orderSubmitting.value = true;
  try {
    await addEquipmentOrder({
      school_id: orderForm.value.school_id,
      items: orderForm.value.items,
      image: orderForm.value.equipment_list_image
    });

    orderSuccess.value = 'Equipment order placed successfully!';
    await fetchOrders();
    setTimeout(() => { isOrderModalOpen.value = false; }, 1200);
  } catch (e: any) {
    orderError.value = e.message || 'Failed to place order.';
  } finally {
    orderSubmitting.value = false;
  }
}

// ─── Report Modal ─────────────────────────────────────────────────────────────
function onReportFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  reportForm.value.file_main = input.files?.[0] ?? null;
}

function openReportModal() {
  reportForm.value = { school_id: '', report_date: new Date().toISOString().split('T')[0], file_main: null };
  reportError.value = '';
  reportSuccess.value = '';
  isReportModalOpen.value = true;
}

function closeReportModal() {
  isReportModalOpen.value = false;
}

async function submitReportForm() {
  reportError.value = '';
  reportSuccess.value = '';

  if (!reportForm.value.school_id) { reportError.value = 'Please select a school.'; return; }
  if (!reportForm.value.file_main) { reportError.value = 'Please upload an Image or PDF file.'; return; }

  const ext = reportForm.value.file_main.name.split('.').pop()?.toLowerCase() ?? '';
  if (!['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
    reportError.value = 'Only JPG, JPEG, PNG or PDF allowed.';
    return;
  }

  reportSubmitting.value = true;
  try {
    await addStockReport({
      school_id: reportForm.value.school_id,
      report_date: reportForm.value.report_date,
      file_main: reportForm.value.file_main
    });
    
    reportSuccess.value = 'Stock report added successfully!';
    await fetchStockReports();
    setTimeout(() => { isReportModalOpen.value = false; }, 1200);
  } catch (e: any) {
    reportError.value = e.message || 'Failed to submit report.';
  } finally {
    reportSubmitting.value = false;
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchSchools();
  fetchOrders();
  fetchStockReports();
  setInterval(async () => { await fetchOrders(); }, 30000);
});
</script>

<template>
  <div class="px-2 py-8 tailwind-wrapper min-h-screen bg-gradient-to-br from-slate-100 to-slate-100">
    <div class="max-w-7xl mx-auto p-4 sm:p-8">

      <!-- ─── Tabs ─────────────────────────────────────────────────── -->
      <div class="mb-8 flex gap-4 flex-wrap">
        <button
          @click="activeTab = 'report'"
          :class="activeTab === 'report'
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 ring-2 ring-offset-2 ring-blue-500 scale-105'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'"
          class="px-8 py-3 rounded-xl text-sm font-extrabold tracking-wide transition-all duration-300 ease-out flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Stock Report
        </button>
        <button
          @click="activeTab = 'order'"
          :class="activeTab === 'order'
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 ring-2 ring-offset-2 ring-blue-500 scale-105'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'"
          class="px-8 py-3 rounded-xl text-sm font-extrabold tracking-wide transition-all duration-300 ease-out flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Order Tracker
        </button>
      </div>

      <!-- ═══════════════════ ORDER TRACKER TAB ═══════════════════ -->
      <div v-if="activeTab === 'order'">

        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 class="text-2xl font-bold text-slate-900">Request Tracker</h1>
            <p class="text-sm text-slate-500 mt-1">Monitor your equipment procurement lifecycle in real-time.</p>
          </div>
          <div class="flex items-center gap-3 relative">
            <!-- Filter Button -->
            <div class="relative">
              <button
                @click="showFilterDropdown = !showFilterDropdown"
                class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h18M6 8h12M9 12h6M11 16h2" />
                </svg>
                Filter
              </button>
              <!-- Filter Dropdown -->
              <div
                v-if="showFilterDropdown"
                v-click-outside="() => showFilterDropdown = false"
                class="absolute right-0 top-11 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-56"
              >
                <div class="mb-3">
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select v-model="filterStatus" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Statuses</option>
                    <option value="1">Pending SSGM</option>
                    <option value="2">SSGM Verified</option>
                    <option value="3">Admin Approved</option>
                    <option value="4">Processing</option>
                    <option value="5">Delivered</option>
                  </select>
                </div>
                <div class="mb-4">
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">School</label>
                  <select v-model="filterSchool" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Schools</option>
                    <option v-for="s in schools" :key="s.id" :value="String(s.id)">{{ s.name }}</option>
                  </select>
                </div>
                <div class="flex gap-2">
                  <button @click="resetFilter" class="flex-1 px-3 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors">Reset</button>
                  <button @click="applyFilter" class="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">Apply</button>
                </div>
              </div>
            </div>

            <!-- New Order Button -->
            <button
              @click="openOrderModal"
              class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New Request
            </button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Requests</p>
            <p class="text-3xl font-bold text-slate-900">{{ stats.total }}</p>
            <p class="text-xs text-slate-400 mt-2">All orders</p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pending SSGM</p>
            <p class="text-3xl font-bold text-amber-600">{{ stats.pendingSsgm }}</p>
            <p class="text-xs text-slate-400 mt-2">Awaiting verification</p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">In Logistics</p>
            <p class="text-3xl font-bold text-blue-600">{{ stats.inLogistics }}</p>
            <p class="text-xs text-blue-500 mt-2">Processing delivery</p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Completed</p>
            <p class="text-3xl font-bold text-green-600">{{ stats.completed }}</p>
            <p class="text-xs text-slate-400 mt-2">Delivered</p>
          </div>
        </div>

        <!-- Loading / Error -->
        <div v-if="ordersLoading" class="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500 text-sm shadow-sm">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          Loading orders…
        </div>
        <div v-else-if="ordersError" class="bg-white rounded-xl border border-red-200 p-6 text-center text-red-600 text-sm shadow-sm">{{ ordersError }}</div>

        <!-- Orders List Card -->
        <div v-else>

          <!-- Empty -->
          <div v-if="filteredOrders.length === 0" class="py-16 text-center text-slate-400">
            <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p class="font-semibold">No orders found</p>
            <p class="text-sm mt-1">Try adjusting your filters or create a new request.</p>
          </div>

          <!-- Order Rows -->
          <template v-for="(order, idx) in paginatedOrders" :key="order.id">
            <div
  class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-4 hover:shadow-md transition-all"              :class="expandedOrderId === order.id ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'"
            >
              <div class="p-5">
                <!-- Row Top: badge + name + actions -->
                <div class="flex items-start justify-between gap-4 mb-4">
                  <div class="flex-1 min-w-0">
                    <!-- Badge row -->
                    <div class="flex items-center gap-2 flex-wrap mb-1.5">
                      <span class="order-id-badge">ORD-{{ String(order.id).padStart(4, '0') }}</span>
                      <span class="text-xs text-slate-400">{{ order.created_at }}</span>
                      <span class="status-badge" :class="order.statusClass">{{ order.status }}</span>
                      <a
                        v-if="order.image_path"
                        :href="`${BASE_URL}/${order.image_path}`"
                        target="_blank"
                        class="text-blue-500 hover:text-blue-700 text-xs font-semibold underline"
                      >View Image</a>
                    </div>
                    <!-- Name & meta -->
                    <p class="text-base font-bold text-slate-800 truncate">{{ order.sku_name }} <span class="font-normal text-slate-500">(x{{ order.qty }})</span></p>
                    <p class="text-sm text-slate-500 mt-0.5">{{ order.school_name }}{{ order.size ? ' · ' + order.size : '' }}</p>
                  </div>
                  <!-- Actions -->
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button
                      @click="expandedOrderId = expandedOrderId === order.id ? null : order.id"
                      class="flex items-center gap-1.5 px-3 py-1.5 border border-blue-500 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {{ expandedOrderId === order.id ? 'Hide' : 'Track' }}
                    </button>
                  </div>
                </div>

                <!-- Visual Tracker Steps (always visible, inline) -->
                <div class="flex items-center min-w-0 overflow-x-auto pb-1">
                  <template v-for="(stepLabel, index) in trackerSteps" :key="stepLabel">
                    <div class="flex flex-col items-center gap-1.5 flex-shrink-0">
                      <!-- Circle -->
                      <div
                        v-if="order.step > index + 1"
                        class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-sm shadow-green-200"
                      >
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                      </div>
                      <div
                        v-else-if="order.step === index + 1"
                        class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center ring-4 ring-blue-100 shadow-sm shadow-blue-200"
                      >
                        <div class="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                      </div>
                      <div v-else class="w-8 h-8 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center" />
                      <!-- Label -->
                      <span
                        class="text-[10px] font-semibold whitespace-nowrap"
                        :class="order.step > index + 1 ? 'text-green-600' : order.step === index + 1 ? 'text-blue-600' : 'text-slate-400'"
                      >{{ stepLabel }}</span>
                    </div>
                    <!-- Connector line -->
                    <div
                      v-if="index < trackerSteps.length - 1"
                      class="flex-grow h-[2px] mx-2 self-start mt-4 min-w-[20px]"
                      :class="order.step > index + 1 ? 'bg-green-400' : 'bg-slate-200'"
                    />
                  </template>
                </div>
              </div>

              <!-- Expanded Detail Row -->
              <div v-if="expandedOrderId === order.id" class="border-t border-blue-100 bg-white px-6 py-5">
                <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Order Details</h4>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p class="text-xs text-slate-400 mb-1">SSGM Status</p>
                    <span class="status-badge" :class="`status-${order.ssgmStatus}`">{{ statusLabel(order.ssgmStatus) }}</span>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400 mb-1">Admin Status</p>
                    <span class="status-badge" :class="`status-${order.adminStatus}`">{{ statusLabel(order.adminStatus) }}</span>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400 mb-1">Delivery</p>
                    <span class="status-badge" :class="`status-${order.deliveryStatus}`">{{ statusLabel(order.deliveryStatus) }}</span>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400 mb-1">Delivery Date</p>
                    <p class="font-semibold text-slate-700">{{ order.deliveryDate }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Footer / Pagination -->
          <div class="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-100">
            <span class="text-sm text-slate-500">
              Showing {{ Math.min((currentPage - 1) * perPage + 1, filteredOrders.length) }}–{{ Math.min(currentPage * perPage, filteredOrders.length) }} of {{ filteredOrders.length }} requests
            </span>
            <div class="flex items-center gap-1.5">
              <button
                @click="goPage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 text-sm font-semibold disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >‹</button>
              <button
                v-for="p in totalPages"
                :key="p"
                @click="goPage(p)"
                :class="p === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'"
                class="w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-semibold transition-colors"
              >{{ p }}</button>
              <button
                @click="goPage(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 text-sm font-semibold disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >›</button>
            </div>
          </div>
        </div>
      </div>
      <!-- END ORDER TRACKER TAB -->

      <!-- ═══════════════════ STOCK REPORT TAB ═══════════════════ -->
      <div v-else-if="activeTab === 'report'" class="bg-white rounded-xl tracker-card p-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 class="text-lg font-semibold text-slate-800">Stock Reports</h2>
          <div class="flex flex-wrap items-center gap-3">
            <select
              v-model="filterMonth"
              @change="fetchStockReports"
              class="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Months</option>
              <option v-for="m in 12" :key="m" :value="m">{{ new Date(2000, m-1, 1).toLocaleString('default', { month: 'long' }) }}</option>
            </select>
            <input
              type="date"
              v-model="filterDate"
              @change="fetchStockReports"
              class="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              @click="openReportModal"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Report
            </button>
          </div>
        </div>

        <div v-if="reportsLoading" class="text-center py-10 text-slate-500 text-sm">Loading reports…</div>
        <div v-else-if="reportsError" class="text-center py-6 text-red-600 text-sm">{{ reportsError }}</div>

        <div v-else class="table-container overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-400">
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">School Name</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Month</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploader</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Document</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-400 table-body">
              <tr v-for="rep in stockReports" :key="rep.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 text-sm text-slate-700">{{ rep.school_name }}</td>
                <td class="px-6 py-4 text-sm text-slate-700">{{ rep.report_date }}</td>
                <td class="px-6 py-4 text-sm text-slate-700">{{ formatDate(rep.report_date) }}</td>
                <td class="px-6 py-4 text-sm text-slate-700">{{ rep.uploader_name }}</td>
                <td class="px-6 py-4 text-sm">
                  <a
                    :href="`${BASE_URL}/${rep.file_path}`"
                    target="_blank"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </a>
                </td>
              </tr>
              <tr v-if="stockReports.length === 0">
                <td colspan="5" class="px-6 py-10 text-center text-sm text-slate-500">No reports found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- END STOCK REPORT TAB -->

    </div>

    <!-- ═══════════════════ ORDER MODAL ═══════════════════ -->
    <Teleport to="body">
      <div v-if="isOrderModalOpen" class="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden ring-1 ring-slate-100 max-h-[90vh] flex flex-col">
          <div class="px-6 py-4 border-b border-slate-400 flex justify-between items-center bg-slate-50 shrink-0">
            <h3 class="text-lg font-semibold text-slate-800">New Equipment Order</h3>
            <button @click="closeOrderModal" class="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-6">
            <div class="mb-6">
              <label class="block text-sm font-semibold text-slate-700 mb-2">School Name</label>
              <select v-model="orderForm.school_id" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select School</option>
                <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
              </select>
            </div>

            <div class="mb-8">
              <label class="block text-base font-semibold text-slate-800 mb-4">Equipment Items</label>
              <div class="border border-slate-400 rounded-lg overflow-hidden">
                <div class="bg-slate-50 border-b border-slate-300 grid grid-cols-12 gap-0">
                  <div class="px-4 py-4 text-sm font-semibold text-slate-700 uppercase tracking-wider col-span-7">SKU Name</div>
                  <div class="px-4 py-4 text-sm font-semibold text-slate-700 uppercase tracking-wider col-span-3 text-center">Quantity</div>
                  <div class="px-4 py-4 text-sm font-semibold text-slate-700 uppercase tracking-wider col-span-1 text-center">Delete</div>
                </div>
                <div v-for="(item, index) in orderForm.items" :key="index" class="border-b border-slate-300 last:border-b-0 grid grid-cols-12 gap-0 hover:bg-slate-50">
                  <div class="col-span-7 px-4 py-3">
                    <input v-model="item.sku_name" placeholder="Enter SKU name" class="w-full px-3 py-2.5 border border-slate-300 rounded text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div class="col-span-3 px-3 py-3">
                    <input v-model.number="item.qty" type="number" placeholder="0" min="0" class="w-full px-3 py-2.5 border border-slate-300 rounded text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center" />
                  </div>
                  <div class="col-span-2 px-4 py-3 flex justify-center">
                    <button v-if="orderForm.items.length > 1" @click="removeEquipmentRow(index)" class="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors p-2 rounded">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <button @click="addEquipmentRow" class="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add More Equipment
              </button>
            </div>

            <div class="mb-8">
              <label class="block text-base font-semibold text-slate-800 mb-4">Upload Equipment List</label>
              <div class="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input type="file" @change="onEquipmentImageChange" accept="image/*,.pdf" class="hidden" ref="equipmentImageInput" />
                <div class="space-y-3">
                  <svg class="w-12 h-12 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <p class="text-sm text-slate-600 mb-2">Click to upload or drag and drop</p>
                    <p class="text-xs text-slate-500">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                  </div>
                  <button @click="equipmentImageInput?.click()" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Select File</button>
                  <div v-if="orderForm.equipment_list_image" class="mt-3 text-sm text-slate-600">
                    <p class="font-medium">Selected: {{ orderForm.equipment_list_image.name }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="orderSuccess" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{{ orderSuccess }}</div>
            <div v-if="orderError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{{ orderError }}</div>
          </div>

          <div class="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 shrink-0">
            <button @click="closeOrderModal" class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">Cancel</button>
            <button @click="submitOrderForm" :disabled="orderSubmitting" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <svg v-if="orderSubmitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              {{ orderSubmitting ? 'Submitting...' : 'Submit Order' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══════════════════ REPORT MODAL ═══════════════════ -->
    <Teleport to="body">
      <div v-if="isReportModalOpen" class="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-slate-100">
          <div class="px-6 py-4 border-b border-slate-400 flex justify-between items-center bg-slate-50">
            <h3 class="text-lg font-semibold text-slate-800">Add Monthly Stock Report</h3>
            <button @click="closeReportModal" class="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-6 space-y-5">
            <div v-if="reportSuccess" class="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{{ reportSuccess }}</div>
            <div v-if="reportError" class="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{{ reportError }}</div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">School <span class="text-red-500">*</span></label>
              <select v-model="reportForm.school_id" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select School</option>
                <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Date <span class="text-red-500">*</span></label>
              <input type="date" v-model="reportForm.report_date" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Upload Image / PDF <span class="text-red-500">*</span></label>
              <div class="relative group cursor-pointer">
                <div class="absolute inset-0 bg-blue-50/50 border-2 border-dashed border-blue-300 rounded-xl group-hover:bg-blue-100 group-hover:border-blue-500 transition-colors pointer-events-none" />
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" @change="onReportFileChange" class="relative z-10 block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer bg-transparent focus:outline-none" />
              </div>
              <p class="mt-1.5 text-xs text-slate-500">JPG, PNG, PDF allowed.</p>
            </div>
          </div>
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button @click="closeReportModal" class="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-200 text-sm font-bold transition-colors">Cancel</button>
            <button @click="submitReportForm" :disabled="reportSubmitting" class="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-60 flex items-center gap-2">
              <svg v-if="reportSubmitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              {{ reportSubmitting ? 'Saving…' : 'Save Report' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.tailwind-wrapper {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #0f172a;
}

.order-id-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 5px;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  letter-spacing: 0.02em;
}

.status-badge {
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 0.68rem;
  font-weight: 700;
  display: inline-flex;
  letter-spacing: 0.025em;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  white-space: nowrap;
}
.status-pending    { background-color: #fef3c7; color: #b45309; border-color: #fde68a; }
.status-approved   { background-color: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.status-rejected   { background-color: #fef2f2; color: #b91c1c; border-color: #fecaca; }
.status-processing { background-color: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.status-delivered  { background-color: #f0fdf4; color: #15803d; border-color: #bbf7d0; }

.tracker-card {
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05) !important;
  border: 1px solid #f1f5f9 !important;
}

.table-container {
  border-radius: 12px;
  border: 1px solid #94a3b8;
}

table { border-collapse: collapse; }
</style>
