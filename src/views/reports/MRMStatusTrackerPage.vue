<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const loading = ref(false);
const statuses = ref<any[]>([]);

const generateYears = () => {
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    years.push(i.toString());
  }
  return years.reverse();
};

const availableYears = ref(generateYears());
const selectedYear = ref(new Date().getFullYear().toString());

const fetchStatuses = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/reports/mrm-status', {
      params: {
        user_id: authStore.user?.id,
        year: selectedYear.value
      }
    });
    if (res.data.success) {
      statuses.value = res.data.statuses;
    }
  } catch (err) {
    console.error('Fetch MRM Status Error:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStatuses();
});

const months = [
  { key: 'jan', label: 'Jan' },
  { key: 'feb', label: 'Feb' },
  { key: 'mar', label: 'Mar' },
  { key: 'apr', label: 'Apr' },
  { key: 'may', label: 'May' },
  { key: 'jun', label: 'Jun' },
  { key: 'jul', label: 'Jul' },
  { key: 'aug', label: 'Aug' },
  { key: 'sep', label: 'Sep' },
  { key: 'oct', label: 'Oct' },
  { key: 'nov', label: 'Nov' },
  { key: 'dec_m', label: 'Dec' },
];
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-10 px-4 font-sans">
    <div class="max-w-7xl mx-auto">
      <header class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-widest text-[#005daa] mb-2">Reports Operations</p>
          <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">MRM Status Tracker</h1>
          <p class="text-slate-500 font-medium mt-1">Track which Monthly Review Meetings have been successfully submitted across all assigned schools.</p>
        </div>
        
        <div class="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <span class="material-symbols-outlined text-slate-400 pl-3">calendar_today</span>
          <select v-model="selectedYear" @change="fetchStatuses"
            class="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer pr-8 py-2 appearance-none">
            <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
          </select>
        </div>
      </header>

      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div v-if="loading" class="p-20 flex flex-col items-center justify-center gap-4">
          <span class="material-symbols-outlined animate-spin text-4xl text-[#005daa]">refresh</span>
          <p class="text-sm font-bold text-slate-400">Loading statuses...</p>
        </div>
        
        <div v-else-if="statuses.length === 0" class="p-20 flex flex-col items-center justify-center gap-4 text-center">
          <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
            <span class="material-symbols-outlined text-4xl text-slate-300">domain_disabled</span>
          </div>
          <h3 class="text-lg font-bold text-slate-700">No Schools Found</h3>
          <p class="text-sm font-medium text-slate-400 max-w-sm">No assigned schools were found for tracking MRMs.</p>
        </div>

        <div v-else class="overflow-x-auto pb-4">
          <table class="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-100">
                <th class="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-50/90 backdrop-blur-sm z-10 shadow-[1px_0_0_#e2e8f0]">School Name</th>
                <th v-for="month in months" :key="month.key" class="px-3 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center w-16">
                  {{ month.label }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="school in statuses" :key="school.school_id" class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-6 py-5 sticky left-0 bg-white group-hover:bg-slate-50/50 shadow-[1px_0_0_#f1f5f9] transition-colors">
                  <p class="text-sm font-bold text-slate-800 truncate max-w-[200px]">{{ school.school_name }}</p>
                </td>
                <td v-for="month in months" :key="month.key" class="px-3 py-5 text-center">
                  <div class="flex justify-center">
                    <span v-if="school[month.key]" class="material-symbols-outlined text-emerald-500 text-xl font-bold">check_circle</span>
                    <span v-else class="text-slate-300 font-bold text-lg">-</span>
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
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
/* Ensure smooth scrolling for the table */
.overflow-x-auto {
  -webkit-overflow-scrolling: touch;
}
</style>
