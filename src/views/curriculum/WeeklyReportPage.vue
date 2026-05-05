<template>
  <div class="min-h-screen bg-slate-50 py-10 px-4 font-sans print:p-0 print:bg-white">
    <div v-if="!selectedSchool" class="max-w-7xl mx-auto">
      <div class="mb-10">
        <p class="text-xs font-black uppercase tracking-widest text-primary mb-2">Curriculum System</p>
        <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Weekly Report</h1>
        <p class="text-slate-500 font-medium mt-1">Select a school to view its weekly progress reports.</p>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loadingSchools" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i"
          class="h-48 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
          <div class="h-12 w-12 bg-slate-200 rounded-xl mb-4"></div>
          <div class="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>

      <!-- School cards grid -->
      <div v-else-if="schoolsList.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="school in schoolsList" :key="school.id" @click="selectSchool(school)"
          class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between mb-4">
              <div
                class="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden shadow-sm p-2">
                <img v-if="school.school_logo" :src="`/uploads/${encodeURIComponent(school.school_logo)}`"
                  @error="handleImageError" class="w-full h-full object-contain" />
                <span v-else class="text-primary font-bold text-xl">{{ school.name?.charAt(0) }}</span>
              </div>
              <span
                class="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                View Reports
              </span>
            </div>
            <h3 class="text-lg font-bold text-slate-800 leading-snug group-hover:text-primary transition-colors">{{
              school.name }}</h3>
            <p class="text-sm text-slate-500 font-medium mt-1 truncate">{{ school.city || 'No City Listed' }}</p>
          </div>
          <div
            class="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-xs font-semibold text-slate-400">
            <span>Code: {{ school.school_code || '---' }}</span>
            <span
              class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">school</span>
        <p class="text-slate-500 font-bold">No schools assigned or available.</p>
      </div>
    </div>
    <div v-else-if="!selectedWeek" class="max-w-6xl mx-auto">
      <div class="flex items-center gap-4 mb-10">
        <button @click="selectedSchool = null"
          class="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-all text-sm group shrink-0">
          <span
            class="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
          All Schools
        </button>
        <div class="h-6 w-px bg-slate-200"></div>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden p-1.5">
            <img v-if="selectedSchool.school_logo" :src="`/uploads/${encodeURIComponent(selectedSchool.school_logo)}`"
              @error="handleImageError" class="w-full h-full object-contain" />
            <span v-else class="text-primary font-bold">{{ selectedSchool.name?.charAt(0) }}</span>
          </div>
          <div>
            <h1 class="text-xl font-extrabold text-slate-800 leading-tight">{{ selectedSchool.name }}</h1>
            <p class="text-xs text-slate-400 font-semibold">Select a week to view its report</p>
          </div>
        </div>
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

      <!-- Week cards grouped by month -->
      <div v-else-if="Object.keys(availableFilters).length">
        <div v-for="(weeks, monthYear) in availableFilters" :key="monthYear" class="mb-12">
          <!-- Month header -->
          <div class="flex items-center gap-3 mb-5">
            <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-white text-sm">calendar_month</span>
            </div>
            <h2 class="text-base font-extrabold text-slate-700 uppercase tracking-wide">{{ monthYear }}</h2>
            <div class="flex-1 h-px bg-slate-200"></div>
            <span class="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{{ weeks.length }} week{{
              weeks.length > 1 ? 's' : '' }}</span>
          </div>

          <!-- Week cards -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div v-for="week in weeks" :key="week" @click="openWeekReport(monthYear, week)"
              class="week-card group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all cursor-pointer p-6 flex flex-col justify-between relative overflow-hidden">
              <!-- Background decoration -->
              <div
                class="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full group-hover:bg-primary/10 transition-colors">
              </div>

              <!-- Top: week badge -->
              <div>
                <div
                  class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 mb-4 group-hover:bg-primary group-hover:border-primary transition-all">
                  <span
                    class="material-symbols-outlined text-primary group-hover:text-white text-sm transition-colors">event_note</span>
                </div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{{ monthYear }}</p>
                <h3
                  class="text-lg font-extrabold text-slate-800 group-hover:text-primary transition-colors leading-tight">
                  {{ week }}</h3>
              </div>

              <!-- Bottom: open indicator -->
              <div class="mt-6 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-400 group-hover:text-primary transition-colors">View
                  Report</span>
                <div
                  class="w-7 h-7 bg-slate-100 group-hover:bg-primary rounded-lg flex items-center justify-center transition-all group-hover:translate-x-0.5">
                  <span
                    class="material-symbols-outlined text-slate-400 group-hover:text-white text-sm transition-colors">arrow_forward</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
        <span class="material-symbols-outlined text-5xl text-slate-300 block mb-3">event_busy</span>
        <p class="text-slate-500 font-bold text-lg">No report data found for this school.</p>
        <p class="text-slate-400 text-sm font-medium mt-1">Assign lesson plans to this school first.</p>
      </div>

      <!-- Table removed and moved to Step 3 -->
    </div>

    <!-- ============================== -->
    <!-- STEP 3: FULL REPORT VIEW       -->
    <!-- ============================== -->
    <div v-else class="report-container relative overflow-hidden min-h-screen bg-white">
      <!-- Header Actions -->
      <div class="max-w-[1100px] mx-auto mb-6 flex justify-between items-center print:hidden relative z-10 p-4"
        data-html2canvas-ignore="true">
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
        <div class="flex items-center gap-3">
          <button @click="printReport"
            class="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-700 rounded-lg font-bold shadow-md border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 text-sm shrink-0">
            <span class="material-symbols-outlined text-[18px]">download</span>
            Download Report PDF
          </button>
          <button @click="showPublishModal = true"
            class="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-95 text-sm shrink-0">
            <span class="material-symbols-outlined text-[18px]">publish</span>
            Publish to Principal
          </button>

        </div>
      </div>

      <template v-if="reportData">
        <div ref="reportContent" class="report-print-wrapper">
          <!-- PAGE 1: PREMIUM COVER Experience -->
          <section
            class="report-cover relative h-[750px] mb-8 rounded-[32px] overflow-hidden shadow-2xl flex flex-col justify-between p-12 text-slate-800 html2pdf__page-break mx-auto">
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
                <img v-if="selectedSchool.school_logo"
                  :src="`/uploads/${encodeURIComponent(selectedSchool.school_logo)}`" @error="handleImageError"
                  class="w-full h-full object-contain" />
                <span v-else class="text-3xl font-black text-slate-800">S</span>
              </div>

              <!-- Right: Company Branding Box -->
              <div class="flex flex-col items-end">
                <div
                  class="w-24 h-24 bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-center shadow-lg">
                  <img :src="companyLogo" alt="ESA Logo" class="w-full h-full object-contain" />
                </div>
                <p class="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase mt-3">Advanced Curriculum
                  System
                </p>
              </div>
            </div>

            <!-- Center Content Block: Identity -->
            <div
              class="relative z-10 max-w-2xl mx-auto text-center py-10 px-8 bg-white/40 backdrop-blur-xl border border-slate-200 rounded-[40px] shadow-2xl mt-auto mb-12 transform hover:-translate-y-1 transition-all duration-500">
              <p class="text-xs font-black uppercase tracking-[0.5em] mb-4 text-primary">Academic Year 2024-25</p>
              <h1 class="text-5xl font-black tracking-tighter mb-4 leading-none text-slate-800">Weekly Performance
                Report
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

          <!-- Main Report Content Section (Layer 2) -->
          <main class="report-page shadow-2xl relative">
            <!-- Subtle Background Pattern Overlay -->
            <div class="absolute inset-0 opacity-[0.02] pointer-events-none rounded-[24px]"
              style="background-image: url('data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M50 50 L100 0 L100 100 Z\' fill=\'%23000\' opacity=\'0.1\'/%3E%3C/svg%3E');">
            </div>

            <!-- ============================================== -->
            <!-- SECTION 1: MASTER DASHBOARD & ATTENDANCE       -->
            <!-- ============================================== -->


            <!-- ============================================== -->
            <!-- SECTION 2: DETAILED SPORT REPORTS              -->
            <!-- ============================================== -->

            <div v-if="reportData.sports_reports && reportData.sports_reports.length">
              <section v-for="(report, index) in reportData.sports_reports" :key="index"
                class="sport-card-v2 avoid-break">
                <!-- Accent bar -->
                <div class="sport-accent-bar"
                  :style="{ background: report.accentColor || 'linear-gradient(90deg, #10b981, #34d399)' }"></div>

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

                <!-- Skills Covered Section -->
                <div class="px-5 py-4" v-if="report.skills && report.skills.length">
                  <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Skills Covered</h4>
                  <div class="flex flex-wrap gap-2">
                    <span v-for="skill in report.skills" :key="skill" class="skill-chip">
                      <span>{{ report.sport_emoji || '⚽' }}</span>
                      {{ skill }}
                    </span>
                  </div>
                </div>

                <div class="section-divider"></div>

                <!-- Performance Overview -->
                <div class="px-5 py-4">
                  <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Performance Overview
                  </h4>
                  <p class="text-[0.9375rem] leading-relaxed text-slate-700 italic font-medium">{{ report.overview }}
                  </p>
                </div>

                <div class="section-divider"></div>

                <!-- Detailed Performance -->
                <div class="px-5 py-4" v-if="report.key_areas && report.key_areas.length">
                  <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">In this week we covered
                    these skills</h4>
                  <div class="overflow-x-auto rounded-xl border border-slate-200/60 bg-white">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="bg-slate-50/60 border-b border-slate-100">
                          <th
                            class="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">
                            Coach Name</th>
                          <th
                            class="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">
                            Sport</th>
                          <th
                            class="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">
                            Covered Skill</th>
                          <th
                            class="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">
                            Objective</th>
                          <th
                            class="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">
                            Grade/Div</th>
                          <th
                            class="text-left px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">
                            Total Taken</th>
                          <th
                            class="text-right px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">
                            Status</th>

                          <th
                            class="text-right px-4 py-3 font-black text-slate-400 uppercase tracking-widest text-[9px]">
                            Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(area, i) in report.key_areas" :key="i"
                          class="border-t border-slate-50 first:border-t-0">
                          <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                              <div
                                class="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center text-[10px] font-bold text-primary border border-slate-200 uppercase">
                                {{ report.coach_name?.charAt(0) }}
                              </div>
                              <span class="font-bold text-slate-800">{{ report.coach_name }}</span>
                            </div>
                          </td>
                          <td class="px-4 py-3 text-slate-600 font-bold text-[12px]">{{ report.sport }}</td>
                          <td class="px-4 py-3 font-bold text-slate-800">{{ area.name }}</td>
                          <td class="px-4 py-3 text-[11px] text-slate-500 italic">{{ area.objective || 'N/A' }}</td>
                          <td class="px-4 py-3">
                            <span
                              class="text-[11px] font-black text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                              {{ area.grade }} ({{ area.divisions }})
                            </span>
                          </td>
                          <td class="px-4 py-3 font-black text-slate-800">1 Lecture</td>
                          <td class="px-4 py-3 text-right">
                            <span
                              v-if="area.status?.toLowerCase() === 'complete' || area.status?.toLowerCase() === 'done'"
                              class="status-complete inline-flex items-center gap-1">
                              <span class="material-symbols-outlined text-[14px]">check_circle</span> Complete
                            </span>
                            <span v-else class="status-in-progress inline-flex items-center gap-1">
                              <span class="material-symbols-outlined text-[14px]">schedule</span> In Progress
                            </span>
                          </td>

                          <td
                            class="px-4 py-3 text-right text-slate-500 italic text-[12px] whitespace-normal break-words max-w-[200px]">
                            {{
                              area.remark || 'N/A' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <!-- Dashboard and Attendance moved outside sport loop -->
                Activity & Evidence Gallery
                <section class="mb-12 px-8 pt-8">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <!-- Total Lectures Card -->
                    <div
                      class="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div
                        class="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] group-hover:bg-primary/10 transition-colors">
                      </div>
                      <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Lectures</p>
                      <div class="flex items-end gap-3">
                        <h2 class="text-4xl font-black text-slate-800 leading-none">{{ totalAllTimeLectures || 0 }}</h2>
                        <span
                          class="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full mb-1">Sessions</span>
                      </div>
                      <p class="text-xs text-slate-400 font-medium mt-3">Recorded across all sports to date.</p>
                    </div>

                    <!-- Active Coaches Card -->
                    <div
                      class="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div
                        class="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-[100px] group-hover:bg-orange-500/10 transition-colors">
                      </div>
                      <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Active Coaches</p>
                      <div class="flex items-end gap-3">
                        <h2 class="text-4xl font-black text-slate-800 leading-none">{{ activeAllTimeCoaches || 0 }}</h2>
                        <span
                          class="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full mb-1">Coaches</span>
                      </div>
                      <p class="text-xs text-slate-400 font-medium mt-3">Unique coaches active at this school.</p>
                    </div>

                    <!-- Sports Covered Card -->
                    <div
                      class="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div
                        class="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-[100px] group-hover:bg-purple-500/10 transition-colors">
                      </div>
                      <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Sports Covered</p>
                      <div class="flex items-end gap-3">
                        <h2 class="text-4xl font-black text-slate-800 leading-none">{{ sportsAllTimeCovered || 0 }}</h2>
                        <span
                          class="text-xs font-bold text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full mb-1">Sports</span>
                      </div>
                      <p class="text-xs text-slate-400 font-medium mt-3">Unique athletic programs implemented.</p>
                    </div>
                  </div>

                  <!-- ALL-TIME COACH ATTENDANCE TABLE (Directly from marked_lectures) -->
                  <div class="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden mb-8">
                    <div class="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <h3 class="text-xl font-black text-slate-800 tracking-tight">Coach Attendance Summary</h3>
                        <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">All-Time School
                          Attendance Record</p>
                      </div>
                      <div class="flex items-center gap-3">
                        <span
                          class="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg font-bold text-xs border border-emerald-100">
                          {{ schoolAttendanceData.length }} Records
                        </span>
                        <div class="flex items-center gap-2">
                          <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master
                            View</span>
                        </div>
                      </div>
                    </div>

                    <div class="overflow-x-auto">
                      <table class="w-full text-left">
                        <thead>
                          <tr class="bg-slate-50/50 border-b border-slate-100">
                            <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date
                            </th>
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Coach
                              Name</th>
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sport
                            </th>
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Time
                            </th>
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              Grade/Div</th>
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              Status</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                          <tr v-for="session in schoolAttendanceData" :key="session.id"
                            class="hover:bg-slate-50/80 transition-colors group">
                            <td class="px-8 py-5 text-xs font-bold text-slate-500">{{ formatDate(session.date) }}</td>
                            <td class="px-6 py-5">
                              <div class="flex items-center gap-3">
                                <div
                                  class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-primary text-xs shrink-0 uppercase border border-slate-200">
                                  {{ session.coach?.charAt(0) }}
                                </div>
                                <span class="text-sm font-bold text-slate-700">{{ session.coach }}</span>
                              </div>
                            </td>
                            <td class="px-6 py-5">
                              <div class="flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                                <span class="text-sm font-bold text-slate-600">{{ session.sport }}</span>
                              </div>
                            </td>
                            <td class="px-6 py-5 text-xs font-medium text-slate-500">
                              {{ session.start_time?.substring(0, 5) }} - {{ session.end_time?.substring(0, 5) }}
                            </td>
                            <td class="px-6 py-5">
                              <span
                                class="text-xs font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                {{ session.grade }} ({{ session.divisions }})
                              </span>
                            </td>
                            <td class="px-6 py-5">
                              <div class="flex items-center gap-1.5">
                                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <span class="text-[11px] font-black text-emerald-600 uppercase tracking-wider">{{
                                  session.status || 'Done' }}</span>
                              </div>
                            </td>
                          </tr>
                          <tr v-if="!schoolAttendanceData.length">
                            <td colspan="6" class="px-8 py-8 text-center text-slate-400 font-medium">No attendance
                              records found.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
                <!-- Activity Gallery -->
                <div class="px-5 py-6" v-if="report.gallery && report.gallery.length">
                  <h4
                    class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">photo_library</span>
                    Activity & Evidence Gallery
                  </h4>
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div v-for="(img, idx) in report.gallery" :key="idx" @click="openPhoto(img)"
                      class="group relative aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm transition-all hover:shadow-md cursor-zoom-in">
                      <img :src="img"
                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div
                        class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span class="material-symbols-outlined text-white text-xl">zoom_in</span>
                      </div>
                    </div>
                  </div>
                </div>


              </section>
            </div>
            <!-- No sports data -->
            <div v-else class="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
              <div
                class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 font-bold text-2xl">
                ?</div>
              <p class="text-slate-500 font-bold">No lesson data found for {{ selectedMonthYear }} • {{ selectedWeek }}
              </p>
              <p class="text-slate-400 text-sm font-medium mt-1">Data may not have been marked yet by the coach.</p>
            </div>

            <footer class="mt-16 pt-10 border-t border-slate-100 text-center">
              <p class="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                © 2026 Elite Sports Academy • Confidential Student Record • System Generated
              </p>
            </footer>
          </main>
        </div>
      </template>

      <!-- Report null / error state -->
      <div v-else
        class="max-w-[1100px] mx-auto bg-white rounded-3xl p-16 shadow-sm border border-slate-100 text-center">
        <span class="material-symbols-outlined text-5xl text-slate-300 block mb-4">search_off</span>
        <h3 class="text-xl font-bold text-slate-700 mb-2">No Report Data</h3>
        <p class="text-slate-400 font-medium">No lesson plans or tracking records found for <strong>{{ selectedWeek
            }}</strong>, {{ selectedMonthYear }}.</p>
        <button @click="selectedWeek = null"
          class="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-all text-sm">
          ← Back to Weeks
        </button>
      </div>
    </div>

    <!-- PUBLISH MODAL -->
    <Transition name="modal-fade">
      <div v-if="showPublishModal"
        class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
        <div
          class="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl transform transition-all scale-100">
          <div class="p-8 text-center">
            <div
              class="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-500">
              <span class="material-symbols-outlined text-4xl">verified</span>
            </div>
            <h3 class="text-2xl font-black text-slate-800 mb-2">Publish Report</h3>
            <p class="text-slate-500 font-medium leading-relaxed">
              This will make the weekly performance report for <strong>{{ selectedMonthYear }} • {{ selectedWeek
              }}</strong> visible to the School Principal.
            </p>
          </div>
          <div class="flex border-t border-slate-100">
            <button @click="showPublishModal = false"
              class="flex-1 px-6 py-5 text-sm font-bold text-slate-400 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button @click="handlePublish"
              class="flex-1 px-6 py-5 text-sm font-black text-emerald-500 hover:bg-emerald-50 transition-colors border-l border-slate-100">
              Confirm Publication
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- SUCCESS NOTIFICATION -->
    <Transition name="slide-up">
      <div v-if="showSuccessToast"
        class="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
        <div class="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-xs">check</span>
        </div>
        <p class="text-sm font-bold tracking-tight">Report Published to School Principal Successfully!</p>
      </div>
    </Transition>

    <!-- Image Viewer Modal -->
    <Transition name="modal-fade">
      <div v-if="selectedImage"
        class="fixed inset-0 z-[10000] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
        @click="selectedImage = null">
        <button
          class="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
          @click.stop="selectedImage = null">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div class="relative max-w-5xl max-h-full" @click.stop>
          <img :src="selectedImage"
            class="max-w-full max-h-[85vh] rounded-3xl shadow-2xl border border-white/20 object-contain" />
          <div class="mt-6 flex justify-center">
            <a :href="selectedImage" download
              class="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full text-sm font-bold flex items-center gap-2 transition-all backdrop-blur-sm border border-white/10">
              <span class="material-symbols-outlined text-sm">download</span>
              Download Activity Photo
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import companyLogo from '@/assets/new_logo.png';

const selectedSchool = ref<any>(null);
const schoolsList = ref<any[]>([]);
const loadingSchools = ref(true);

const showPublishModal = ref(false);
const showSuccessToast = ref(false);

const handlePublish = async () => {
  if (!selectedSchool.value || !selectedMonthYear.value || !selectedWeek.value) return;

  try {
    const res = await fetch('/api/curriculum/publish-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: selectedSchool.value.id,
        month_year: selectedMonthYear.value,
        week_no: selectedWeek.value
      })
    });

    const data = await res.json();
    if (data.success) {
      showPublishModal.value = false;
      showSuccessToast.value = true;
      setTimeout(() => {
        showSuccessToast.value = false;
      }, 4000);
    } else {
      alert('Error publishing report: ' + (data.message || 'Unknown error'));
    }
  } catch (err) {
    console.error('Publish Error:', err);
    alert('Failed to connect to the server. Please try again.');
  }
};

