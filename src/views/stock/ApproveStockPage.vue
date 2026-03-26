<script setup lang="ts">
import { ref, computed } from 'vue';

const requests = ref([
  {
    id: 'REQ-1025',
    school: 'School 1',
    itemName: 'Projector',
    quantity: 2,
    date: 'Oct 28, 2023',
    status: 'Pending Approval',
    statusClass: 'status-pending'
  },
  {
    id: 'REQ-1024',
    school: 'School 2',
    itemName: 'Whiteboard markers',
    quantity: 50,
    date: 'Oct 26, 2023',
    status: 'Pending Approval',
    statusClass: 'status-pending'
  }
]);

const handleApprove = (id: string) => {
  const req = requests.value.find(r => r.id === id);
  if (req) {
    req.status = 'Approved';
    req.statusClass = 'status-delivered';
  }
};

const handleReject = (id: string) => {
  const req = requests.value.find(r => r.id === id);
  if (req) {
    req.status = 'Rejected';
    req.statusClass = 'status-rejected';
  }
};

const stats = computed(() => ({
  total: requests.value.length,
  pending: requests.value.filter(r => r.status === 'Pending Approval').length,
  approved: requests.value.filter(r => r.status === 'Approved').length,
  rejected: requests.value.filter(r => r.status === 'Rejected').length,
}));
</script>

<template>
  <div class="px-2 py-8 tailwind-wrapper bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen font-inter">
    <div class="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav class="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 font-manrope">
            <span>Portal</span>
            <span class="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Inventory</span>
            <span class="material-symbols-outlined text-[14px]">chevron_right</span>
            <span class="text-primary">Approve Orders</span>
          </nav>
          <h2 class="text-4xl font-extrabold text-[#1e293b] tracking-tight font-manrope">Approve Stock Orders</h2>
          <p class="text-slate-500 mt-1 text-sm font-inter">Review and action pending stock requests from schools.</p>
        </div>
      </div>

      <!-- Bento Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-blue-500 rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">Total Requests</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-[#1e293b] font-manrope">{{ stats.total }}</h3>
            <span class="text-blue-600 text-[10px] font-bold bg-blue-50 px-2 py-1 rounded-lg font-inter uppercase">All Time</span>
          </div>
        </div>
        <!-- Pending -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-amber-400 rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">Pending Approval</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-amber-600 font-manrope">{{ stats.pending }}</h3>
            <span class="text-amber-600 text-[10px] font-bold bg-amber-50 px-2 py-1 rounded-lg font-inter uppercase">Awaiting</span>
          </div>
        </div>
        <!-- Approved -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-emerald-500 rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">Approved</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-emerald-600 font-manrope">{{ stats.approved }}</h3>
            <span class="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-lg font-inter uppercase">Cleared</span>
          </div>
        </div>
        <!-- Rejected -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-rose-500 rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">Rejected</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-rose-600 font-manrope">{{ stats.rejected }}</h3>
            <span class="text-rose-600 text-[10px] font-bold bg-rose-50 px-2 py-1 rounded-lg font-inter uppercase">Declined</span>
          </div>
        </div>
      </div>

      <!-- Approval Table -->
      <div class="bg-white rounded-[28px] shadow-[0_8px_32px_rgba(0,28,58,0.04)] overflow-hidden border border-slate-100">
        <div class="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 class="font-manrope font-bold text-lg text-slate-800 flex items-center gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            Approval Requests
            <span class="text-sm font-normal text-slate-400 ml-2">({{ requests.length }} total)</span>
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Request ID</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">School</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Item</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope text-center">Qty</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Date</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Status</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <template v-for="req in requests" :key="req.id">
                <tr class="hover:bg-slate-50/50 transition-colors group">
                  <td class="px-8 py-5">
                    <span class="font-manrope text-sm font-bold text-slate-400 tracking-tight">#{{ req.id }}</span>
                  </td>
                  <td class="px-8 py-5 text-sm font-semibold text-slate-700">{{ req.school }}</td>
                  <td class="px-8 py-5 text-sm font-semibold text-slate-700">{{ req.itemName }}</td>
                  <td class="px-8 py-5 text-center">
                    <span class="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">{{ req.quantity }}</span>
                  </td>
                  <td class="px-8 py-5 text-sm text-slate-500">{{ req.date }}</td>
                  <td class="px-8 py-5">
                    <span class="status-badge border" :class="req.statusClass">{{ req.status }}</span>
                  </td>
                  <td class="px-8 py-5 text-right">
                    <div class="flex items-center justify-end gap-2" v-if="req.status === 'Pending Approval'">
                      <button @click="handleApprove(req.id)" class="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all active:scale-95 shadow-sm font-manrope uppercase tracking-widest">
                        <span class="material-symbols-outlined text-[16px]">check_circle</span>
                        Approve
                      </button>
                      <button @click="handleReject(req.id)" class="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-95 shadow-sm font-manrope uppercase tracking-widest">
                        <span class="material-symbols-outlined text-[16px]">cancel</span>
                        Reject
                      </button>
                    </div>
                    <span v-else class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">—</span>
                  </td>
                </tr>
              </template>
              <tr v-if="requests.length === 0">
                <td colspan="7" class="px-6 py-20 text-center">
                  <div class="flex flex-col items-center gap-3 opacity-40">
                    <span class="material-symbols-outlined text-[48px]">inventory_2</span>
                    <p class="font-bold uppercase text-[10px] tracking-widest font-manrope text-slate-500">No pending approvals</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.tailwind-wrapper {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #0f172a;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 700;
  display: inline-flex;
  letter-spacing: 0.07em;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  font-family: 'Manrope', sans-serif;
}
.status-pending { background-color: #fef3c7; color: #b45309; border-color: #fde68a; }
.status-delivered { background-color: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.status-rejected { background-color: #fef2f2; color: #b91c1c; border-color: #fecaca; }
</style>

