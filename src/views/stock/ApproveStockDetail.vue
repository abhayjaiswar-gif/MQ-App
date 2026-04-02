<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getEquipmentOrders, updateEquipmentOrderStatus } from '@/services/api';

interface EquipmentOrder {
  id: string;
  school: string;
  itemName: string;
  quantity: number;
  date: string;
  status: string;
  statusClass: string;
  requester: string;
  department: string;
  requestDate: string;
  item: string;
  brand: string;
  model: string;
  description: string;
  specifications: string;
  warranty: string;
  supplier: string;
  image_path: string;
}

const route = useRoute();
const router = useRouter();

const requests = ref<EquipmentOrder[]>([]);
const currentRequest = ref<EquipmentOrder | null>(null);
const loading = ref(false);
const error = ref('');

// Load equipment orders data
const loadOrders = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await getEquipmentOrders();
    if (response.success || response.status === 'success') {
      requests.value = response.data.map((order: any) => ({
        id: order.id.toString(),
        school: order.school_name,
        itemName: order.sku_name,
        quantity: order.qty,
        date: order.created_at,
        status: order.status,
        statusClass: getStatusClass(order.status),
        requester: order.user_name,
        department: 'Department',
        requestDate: order.created_at,
        item: order.sku_name,
        brand: order.size || '',
        model: '',
        description: '',
        specifications: order.size || '',
        warranty: '',
        supplier: '',
        image_path: order.image_path
      }));

      // Set current request based on route parameter
      const requestId = route.params.id as string;
      currentRequest.value = requests.value.find(r => r.id === requestId) || requests.value[0];
    } else {
      error.value = 'Failed to load orders';
    }
  } catch (err) {
    error.value = 'Error loading orders';
    console.error('Error:', err);
  } finally {
    loading.value = false;
  }
};

const getStatusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'admin approved':
    case 'ssgm verified':
    case 'processing':
    case 'delivered':
      return 'status-delivered';
    case 'rejected':
      return 'status-rejected';
    default:
      return 'status-pending';
  }
};

const handleApprove = async () => {
  if (!currentRequest.value) return;

  try {
    // Update backend status first
    await updateEquipmentOrderStatus(parseInt(currentRequest.value.id), 'Approved');

    // Update local state
    currentRequest.value.status = 'Approved';
    currentRequest.value.statusClass = 'status-delivered';

    alert(`✅ Request ${currentRequest.value?.id || 'N/A'} has been Approved Successfully!`);

    // Go back to Approve Stock Orders page with success indicator
    router.push({ path: '/stock/approve', query: { approved: currentRequest.value?.id } });
  } catch (error) {
    console.error('Error approving request:', error);
    alert('Failed to approve request. Please try again.');
  }
};

const handleReject = async () => {
  if (!currentRequest.value) return;

  if (confirm('Are you sure you want to reject this request?')) {
    try {
      // Update backend status first
      await updateEquipmentOrderStatus(parseInt(currentRequest.value.id), 'Rejected');

      // Update local state
      currentRequest.value.status = 'Rejected';
      currentRequest.value.statusClass = 'status-rejected';
      alert(`❌ Request ${currentRequest.value?.id || 'N/A'} has been Rejected.`);

      // Go back to Approve Stock Orders page with success indicator
      router.push({ path: '/stock/approve', query: { rejected: currentRequest.value?.id } });
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    }
  }
};

onMounted(() => {
  loadOrders();
});
</script>

