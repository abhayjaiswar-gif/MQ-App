<template>
  <div class="min-h-screen bg-slate-50 py-10 px-4 font-sans print:p-0 print:bg-white">
    <!-- STEP 1: SCHOOL SELECTION (Loading or Grid for Multi-school) -->
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

    <!-- STEP 2: WEEK SELECTION -->
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

    <!-- STEP 3: FULL REPORT VIEW -->
    <div v-else class="report-container relative overflow-hidden min-h-screen bg-white">
      <!-- Background Sports Pattern (Digital Only) -->
      <div class="sports-pattern-bg print:hidden"></div>

      <!-- Header Actions -->
      <div class="max-w-[1100px] mx-auto mb-6 flex justify-between items-center print:hidden relative z-10 p-4">
        <div class="flex items-center gap-3">
          <button @click="selectedWeek = null"
            class="flex items-center gap-2 px-4 py-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg font-bold transition-all text-sm group">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 group-hover:-translate-x-1 transition-transform"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Weeks
          </button>
          <div class="h-5 w-px bg-slate-200"></div>
          <div class="flex items-center gap-2 text-sm">
            <span class="px-3 py-1 bg-primary/10 text-primary font-bold rounded-full text-xs shrink-0">{{
              selectedMonthYear }}</span>
            <span class="px-3 py-1 bg-slate-100 text-slate-600 font-bold rounded-full text-xs shrink-0">{{ selectedWeek
            }}</span>
          </div>
        </div>
      </div>

      <!-- PAGE 1: PREMIUM COVER Experience -->
      <section
        class="report-cover relative h-[700px] mb-12 rounded-[32px] overflow-hidden shadow-2xl flex flex-col justify-between p-12 text-slate-800 page-break-after mx-auto">
        <!-- Hero Visual Background -->
        <div class="absolute inset-0 z-0 bg-white">
          <img src="@/assets/report-cover.png"
            class="w-full h-full object-contain opacity-40 transform hover:scale-105 transition-transform duration-[10s]" />
          <div class="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/60"></div>
        </div>

        <!-- Top Layer: Dual Branding -->
        <div class="relative z-10 flex justify-between items-start">
          <!-- Left: School Branding Box -->
          <div
            class="w-24 h-24 bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-center shadow-lg">
            <img v-if="selectedSchool.school_logo" :src="`/uploads/${encodeURIComponent(selectedSchool.school_logo)}`"
              @error="handleImageError" class="w-full h-full object-contain" />
            <span v-else class="text-3xl font-black text-slate-800">S</span>
          </div>

          <!-- Right: Company Branding Box -->
          <div class="flex flex-col items-end">
            <div
              class="w-24 h-24 bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-center shadow-lg">
              <img :src="companyLogo" alt="ESA Logo" class="w-full h-full object-contain" />
            </div>
            <p class="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase mt-3">Advanced Curriculum System
            </p>
          </div>
        </div>

        <!-- Center Content Block: Identity -->
        <div
          class="relative z-10 max-w-2xl mx-auto text-center py-10 px-8 bg-white/40 backdrop-blur-xl border border-slate-200 rounded-[40px] shadow-2xl mt-auto mb-12 transform hover:-translate-y-1 transition-all duration-500">
          <p class="text-xs font-black uppercase tracking-[0.5em] mb-4 text-primary">Academic Year 2024-25</p>
          <h1 class="text-5xl font-black tracking-tighter mb-4 leading-none text-slate-800 uppercase">Weekly Performance Report
          </h1>
          <div class="flex items-center justify-center gap-4 mb-4">
            <span class="h-px w-8 bg-slate-200"></span>
            <span class="text-lg font-bold text-slate-600">{{ selectedMonthYear }} • {{ selectedWeek }}</span>
            <span class="h-px w-8 bg-slate-200"></span>
          </div>
          <p class="text-3xl font-bold tracking-tight text-slate-800 mb-2">{{ selectedSchool.name }}</p>
          <p class="text-base font-medium text-slate-400 italic">“Building Discipline. Inspiring Excellence.”</p>
        </div>

        <!-- Bottom Footer Branding -->
        <div class="relative z-10 flex justify-between items-end border-t border-slate-100 pt-6">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-slate-400 text-sm">school</span>
            <p class="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Official Institution Record</p>
          </div>
          <p class="text-[10px] font-black tracking-widest text-slate-400 uppercase">© 2026 Elite Sports Academy</p>
        </div>
      </section>


      <!-- Loading state -->
      <div v-if="loadingReport"
        class="max-w-[1100px] mx-auto bg-white rounded-3xl p-12 shadow-sm border border-slate-100">
        <div class="animate-pulse space-y-6">
          <div class="h-8 bg-slate-100 w-1/3 rounded-full"></div>
          <div class="h-4 bg-slate-100 w-1/2 rounded-full"></div>
          <div class="h-4 bg-slate-100 w-1/4 rounded-full"></div>
          <div class="h-32 bg-slate-100 rounded-2xl mt-8"></div>
        </div>
      </div>

      <!-- Main Report Content Section -->
      <main v-if="reportData" class="report-page shadow-2xl relative">
        <!-- Sports Sections -->
        <div v-if="reportData.sports_reports && reportData.sports_reports.length">
          <section v-for="(report, index) in reportData.sports_reports" :key="index" class="sport-card-v2">
            <!-- Accent bar -->
            <div class="sport-accent-bar"
              :style="{ background: report.accentColor || 'linear-gradient(90deg, #10b981, #34d399)' }" />

            <!-- Sport header -->
            <div class="flex items-center justify-between px-5 pt-4 pb-0">
              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ report.sport_emoji || '⚽' }}</span>
                <h2 class="text-xl font-bold text-slate-800">{{ report.sport }}</h2>
              </div>
              <span
                class="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                {{ report.sessions_count || 1 }} sessions this week
              </span>
            </div>

            <div class="section-divider mt-3"></div>

            <!-- Coach Profile Section -->
            <div class="flex items-center gap-4 p-5">
              <div class="relative group">
                <img :src="report.coach_avatar" :alt="report.coach_name" @error="handleImageError"
                  class="coach-avatar w-16 h-16" />
              </div>
              <div class="flex flex-col gap-1">
                <h3 class="text-lg font-bold text-slate-800 leading-tight">{{ report.coach_name }}</h3>
                <p class="text-sm text-slate-500 font-medium">
                  {{ report.coach_role || (report.sport + ' Coach') }} · {{ report.coach_experience || '5+ Years' }}
                </p>
                <div class="badge-certified w-fit mt-0.5">
                  <span class="material-symbols-outlined text-xs">verified_user</span>
                  Certified Trainer
                </div>
              </div>
            </div>

            <div class="section-divider"></div>

            <!-- Performance Overview -->
            <div class="px-5 py-4">
              <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Performance Overview</h4>
              <p class="text-[0.9375rem] leading-relaxed text-slate-700 italic font-medium">{{ report.overview }}</p>
            </div>

            <div class="section-divider"></div>

            <!-- Detailed Performance -->
            <div class="px-5 py-4" v-if="report.key_areas && report.key_areas.length">
              <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Detailed Performance</h4>
              <div class="overflow-x-auto rounded-xl border border-slate-200/60 bg-white">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-slate-50/60 border-b border-slate-100">
                      <th class="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">Key Area</th>
                      <th class="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">Standard</th>
                      <th class="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">Divisions</th>
                      <th class="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">Date Done</th>
                      <th class="text-right px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">Status</th>
                      <th class="text-center px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">Evidence</th>
                      <th class="text-right px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(area, i) in report.key_areas" :key="i" class="border-t border-slate-50 first:border-t-0">
                      <td class="px-4 py-3 font-bold text-slate-800">{{ area.name }}</td>
                      <td class="px-4 py-3 text-slate-800 font-bold text-[13px]">{{ area.grade || 'N/A' }}</td>
                      <td class="px-4 py-3 text-slate-500 font-medium text-[13px]">{{ area.divisions || 'N/A' }}</td>
                      <td class="px-4 py-3 text-slate-500 font-bold text-[12px]">{{ formatDate(area.done_date) }}</td>
                      <td class="px-4 py-3 text-right">
                        <span v-if="area.status?.toLowerCase() === 'complete' || area.status?.toLowerCase() === 'done'"
                          class="status-complete inline-flex items-center gap-1">
                          <span class="material-symbols-outlined text-[14px]">check_circle</span> Complete
                        </span>
                        <span v-else class="status-in-progress inline-flex items-center gap-1">
                          <span class="material-symbols-outlined text-[14px]">schedule</span> In Progress
                        </span>
                      </td>
                      <td class="px-4 py-3 text-center">
                        <div v-if="area.photos && area.photos.length" class="flex items-center justify-center gap-1">
                          <img v-for="(photo, pi) in area.photos.slice(0, 2)" :key="pi" :src="photo" 
                            class="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-sm"
                            @click="openPhoto(photo)" />
                          <span v-if="area.photos.length > 2" class="text-[10px] font-bold text-slate-400">+{{ area.photos.length - 2 }}</span>
                        </div>
                        <span v-else class="text-[10px] text-slate-300">No Photo</span>
                      </td>
                      <td class="px-4 py-3 text-right text-slate-500 italic text-[12px] truncate max-w-[120px]">{{ area.remark || 'N/A' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Activity Gallery -->
            <div class="px-5 py-6" v-if="report.gallery && report.gallery.length">
              <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">photo_library</span>
                Activity & Evidence Gallery
              </h4>
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div v-for="(img, idx) in report.gallery" :key="idx" 
                  class="group relative aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm transition-all hover:shadow-md">
                  <img :src="img" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-xl">zoom_in</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer class="mt-16 pt-10 border-t border-slate-100 text-center">
          <p class="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
            © 2026 Elite Sports Academy • Official Institution Record • System Generated
          </p>
        </footer>
      </main>

      <!-- Error State -->
      <div v-else class="max-w-[1100px] mx-auto bg-white rounded-3xl p-16 text-center border border-slate-100">
        <span class="material-symbols-outlined text-4xl text-slate-200 mb-4">search_off</span>
        <h3 class="text-xl font-bold text-slate-700">Unable to load report</h3>
        <button @click="selectedWeek = null" class="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold">Return to Timeline</button>
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
            publishedOnly: 'true' 
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

const openPhoto = (url: string) => {
  window.open(url, '_blank');
};
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

/* ========== SPORT CARD V2 ========== */
.sport-card-v2 {
  background: white;
  border-radius: 24px;
  margin-bottom: 3rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
  transition: all 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.sport-accent-bar {
  height: 6px;
  width: 100%;
}

.section-divider {
  height: 1px;
  background-color: #f1f5f9;
  width: calc(100% - 2.5rem);
  margin-left: 1.25rem;
}

.coach-avatar {
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.badge-certified {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.125rem 0.5rem;
  background-color: #fffbeb;
  color: #b45309;
  border-radius: 6px;
  border: 1px solid #fef3c7;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.status-complete {
  color: #059669;
  background-color: #ecfdf5;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 11px;
}

.status-in-progress {
  color: #d97706;
  background-color: #fffbeb;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 11px;
}

@media print {
  .print\:hidden { display: none !important; }
  .report-page { padding: 0; border-radius: 0; box-shadow: none; margin: 0; max-width: 100%; width: 100%; }
}
</style>