const selectedMonthYear = ref<string | null>(null);
const selectedWeek = ref<string | null>(null);
const availableFilters = ref<any>({});
const loadingFilters = ref(false);

const reportData = ref<any>(null);
const loadingReport = ref(false);
const defaultImage = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIIwsL-pbkbiNEWxbRRwgfXGFp_KSROv6DrQ&s';
const formatDate = (date: string | null) => {
  if (!date) return 'TBD';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const handleImageError = (event: Event) => {
  (event.target as HTMLImageElement).src = defaultImage;
};

// Fetch schools on mount
onMounted(async () => {
  try {
    const userId = sessionStorage.getItem('id') || '';
    const res = await fetch(`/api/schools?user_id=${userId}&hasReports=true`);
    const data = await res.json();
    if (data.success) {
      schoolsList.value = data.schools;
    }
  } catch (error) {
    console.error('Error fetching schools:', error);
  } finally {
    loadingSchools.value = false;
  }
});

const schoolAttendanceData = ref<any[]>([]);
const loadingSchoolAttendance = ref(false);

const totalAllTimeLectures = computed(() => schoolAttendanceData.value.length);
const activeAllTimeCoaches = computed(() => new Set(schoolAttendanceData.value.map(s => s.coach)).size);
const sportsAllTimeCovered = computed(() => new Set(schoolAttendanceData.value.map(s => s.sport)).size);

const fetchSchoolAttendance = async () => {
  if (!selectedSchool.value) return;
  loadingSchoolAttendance.value = true;
  try {
    const res = await fetch(`/api/curriculum/school-attendance/${selectedSchool.value.id}`);
    const data = await res.json();
    if (data.success) {
      schoolAttendanceData.value = data.data;
    }
  } catch (err) {
    console.error('Error fetching school attendance:', err);
  } finally {
    loadingSchoolAttendance.value = false;
  }
};

const selectSchool = async (school: any) => {
  selectedSchool.value = school;
  selectedMonthYear.value = null;
  selectedWeek.value = null;
  availableFilters.value = {};
  schoolAttendanceData.value = [];

  loadingFilters.value = true;
  fetchSchoolAttendance(); // Fetch in parallel
  try {
    const res = await fetch(`/api/curriculum/report-filters/${school.id}`);
    const data = await res.json();
    if (data.success) {
      availableFilters.value = data.filters;
    }
  } catch (err) {
    console.error('Fetch Filters Error:', err);
  } finally {
    loadingFilters.value = false;
  }
};

// Called when user clicks a week card
const openWeekReport = (monthYear: string, week: string) => {
  selectedMonthYear.value = monthYear;
  selectedWeek.value = week;
  fetchReportData();
};

const fetchReportData = async () => {
  if (!selectedSchool.value || !selectedMonthYear.value || !selectedWeek.value) return;

  loadingReport.value = true;
  reportData.value = null;

  try {
    const params = new URLSearchParams({
      school_id: selectedSchool.value.id,
      month_year: selectedMonthYear.value,
      week_no: selectedWeek.value
    });
    const res = await fetch(`/api/curriculum/report-data?${params}`);
    const data = await res.json();
    if (data.success) {
      reportData.value = data.report;
    }
  } catch (err) {
    console.error('Fetch Report data error:', err);
  } finally {
    loadingReport.value = false;
  }
};

const reportContent = ref<HTMLElement | null>(null);

const printReport = () => {
  if (!reportContent.value) return;

  const element = reportContent.value;
  const opt = {
    margin: 0,
    filename: `Weekly_Report_${selectedSchool.value?.name || 'School'}_${selectedWeek.value}.pdf`,
    image: { type: 'jpeg', quality: 1.0 },
    html2canvas: {
      scale: 2.5,
      useCORS: true,
      logging: false,
      letterRendering: true,
      windowWidth: 1100
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  // @ts-ignore
  html2pdf().set(opt).from(element).save();
};

const selectedImage = ref<string | null>(null);

const openPhoto = (url: string) => {
  selectedImage.value = url;
};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

:root {
  --primary: #1890FF;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translate(-50%, 20px);
  opacity: 0;
}

.report-print-wrapper {
  padding: 0 !important;
  margin: 0 !important;
  background: white;
}

.avoid-break {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

@media print {
  .report-container {
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .report-page {
    box-shadow: none !important;
    border: none !important;
    padding: 10mm 0 !important;
    /* Vertical padding only */
    margin: 0 !important;
    width: 100% !important;
  }

  .report-cover {
    height: 297mm !important;
    /* Full A4 height */
    margin: 0 !important;
    padding: 15mm 0 !important;
    /* Vertical padding only */
    border-radius: 0 !important;
    width: 100% !important;
  }

  .report-print-wrapper {
    margin: 0 !important;
    padding: 0 !important;
  }
}

/* ========== SPORT CARD V2 (Modern Segmented) ========== */
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

.sport-card-v2:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
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

.font-sans {
  font-family: 'Manrope', sans-serif !important;
}

/* ========== COACH PROFILE ========== */
.coach-avatar {
  border-radius: 12px;
  object-cover: cover;
  border: 2px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.badge-certified {
  display: inline-flex;
  items-center: center;
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

/* ========== SKILL CHIPS ========== */
.skill-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #eff6ff;
  color: #1d4ed8;
  border-radius: 12px;
  border: 1px solid #dbeafe;
  font-weight: 700;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.skill-chip:hover {
  background-color: #dbeafe;
  transform: scale(1.02);
}

/* ========== PERFORMANCE TABLE ========== */
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

.rating-excellent {
  color: #059669;
  font-weight: 700;
}

.rating-good {
  color: #2563eb;
  font-weight: 700;
}

.rating-needs-work {
  color: #dc2626;
  font-weight: 700;
}

/* ========== COACH REMARK ========== */
.coach-remark {
  position: relative;
  background: #fffbeb;
  padding: 1rem 1rem 1rem 1.5rem;
  border-radius: 12px;
}

.text-gold {
  color: #d4af37;
}

/* ========== WEEK CARD ========== */
.week-card {
  min-height: 160px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.week-card:hover {
  transform: translateY(-3px);
}

/* ========== REPORT PAGE ========== */
.report-container {
  background-color: #f8fafc;
  font-family: 'Manrope', sans-serif;
}

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
  min-height: 1100px;
  border-radius: 24px;
  position: relative;
  z-index: 10;
}

.report-cover {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.glass-header {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.8));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
}

.page-break-after {
  break-after: page;
}

/* ========== PERFORMANCE TABLE V2 ========== */
.performance-table-v2 {
  border-collapse: collapse;
}

.performance-table-v2 th {
  padding: 1rem 1.5rem;
  background: #f8fafc;
  color: #94a3b8;
  font-weight: 900;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  border-bottom: 1px solid #f1f5f9;
}

.performance-table-v2 td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f8fafc;
  vertical-align: middle;
}

.performance-table-v2 tr:last-child td {
  border-bottom: none;
}

/* ========== REMARK BLOCK V2 ========== */
.remark-block-v2 {
  position: relative;
}

@media print {
  body {
    background: white;
    padding: 0;
  }

  .report-container {
    background: white;
  }

  .report-page,
  .report-cover,
  .sport-card-v2 {
    box-shadow: none !important;
    padding: 2rem !important;
    width: 100% !important;
    max-width: 100% !important;
    border: none !important;
    border-radius: 0 !important;
  }

  .report-cover {
    height: 1000px !important;
  }

  .print\:hidden {
    display: none !important;
  }
}

/* Reusing some existing utility styles */

.bg-primary {
  background-color: var(--primary);
}

.text-primary {
  color: var(--primary);
}

.border-primary {
  border-color: var(--primary);
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 24;
}

/* Print Separator */
.page-break-after {
  page-break-after: always;
  break-after: page;
}

@media print {
  body {
    background: white;
    padding: 0;
  }

  .report-page {
    box-shadow: none !important;
    padding: 2rem !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .print\:hidden {
    display: none !important;
  }

  .sport-card-v2 {
    break-inside: avoid;
    border: 1px solid #eee !important;
    box-shadow: none !important;
    margin-bottom: 3rem !important;
    padding: 0 !important;
  }
}
</style>