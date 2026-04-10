<template>
  <div class="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] font-['Inter']">
    <div class="p-2 max-w-7xl mx-auto space-y-10">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav class="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#404753] font-bold mb-3">
            <span>Portal</span>
            <span class="material-symbols-outlined text-[12px]">chevron_right</span>
            <span class="text-[#005daa]">Curriculums</span>
          </nav>
          <h2 class="text-4xl font-extrabold text-[#1a1c1c] tracking-tight" style="font-family: 'Manrope', sans-serif;">
            My Curriculums</h2>
          <p class="text-[#404753] mt-2 font-medium italic">Manage and access your assigned specialized athletic
            training modules.</p>
        </div>
        <div class="flex items-center gap-3">
          <button @click="openAssignModal"
            class="bg-white hover:bg-slate-50 text-[#005daa] border border-[#005daa]/20 px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-3 transition-all shadow-md active:scale-95 group">
            <span class="material-symbols-outlined">user_attributes</span>
            <span>Assign CRM</span>
          </button>
          <button @click="fetchData"
            class="bg-[#005daa] hover:bg-[#0075d5] text-white px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-3 transition-all shadow-lg shadow-[#005daa]/20 active:scale-95 group">
            <span class="material-symbols-outlined group-hover:rotate-180 transition-transform duration-700">sync</span>
            <span>Refresh Path</span>
          </button>
        </div>
      </div>
      <div v-if="assignments.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-10">
        <!-- Consolidated Workload Card -->
        <div @click="$router.push('/curriculum/assigned')"
          class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-[#005daa] relative overflow-hidden group transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer">
          <p class="text-[10px] uppercase font-bold text-[#707785] tracking-widest mb-3 relative z-10">Total Workload</p>
          <div class="flex items-end justify-between relative z-10">
            <h3 class="text-3xl font-extrabold text-[#1a1c1c]">{{ lpSummaryTotal }} <span
                class="text-xs font-medium text-slate-400">Plans</span></h3>
            <span class="bg-[#005daa]/10 text-[#005daa] text-[10px] font-black flex items-center px-2 py-1 rounded-lg">
              View All
            </span>
          </div>
          <span
            class="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-[#005daa]/5 rotate-12 group-hover:scale-110 transition-transform">event_available</span>
        </div>

        <div @click="selectedSport = 'All'" :class="['bg-white p-6 rounded-2xl shadow-sm border-b-4 relative overflow-hidden group transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer',
          selectedSport === 'All' ? 'border-[#005daa]' : 'border-slate-100']">
          <p class="text-[10px] uppercase font-bold text-[#707785] tracking-widest mb-3 relative z-10">Total Training
            Path</p>
          <div class="flex items-end justify-between relative z-10">
            <h3 class="text-3xl font-extrabold text-[#1a1c1c]">{{ curriculumModules.length }} <span
                class="text-xs font-medium text-slate-400">Modules</span></h3>
            <span class="bg-[#f0fdf4] text-[#059669] text-[10px] font-bold flex items-center px-2 py-1 rounded-lg">
              <span class="material-symbols-outlined text-sm mr-1">map</span> Global
            </span>
          </div>
        </div>
        <div v-for="(sport, index) in assignments" :key="sport.id" @click="selectedSport = sport.sport" :class="['bg-white p-6 rounded-2xl shadow-sm border-b-4 relative overflow-hidden group transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer',
          selectedSport === sport.sport ? getBorderColor(index) : 'border-slate-100']">
          <p class="text-[10px] uppercase font-bold text-[#707785] tracking-widest mb-3 relative z-10">{{ sport.sport }}
          </p>
          <div class="flex items-end justify-between relative z-10">
            <h3 class="text-3xl font-extrabold text-[#1a1c1c]">{{ sport.module_count }} <span
                class="text-xs font-medium text-slate-400">Steps</span></h3>
            <span :class="['text-[10px] font-bold flex items-center px-2 py-1 rounded-lg', getBadgeColor(index)]">
              <span class="material-symbols-outlined text-sm mr-1">check_circle</span> Active
            </span>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,28,58,0.04)] overflow-hidden">
        <div
          class="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-[#f9f9f9]/50">
          <div class="flex items-center gap-3 w-full md:w-auto">
            <div class="relative flex-1 md:w-64 group">
              <span
                class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707785] text-lg">search</span>
              <input v-model="searchQuery"
                class="w-full bg-white border border-[#c0c7d6]/30 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:border-[#005daa]/50 focus:ring-4 focus:ring-[#005daa]/5 transition-all outline-none"
                placeholder="Search plan, skill, or objective..." type="text" />
            </div>
            <div class="relative">
              <select v-model="selectedGrade"
                class="bg-white border border-[#c0c7d6]/30 rounded-xl py-2.5 pl-4 pr-10 text-sm font-semibold text-[#404753] focus:border-[#005daa]/50 focus:ring-4 focus:ring-[#005daa]/5 transition-all outline-none appearance-none min-w-[120px]">
                <option value="All">All Grades</option>
                <option v-for="g in availableGrades" :key="g" :value="g">Grade {{ g }}</option>
              </select>
              <span
                class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#707785] pointer-events-none">expand_more</span>
            </div>
          </div>
          <div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide px-2">
            <span class="text-[10px] font-bold uppercase text-[#707785] px-2 whitespace-nowrap">Sport:</span>
            <button @click="selectedSport = 'All'" :class="[
              'whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all',
              selectedSport === 'All' ? 'bg-[#005daa] text-white shadow-md shadow-[#005daa]/20' : 'bg-[#f3f3f3] text-[#404753] hover:bg-[#e8e8e8]'
            ]">All Path</button>
            <button v-for="sport in sports" :key="sport" @click="selectedSport = sport" :class="[
              'whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all',
              selectedSport === sport ? 'bg-[#005daa] text-white shadow-md shadow-[#005daa]/20' : 'bg-[#f3f3f3] text-[#404753] hover:bg-[#e8e8e8]'
            ]">
              {{ sport }}
            </button>
          </div>
        </div>

        <!-- Table View -->
        <div class="overflow-x-auto">
          <div v-if="loading" class="p-20 text-center">
            <div class="animate-spin rounded-full h-12 w-20 border-t-2 border-b-2 border-[#005daa] mx-auto mb-4"></div>
            <p class="text-[#404753] font-medium animate-pulse">Syncing school path modules...</p>
          </div>
          <table v-else class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#f3f3f3]/30">
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753] text-center w-20">
                  No.</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753] w-32">Sport</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753] w-40">Skill</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753] w-48">Sub-Skill</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753]">Objective</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753] text-center w-20">
                  Grade</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="module in filteredModules" :key="module.module_id" @click="selectedModule = module"
                class="hover:bg-slate-50/80 transition-all group cursor-pointer">
                <td class="px-6 py-5 text-center">
                  <span
                    class="font-mono text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500 border border-slate-200">
                    {{ module.lp_no || module.module_id }}
                  </span>
                </td>
                <td class="px-6 py-5">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-[#005daa]"></div>
                    <p class="font-bold text-xs text-[#1a1c1c] uppercase tracking-tighter">{{ module.sport }}</p>
                  </div>
                </td>
                <td class="px-6 py-5">
                  <p class="text-xs font-bold text-[#1a1c1c] leading-snug">{{ module.skill }}</p>
                </td>
                <td class="px-6 py-5">
                  <p class="text-[11px] text-[#404753] font-medium leading-relaxed">{{ module.sub_skill || '-' }}</p>
                </td>
                <td class="px-6 py-5">
                  <p class="text-[11px] text-[#404753] font-medium leading-relaxed line-clamp-2 italic"
                    :title="module.objective">
                    {{ module.objective }}
                  </p>
                </td>
                <td class="px-6 py-5 text-center">
                  <div
                    class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-600 mx-auto border border-slate-200 shadow-sm uppercase">
                    {{ formatGrade(module.grade) }}
                  </div>
                </td>
              </tr>
              <tr v-if="!loading && filteredModules.length === 0">
                <td colspan="6" class="px-6 py-24 text-center">
                  <span class="material-symbols-outlined text-4xl text-slate-200 mb-2 opacity-20">history_edu</span>
                  <p class="text-[#404753] font-medium uppercase tracking-widest text-[10px]">No learning records
                    matched your search</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div
          class="p-6 bg-[#f3f3f3]/20 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-50">
          <p class="text-xs text-[#404753] font-medium tracking-widest uppercase">
            Showing <span class="text-[#1a1c1c] font-bold">{{ filteredModules.length }}</span> modules on your path
          </p>
          <div class="flex items-center gap-1.5">
            <button
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-[#c0c7d6]/30 text-slate-400 hover:bg-white transition-all disabled:opacity-30">
              <span class="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              class="w-8 h-8 flex items-center justify-center rounded-lg bg-[#005daa] text-white text-xs font-bold shadow-md shadow-[#005daa]/20">1</button>
            <button
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-[#c0c7d6]/30 text-slate-400 hover:bg-white transition-all">
              <span class="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Detail Modal -->
    <div v-if="selectedModule" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-[#001c3a]/60 backdrop-blur-sm" @click="selectedModule = null"></div>
      <div
        class="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <p class="text-[10px] font-black uppercase text-[#005daa] tracking-widest mb-1">Plan Module #{{
              selectedModule.lp_no || selectedModule.module_id }}</p>
            <h3 class="text-xl font-extrabold text-[#1a1c1c]">{{ selectedModule.sport }} Training</h3>
          </div>
          <button @click="selectedModule = null"
            class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-all text-slate-500">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-8 space-y-6 max-height-[70vh] overflow-y-auto">
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-[#f8fafc] rounded-2xl border border-slate-100">
              <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Skill Category</p>
              <p class="text-sm font-bold text-[#1a1c1c]">{{ selectedModule.skill || '-' }}</p>
            </div>
            <div class="p-4 bg-[#f8fafc] rounded-2xl border border-slate-100">
              <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Grade Level</p>
              <p class="text-sm font-bold text-[#1a1c1c] font-mono">GRADE {{ selectedModule.grade || '-' }}</p>
            </div>
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Sub-Skill Detail</p>
            <div
              class="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm italic text-sm text-[#404753] leading-relaxed">
              {{ selectedModule.sub_skill || 'No specific sub-skill defined for this plan.' }}
            </div>
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Training Objective</p>
            <div
              class="p-6 bg-[#005daa]/5 border border-[#005daa]/10 rounded-2xl text-sm text-[#1a1c1c] leading-loose font-medium">
              {{ selectedModule.objective }}
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-50 flex items-center justify-between border-t border-slate-100">
          <p class="text-[10px] font-bold text-slate-400 uppercase">Interactive Path Learning System</p>
          <div class="flex gap-3">
            <button @click="selectedModule = null"
              class="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-white/50 transition-all">Close
              Details</button>
            <button
              class="px-6 py-2.5 bg-[#005daa] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#005daa]/20 hover:bg-[#0075d5] transition-all">Download
              PDF</button>
          </div>
        </div>
      </div>
    </div>


  </div>

  <!-- Assign CRM Modal -->
  <div v-if="showAssignModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-[#001c3a]/60 backdrop-blur-md" @click="showAssignModal = false"></div>
    <div
      class="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">

      <!-- Simplified Modal Header -->
      <div class="px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-[100] flex items-center justify-between">
        <div>
          <h3 class="text-xl font-extrabold text-[#1a1c1c] flex items-center gap-3">
            <span class="material-symbols-outlined text-[#005daa] text-2xl">assignment_add</span>
            Assign Learning Plan
          </h3>
          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Step-by-step curriculum
            distribution</p>
        </div>
        <button @click="showAssignModal = false"
          class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined text-2xl">close</span>
        </button>
      </div>

      <!-- Unified Scroll Body -->
      <div class="flex-1 overflow-y-auto relative scroll-smooth">

        <!-- Step 1: Assign Details (Now Scrollable) -->
        <div class="px-8 py-8 bg-[#f9fafb]/50 border-b border-slate-50">
          <div class="flex items-center gap-2 mb-6">
            <span
              class="w-6 h-6 rounded-full bg-[#005daa] text-white text-[10px] font-black flex items-center justify-center">1</span>
            <h4 class="text-xs font-black uppercase text-[#1a1c1c] tracking-widest">Assign Details</h4>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Select Coach</label>
              <div class="relative group">
                <select v-model="assignForm.teacher_id"
                  class="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-[#1a1c1c] focus:border-[#005daa]/30 focus:ring-4 focus:ring-[#005daa]/5 outline-none transition-all appearance-none">
                  <option value="">Choose a Coach</option>
                  <option v-for="c in coaches" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <span
                  class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">person_search</span>
              </div>
            </div>
            <!-- School Dropdown (dynamic based on selected coach) -->
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">School <span
                  v-if="loadingCoachSchools" class="text-[#005daa] animate-pulse">Loading...</span></label>
              <div class="relative group">
                <select v-model="assignForm.school_id" :disabled="!assignForm.teacher_id || coachSchools.length === 0"
                  class="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-[#1a1c1c] focus:border-[#005daa]/30 focus:ring-4 focus:ring-[#005daa]/5 outline-none transition-all appearance-none disabled:bg-slate-50 disabled:text-slate-400">
                  <option value="">{{ !assignForm.teacher_id ? 'Select coach first' : coachSchools.length === 0 ? 'No schools found' : 'All Schools' }}</option>
                  <option v-for="s in coachSchools" :key="s.school_id" :value="s.school_id">{{ s.school_name }}</option>
                </select>
                <span
                  class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">school</span>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Select Week</label>
              <div class="relative group">
                <select v-model="assignForm.week"
                  class="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-[#1a1c1c] focus:border-[#005daa]/30 focus:ring-4 focus:ring-[#005daa]/5 outline-none transition-all appearance-none">
                  <option value="">Select Week</option>
                  <option value="Week1">Week 1</option>
                  <option value="Week2">Week 2</option>
                  <option value="Week3">Week 3</option>
                  <option value="Week4">Week 4</option>
                </select>
                <span
                  class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">calendar_month</span>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Month & Year</label>
              <div class="relative group">
                <select v-model="assignForm.month_year"
                  class="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-[#1a1c1c] focus:border-[#005daa]/30 focus:ring-4 focus:ring-[#005daa]/5 outline-none transition-all appearance-none">
                  <option value="">Select Month</option>
                  <option v-for="m in next24Months" :key="m" :value="m">{{ m }}</option>
                </select>
                <span
                  class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">schedule</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Content Filters (Sticky Header) -->
        <div
          class="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] px-8 py-6">
          <div class="flex items-center gap-2 mb-4">
            <span
              class="w-6 h-6 rounded-full bg-[#005daa] text-white text-[10px] font-black flex items-center justify-center">2</span>
            <h4 class="text-xs font-black uppercase text-[#1a1c1c] tracking-widest">Filter Content</h4>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sport
                Category</label>
              <div class="relative group">
                <select v-model="modalFilters.sport"
                  class="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-[#1a1c1c] appearance-none outline-none focus:ring-4 focus:ring-[#005daa]/5 transition-all">
                  <option value="All">All Path</option>
                  <option v-for="s in sports" :key="s" :value="s">{{ s }}</option>
                </select>
                <span
                  class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl">stat_0</span>
              </div>
            </div>

            <div class="md:col-span-2 space-y-1.5">
              <div class="flex items-center justify-between px-1">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standard / Grade</label>
                <button v-if="modalFilters.grades.length > 0" @click="modalFilters.grades = []"
                  class="text-[10px] font-black text-[#005daa] hover:underline uppercase tracking-tighter">Clear</button>
              </div>

              <div class="grade-swiper-container">
                <swiper :slides-per-view="'auto'" :space-between="8" :free-mode="true"
                  :mousewheel="{ forceToAxis: true }" :modules="[Navigation, Pagination, FreeMode, Mousewheel]"
                  class="grade-swiper !py-2 !px-1">
                  <swiper-slide v-for="g in availableGrades" :key="g" class="!w-auto">
                    <button @click="toggleGradeSelection(Number(g))" :class="[
                      'px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 min-w-[80px]',
                      modalFilters.grades.includes(Number(g))
                        ? 'bg-[#005daa] border-[#005daa] text-white shadow-sm'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                    ]">
                      <span class="text-[10px] font-black whitespace-nowrap uppercase">{{ formatGrade(g) }}</span>
                    </button>
                  </swiper-slide>
                </swiper>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Module Selection -->
        <div class="px-8 py-8">
          <div class="flex items-center justify-between mb-6 px-1">
            <div class="flex items-center gap-2">
              <span
                class="w-6 h-6 rounded-full bg-[#005daa] text-white text-[10px] font-black flex items-center justify-center">3</span>
              <h4 class="text-xs font-black uppercase text-[#1a1c1c] tracking-widest">Choose Modules</h4>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-[10px] font-bold text-[#005daa] bg-[#005daa]/10 px-3 py-1 rounded-full uppercase">{{
                selectedAssignments.length }} Selected</span>
              <button @click="toggleSelectAllModal"
                class="text-[10px] font-bold text-slate-400 hover:text-[#005daa] transition-colors uppercase underline decoration-dotted">
                {{ selectedAssignments.length > 0 && selectedAssignments.length === modalFilteredModules.length ?
                  'Deselect All' : 'Select All' }}
              </button>
            </div>
          </div>
          <div class="border border-slate-100 rounded-2xl overflow-hidden">
            <table class="w-full text-left">
              <thead class="bg-[#f9fafb] border-b border-slate-100">
                <tr>
                  <th class="px-6 py-4 w-14 text-center">
                    <input type="checkbox" @change="toggleSelectAllModal"
                      :checked="selectedAssignments.length > 0 && selectedAssignments.length === modalFilteredModules.length"
                      class="w-6 h-6 rounded-lg border-2 border-slate-900 bg-slate-200 text-[#005daa] focus:ring-[#005daa] cursor-pointer transition-all active:scale-95 shadow-md">
                  </th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Sport & Plan
                  </th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Skill / Objective</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase text-slate-500 text-center">Grade</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="m in modalFilteredModules" :key="m.module_id" @click="toggleSelection(m.module_id)" :class="[
                  'transition-colors',
                  alreadyAssignedModules.includes(m.module_id) ? 'bg-[#005daa]/10 cursor-not-allowed opacity-80' : 'hover:bg-slate-50 cursor-pointer',
                  selectedAssignments.includes(m.module_id) && !alreadyAssignedModules.includes(m.module_id) ? 'bg-[#005daa]/5' : ''
                ]">
                  <td class="px-6 py-4 text-center relative">
                    <input type="checkbox"
                      :checked="selectedAssignments.includes(m.module_id) || alreadyAssignedModules.includes(m.module_id)"
                      :disabled="alreadyAssignedModules.includes(m.module_id)"
                      @click.stop="toggleSelection(m.module_id)" :class="[
                        'w-6 h-6 rounded-lg border-2 border-slate-900 transition-all active:scale-95 shadow-md',
                        alreadyAssignedModules.includes(m.module_id) ? 'bg-[#005daa] cursor-not-allowed opacity-50' : 'bg-slate-200 text-[#005daa] focus:ring-[#005daa] cursor-pointer'
                      ]">
                    <span v-if="alreadyAssignedModules.includes(m.module_id)"
                      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[10px] font-bold pointer-events-none material-symbols-outlined shrink-0"
                      style="font-size:16px;">lock</span>
                  </td>
                  <td class="px-6 py-4">
                    <p
                      :class="['text-xs font-black mb-0.5', alreadyAssignedModules.includes(m.module_id) ? 'text-[#005daa]' : 'text-[#005daa]']">
                      LP-{{ m.lp_no }}</p>
                    <p
                      :class="['text-[10px] uppercase font-bold tracking-tighter', alreadyAssignedModules.includes(m.module_id) ? 'text-[#005daa]/80' : 'text-[#1a1c1c]']">
                      {{ m.sport }}</p>
                  </td>
                  <td class="px-6 py-4">
                    <p
                      :class="['text-xs font-bold line-clamp-1', alreadyAssignedModules.includes(m.module_id) ? 'text-[#005daa]' : 'text-[#1a1c1c]']">
                      {{ m.skill }}</p>
                    <p
                      :class="['text-[10px] line-clamp-1 italic', alreadyAssignedModules.includes(m.module_id) ? 'text-[#005daa]/60' : 'text-[#404753]']">
                      {{ m.objective }}</p>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span
                      :class="['text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase whitespace-nowrap', alreadyAssignedModules.includes(m.module_id) ? 'bg-[#005daa]/20 text-[#005daa] border-[#005daa]/30' : 'bg-slate-100 text-slate-600 border-slate-200']">
                      {{ formatGrade(m.grade) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-8 border-t border-slate-100 bg-white flex items-center justify-between">
        <p class="text-[10px] font-bold text-slate-400 max-w-[200px]">Ensure details are correct before assigning.</p>
        <div class="flex gap-4">
          <button @click="showAssignModal = false"
            class="px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all border border-slate-100">Cancel</button>
          <button @click="assignCRM"
            :disabled="assigning || !assignForm.teacher_id || !assignForm.week || !assignForm.month_year || selectedAssignments.length === 0"
            class="bg-[#005daa] disabled:bg-slate-300 hover:bg-[#0075d5] text-white px-10 py-3.5 rounded-2xl font-black text-sm flex items-center gap-3 transition-all shadow-xl shadow-[#005daa]/20 active:scale-95 group">
            <span v-if="assigning" class="material-symbols-outlined animate-spin">sync</span>
            <span v-else class="material-symbols-outlined">send</span>
            <span>Assign Now</span>
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- Manage Assignments Modal -->
  <div v-if="showManageModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-[#001c3a]/60 backdrop-blur-md" @click="showManageModal = false"></div>
    <div
      class="relative bg-white w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
      <div class="px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-[100] flex items-center justify-between">
        <div>
          <h3 class="text-xl font-extrabold text-[#1a1c1c] flex items-center gap-3">
            <span class="material-symbols-outlined text-[#005daa] text-2xl">manage_history</span>
            Manage Assignments
          </h3>
          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Review and manage curriculum
            distribution</p>
        </div>
        <button @click="showManageModal = false"
          class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined text-2xl">close</span>
        </button>
      </div>

      <div
        class="px-8 py-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex flex-wrap gap-4 items-center z-50 relative shadow-inner">
        <div class="flex items-center gap-2 mr-2">
          <span class="material-symbols-outlined text-slate-300">filter_list</span>
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Filters</span>
        </div>

        <!-- Coach Filter -->
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span
              class="material-symbols-outlined text-[16px] text-[#005daa] opacity-70 group-focus-within:opacity-100 transition-opacity">person</span>
          </div>
          <select v-model="manageFilters.coach_name"
            class="pl-9 pr-8 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-extrabold text-[#1a1c1c] focus:ring-4 focus:ring-[#005daa]/10 focus:border-[#005daa] outline-none transition-all appearance-none shadow-sm cursor-pointer min-w-[150px]">
            <option value="All">All Coaches</option>
            <option v-for="c in uniqueManageCoaches" :key="c" :value="c">{{ c }}</option>
          </select>
          <span
            class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-lg group-hover:text-slate-600 transition-colors">expand_more</span>
        </div>

        <!-- Week Filter -->
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span
              class="material-symbols-outlined text-[16px] text-emerald-600 opacity-70 group-focus-within:opacity-100 transition-opacity">view_week</span>
          </div>
          <select v-model="manageFilters.week"
            class="pl-9 pr-8 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-extrabold text-[#1a1c1c] focus:ring-4 focus:ring-emerald-600/10 focus:border-emerald-600 outline-none transition-all appearance-none shadow-sm cursor-pointer min-w-[130px]">
            <option value="All">All Weeks</option>
            <option v-for="w in uniqueManageWeeks" :key="w" :value="w">{{ w }}</option>
          </select>
          <span
            class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-lg group-hover:text-slate-600 transition-colors">expand_more</span>
        </div>

        <!-- Month Filter -->
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span
              class="material-symbols-outlined text-[16px] text-amber-600 opacity-70 group-focus-within:opacity-100 transition-opacity">calendar_month</span>
          </div>
          <select v-model="manageFilters.month_year"
            class="pl-9 pr-8 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-extrabold text-[#1a1c1c] focus:ring-4 focus:ring-amber-600/10 focus:border-amber-600 outline-none transition-all appearance-none shadow-sm cursor-pointer min-w-[140px]">
            <option value="All">All Months</option>
            <option v-for="m in uniqueManageMonths" :key="m" :value="m">{{ m }}</option>
          </select>
          <span
            class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-lg group-hover:text-slate-600 transition-colors">expand_more</span>
        </div>

        <!-- Status Filter -->
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span
              class="material-symbols-outlined text-[16px] text-purple-600 opacity-70 group-focus-within:opacity-100 transition-opacity">fact_check</span>
          </div>
          <select v-model="manageFilters.status"
            class="pl-9 pr-8 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-extrabold text-[#1a1c1c] focus:ring-4 focus:ring-purple-600/10 focus:border-purple-600 outline-none transition-all appearance-none shadow-sm cursor-pointer min-w-[150px]">
            <option value="All">All Statuses</option>
            <option value="Done">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Unmarked">Unmarked</option>
          </select>
          <span
            class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-lg group-hover:text-slate-600 transition-colors">expand_more</span>
        </div>

        <!-- School Filter -->
        <div class="relative group" v-if="uniqueManageSchools.length > 0">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span
              class="material-symbols-outlined text-[16px] text-rose-600 opacity-70 group-focus-within:opacity-100 transition-opacity">school</span>
          </div>
          <select v-model="manageFilters.school"
            class="pl-9 pr-8 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-extrabold text-[#1a1c1c] focus:ring-4 focus:ring-rose-600/10 focus:border-rose-600 outline-none transition-all appearance-none shadow-sm cursor-pointer min-w-[160px]">
            <option value="All">All Schools</option>
            <option v-for="s in uniqueManageSchools" :key="s" :value="s">{{ s }}</option>
          </select>
          <span
            class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-lg group-hover:text-slate-600 transition-colors">expand_more</span>
        </div>
        <div class="ml-auto flex flex-col items-end justify-center">
          <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Results</span>
          <span class="text-lg font-black text-[#005daa] leading-tight">{{ filteredAssignmentsByMe.length }}</span>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-8">
        <div v-if="filteredAssignmentsByMe.length === 0" class="py-20 text-center">
          <span class="material-symbols-outlined text-6xl text-slate-200 mb-4">assignment_late</span>
          <h4 class="text-lg font-bold text-slate-400">No assignments found</h4>
          <p class="text-sm text-slate-400">Try adjusting your filters.</p>
        </div>
        <div v-else class="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Coach</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">School</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Grade
                </th>
                <th class="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Week/Month</th>
                <th class="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Status
                </th>
                <th class="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Action
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="asgn in filteredAssignmentsByMe" :key="asgn.id" class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-5">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-[#005daa]/10 flex items-center justify-center text-[#005daa]">
                      <span class="material-symbols-outlined text-sm">person</span>
                    </div>
                    <div>
                      <p class="text-sm font-bold text-[#1a1c1c]">{{ asgn.coach_name }}</p>
                      <p class="text-[10px] font-medium text-slate-500">{{ new
                        Date(asgn.created_at).toLocaleDateString() }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-5">
                  <div v-if="asgn.school_name" class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-rose-400 text-sm">school</span>
                    <p class="text-xs font-bold text-slate-700">{{ asgn.school_name }}</p>
                  </div>
                  <span v-else class="text-slate-300 text-xs">—</span>
                </td>
                <td class="px-6 py-5 text-center">
                  <p class="text-sm font-extrabold text-[#005daa]">{{ formatGrade(asgn.grade) }}</p>
                  <span
                    class="px-3 py-0.5 rounded-full bg-slate-100 text-[#1a1c1c] text-[9px] font-black uppercase mt-1 inline-block">{{
                      asgn.sport }}</span>
                </td>
                <td class="px-6 py-5">
                  <p class="text-xs font-bold text-[#005daa]">{{ asgn.week }}</p>
                  <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ asgn.month_year }}</p>
                </td>
                <td class="px-6 py-5 text-center">
                  <div class="flex flex-col items-center gap-1">
                    <span v-if="asgn.saved_status === 'Done'"
                      class="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider rounded-full">Done</span>
                    <span v-else-if="asgn.saved_status === 'Pending'"
                      class="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-wider rounded-full">Pending</span>
                    <span v-else
                      class="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded-full">Unmarked</span>
                    <p v-if="asgn.saved_remark" class="text-[10px] text-slate-500 max-w-[120px] truncate"
                      :title="asgn.saved_remark">"{{ asgn.saved_remark }}"</p>
                  </div>
                </td>
                <td class="px-6 py-5 text-center">
                  <button @click="deleteAssignedPlan(asgn.id)"
                    class="w-9 h-9 mx-auto rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center group shadow-sm active:scale-90"
                    title="Revoke Assignment">
                    <span class="material-symbols-outlined text-xl">delete</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="p-8 border-t border-slate-100 bg-white text-right">
        <button @click="showManageModal = false"
          class="px-8 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all border border-slate-100">Close
          Manager</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
// Import Swiper components and styles
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination, FreeMode, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';

const authStore = useAuthStore();
const curriculumModules = ref<any[]>([]);
const assignments = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedSport = ref('All');
const selectedGrade = ref('All');
const selectedModule = ref<any>(null);
const showAssignModal = ref(false);
const showManageModal = ref(false);
const assigning = ref(false);
const coaches = ref<any[]>([]);
const selectedAssignments = ref<number[]>([]);
const assignmentsByMe = ref<any[]>([]);
const lpSummaryTotal = ref(0);
const assignForm = ref({
  teacher_id: '',
  school_id: '',
  week: '',
  month_year: '',
});
const coachSchools = ref<any[]>([]);
const loadingCoachSchools = ref(false);
const modalFilters = ref({
  sport: 'All',
  grades: [] as number[] // Changed from grade: 'All' to grades: [] for multiple selection
});
const alreadyAssignedModules = ref<number[]>([]);

const manageFilters = ref({
  coach_name: 'All',
  week: 'All',
  month_year: 'All',
  status: 'All',
  school: 'All'
});

const uniqueManageCoaches = computed(() => Array.from(new Set(assignmentsByMe.value.map(a => a.coach_name))).sort());
const uniqueManageWeeks = computed(() => Array.from(new Set(assignmentsByMe.value.map(a => a.week))).sort());
const uniqueManageMonths = computed(() => Array.from(new Set(assignmentsByMe.value.map(a => a.month_year))).sort());
const uniqueManageSchools = computed(() => Array.from(new Set(assignmentsByMe.value.map(a => a.school_name).filter(Boolean))).sort());

const filteredAssignmentsByMe = computed(() => {
  return assignmentsByMe.value.filter(a => {
    if (manageFilters.value.coach_name !== 'All' && a.coach_name !== manageFilters.value.coach_name) return false;
    if (manageFilters.value.week !== 'All' && a.week !== manageFilters.value.week) return false;
    if (manageFilters.value.month_year !== 'All' && a.month_year !== manageFilters.value.month_year) return false;
    if (manageFilters.value.school !== 'All' && (a.school_name || '') !== manageFilters.value.school) return false;

    const statusMatch = a.saved_status || 'Unmarked';
    if (manageFilters.value.status !== 'All' && statusMatch !== manageFilters.value.status) return false;

    return true;
  });
});

import { watch } from 'vue';

watch(
  () => assignForm.value.teacher_id,
  async (newTeacherId) => {
    assignForm.value.school_id = '';
    coachSchools.value = [];
    if (!newTeacherId) return;
    loadingCoachSchools.value = true;
    try {
      const res = await fetch(`/api/curriculum/coach-schools/${newTeacherId}`);
      const data = await res.json();
      if (data.success) coachSchools.value = data.schools;
    } catch (err) {
      console.error('Fetch coach schools error:', err);
    } finally {
      loadingCoachSchools.value = false;
    }
  }
);

watch(
  [() => assignForm.value.teacher_id, () => assignForm.value.week, () => assignForm.value.month_year],
  async ([teacher_id, week, month_year]) => {
    if (teacher_id && week && month_year) {
      try {
        const res = await fetch(`/api/curriculum/check-assigned?teacher_id=${teacher_id}&week=${week}&month_year=${month_year}`);
        const data = await res.json();
        if (data.success) {
          alreadyAssignedModules.value = data.assigned_curriculum_ids.map(Number);
          // Also remove any selections that were just marked as already assigned
          selectedAssignments.value = selectedAssignments.value.filter(id => !alreadyAssignedModules.value.includes(id));
        }
      } catch (err) {
        console.error('Check assigned error:', err);
      }
    } else {
      alreadyAssignedModules.value = [];
    }
  }
);

const getBorderColor = (index: number) => {
  const colors = ['border-[#005daa]', 'border-[#10b981]', 'border-[#fbbf24]', 'border-[#40608b]'];
  return colors[index % colors.length];
};

const getBadgeColor = (index: number) => {
  const colors = [
    'bg-[#f0fdf4] text-[#059669]',
    'bg-[#f0fdf4] text-[#059669]',
    'bg-[#fffbeb] text-[#b45309]',
    'bg-[#f1f5f9] text-[#40608b]'
  ];
  return colors[index % colors.length];
};

const fetchData = async () => {
  const userId = authStore.user?.id || sessionStorage.getItem('id');

  if (!userId) {
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const [assignRes, modulesRes, coachesRes, byMeRes, summaryRes] = await Promise.all([
      fetch(`/api/curriculum/my-assignments/${userId}`),
      fetch(`/api/curriculum/my-modules/${userId}`),
      fetch('/api/curriculum/coaches'),
      fetch(`/api/curriculum/assignments-by-me/${userId}`),
      fetch(`/api/curriculum/my-lp-summary/${userId}`)
    ]);
    const assignData = await assignRes.json();
    const modulesData = await modulesRes.json();
    const coachesData = await coachesRes.json();
    const byMeData = await byMeRes.json();
    const summaryData = await summaryRes.json();

    if (assignData.success) assignments.value = assignData.assignments;
    if (modulesData.success) curriculumModules.value = modulesData.modules;
    if (coachesData.success) coaches.value = coachesData.coaches;
    if (byMeData.success) assignmentsByMe.value = byMeData.assignments;
    if (summaryData.success) lpSummaryTotal.value = summaryData.totalCount || 0;
  } catch (err) {
    console.error('Fetch data error:', err);
  } finally {
    loading.value = false;
  }
};

const openAssignModal = () => {
  showAssignModal.value = true;
  selectedAssignments.value = [];
  alreadyAssignedModules.value = [];
  coachSchools.value = [];
  manageFilters.value = { coach_name: 'All', week: 'All', month_year: 'All', status: 'All', school: 'All' };
  assignForm.value = {
    teacher_id: '',
    school_id: '',
    week: '',
    month_year: '',
  };
  modalFilters.value = {
    sport: 'All',
    grades: [] // Initialize as empty array for multiple selection
  };
};

const toggleSelection = (id: number) => {
  if (alreadyAssignedModules.value.includes(id)) return;
  if (selectedAssignments.value.includes(id)) {
    selectedAssignments.value = selectedAssignments.value.filter(i => i !== id);
  } else {
    selectedAssignments.value.push(id);
  }
};

const toggleSelectAllModal = () => {
  const availableModules = modalFilteredModules.value.filter(m => !alreadyAssignedModules.value.includes(m.module_id));
  if (availableModules.length === 0) return;

  if (selectedAssignments.value.length > 0 && selectedAssignments.value.length === availableModules.length) {
    selectedAssignments.value = [];
  } else {
    selectedAssignments.value = availableModules.map(m => m.module_id);
  }
};

const next24Months = computed(() => {
  const months = [];
  const start = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    months.push(d.toLocaleString('default', { month: 'short' }) + ',' + d.getFullYear());
  }
  return months;
});

const assignCRM = async () => {
  const currentUserId = authStore.user?.id || sessionStorage.getItem('id');

  assigning.value = true;
  try {
    const payload = {
      ...assignForm.value,
      assigned_by: currentUserId,
      assignments: selectedAssignments.value.map(id => ({ curriculum_id: id }))
    };

    const res = await fetch('/api/curriculum/assign-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      alert(data.message);
      showAssignModal.value = false;
      selectedAssignments.value = [];
      fetchData(); // Refresh to update "Total Managed" count
    } else {
      alert(data.message || 'Assignment failed');
    }
  } catch (err) {
    console.error('Assign CRM Error:', err);
    alert('Server error while assigning');
  } finally {
    assigning.value = false;
  }
};

const deleteAssignedPlan = async (id: number) => {
  if (!confirm('Are you sure you want to remove this assignment?')) return;
  try {
    const res = await fetch(`/api/curriculum/assigned-plans/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      fetchData(); // Refresh counts and list
    } else {
      alert(data.message || 'Deletion failed');
    }
  } catch (err) {
    console.error('Delete Assigned Plan Error:', err);
    alert('Server error while deleting');
  }
};

onMounted(() => {
  fetchData();
});


const sports = computed(() => {
  const uniqueSports = [...new Set(curriculumModules.value.map(m => m.sport))];
  return uniqueSports.sort();
});

const availableGrades = computed(() => {
  const uniqueGrades = [...new Set(curriculumModules.value.map(m => m.grade))].filter(Boolean);
  return uniqueGrades.sort((a, b) => a - b);
});

const filteredModules = computed(() => {
  let filtered = curriculumModules.value;

  if (selectedSport.value !== 'All') {
    filtered = filtered.filter(m => m.sport === selectedSport.value);
  }

  if (selectedGrade.value !== 'All') {
    filtered = filtered.filter(m => m.grade.toString() === selectedGrade.value.toString());
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    filtered = filtered.filter(m =>
      (m.sport && m.sport.toLowerCase().includes(q)) ||
      (m.skill && m.skill.toLowerCase().includes(q)) ||
      (m.sub_skill && m.sub_skill.toLowerCase().includes(q)) ||
      (m.objective && m.objective.toLowerCase().includes(q)) ||
      (m.grade && m.grade.toString().includes(q))
    );
  }

  return filtered;
});

const modalFilteredModules = computed(() => {
  let filtered = curriculumModules.value;

  if (modalFilters.value.sport !== 'All') {
    filtered = filtered.filter(m => m.sport === modalFilters.value.sport);
  }

  if (modalFilters.value.grades.length > 0) {
    filtered = filtered.filter(m => modalFilters.value.grades.includes(Number(m.grade)));
  }

  return filtered;
});

const toggleGradeSelection = (grade: number) => {
  const index = modalFilters.value.grades.indexOf(grade);
  if (index === -1) {
    modalFilters.value.grades.push(grade);
  } else {
    modalFilters.value.grades.splice(index, 1);
  }
};

const formatGrade = (grade: any) => {
  if (!grade) return '-';
  const g = grade.toString().toLowerCase().trim();

  const presets: Record<string, string> = {
    'nursery': 'Nursery',
    'jr.kg': 'Jr.Kg',
    'jrkg': 'Jr.Kg',
    'sr.kg': 'Sr.Kg',
    'srkg': 'Sr.Kg',
    'lkg': 'LKG',
    'ukg': 'UKG'
  };

  if (presets[g]) return presets[g];

  const num = parseInt(g);
  if (isNaN(num)) return grade;

  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) return num + 'st';
  if (lastDigit === 2 && lastTwoDigits !== 12) return num + 'nd';
  if (lastDigit === 3 && lastTwoDigits !== 13) return num + 'rd';
  return num + 'th';
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap');

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
}

/* Grade Swiper Styles */
.grade-swiper-container {
  width: 100%;
}

.grade-swiper {
  padding: 10px 4px 20px 4px !important;
}

.grade-swiper :deep(.swiper-wrapper) {
  align-items: center;
}

.grade-swiper :deep(.swiper-slide) {
  height: auto;
}
</style>