<template>
  <div class="px-4 py-4 bg-[#f0f2f5] min-h-[calc(100vh-100px)]">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-slate-700">Loading request details...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <p class="text-red-600 text-lg">{{ error }}</p>
        <button @click="loadOrders" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">Retry</button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="currentRequest" class="max-w-7xl mx-auto">
      <div class="flex flex-col gap-1 mb-6">
        <h2 class="text-2xl font-bold text-black">Approve Stock Orders</h2>
        <div class="flex items-center gap-2 text-xs text-black">
          <!-- <span>Home</span>
          <span class="text-xs">›</span>
          <span>Approvals</span>
          <span class="text-xs">›</span>
          <span class="text-[#262626]">Pending Requests</span> -->
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <!-- Left Column: List -->
        <div class="xl:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden" style="border: 2px solid #b8babc;">
          <div class="px-6 py-4 bg-slate-50" style="border-bottom: 2px solid #b8babc;">
            <h3 class="font-bold text-lg text-black">Pending Stock Requests ({{requests.filter(req => req.status ===
              'Pending Approval').length }})</h3>
          </div>
          <div class="p-6 space-y-4">
            <!-- Request Cards -->
            <div v-for="req in requests" :key="req.id" :class="{
              'bg-[#e6f7ff] shadow-md': req.id === currentRequest?.id,
              'bg-white': req.id !== currentRequest?.id
            }"
              class="p-5 rounded-lg flex items-center justify-between hover:opacity-80 transition-all cursor-pointer"
              :style="req.id === currentRequest?.id ? 'border: 2px solid #b8babc;' : 'border: 2px solid #d9d9d9;'"
              @click="currentRequest = req">
              <div class="space-y-1 flex-1">
                <div class="pb-2" style="border-bottom: 1px solid #b8babc;">
                  <p class="text-sm font-bold text-black">
                    Request ID: {{ req.id }}
                  </p>
                  <p class="text-xs text-black mt-1">
                    <span class="font-bold">Requester:</span> {{ req.requester }} |
                    <span class="font-bold">Date:</span> {{ req.requestDate }}<br>
                    <span class="font-semibold">Item:</span> {{ req.item }}<br>
                    <span class="font-semibold">Brand:</span> {{ req.brand || '—' }}<br>
                    <span class="font-semibold">Qty:</span> {{ req.quantity }}<br>
                    <span class="font-semibold">Status:</span> {{ req.status }}

                  </p>
                </div>
                <!-- <div class="grid grid-cols-2 gap-4 text-xs">
                  <div class="pr-4" style="border-right: 1px solid #d9d9d9;">
                  
                    
                  </div>
                  <div class="pl-4">
                  
              
                  </div>
                </div> -->
              </div>
              <div class="pl-4" style="border-left: 1px solid #d9d9d9;">
                <button class="text-white px-5 py-1.5 rounded text-sm font-bold hover:opacity-90 transition-colors"
                  style="background-color: #1677ff;" @click.stop="currentRequest = req">
                  Verify
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Detail View -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden sticky top-24" style="border: 2px solid #b8babc;">
          <div class="px-6 py-4 bg-slate-50" style="border-bottom: 2px solid #b8babc;">
            <h3 class="font-bold text-base text-black">Request ID: {{ currentRequest?.id || 'N/A' }}</h3>
          </div>
          <div class="p-6 space-y-6">
            <!-- Request Details -->
            <div>
              <p class="text-sm font-bold text-black mb-3 uppercase tracking-wide text-[11px] pb-1"
                style="border-bottom: 2px solid #b8babc;">Request Details</p>
              <div class="grid grid-cols-2 gap-y-2 text-sm">
                <p class="text-black">Requester</p>
                <p class="text-black font-semibold text-right">{{ currentRequest?.requester || 'N/A' }}</p>
                <p class="text-black">Department</p>
                <p class="text-black font-semibold text-right">{{ currentRequest?.department || 'N/A' }}</p>
                <p class="text-black">Request Date</p>
                <p class="text-black font-semibold text-right">{{ currentRequest?.requestDate || 'N/A' }}</p>
                <p class="text-black">Urgency</p>
                <p class="text-black font-semibold text-right">Pending</p>
              </div>
            </div>

            <!-- Item Information -->
            <div>
              <p class="text-sm font-bold text-black mb-3 uppercase tracking-wide text-[11px] pb-1"
                style="border-bottom: 2px solid #b8babc;">Item Information</p>
              <div class="grid grid-cols-2 gap-y-2 text-sm mb-2">
                <p class="text-black">SKU Name</p>
                <p class="text-black font-semibold text-right">{{ currentRequest?.item || 'N/A' }}</p>
                <p class="text-black">Brand</p>
                <p class="text-black font-semibold text-right">{{ currentRequest?.brand || '—' }}</p>
                <p class="text-black">Model</p>
                <p class="text-black font-semibold text-right">{{ currentRequest?.model || '—' }}</p>
              </div>
              <div class="text-sm">
                <p class="text-black mb-1">Description</p>
                <p class="text-black text-xs leading-relaxed">{{ currentRequest?.description || '—' }}</p>
              </div>
              <div class="flex justify-between items-center mt-3 text-sm">
                <p class="text-black font-bold">Quantity requested</p>
                <p class="text-black font-bold">{{ currentRequest?.quantity || 0 }}</p>
              </div>
            </div>

            <!-- Equipment Information -->
            <div>
              <p class="text-sm font-bold text-black mb-3 uppercase tracking-wide text-[11px] pb-1"
                style="border-bottom: 2px solid #b8babc;">Equipment Information</p>
              <div class="grid grid-cols-2 gap-y-3 text-sm">
                <p class="text-black">Specifications</p>
                <p class="text-black text-right leading-tight">{{ currentRequest?.specifications || '—' }}</p>
                <p class="text-black">Warranty</p>
                <p class="text-black text-right leading-tight">{{ currentRequest?.warranty || '—' }}</p>
                <p class="text-black">Supplier</p>
                <p class="text-black text-right leading-tight">{{ currentRequest?.supplier || '—' }}</p>
              </div>
            </div>

            <!-- Approval Actions -->
            <div class="pt-4 space-y-4">
              <p class="text-sm font-bold text-black uppercase tracking-wide text-[11px]">Approval Actions</p>
              <div class="grid grid-cols-2 gap-3">
                <button @click="handleApprove"
                  class="bg-[#52c41a] text-white py-2 rounded font-bold text-sm hover:opacity-90 transition-opacity">
                  Approve
                </button>
                <button @click="handleReject"
                  class="bg-[#ff4d4f] text-white py-2 rounded font-bold text-sm hover:opacity-90 transition-opacity">
                  Reject
                </button>
              </div>
              <div>
                <label class="block text-sm font-bold text-black mb-2">Add Note (Optional)</label>
                <textarea
                  class="w-full rounded-lg p-3 text-sm font-bold focus:ring-2 focus:ring-[#b8babc] focus:border-[#1677ff] h-24 resize-none bg-gray-50 shadow-sm text-black"
                  style="border: 2px solid #d9d9d9;" placeholder="Enter your comments or notes here..."></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex items-center justify-center min-h-[400px]">
      <div class="text-center bg-white p-8 rounded-lg shadow-sm" style="border: 2px solid #b8babc;">
        <svg class="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 class="text-lg font-bold text-black mb-1">No Orders Found</h3>
        <p class="text-slate-500">There are no pending stock requests at the moment.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Your existing styles remain unchanged */
.tailwind-wrapper {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #0f172a;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.tracker-card {
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05) !important;
  border: 1px solid #1563b1 !important;
  transition: all 0.3s ease;
}
</style>
