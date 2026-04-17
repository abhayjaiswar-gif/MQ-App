<template>
  <div class="min-h-screen bg-slate-50 py-10 px-4 font-sans print:p-0 print:bg-white">
    <!-- NO SCHOOL SELECTED (Loading or Grid for Multi-school) -->
    <div v-if="!selectedSchool" class="max-w-7xl mx-auto">
      <div v-if="loadingSchools" class="text-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-slate-500 font-bold">Identifying Institutional Access...</p>
      </div>
      <div v-else-if="schoolsList.length > 1" class="max-w-4xl mx-auto">
        <div class="mb-10 text-center">
            <p class="text-xs font-black uppercase tracking-widest text-primary mb-2">Principal Portal</p>
            <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Select Institution</h1>
            <p class="text-slate-500 font-medium mt-1">Please select the school you'd like to view reports for.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="school in schoolsList" :key="school.id" @click="selectSchool(school)"
              class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group flex flex-col justify-between">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-200 p-2 overflow-hidden shadow-sm">
                    <img v-if="school.school_logo" :src="`/uploads/${encodeURIComponent(school.school_logo)}`" class="w-full h-full object-contain" />
                    <span v-else class="text-primary font-bold text-xl">{{ school.name?.charAt(0) }}</span>
                </div>
                <h3 class="text-lg font-bold text-slate-800 leading-snug group-hover:text-primary transition-colors">{{ school.name }}</h3>
              </div>
            </div>
        </div>
      </div>
      <div v-else class="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">lock_person</span>
        <p class="text-slate-500 font-bold">No schools assigned to your profile.</p>
        <p class="text-slate-400 text-sm mt-1">Please contact the administrator for portal access.</p>
      </div>
    </div>

    <!-- STEP 2: WEEK SELECTION (Restricted to status=1) -->
    <div v-else-if="!selectedWeek" class="max-w-6xl mx-auto">
       <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-200 p-2 overflow-hidden shadow-sm shadow-slate-100">
                <img v-if="selectedSchool.school_logo" :src="`/uploads/${encodeURIComponent(selectedSchool.school_logo)}`" class="w-full h-full object-contain" />
                <span v-else class="text-primary font-bold text-xl">{{ selectedSchool.name?.charAt(0) }}</span>
            </div>
            <div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Principal Portal</p>
                <h1 class="text-2xl font-extrabold text-slate-800 leading-tight">Weekly Performance Reports</h1>
                <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{{ selectedSchool.name }}</p>
            </div>
        </div>
        
        <button v-if="schoolsList.length > 1" @click="selectedSchool = null" class="text-xs font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">swap_horiz</span>
            Switch Institution
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loadingFilters">
        <div v-for="g in 2" :key="g" class="mb-10">
          <div class="h-5 bg-slate-200 rounded w-32 mb-4 animate-pulse"></div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="i in 4" :key="i" class="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
          </div>
        </div>
      </div>

      <!-- Week cards grouped by month (PUBLISHED ONLY) -->
      <div v-else-if="Object.keys(availableFilters).length">
        <div v-for="(weeks, monthYear) in availableFilters" :key="monthYear" class="mb-12">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-white text-sm">calendar_month</span>
            </div>
            <h2 class="text-base font-extrabold text-slate-700 uppercase tracking-wide">{{ monthYear }}</h2>
            <div class="flex-1 h-px bg-slate-200"></div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div v-for="week in weeks" :key="week" @click="openWeekReport(monthYear, week)"
              class="week-card group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-800/40 transition-all cursor-pointer p-6 flex flex-col justify-between relative overflow-hidden">
              <div class="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-bl-full"></div>
              <div>
                <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 mb-4 group-hover:bg-slate-800 transition-all">
                  <span class="material-symbols-outlined text-slate-500 group-hover:text-white text-sm transition-colors">verified</span>
                </div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{{ monthYear }}</p>
                <h3 class="text-lg font-extrabold text-slate-800 group-hover:text-slate-800 transition-colors leading-tight">{{ week }}</h3>
              </div>
              <div class="mt-6 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-400 group-hover:text-slate-800 transition-colors">View Record</span>
                <div class="w-7 h-7 bg-slate-100 group-hover:bg-slate-800 rounded-lg flex items-center justify-center transition-all group-hover:translate-x-0.5">
                  <span class="material-symbols-outlined text-slate-400 group-hover:text-white text-sm transition-colors">arrow_forward</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100 shadow-sm">
        <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span class="material-symbols-outlined text-5xl text-slate-200">visibility_off</span>
        </div>
        <p class="text-slate-500 font-extrabold text-xl">No Published Reports Yet</p>
        <p class="text-slate-400 text-sm font-medium mt-2 max-w-sm mx-auto leading-relaxed">Official weekly records will appear here once they are approved and published by the curriculum coordinator.</p>
      </div>
    </div>

    <!-- STEP 3: FULL REPORT VIEW (Restricted) -->
    <div v-else class="report-container relative overflow-hidden min-h-screen">
      <div class="sports-pattern-bg print:hidden"></div>

      <!-- Header Actions -->
      <div class="max-w-[1100px] mx-auto mb-6 flex justify-between items-center print:hidden relative z-10 p-4">
        <div class="flex items-center gap-3">
          <button @click="selectedWeek = null"
            class="flex items-center gap-2 px-4 py-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg font-bold transition-all text-sm group">
            <span class="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform rotate-180">arrow_forward</span>
            Back to Timeline
          </button>
          <div class="h-5 w-px bg-slate-200"></div>
          <div class="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest text-[11px]">
             {{ selectedMonthYear }} • {{ selectedWeek }}
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button @click="printReport"
            class="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-lg font-bold shadow-lg shadow-slate-200 hover:bg-black transition-all active:scale-95 text-sm shrink-0">
            <span class="material-symbols-outlined text-[18px]">print</span>
            Download PDF
          </button>
        </div>
      </div>

      <!-- PAGE 1: PREMIUM COVER -->
      <section class="report-cover relative h-[700px] mb-12 rounded-[32px] overflow-hidden shadow-2xl flex flex-col justify-between p-12 text-slate-800 page-break-after mx-auto">
        <div class="absolute inset-0 z-0 bg-white">
          <img src="@/assets/report-cover.png" class="w-full h-full object-contain opacity-40 transform hover:scale-105 transition-transform duration-[10s]" />
          <div class="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/60"></div>
        </div>

        <div class="relative z-10 flex justify-between items-start">
          <div class="w-24 h-24 bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-center shadow-lg">
            <img v-if="selectedSchool.school_logo" :src="`/uploads/${encodeURIComponent(selectedSchool.school_logo)}`" class="w-full h-full object-contain" />
            <span v-else class="text-3xl font-black text-slate-800">S</span>
          </div>
          <div class="flex flex-col items-end">
            <div class="w-24 h-24 bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-center shadow-lg">
              <img :src="companyLogo" alt="ESA Logo" class="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        <div class="relative z-10 max-w-2xl mx-auto text-center py-10 px-8 bg-white/40 backdrop-blur-xl border border-slate-200 rounded-[40px] shadow-2xl mt-auto mb-12">
          <p class="text-xs font-black uppercase tracking-[0.5em] mb-4 text-primary">Institutional Record</p>
          <h1 class="text-5xl font-black tracking-tighter mb-4 leading-none text-slate-800 uppercase">Weekly Performance</h1>
          <div class="flex items-center justify-center gap-4 mb-4">
            <span class="h-px w-8 bg-slate-200"></span>
            <span class="text-lg font-bold text-slate-600">{{ selectedMonthYear }} • {{ selectedWeek }}</span>
            <span class="h-px w-8 bg-slate-200"></span>
          </div>
          <p class="text-3xl font-bold tracking-tight text-slate-800 mb-2">{{ selectedSchool.name }}</p>
        </div>

        <div class="relative z-10 flex justify-between items-end border-t border-slate-100 pt-6 font-bold text-[10px] text-slate-400 uppercase tracking-widest">
          <p>Official Institution Record</p>
          <p>© 2026 Elite Sports Academy</p>
        </div>
      </section>

      <!-- Main Report Content Section -->
      <main v-if="reportData" class="report-page shadow-2xl relative">
        <div class="sports-pattern-bg"></div>
        
        <div v-if="reportData.sports_reports && reportData.sports_reports.length">
          <section v-for="(report, index) in reportData.sports_reports" :key="index" class="sport-card-v2 bg-white rounded-[32px] overflow-hidden border border-slate-100 mb-12 relative z-10">
            <div class="h-1.5 w-full bg-slate-800"></div>
            
            <!-- Sport header -->
            <div class="flex items-center justify-between px-8 pt-8 pb-4">
              <div class="flex items-center gap-3">
                <span class="text-3xl">{{ report.sport_emoji || '⚽' }}</span>
                <h2 class="text-2xl font-black text-slate-800 tracking-tight">{{ report.sport }}</h2>
              </div>
            </div>

            <!-- Coach and Overview -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-slate-50/50">
              <div class="flex items-center gap-4">
                <img :src="report.coach_avatar" class="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md" @error="handleImageError" />
                <div>
                  <h3 class="text-base font-extrabold text-slate-800 leading-tight">{{ report.coach_name }}</h3>
                  <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{{ report.sport }} Head Coach</p>
                </div>
              </div>
              <div class="md:col-span-2">
                <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Performance Summary</h4>
                <p class="text-[13px] leading-relaxed text-slate-600 font-medium italic border-l-4 border-slate-200 pl-4">{{ report.overview }}</p>
              </div>
            </div>

            <!-- Detailed Performance Table -->
            <div class="p-8 pt-0" v-if="report.key_areas && report.key_areas.length">
              <div class="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm font-bold">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-slate-50/80 border-b border-slate-100 uppercase tracking-widest text-[9px] text-slate-400">
                      <th class="text-left px-6 py-4">Learning Area</th>
                      <th class="text-left px-6 py-4">Standard</th>
                      <th class="text-left px-6 py-4">Divisions</th>
                      <th class="text-left px-6 py-4 text-right">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(area, i) in report.key_areas" :key="i" class="border-t border-slate-50">
                      <td class="px-6 py-4 font-black text-slate-800">{{ area.name }}</td>
                      <td class="px-6 py-4 text-slate-500 text-xs">{{ area.grade }}</td>
                      <td class="px-6 py-4 text-slate-500 text-xs">{{ area.divisions }}</td>
                      <td class="px-6 py-4 text-right">
                         <span v-if="area.status?.toLowerCase() === 'done' || area.status?.toLowerCase() === 'complete'" class="bg-emerald-50 text-emerald-600 text-[10px] px-2.5 py-1 rounded-full uppercase">Verified</span>
                         <span v-else class="bg-slate-100 text-slate-400 text-[10px] px-2.5 py-1 rounded-full uppercase italic">In Progress</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <footer class="mt-20 text-center pb-10">
          <p class="text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">Institutional Grade Documentation • Elite Sports Academy System</p>
        </footer>
      </main>

      <!-- Error State -->
      <div v-else class="max-w-[1100px] mx-auto bg-white rounded-3xl p-16 text-center border border-slate-100">
        <span class="material-symbols-outlined text-4xl text-slate-200 mb-4">search_off</span>
        <h3 class="text-xl font-bold text-slate-700">Unable to load report</h3>
        <button @click="selectedWeek = null" class="mt-4 px-6 py-2 bg-slate-800 text-white rounded-xl font-bold">Return to Timeline</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import companyLogo from '@/assets/new_logo.png';

