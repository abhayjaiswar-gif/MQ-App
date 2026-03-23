<script setup lang="ts">
import { ref } from 'vue';

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
</script>

<template>
  <div class="px-2 py-8 tailwind-wrapper bg-gradient-to-br from-slate-50 to-slate-100 min-h-[calc(100vh-100px)]">
    <div class="max-w-7xl mx-auto p-4 sm:p-8">
      
      <div class="bg-white rounded-2xl tracker-card p-8 shadow-xl shadow-slate-200/40 border border-slate-100 transition-all duration-500 animate-fade-in">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">Approve Stock Orders</h2>
            <div class="h-1.5 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mt-2"></div>
          </div>
        </div>
        
        <div class="table-container overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
          <table class="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100/50">Request ID</th>
                <th class="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100/50">School</th>
                <th class="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100/50">Item</th>
                <th class="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100/50">Qty</th>
                <th class="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100/50">Date</th>
                <th class="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100/50">Status</th>
                <th class="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100/50">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 table-body">
              <template v-for="req in requests" :key="req.id">
                <tr class="transition-all duration-300 hover:bg-slate-50 hover:shadow-sm group">
                  <td class="px-6 py-5 text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{{ req.id }}</td>
                  <td class="px-6 py-5 text-sm font-medium text-slate-600">{{ req.school }}</td>
                  <td class="px-6 py-5 text-sm font-medium text-slate-600">{{ req.itemName }}</td>
                  <td class="px-6 py-5 text-sm font-medium text-slate-600">
                    <span class="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold shadow-sm whitespace-nowrap">{{ req.quantity }}</span>
                  </td>
                  <td class="px-6 py-5 text-sm text-slate-500">{{ req.date }}</td>
                  <td class="px-6 py-5">
                    <span class="status-badge shadow-sm border" :class="req.statusClass">{{ req.status }}</span>
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex gap-2" v-if="req.status === 'Pending Approval'">
                      <button @click="handleApprove(req.id)" class="bg-green-50 text-green-600 border border-green-200 hover:bg-green-600 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 shadow-sm flex items-center gap-1.5 transform hover:scale-105 active:scale-95">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        Approve
                      </button>
                      <button @click="handleReject(req.id)" class="bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 shadow-sm flex items-center gap-1.5 transform hover:scale-105 active:scale-95">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-if="requests.length === 0">
                <td colspan="7" class="px-6 py-12 text-center text-sm font-medium text-slate-500 bg-slate-50/50">No pending orders.</td>
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-flex;
  letter-spacing: 0.025em;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
}
.status-pending { background-color: #fef3c7; color: #b45309; border-color: #fde68a; }
.status-delivered { background-color: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.status-rejected { background-color: #fef2f2; color: #b91c1c; border-color: #fecaca; }

.tracker-card {
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)!important;
  border: 1px solid #f1f5f9!important;
  transition: all 0.3s ease;
}

.table-container {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

table {
  text-indent: 0;
  border-color: inherit;
  border-collapse: collapse;
}

.table-body tr {
  border-bottom: 1px solid #f1f5f9;
}
.table-body tr:last-child {
  border-bottom: none;
}
</style>
