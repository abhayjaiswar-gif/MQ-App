<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getEquipmentOrders, updateEquipmentOrderStatus } from '@/services/api';
interface EquipmentOrder {
  id: string;
  school_name: string;
  sku_name: string;
  qty: number;
  created_at: string;
  status: string;
  user_name: string;
  image_path: string;
  approve_ssgm: number;
  approve_admin: number;
  size?: string;
}
const orders = ref<EquipmentOrder[]>([]);
const loading = ref(false);
const error = ref('');
const deliveryDate = ref(new Date().toISOString().split('T')[0]);
const selectedOrder = ref<EquipmentOrder | null>(null);
const isApprovalModalOpen = ref(false);
const fetchOrders = async () => {
  loading.value = true;
  try {
    const response = await getEquipmentOrders();
    if (response.success) {
      // Show all SSGM Verified orders
      const filtered = response.data.filter((o: any) => o.approve_ssgm === 1);
      // Sort: Pending Admin (null or 0) first, Approved (1) last
      orders.value = filtered.sort((a: any, b: any) => {
        const aDone = a.approve_admin === 1 ? 1 : 0;
        const bDone = b.approve_admin === 1 ? 1 : 0;
        return aDone - bDone;
      });
    }
  } catch (err) {
    error.value = 'Failed to load orders';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const openApprovalModal = (order: EquipmentOrder) => {
  selectedOrder.value = order;
  isApprovalModalOpen.value = true;
};

const handleApprove = async () => {
  if (!selectedOrder.value) return;
  try {
    await updateEquipmentOrderStatus(parseInt(selectedOrder.value.id), 'Approved', deliveryDate.value);
    alert('Order approved successfully!');
    isApprovalModalOpen.value = false;
    fetchOrders(); // Refresh list
  } catch (err) {
    alert('Failed to approve order');
  }
};

const handleReject = async () => {
  if (!selectedOrder.value) return;
  if (!confirm('Are you sure you want to reject this order?')) return;
  try {
    await updateEquipmentOrderStatus(parseInt(selectedOrder.value.id), 'Rejected');
    alert('Order rejected');
    isApprovalModalOpen.value = false;
    fetchOrders();
  } catch (err) {
    alert('Failed to reject order');
  }
};

onMounted(fetchOrders);
</script>

<template>
  <div class="p-6 bg-slate-50 min-h-screen">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Admin Stock Approvals</h1>
          <p class="text-slate-500 mt-1">Review and finalize stock requests verified by SSGMs</p>
        </div>
        <div class="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
          <span class="text-sm font-medium text-slate-600">Pending Actions: </span>
          <span class="text-lg font-bold text-blue-600">{{ orders.length }}</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="orders.length === 0"
        class="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-slate-900">All caught up!</h3>
        <p class="text-slate-500 mt-1">No pending stock approvals from SSGMs at the moment.</p>
      </div>

      <!-- Orders Table -->
      <div v-else class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table class="w-full text-left">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Request ID</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">School</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item Name</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Qty</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="order in orders" :key="order.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 text-sm font-medium text-slate-900">#{{ order.id }}</td>
              <td class="px-6 py-4 text-sm text-slate-600">{{ order.school_name }}</td>
              <td class="px-6 py-4 text-sm text-slate-600 font-semibold">{{ order.sku_name }}</td>
              <td class="px-6 py-4 text-sm text-slate-600">{{ order.qty }}</td>
              <td class="px-6 py-4 text-sm text-slate-500">{{ new Date(order.created_at).toLocaleDateString() }}</td>
              <td class="px-6 py-4">
                <span v-if="order.approve_admin === 1"
                  class="px-2 py-1 text-[10px] font-bold rounded-full bg-green-100 text-green-600 uppercase">Done</span>
                <span v-else
                  class="px-2 py-1 text-[10px] font-bold rounded-full bg-orange-100 text-orange-600 uppercase">Pending
                  Admin</span>
              </td>
              <td class="px-6 py-4 text-right">
                <button @click="openApprovalModal(order)" :disabled="order.approve_admin === 1"
                  :class="order.approve_admin === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'"
                  class="px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  {{ order.approve_admin === 1 ? 'Approved' : 'Review & Approve' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Approval Modal -->
    <div v-if="isApprovalModalOpen && selectedOrder"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 class="text-lg font-bold text-slate-800">Final Approval: Order #{{ selectedOrder.id }}</h3>
          <button @click="isApprovalModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-6">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-slate-500">School</p>
              <p class="font-bold text-slate-900">{{ selectedOrder.school_name }}</p>
            </div>
            <div>
              <p class="text-slate-500">Requester</p>
              <p class="font-bold text-slate-900">{{ selectedOrder.user_name }}</p>
            </div>
            <div class="col-span-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p class="text-blue-700 text-xs font-bold uppercase mb-1">Item Details</p>
              <p class="text-blue-900 font-bold text-lg">{{ selectedOrder.sku_name }} (x{{ selectedOrder.qty }})</p>
              <p v-if="selectedOrder.size" class="text-blue-700 text-sm">Size: {{ selectedOrder.size }}</p>
            </div>
          </div>

          <!-- Document Link if available -->
          <div v-if="selectedOrder.image_path">
            <a :href="`/${selectedOrder.image_path}`" target="_blank"
              class="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Attached Document
            </a>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Set Expected Delivery Date</label>
            <input type="date" v-model="deliveryDate"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
        </div>

        <div class="p-6 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3">
          <button @click="handleReject"
            class="px-4 py-3 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            Reject Request
          </button>
          <button @click="handleApprove"
            class="px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all">
            Confirm & Approve
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped></style>