const selectedSchool = ref<any>(null);
const schoolsList = ref<any[]>([]);
const loadingSchools = ref(true);

const selectedMonthYear = ref<string | null>(null);
const selectedWeek = ref<string | null>(null);
const availableFilters = ref<any>({});
const loadingFilters = ref(false);

const reportData = ref<any>(null);
const loadingReport = ref(false);

const handleImageError = (event: Event) => {
  (event.target as HTMLImageElement).src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIIwsL-pbkbiNEWxbRRwgfXGFp_KSROv6DrQ&s';
};

const formatDate = (date: string | null) => {
  if (!date) return 'TBD';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

onMounted(async () => {
    try {
        const userId = sessionStorage.getItem('id') || '';
        if (!userId) {
            loadingSchools.value = false;
            return;
        }

        const res = await fetch(`/api/schools?user_id=${userId}&hasReports=true`);
        const data = await res.json();
        if (data.success) {
            schoolsList.value = data.schools;
            // AUTO-SELECT: If principal is assigned to exactly one school, jump to Step 2
            if (schoolsList.value.length === 1) {
                selectSchool(schoolsList.value[0]);
            }
        }
    } catch (err) {
        console.error('Portal Initialization error:', err);
    } finally {
        loadingSchools.value = false;
    }
});

const selectSchool = async (school: any) => {
    selectedSchool.value = school;
    loadingFilters.value = true;
    try {
        // CALL FILTER API WITH publishedOnly=true
        const res = await fetch(`/api/curriculum/report-filters/${school.id}?publishedOnly=true`);
        const data = await res.json();
        if (data.success) {
            availableFilters.value = data.filters;
        }
    } catch (err) {
        console.error('Filter load error:', err);
    } finally {
        loadingFilters.value = false;
    }
};

const openWeekReport = (monthYear: string, week: string) => {
    selectedMonthYear.value = monthYear;
    selectedWeek.value = week;
    fetchReportData();
};

const fetchReportData = async () => {
    if (!selectedSchool.value || !selectedMonthYear.value || !selectedWeek.value) return;
    loadingReport.value = true;
    try {
        const params = new URLSearchParams({
            school_id: selectedSchool.value.id,
            month_year: selectedMonthYear.value,
            week_no: selectedWeek.value,
            publishedOnly: 'true' // RESTRICT TO PUBLISHED DATA
        });
        const res = await fetch(`/api/curriculum/report-data?${params}`);
        const data = await res.json();
        if (data.success) {
            reportData.value = data.report;
        }
    } catch (err) {
        console.error('Report fetch error:', err);
    } finally {
        loadingReport.value = false;
    }
};

const printReport = () => window.print();
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.font-sans { font-family: 'Manrope', sans-serif !important; }

.sports-pattern-bg {
  position: fixed;
  inset: 0;
  opacity: 0.05;
  pointer-events: none;
  background-image: url('@/assets/background_of_report_card.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  z-index: 0;
}

.report-page {
  max-width: 1100px;
  margin: 0 auto;
  background-color: white;
  padding: 4rem;
  border-radius: 40px;
  min-height: 1100px;
  position: relative;
  z-index: 10;
}

.week-card {
  min-height: 160px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.week-card:hover { transform: translateY(-4px); }

@media print {
  .print\\:hidden { display: none !important; }
  .report-page { padding: 0; border-radius: 0; box-shadow: none; margin: 0; max-width: 100%; width: 100%; }
}
</style>
