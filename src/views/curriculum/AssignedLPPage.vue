<template>
  <div class="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    
    <!-- ══ HEADER SECTION ══ -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[32px] shadow-[0_8px_32px_rgba(0,28,58,0.04)] border border-slate-50 relative overflow-hidden group">
      <div class="relative z-10">
        <div class="flex items-center gap-3 mb-2">
          <span class="bg-[#005daa]/10 text-[#005daa] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
            Schedule Overview
          </span>
          <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ monthRange }}</span>
        </div>
        <h2 class="text-4xl font-black text-[#1a1c1c] tracking-tight leading-none" style="font-family: 'Manrope', sans-serif;">
          Assigned <span class="text-[#005daa]">Lesson Plans</span>
        </h2>
        <p class="text-sm text-slate-500 font-medium mt-3 max-w-xl leading-relaxed">
          Manage and track curriculum distribution across all assigned schools. Review monthly schedules and update lesson plan statuses.
        </p>
      </div>
      <div class="flex items-center gap-3 relative z-10">
        <button @click="fetchLPSummary"
          class="flex items-center gap-2 px-6 py-3 bg-[#005daa] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#005daa]/20 hover:bg-[#0075d5] transition-all hover:-translate-y-0.5 active:scale-95 group">
          <span class="material-symbols-outlined text-lg group-hover:rotate-180 transition-transform duration-500">refresh</span>
          Refresh Schedule
        </button>
      </div>
      <!-- Decorative Background -->
      <span class="material-symbols-outlined absolute -right-8 -bottom-8 text-[180px] text-[#005daa]/5 -rotate-12 pointer-events-none">calendar_view_week</span>
    </div>

    <!-- ══ STATS OVERVIEW ══ -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 relative overflow-hidden group hover:shadow-xl transition-all">
        <div class="relative z-10">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Schools</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-black text-[#1a1c1c]">{{ lpSummarySchools.length }}</h3>
            <span class="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-lg">Active</span>
          </div>
        </div>
        <span class="material-symbols-outlined absolute -right-4 -bottom-4 text-6xl text-[#005daa]/5 rotate-12 transition-transform group-hover:scale-110">school</span>
      </div>
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 relative overflow-hidden group hover:shadow-xl transition-all">
        <div class="relative z-10">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Active Months</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-black text-[#1a1c1c]">{{ Object.keys(lpSummaryGrouped).length }}</h3>
            <span class="bg-amber-50 text-amber-600 text-[10px] font-black px-2 py-1 rounded-lg">In Progress</span>
          </div>
        </div>
        <span class="material-symbols-outlined absolute -right-4 -bottom-4 text-6xl text-[#005daa]/5 rotate-12 transition-transform group-hover:scale-110">calendar_month</span>
      </div>
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 relative overflow-hidden group hover:shadow-xl transition-all">
        <div class="relative z-10">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Assigned Plans</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-black text-[#1a1c1c]">{{ totalPlanCount }}</h3>
            <span class="bg-purple-50 text-purple-600 text-[10px] font-black px-2 py-1 rounded-lg">Consolidated</span>
          </div>
        </div>
        <span class="material-symbols-outlined absolute -right-4 -bottom-4 text-6xl text-[#005daa]/5 rotate-12 transition-transform group-hover:scale-110">assignment</span>
      </div>
    </div>

    <!-- ══ MAIN CONTENT CARD ══ -->
    <div class="bg-white rounded-[32px] shadow-[0_8px_32px_rgba(0,28,58,0.02)] border border-slate-50 overflow-hidden">
      
      <!-- Loading State -->
      <div v-if="lpSummaryLoading" class="py-32 text-center">
        <div class="w-12 h-12 border-4 border-[#005daa] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p class="text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">Synchronizing assignments...</p>
      </div>

      <!-- No schools assigned -->
      <div v-else-if="lpSummarySchools.length === 0" class="py-32 text-center max-w-md mx-auto">
        <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span class="material-symbols-outlined text-4xl text-slate-200">school</span>
        </div>
        <h4 class="text-xl font-black text-[#1a1c1c] mb-2">No Institutional Access</h4>
        <p class="text-slate-400 text-sm font-medium leading-relaxed">It seems you haven't been assigned to any schools yet. Please contact your administrator to grant institutional access.</p>
      </div>

      <!-- No data -->
      <div v-else-if="Object.keys(lpSummaryGrouped).length === 0" class="py-32 text-center max-w-md mx-auto">
        <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span class="material-symbols-outlined text-4xl text-slate-200">event_busy</span>
        </div>
        <h4 class="text-xl font-black text-[#1a1c1c] mb-2">Empty Schedule</h4>
        <p class="text-slate-400 text-sm font-medium leading-relaxed">You don't have any lesson plans assigned for the current period. New assignments will appear here once distributed.</p>
        <button @click="$router.push('/curriculum/my')" class="mt-8 text-[#005daa] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 mx-auto hover:underline">
          View Master Library <span class="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      <!-- Month/Week grouped data -->
      <div v-else class="divide-y divide-slate-100">
        <div v-for="(weeks, monthName) in lpSummaryGrouped" :key="monthName" class="overflow-hidden">
          
          <!-- Month Header -->
          <div class="flex items-center gap-3 px-8 py-6 bg-slate-50/30 border-b border-slate-50">
            <span class="material-symbols-outlined text-[#005daa] bg-white p-2 rounded-xl shadow-sm">calendar_month</span>
            <div>
              <p class="font-black text-[#1a1c1c] text-lg tracking-tight leading-none">{{ monthName }}</p>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Monthly Curriculum Pipeline</p>
            </div>
            <span class="ml-auto bg-[#005daa]/10 text-[#005daa] text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border border-[#005daa]/5">
              {{ Object.values(weeks).length }} Working Groups
            </span>
          </div>

          <!-- Week rows -->
          <div v-for="(group, weekKey) in weeks" :key="weekKey" class="border-b border-slate-50 last:border-0">
            <!-- Week Summary Row -->
            <div @click="toggleLPWeek(weekKey)"
              class="flex flex-wrap items-center gap-6 px-10 py-6 hover:bg-slate-50/80 cursor-pointer transition-all group border-l-4 border-transparent hover:border-[#005daa]">
              
              <div class="flex items-center gap-4 flex-1 min-w-[280px]">
                <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#005daa]/10 group-hover:text-[#005daa] transition-colors">
                  <span class="material-symbols-outlined text-xl">school</span>
                </div>
                <div>
                   <p class="font-black text-sm text-[#1a1c1c] leading-tight">{{ group.school_name }}</p>
                   <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[14px]">event</span>
                    Assigned: {{ formatDate(group.assign_date) }}
                   </p>
                </div>
              </div>

              <div class="flex items-center gap-8">
                <div class="flex flex-col items-center">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Period</span>
                  <span class="bg-indigo-50 text-indigo-700 text-[10px] font-black px-4 py-1.5 rounded-full border border-indigo-100 uppercase">{{ group.week_no }}</span>
                </div>
                
                <div class="flex flex-col items-center">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Modules</span>
                  <span class="bg-[#005daa]/5 text-[#005daa] text-[10px] font-black px-4 py-1.5 rounded-full border border-[#005daa]/10">{{ group.items.length }} Plans</span>
                </div>

                <div class="w-px h-8 bg-slate-100"></div>

                <button @click.stop="downloadWeeklyReport(group, monthName)"
                  class="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-200 group/btn">
                  <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                  <span class="text-[9px] font-black uppercase tracking-widest">Report</span>
                </button>

                <div class="w-px h-8 bg-slate-100"></div>

                <span class="material-symbols-outlined text-slate-300 group-hover:text-[#005daa] transition-all transform group-hover:scale-110"
                      :class="{'rotate-180': expandedLPWeeks.includes(weekKey)}">
                  expand_more
                </span>
              </div>
            </div>

            <!-- Expanded LP Details -->
            <transition enter-active-class="transition duration-300 ease-out"
                        enter-from-class="transform opacity-0 -translate-y-2"
                        enter-to-class="transform opacity-100 translate-y-0"
                        leave-active-class="transition duration-200 ease-in"
                        leave-from-class="transform opacity-100 translate-y-0"
                        leave-to-class="transform opacity-0 -translate-y-2">
              <div v-if="expandedLPWeeks.includes(weekKey)" class="bg-slate-50/30 border-t border-slate-50">
                <div class="p-4 md:p-8">
                  <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <table class="w-full text-left text-xs">
                      <thead>
                        <tr class="bg-slate-50/50">
                          <th class="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]">Reference</th>
                          <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]">Curriculum Detail</th>
                          <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]">Objective</th>
                          <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#1a1c1c] text-center">Status</th>
                          <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#1a1c1c]">Remark</th>
                          <th class="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[#1a1c1c] text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-50">
                        <tr v-for="item in group.items" :key="item.id" class="hover:bg-slate-50/50 transition-colors">
                          <td class="px-8 py-5">
                            <span class="bg-slate-900 text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg border border-slate-700 shadow-sm uppercase tracking-tighter">
                              LP-{{ item.lp_id || item.lp_no }}
                            </span>
                          </td>
                          <td class="px-6 py-5">
                            <div class="flex flex-col gap-0.5">
                              <span class="text-[9px] font-black text-[#005daa] uppercase tracking-tighter">{{ item.sport }}</span>
                              <span class="font-bold text-[#1a1c1c] text-xs">{{ item.skill || '-' }}</span>
                              <span class="text-[10px] text-slate-400 font-medium">{{ item.sub_skill || '-' }}</span>
                            </div>
                          </td>
                          <td class="px-6 py-5 max-w-[280px]">
                            <p class="text-[11px] text-slate-500 italic leading-relaxed line-clamp-2" :title="item.objective">
                              {{ item.objective || '-' }}
                            </p>
                          </td>
                          <td class="px-6 py-5 text-center">
                            <div class="flex items-center justify-center">
                              <span v-if="item.lp_status === 'Done'"
                                    class="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase px-3 py-1.5 rounded-full border border-emerald-200">
                                <span class="material-symbols-outlined text-[14px]">check_circle</span>
                                Done
                              </span>
                              <span v-else-if="item.lp_status === 'Pending'"
                                    class="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase px-3 py-1.5 rounded-full border border-amber-200">
                                <span class="material-symbols-outlined text-[14px]">schedule</span>
                                Pending
                              </span>
                              <span v-else
                                    class="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase px-3 py-1.5 rounded-full border border-slate-200">
                                <span class="material-symbols-outlined text-[14px]">radio_button_unchecked</span>
                                Unmarked
                              </span>
                            </div>
                          </td>
                          <td class="px-6 py-5">
                            <div class="flex items-center gap-2">
                              <span v-if="!item.lp_remark" class="text-[10px] text-slate-300 italic">No feedback</span>
                              <p v-else class="text-[10px] font-medium text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-3">
                                "{{ item.lp_remark }}"
                              </p>
                            </div>
                          </td>
                          <td class="px-8 py-5 text-right">
                            <button @click="viewCoachReport(item, monthName)" 
                                    class="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                    title="View Coach Report">
                              <span class="material-symbols-outlined text-[18px]">description</span>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ FOOTER INFO ══ -->
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 py-8">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-300">
          <span class="material-symbols-outlined">info</span>
        </div>
        <p class="text-xs font-bold text-slate-400 max-w-[300px] leading-relaxed uppercase tracking-widest">
          Schedule is updated automatically based on centralized distribution. Status updates are synced across all devices.
        </p>
      </div>
      <div class="flex gap-4">
        <button class="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-all tracking-widest">
          Export Schedule
        </button>
        <button class="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-all tracking-widest">
          Print Plans
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const lpSummaryLoading = ref(false);
const lpSummarySchools = ref<any[]>([]);
const lpSummaryGrouped = ref<Record<string, Record<string, any>>>({});
const expandedLPWeeks = ref<string[]>([]);

const fetchLPSummary = async () => {
  const userId = authStore.user?.id || sessionStorage.getItem('id');
  if (!userId) return;
  
  lpSummaryLoading.value = true;
  try {
    const res = await fetch(`/api/curriculum/my-lp-summary/${userId}`);
    const data = await res.json();
    if (data.success) {
      lpSummarySchools.value = data.schools;
      lpSummaryGrouped.value = data.grouped;
    }
  } catch (err) {
    console.error('LP Summary fetch error:', err);
  } finally {
    lpSummaryLoading.value = false;
  }
};

const toggleLPWeek = (weekKey: string) => {
  if (expandedLPWeeks.value.includes(weekKey)) {
    expandedLPWeeks.value = expandedLPWeeks.value.filter(k => k !== weekKey);
  } else {
    expandedLPWeeks.value.push(weekKey);
  }
};

const downloadWeeklyReport = (group: any, monthYear: string) => {
  router.push({
    name: 'WeeklyReport',
    query: {
      school_id: group.school_id,
      week_no: group.week_no,
      month_year: monthYear
    }
  });
};

const viewCoachReport = (item: any, monthYear: string) => {
  router.push({
    name: 'WeeklyReport',
    query: {
      school_id: item.school_id,
      week_no: item.week_no,
      month_year: monthYear,
      coach_id: item.coach_id
    }
  });
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
};

const totalPlanCount = computed(() => {
  let count = 0;
  Object.values(lpSummaryGrouped.value).forEach(monthWeeks => {
    Object.values(monthWeeks).forEach(group => {
      count += group.items.length;
    });
  });
  return count;
});

const monthRange = computed(() => {
  const months = Object.keys(lpSummaryGrouped.value);
  if (months.length === 0) return 'No active schedule';
  if (months.length === 1) return months[0];
  return `${months[months.length - 1]} - ${months[0]}`;
});

onMounted(() => {
  fetchLPSummary();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@800&display=swap');

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
