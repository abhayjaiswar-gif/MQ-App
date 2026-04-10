<template>
  <div class="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
    <header class="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Activity Audit Tracker</h1>
        <p class="text-slate-500 font-medium">Monitoring detailed coaching behavior and marking patterns</p>
      </div>
      <div class="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <span class="material-symbols-outlined text-slate-400 text-sm">calendar_month</span>
          <select v-model="selectedMonthYear" @change="fetchTrackerData"
            class="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer">
            <option v-for="opt in monthYearOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="h-8 w-[1px] bg-slate-200"></div>
        <input type="text" v-model="searchQuery" placeholder="Search Coach or School..."
          class="bg-transparent text-sm font-medium focus:outline-none w-48 text-slate-600" />
      </div>
    </header>
    <section v-if="suspiciousCoaches.length" class="max-w-7xl mx-auto mb-10">
      <div class="flex items-center gap-2 mb-4">
        <span class="material-symbols-outlined text-red-500 text-xl font-bold">warning</span>
        <h2 class="text-xs font-black text-slate-400 uppercase tracking-widest">Rapid Marking Alerts (Same Day)</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="alert in suspiciousCoaches" :key="alert.coach_id" @click="filterByCoach(alert.coach_name)"
          class="bg-red-50 border border-red-100 p-5 rounded-3xl cursor-pointer hover:bg-red-100 transition-all group scale-100 active:scale-95">
          <div class="flex justify-between items-start mb-2">
            <div>
              <div class="text-[10px] font-black text-red-400 uppercase tracking-widest">Bulk Done Flag</div>
              <div class="text-lg font-black text-red-600">{{ alert.coach_name }}</div>
            </div>
            <span
              class="material-symbols-outlined text-red-300 group-hover:text-red-500 transition-colors">touch_app</span>
          </div>
          <p class="text-xs text-red-500 font-medium leading-relaxed">
            Marked <span class="font-black">{{ alert.count }} plans</span> as 'Done' on
            <span class="font-black">{{ alert.date }}</span>.
          </p>
        </div>
      </div>
    </section>
    <section
      class="max-w-7xl mx-auto bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
      <div v-if="loading" class="flex flex-col items-center justify-center py-40 gap-4">
        <div class="w-10 h-10 border-4 border-[#1890FF] border-t-transparent rounded-full animate-spin"></div>
        <p class="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Auditing Assessment Data...</p>
      </div>
      <div v-else-if="filteredData.length" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50">
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Coach & Period</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">School</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill / LP</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status
              </th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marked On</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="row in filteredData" :key="row.lp_unique_id + row.coach_id"
              class="hover:bg-slate-50/50 transition-all duration-200 group">
              <td class="px-8 py-6">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#1890FF] group-hover:text-white transition-all">
                    <span class="material-symbols-outlined text-sm">person</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-black text-slate-800">{{ row.coach_name || 'Anonymous' }}</span>
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{{ row.week_no }}</span>
                  </div>
                </div>
              </td>
              <td class="px-8 py-6">
                <span class="text-xs font-bold text-slate-600">{{ row.school_name }}</span>
              </td>
              <td class="px-8 py-6">
                <div class="flex flex-col">
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{{ row.lp_no }}</span>
                  <span class="text-xs font-medium text-slate-700 leading-tight">{{ row.skill || 'General Curriculum'
                  }}</span>
                </div>
              </td>
              <td class="px-8 py-6 text-center text-sm font-black text-slate-700">
                <span :class="getStatusClass(row.lp_status)"
                  class="px-3 py-1 rounded-full text-[9px] uppercase tracking-widest border">
                  {{ row.lp_status || 'Pending' }}
                </span>
              </td>
              <td class="px-8 py-6">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[14px] text-slate-300">history</span>
                  <span class="text-[11px] font-medium text-slate-500">{{ formatTimestamp(row.status_updated_at)
                  }}</span>
                </div>
              </td>
              <td class="px-8 py-6 text-right">
                <button @click="showDetails(row)"
                  class="px-4 py-2 border border-slate-100 rounded-xl hover:bg-white hover:border-[#1890FF] hover:text-[#1890FF] transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm">
                  View LP
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="py-40 text-center">
        <span class="material-symbols-outlined text-5xl text-slate-200 mb-4 block">fact_check</span>
        <p class="text-slate-400 font-bold text-sm uppercase tracking-widest italic">No record found for this period</p>
      </div>
    </section>
    <div v-if="activeRow"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div class="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl relative">
        <button @click="activeRow = null"
          class="absolute top-6 right-6 w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 text-slate-400">
          <span class="material-symbols-outlined">close</span>
        </button>
        <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Curriculum Objective</div>
        <h2 class="text-2xl font-black text-slate-900 mb-4">{{ activeRow.skill }}</h2>
        <div class="bg-slate-50 p-6 rounded-2xl italic text-slate-600 leading-relaxed text-sm">
          "{{ activeRow.objective }}"
        </div>
        <div class="mt-8 flex justify-between items-center text-slate-400 font-medium text-xs">
          <span>{{ activeRow.school_name }}</span>
          <span>{{ activeRow.coach_name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
const loading = ref(true);
const trackerData = ref<any[]>([]);
const searchQuery = ref('');
const selectedMonthYear = ref(new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }));
const activeRow = ref<any>(null);
const monthYearOptions = computed(() => {
  const options = [];
  const date = new Date();
  for (let i = 0; i < 12; i++) {
    const m = new Date(date.getFullYear(), date.getMonth() - i, 1);
    options.push(m.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }));
  }
  return options;
});
const fetchTrackerData = async () => {
  loading.value = true;
  try {
    const res = await fetch(`/api/curriculum/tracker-summary?month_year=${selectedMonthYear.value}`);
    const data = await res.json();
    if (data.success) {
      trackerData.value = data.data;
    }
  } catch (err) {
    console.error('Audit fetch error:', err);
  } finally {
    loading.value = false;
  }
};
const suspiciousCoaches = computed(() => {
  if (!trackerData.value.length) return [];
  const grouped: any = {};
  trackerData.value.forEach(row => {
    if (row.lp_status === 'Done' && row.status_updated_at) {
      const date = new Date(row.status_updated_at).toLocaleDateString();
      const key = `${row.coach_id}-${date}`;
      if (!grouped[key]) {
        grouped[key] = { coach_name: row.coach_name, coach_id: row.coach_id, date, count: 0, total_assigned: 0 };
      }
      grouped[key].count++;
    }
  });
  const coaches = [...new Set(trackerData.value.map(r => r.coach_id))];
  const alerts: any[] = [];
  Object.values(grouped).forEach((g: any) => {
    if (g.count >= 2) {
      alerts.push(g);
    }
  });
  return alerts.sort((a, b) => b.count - a.count);
});
const filteredData = computed(() => {
  if (!searchQuery.value) return trackerData.value;
  const q = searchQuery.value.toLowerCase();
  return trackerData.value.filter(r =>
    (r.coach_name?.toLowerCase().includes(q)) ||
    (r.school_name?.toLowerCase().includes(q)) ||
    (r.skill?.toLowerCase().includes(q))
  );
});
const formatTimestamp = (ts: string) => {
  if (!ts) return 'Not Marked';
  const date = new Date(ts);
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
  });
};
const getStatusClass = (status: string) => {
  if (status === 'Done') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  if (status === 'Pending') return 'bg-amber-50 text-amber-600 border-amber-100';
  return 'bg-slate-50 text-slate-400 border-slate-100';
};
const filterByCoach = (name: string) => {
  searchQuery.value = name;
};
const showDetails = (row: any) => {
  activeRow.value = row;
};
onMounted(() => {
  fetchTrackerData();
});
</script>
<style scoped>
.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
</style>
