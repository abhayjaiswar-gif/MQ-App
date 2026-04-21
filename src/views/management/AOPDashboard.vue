<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const loading = ref(false);
const metadataLoading = ref(true);

const sports = ref<string[]>([]);
const selectedSport = ref<string>('All');

const stats = ref<any[]>([]);

const metrics = computed(() => {
  if (stats.value.length === 0) return { totalSports: 0, avgProgress: 0 };
  const total = stats.value.length;
  const avg = stats.value.reduce((acc, curr) => acc + (curr.progress || 0), 0) / total;
  return {
    totalSports: total,
    avgProgress: Math.round(avg)
  };
});

const fetchMetadata = async () => {
  metadataLoading.value = true;
  try {
    const userId = authStore.user?.id;
    const res = await axios.get(`/api/curriculum/aop-metadata?user_id=${userId}`);
    if (res.data.success) {
      sports.value = res.data.sports || [];
    }
  } catch (err) {
    console.error('Fetch Metadata Error:', err);
  } finally {
    metadataLoading.value = false;
  }
};

const fetchStats = async () => {
  loading.value = true;
  try {
    const userId = authStore.user?.id;
    const url = `/api/curriculum/aop-stats?sport=${selectedSport.value}&user_id=${userId}`;
    const res = await axios.get(url);
    if (res.data.success) {
      stats.value = res.data.stats;
    }
  } catch (err) {
    console.error('Fetch Stats Error:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchMetadata();
  fetchStats(); // Initial fetch for 'All'
});

watch(selectedSport, () => {
  fetchStats();
});

const getProgressColor = (progress: number) => {
  if (progress >= 80) return 'bg-emerald-500';
  if (progress >= 50) return 'bg-blue-500';
  if (progress >= 20) return 'bg-amber-500';
  return 'bg-rose-500';
};

const getSportIcon = (sportName: string) => {
  if (!sportName) return 'sports';
  const name = sportName.toLowerCase();
  if (name.includes('basket')) return 'sports_basketball';
  if (name.includes('foot') || name.includes('soccer')) return 'sports_soccer';
  if (name.includes('cricket')) return 'sports_cricket';
  if (name.includes('tennis')) return 'sports_tennis';
  if (name.includes('volley')) return 'sports_volleyball';
  if (name.includes('kabaddi')) return 'sports_kabaddi';
  if (name.includes('skat')) return 'ice_skating';
  if (name.includes('run') || name.includes('athlet')) return 'directions_run';
  return 'sports';
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-2">
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Section: Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1">
          <h1 class="text-3xl font-black tracking-tight text-slate-900">AOP Dashboard</h1>
          <p class="text-slate-500 text-sm font-medium">Tracking your assigned schools' progress against the
            institutional year plan.</p>
        </div>

        <!-- Section: Filter (Simplified) -->
        <div class="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <div class="flex flex-col px-4">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter by Sport</label>
            <select v-model="selectedSport"
              class="bg-transparent border-none focus:ring-0 text-sm font-bold p-0 pr-10 cursor-pointer min-w-[150px]">
              <option value="All">All Sports</option>
              <option v-for="s in sports" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <button @click="fetchStats"
            class="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors mr-1">
            <span class="material-symbols-outlined leading-none" :class="{ 'animate-spin': loading }">refresh</span>
          </button>
        </div>
      </div>

      <!-- Section: Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all duration-300">
          <div
            class="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
            <span class="material-symbols-outlined text-3xl font-variation-fill">sports</span>
          </div>
          <div>
            <p class="text-slate-500 text-[11px] font-black uppercase tracking-[0.15em] mb-1">Total Sports</p>
            <h3 class="text-4xl font-black text-slate-900 leading-none">{{ metrics.totalSports }}</h3>
          </div>
        </div>

        <div
          class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all duration-300">
          <div
            class="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
            <span class="material-symbols-outlined text-3xl font-variation-fill">trending_up</span>
          </div>
          <div>
            <p class="text-slate-500 text-[11px] font-black uppercase tracking-[0.15em] mb-1">Avg Progression</p>
            <div class="flex items-baseline gap-1">
              <h3 class="text-4xl font-black text-slate-900 leading-none">{{ metrics.avgProgress }}</h3>
              <span class="text-xl font-bold text-slate-400">%</span>
            </div>
          </div>
        </div>

        <div
          class="bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-indigo-100 flex items-center gap-6 text-white relative overflow-hidden">
          <div class="z-10">
            <p class="text-indigo-200 text-[11px] font-black uppercase tracking-[0.15em] mb-1">Target Excellence</p>
            <h3 class="text-xl font-bold leading-tight">MarcosQuay Curriculum 2026</h3>
          </div>
          <span
            class="material-symbols-outlined text-9xl absolute -right-4 -bottom-4 opacity-10 pointer-events-none">star</span>
        </div>
      </div>

      <!-- Section: Table -->
      <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="p-8 border-b border-slate-50 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-2 h-8 bg-indigo-600 rounded-full"></div>
            <h3 class="font-black text-xl text-slate-900">Curriculum Matrix</h3>
          </div>
          <div class="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
            AOP Tracking Mode
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sport Name</th>
                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Total
                  Plans</th>
                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                  Completed</th>
                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Progress
                  Breakdown</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="loading" class="animate-pulse">
                <td colspan="4" class="px-8 py-16 text-center text-slate-400 font-bold italic">Analyzing curriculum
                  data...</td>
              </tr>
              <tr v-else-if="stats.length === 0" class="bg-slate-50/30">
                <td colspan="4" class="px-8 py-16 text-center text-slate-400 font-bold italic">No data found for the
                  selected filters.</td>
              </tr>
              <tr v-for="item in stats" :key="item.sport" class="hover:bg-slate-50/70 transition-all group">
                <td class="px-8 py-6">
                  <div class="flex items-center gap-4">
                    <div
                      class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                      <span class="material-symbols-outlined text-xl">{{ getSportIcon(item.sport) }}</span>
                    </div>
                    <span class="text-base font-black text-slate-900">{{ item.sport }}</span>
                  </div>
                </td>
                <td class="px-8 py-6 text-center">
                  <span class="bg-slate-100 text-slate-600 py-1.5 px-4 rounded-full text-sm font-black">{{
                    item.total_plans }}</span>
                </td>
                <td class="px-8 py-6 text-center">
                  <span class="bg-emerald-50 text-emerald-700 py-1.5 px-4 rounded-full text-sm font-black">{{
                    item.completed_plans }}</span>
                </td>
                <td class="px-8 py-6 min-w-[280px]">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                      <span :class="item.progress === 100 ? 'text-emerald-600' : 'text-slate-400'">{{ item.progress }}%
                        Complete</span>
                      <span class="text-slate-300">{{ item.total_plans - item.completed_plans }} Left</span>
                    </div>
                    <div class="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5">
                      <div class="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                        :class="getProgressColor(item.progress)" :style="{ width: `${item.progress}%` }"></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-8 bg-slate-50/50 border-t border-slate-100">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
            Showing tracking metrics for {{ stats.length }} sports
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');

:deep(*) {
  font-family: 'Inter', sans-serif;
}

.material-symbols-outlined {
  font-family: 'Material Symbols Outlined' !important;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.font-variation-fill {
  font-variation-settings: 'FILL' 1;
}

select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 2s linear infinite;
}
</style>
