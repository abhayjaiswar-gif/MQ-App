<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const loading = ref(false);
const statuses = ref<any[]>([]);

// Generate months (e.g., last 6 months to next 6 months)
const generateMonths = () => {
  const months = [];
  const date = new Date();
  date.setMonth(date.getMonth() - 6);
  for (let i = 0; i < 12; i++) {
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    months.push(`${month}-${year}`);
    date.setMonth(date.getMonth() + 1);
  }
  return months;
};

const availableMonths = ref(generateMonths());
const selectedMonth = ref(availableMonths.value[6]); // Current month

const fetchStatuses = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/curriculum/publish-status', {
      params: {
        user_id: authStore.user?.id,
        month_year: selectedMonth.value
      }
    });
    if (res.data.success) {
      statuses.value = res.data.statuses;
    }
  } catch (err) {
    console.error('Fetch Publish Status Error:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStatuses();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-10 px-4 font-sans">
    <div class="max-w-6xl mx-auto">
      <header class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-widest text-[#005daa] mb-2">Curriculum Operations</p>
          <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Report Card Status</h1>
          <p class="text-slate-500 font-medium mt-1">Track which weekly reports have been successfully published to Principals.</p>
        </div>
        
        <div class="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <span class="material-symbols-outlined text-slate-400 pl-3">calendar_month</span>
          <select v-model="selectedMonth" @change="fetchStatuses"
            class="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer pr-8 py-2 appearance-none">
            <option v-for="month in availableMonths" :key="month" :value="month">{{ month }}</option>
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
            <span class="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
          </div>
          <h3 class="text-lg font-bold text-slate-700">No Reports Found</h3>
          <p class="text-sm font-medium text-slate-400 max-w-sm">No curriculum tracking data found for the selected month. Try selecting a different month.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-100">
                <th class="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">School Name</th>
                <th class="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center w-24">Week 1</th>
                <th class="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center w-24">Week 2</th>
                <th class="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center w-24">Week 3</th>
                <th class="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center w-24">Week 4</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="school in statuses" :key="school.school_id" class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-6 py-5">
                  <p class="text-sm font-bold text-slate-800">{{ school.school_name }}</p>
                </td>
                <td class="px-6 py-5 text-center">
                  <div class="flex justify-center">
                    <span v-if="school.week_1_published" class="material-symbols-outlined text-emerald-500 text-xl font-bold">check_circle</span>
                    <span v-else class="text-slate-300 font-bold text-lg">-</span>
                  </div>
                </td>
                <td class="px-6 py-5 text-center">
                  <div class="flex justify-center">
                    <span v-if="school.week_2_published" class="material-symbols-outlined text-emerald-500 text-xl font-bold">check_circle</span>
                    <span v-else class="text-slate-300 font-bold text-lg">-</span>
                  </div>
                </td>
                <td class="px-6 py-5 text-center">
                  <div class="flex justify-center">
                    <span v-if="school.week_3_published" class="material-symbols-outlined text-emerald-500 text-xl font-bold">check_circle</span>
                    <span v-else class="text-slate-300 font-bold text-lg">-</span>
                  </div>
                </td>
                <td class="px-6 py-5 text-center">
                  <div class="flex justify-center">
                    <span v-if="school.week_4_published" class="material-symbols-outlined text-emerald-500 text-xl font-bold">check_circle</span>
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
</style>
