<template>
  <div class="p-2 mt-5 max-w-9xl mx-auto">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
      <div>
        <nav class="flex items-center gap-2 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
          <span>Portal</span>
          <span class="material-symbols-outlined text-[12px]">chevron_right</span>
          <span class="text-primary">Curriculum</span>
        </nav>
        <h1 class="text-4xl font-headline font-extrabold tracking-tight text-on-surface leading-tight" style="font-family: 'Manrope', sans-serif;">Curriculum Builder</h1>
        <p class="text-on-surface-variant mt-1 font-body">Define the structure and athletic focus of your new portal.</p>
      </div>
    </header>

    <!-- Steps Progress -->
    <div class="flex items-center gap-4 mb-10 overflow-x-auto pb-4 no-scrollbar">
      <div v-for="(step, idx) in steps" :key="idx" class="flex items-center gap-4 shrink-0">
        <div :class="[
          'flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300',
          currentStep > idx + 1 ? 'bg-surface-container opacity-60' : 
          currentStep === idx + 1 ? 'bg-primary text-white shadow-md' : 
          'bg-surface-container-low text-on-surface-variant opacity-50'
        ]">
          <span v-if="currentStep > idx + 1" class="material-symbols-outlined text-primary text-sm" style="font-variation-settings: 'FILL' 1;">check_circle</span>
          <span v-else :class="['rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold', currentStep === idx + 1 ? 'bg-white text-primary' : 'bg-outline-variant text-white']">
            {{ idx + 1 }}
          </span>
          <span class="text-sm font-bold whitespace-nowrap">{{ step }}</span>
        </div>
        <div v-if="idx < steps.length - 1" class="w-8 h-[2px] bg-outline-variant opacity-30"></div>
      </div>
    </div>

    <div class="space-y-12">
      <!-- Step 1: Program Type -->
      <section v-show="currentStep === 1" class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div class="flex items-center gap-4 mb-8">
          <div class="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-primary">info</span>
          </div>
          <div>
            <h3 class="text-xl font-headline font-bold text-on-surface">Step 1: Program Type</h3>
            <p class="text-sm text-on-surface-variant">Select the fundamental delivery model for this curriculum.</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label v-for="type in programTypes" :key="type.id" class="cursor-pointer group">
            <input v-model="programType" :value="type.id" type="radio" name="program_type" class="sr-only peer" />
            <div class="block h-full bg-white p-8 rounded-xl transition-all duration-300 ring-2 ring-transparent peer-checked:ring-primary peer-checked:bg-primary/5 hover:bg-slate-50 shadow-sm border border-slate-100">
              <div class="flex justify-between items-start mb-6">
                <div :class="['w-14 h-14 rounded-xl flex items-center justify-center', type.bgClass, type.textClass]">
                  <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">{{ type.icon }}</span>
                </div>
                <span class="material-symbols-outlined text-primary opacity-0 peer-checked:opacity-100 transition-opacity">check_circle</span>
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-2" style="font-family: 'Manrope', sans-serif;">{{ type.name }}</h3>
              <p class="text-sm text-slate-500 leading-relaxed">{{ type.description }}</p>
            </div>
          </label>
        </div>
      </section>

      <!-- Step 2: Grade Level -->
      <section v-show="currentStep === 2" class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div class="flex items-center gap-4 mb-8">
          <div class="w-10 h-10 rounded-lg bg-secondary-container/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-secondary">school</span>
          </div>
          <div>
            <h3 class="text-xl font-headline font-bold text-on-surface">Step 2: Target Grade Levels</h3>
            <p class="text-sm text-on-surface-variant">Select one or more standards that this curriculum will serve.</p>
          </div>
        </div>

        <div v-if="loadingGrades" class="py-12 flex justify-center items-center gap-4">
           <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Identifying Standards...</p>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
          <!-- Foundation -->
          <label v-for="grade in visibleFoundationGrades" :key="grade.id" class="cursor-pointer">
            <input v-model="selectedGrades" :value="grade.id" name="standard_selection" class="peer sr-only" type="radio" />
            <div class="flex flex-col items-center justify-center aspect-square bg-white rounded-xl border border-slate-100 hover:bg-slate-50 transition-all peer-checked:bg-primary peer-checked:text-white shadow-sm">
              <span class="text-[10px] uppercase tracking-tighter font-bold opacity-60 mb-1">{{ grade.group }}</span>
              <span class="text-sm font-bold">{{ grade.name }}</span>
            </div>
          </label>
          <!-- Numeric -->
          <label v-for="n in visibleNumericGrades" :key="n" class="cursor-pointer">
            <input v-model="selectedGrades" :value="n" name="standard_selection" class="peer sr-only" type="radio" />
            <div class="flex flex-col items-center justify-center aspect-square bg-white rounded-xl border border-slate-100 hover:bg-slate-50 transition-all peer-checked:bg-primary peer-checked:text-white shadow-sm">
              <span class="text-[10px] uppercase tracking-tighter font-bold opacity-60 mb-1">{{ n <= 5 ? 'Elementary' : n <= 8 ? 'Middle' : 'High' }}</span>
              <span class="text-2xl font-black">{{ n }}</span>
            </div>
          </label>
        </div>
      </section>

      <!-- Step 3: Division Selection (Inside Step 3 logic) -->
      <!-- Step 3: Division Selection -->
      <!-- Step 3: Division & Sport Selection -->
      <section v-show="currentStep === 3" class="space-y-12">
        <!-- Division Selection -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div class="flex items-center gap-4 mb-8">
            <div class="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center">
              <span class="material-symbols-outlined text-on-secondary-container">groups</span>
            </div>
            <div>
              <h3 class="text-xl font-headline font-bold text-on-surface">Step 3: Division Selection</h3>
              <p class="text-sm text-on-surface-variant">Choose the competitive levels available for your selected grades.</p>
            </div>
          </div>

          <div v-if="loadingDivisions" class="py-8 flex items-center gap-4 justify-center">
             <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
             <p class="text-xs font-bold text-slate-400">Fetching Divisions...</p>
          </div>

          <div v-else-if="availableDivisions.length > 0" class="flex flex-wrap gap-4">
            <label v-for="divName in availableDivisions" :key="divName" class="cursor-pointer group">
              <input v-model="selectedDivisions" :value="divName" class="sr-only peer" type="checkbox"/>
              <div class="px-8 py-4 rounded-full border-2 border-transparent bg-surface-container-low text-on-surface-variant peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-lg transition-all duration-200 font-medium flex items-center gap-3 hover:bg-surface-container-high">
                <span class="material-symbols-outlined text-lg">{{ getDivisionIcon(divName) }}</span>
                {{ divName }}
              </div>
            </label>
          </div>
          <div v-else class="py-12 text-center text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-xl">
            Please complete Step 2 to view available divisions.
          </div>
        </div>

        <!-- Sport Selection -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div class="flex items-center gap-4 mb-8">
            <div class="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center">
              <span class="material-symbols-outlined text-on-tertiary-fixed">sports_basketball</span>
            </div>
            <div>
              <h3 class="text-xl font-headline font-bold text-on-surface">Step 4: Specific Sport</h3>
              <p class="text-sm text-on-surface-variant">Select the primary athletic discipline for this curriculum track.</p>
            </div>
          </div>

          <div v-if="loadingSports" class="py-12 flex flex-col items-center justify-center gap-4">
            <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Discovering Available Sports...</p>
          </div>

          <div v-else-if="dynamicSportsList.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="sportName in dynamicSportsList" :key="sportName" 
                 @click="selectedSport = sportName"
                 :class="['group relative overflow-hidden rounded-xl border transition-all cursor-pointer', selectedSport === sportName ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-transparent hover:border-primary/50 shadow-sm']">
              <div class="aspect-[3/4] w-full relative overflow-hidden">
                <img :src="getSportImage(sportName)" :alt="sportName" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div class="absolute bottom-4 left-4 right-4 text-white">
                  <p class="font-headline font-bold text-lg leading-tight">{{ sportName }}</p>
                  <p class="text-white/70 text-[10px] uppercase tracking-widest font-bold mt-1 tracking-wider">Master Data Source</p>
                </div>
                <div class="absolute top-3 right-3 transition-all">
                  <div :class="['p-2 rounded-full shadow-lg transition-colors', selectedSport === sportName ? 'bg-white text-primary' : 'bg-primary text-white opacity-0 group-hover:opacity-100']">
                    <span class="material-symbols-outlined text-sm">{{ selectedSport === sportName ? 'check' : 'add' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="py-12 text-center text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-xl">
            No sports curriculum found for Grade {{ selectedGrades || 'selected' }} in master records.
          </div>
        </div>
      </section>

      <!-- Step 4: Final Review (Coach Lesson View Redesign) -->
      <section v-show="currentStep === 4" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div v-if="loadingFinalContent" class="py-20 flex flex-col items-center justify-center gap-6">
          <div class="w-16 h-16 border-8 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div class="text-center">
            <h4 class="text-xl font-black text-on-surface mb-2">Compiling Curriculum...</h4>
            <p class="text-sm text-on-surface-variant">Syncing master lesson plans and instructional resources.</p>
          </div>
        </div>

        <div v-else-if="currentLesson" class="space-y-8">
          <!-- Step 4 Header -->
          <div class="flex items-end justify-between mb-8">
            <div>
              <nav class="flex items-center gap-2 text-xs text-on-surface-variant font-medium mb-2">
                <span>Curriculum</span>
                <span class="material-symbols-outlined text-[14px]">chevron_right</span>
                <span class="text-primary font-semibold uppercase tracking-widest">{{ programType }} • {{ selectedSport }}</span>
              </nav>
              <h2 class="text-3xl font-extrabold text-on-surface tracking-tight" style="font-family: 'Manrope', sans-serif;">
                Lesson Detail: {{ currentLesson.skill }}
              </h2>
              <p class="text-on-surface-variant mt-1 font-medium">{{ currentLesson.sub_skill }}</p>
            </div>
            <div class="flex gap-4">
              <button @click="printLessonPlan" class="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors text-sm font-semibold flex items-center gap-2 shadow-sm">
                <span class="material-symbols-outlined text-[20px]">file_download</span>
                Session Plan PDF
              </button>
              <button @click="reviewSelection" class="px-6 py-2.5 rounded-lg bg-gradient-to-v from-primary to-primary-container text-white text-sm font-bold shadow-md hover:scale-95 transition-transform flex items-center gap-2">
                <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                Mark Lesson as Complete
              </button>
            </div>
          </div>

          <!-- 3-Column Bento Grid Layout -->
          <div class="grid grid-cols-12 gap-8 items-start">
            <!-- Left Column: Lesson Navigation & Resources (col-span-3) -->
            <div class="col-span-12 lg:col-span-3 space-y-6">
              <section class="bg-surface-container-low rounded-xl p-5 shadow-sm border border-slate-100">
                <h3 class="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Unit Curriculum</h3>
                <div class="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                  <button v-for="(lesson, idx) in liveLessons" :key="idx" 
                          @click="selectedLessonIdx = idx"
                          :class="['w-full text-left p-3 rounded-lg transition-all duration-300 border-l-4 shadow-sm group', 
                            selectedLessonIdx === idx ? 'bg-surface-container-lowest border-primary shadow-md' : 'bg-transparent border-transparent hover:bg-surface-container']">
                    <p :class="['text-xs font-bold mb-1', selectedLessonIdx === idx ? 'text-primary' : 'text-on-surface-variant']">LP {{ lesson.lp_no }}</p>
                    <p class="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{{ lesson.skill || 'Session' }}</p>
                    <div v-if="selectedLessonIdx === idx" class="mt-2 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      <span class="text-[10px] text-on-surface-variant font-bold uppercase">In Progress</span>
                    </div>
                    <div v-else class="mt-2 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-slate-300"></span>
                      <span class="text-[10px] text-on-surface-variant font-bold uppercase">Locked</span>
                    </div>
                  </button>
                </div>
              </section>

              <div class="bg-primary-container/10 border border-primary/20 rounded-xl p-5">
                <h4 class="text-sm font-bold text-on-primary-fixed-variant mb-2">Training Resources</h4>
                <p class="text-xs text-on-surface-variant mb-4 leading-relaxed italic">Ensure all equipment is ready 15 mins before session start.</p>
                <div class="space-y-3">
                  <div v-for="aid in parseList(currentLesson.teaching_aids)" :key="aid" class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm border border-primary/5">
                      <span class="material-symbols-outlined text-[18px]">inventory_2</span>
                    </div>
                    <span class="text-xs font-medium text-on-surface">{{ aid }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Center Column: Video & Instructions (col-span-6) -->
            <div class="col-span-12 lg:col-span-6 space-y-8">
              <!-- Instructional Video -->
              <section class="bg-black rounded-xl overflow-hidden aspect-video relative group shadow-2xl">
                <img :src="currentLesson.picture || getSportImage(selectedSport)" class="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                <div class="absolute inset-0 flex items-center justify-center">
                  <button class="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform">
                    <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center text-primary shadow-xl">
                      <span class="material-symbols-outlined text-[40px]" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                    </div>
                  </button>
                </div>
                <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent text-white">
                  <h4 class="font-bold text-lg mb-1">{{ currentLesson.skill }} Technique Detail</h4>
                  <p class="text-white/70 text-xs">High Definition • LP {{ currentLesson.lp_no }}</p>
                </div>
              </section>

              <!-- Training Instructions (Fetched Methodology) -->
              <section class="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-slate-100">
                <h3 class="text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
                  <span class="material-symbols-outlined text-primary">description</span>
                  Training Instructions
                </h3>
                <div class="space-y-6">
                  <!-- Dynamic Phases -->
                  <div v-if="currentLesson.warm_up">
                    <p class="text-xs font-bold text-primary uppercase tracking-widest mb-2">Phase 1: Performance Warm Up</p>
                    <div class="space-y-3">
                      <div v-for="t in parseList(currentLesson.warm_up)" :key="t" class="p-4 bg-slate-50 rounded-lg text-sm text-on-surface-variant font-medium leading-relaxed border border-slate-100">
                        {{ t }}
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="currentLesson.skill_implementation">
                    <p class="text-xs font-bold text-primary uppercase tracking-widest mb-2">Phase 2: Core Implementation</p>
                    <div class="space-y-3">
                      <div v-for="(t, i) in parseList(currentLesson.skill_implementation)" :key="i" class="p-5 bg-blue-50/50 rounded-lg text-sm font-medium text-on-surface-variant leading-relaxed border border-blue-100/30 flex gap-4">
                        <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-md shrink-0">{{ i+1 }}</span>
                        <p class="pt-1.5">{{ t }}</p>
                      </div>
                    </div>
                  </div>

                  <div v-if="currentLesson.cool_down">
                    <p class="text-xs font-bold text-primary uppercase tracking-widest mb-2">Phase 3: Recovery & Cool Down</p>
                    <div class="p-5 bg-amber-50/30 rounded-lg border border-amber-100/50 flex items-start gap-4">
                      <span class="material-symbols-outlined text-amber-600 text-[20px]">ac_unit</span>
                      <p class="text-sm text-on-surface-variant font-medium leading-relaxed pt-0.5">{{ currentLesson.cool_down }}</p>
                    </div>
                  </div>

                  <div v-if="currentLesson.summarization">
                    <p class="text-xs font-bold text-primary uppercase tracking-widest mb-2">Phase 4: Session Review</p>
                    <div class="bg-purple-50/50 border border-purple-100/30 rounded-lg p-5 italic text-sm text-purple-900 font-medium leading-relaxed flex items-start gap-4">
                      <span class="material-symbols-outlined text-purple-600 text-[20px]">tips_and_updates</span>
                      "{{ currentLesson.summarization }}"
                    </div>
                  </div>
                </div>
              </section>

              <!-- Notes or Feedback -->
              <section class="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-slate-100">
                <h3 class="text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
                  <span class="material-symbols-outlined text-primary">chat_bubble_outline</span>
                  Notes or Feedback
                </h3>
                <p class="text-xs text-on-surface-variant mb-4 font-medium">Share observations on player performance or drill effectiveness with the Head Coach.</p>
                <textarea v-model="coachFocusNotes" class="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary text-sm p-4 text-on-surface placeholder-on-surface-variant/50 transition-all outline-none" placeholder="E.g. Group B struggled with Phase 2; might need wider cone spacing..." rows="4"></textarea>
                <div class="mt-4 flex justify-end">
                  <button @click="saveSessionNotes" class="px-6 py-2 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-bold hover:bg-slate-200 transition-colors shadow-sm">Save Draft Note</button>
                </div>
              </section>
            </div>

            <!-- Right Column: Objectives & Stats (col-span-3) -->
            <div class="col-span-12 lg:col-span-3 space-y-8">
              <!-- Objectives Checklist -->
              <section class="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 class="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-6">Learning Objectives</h3>
                <div class="space-y-4">
                  <label v-for="(obj, idx) in parseList(currentLesson.objective)" :key="idx" 
                         class="flex items-start gap-3 group cursor-pointer">
                    <input type="checkbox" :checked="checkedObjectives.has(idx)" @change="toggleObjective(idx)"
                           class="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary transition-all cursor-pointer" />
                    <div class="flex flex-col">
                      <span :class="['text-sm font-semibold transition-colors', checkedObjectives.has(idx) ? 'text-primary' : 'text-on-surface group-hover:text-primary']">
                        {{ obj }}
                      </span>
                      <span class="text-[10px] text-on-surface-variant uppercase font-bold mt-0.5 tracking-wider">Benchmark {{ idx + 1 }}</span>
                    </div>
                  </label>
                </div>

                <div class="mt-8 pt-8 border-t border-slate-100">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Objective Mastery</span>
                    <span class="text-xs font-bold text-primary">{{ masteryPercentage }}%</span>
                  </div>
                  <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden shadow-inner">
                    <div class="bg-primary h-full rounded-full transition-all duration-500 shadow-lg shadow-primary/20" :style="{ width: masteryPercentage + '%' }"></div>
                  </div>
                </div>
              </section>

              <!-- Weather / Environment Card -->
              <section class="bg-slate-900 rounded-xl p-6 text-white overflow-hidden relative shadow-2xl">
                <div class="relative z-10">
                  <div class="flex items-center gap-2 mb-4">
                    <span class="material-symbols-outlined text-amber-400">wb_sunny</span>
                    <span class="text-xs font-bold uppercase tracking-widest text-slate-400">Live Field Conditions</span>
                  </div>
                  <div class="mb-4">
                    <p class="text-3xl font-black tracking-tight">22°C</p>
                    <p class="text-sm text-slate-400 font-medium">Clear skies • Humidity 45%</p>
                  </div>
                  <p class="text-[11px] leading-relaxed text-slate-300 font-medium italic">"Ideal conditions for technical drills. Mandatory hydration break in 15 mins."</p>
                </div>
                <div class="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl z-0"></div>
              </section>

              <!-- Quick Actions Area -->
              <div class="bg-white rounded-xl border-2 border-dashed border-outline-variant p-5 text-center shadow-sm group hover:border-red-200 transition-all cursor-pointer">
                <span class="material-symbols-outlined text-slate-300 text-4xl mb-2 group-hover:text-red-500 transition-colors">emergency</span>
                <p class="text-xs font-black text-on-surface-variant mb-1 uppercase tracking-widest">Field Assistance</p>
                <p class="text-[10px] text-on-surface-variant/70 mb-4 font-bold uppercase tracking-widest leading-relaxed">Immediate Support for Gear or Medical Needs</p>
                <button class="w-full py-2.5 bg-red-100/50 text-red-600 text-xs font-black rounded-lg hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest">Request Support</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="flex justify-between items-center pt-10 border-t border-slate-100 flex-wrap gap-6">
        <button v-if="currentStep > 1" @click="currentStep--" class="flex items-center gap-3 text-xs font-black text-on-surface-variant hover:text-primary transition-all uppercase tracking-widest">
          <span class="material-symbols-outlined text-lg">arrow_back</span>
          Modify Previous Parameters
        </button>
        <div v-else></div>
        
        <div class="flex gap-4">
          <button v-if="currentStep === 4" class="px-8 py-3.5 rounded-xl border-2 border-slate-100 text-xs font-black text-on-surface hover:bg-slate-50 transition-all uppercase tracking-widest">
            Save as Template
          </button>
          
          <button v-if="currentStep < 4" 
                  @click="currentStep++"
                  :disabled="!isStepValid(currentStep)"
                  :class="['px-10 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center gap-2', isStepValid(currentStep) ? 'bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed']">
            Construct Path
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
          
          <button v-else 
                  @click="reviewSelection"
                  class="px-10 py-3.5 rounded-xl bg-gradient-to-br from-green-600 to-green-700 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
            Complete Curriculum Build
            <span class="material-symbols-outlined text-sm">done_all</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';

const currentStep = ref(1);
const selectedLessonIdx = ref(0);
const steps = ['Basic Info', 'Academic Year', 'Division & Sport', 'Review'];

const programType = ref('sdp');
const selectedGrades = ref<any | null>(null);
const selectedDivisions = ref<string[]>([]);
const selectedSport = ref<string | null>(null);

const availableGrades = ref<any[]>([]);
const availableDivisions = ref<string[]>([]);
const dynamicSportsList = ref<any[]>([]);
const liveLessons = ref<any[]>([]);
const extraSessionNotes = ref('');
const coachFocusNotes = ref('');
const checkedObjectives = ref<Set<number>>(new Set());

const loadingGrades = ref(false);
const loadingDivisions = ref(false);
const loadingSports = ref(false);
const loadingFinalContent = ref(false);

const programTypes = [
  { id: 'sdp', name: 'SDP (Specialized)', icon: 'stars', bgClass: 'bg-blue-100', textClass: 'text-blue-700', description: 'Advanced training modules focused on high-performance athlete development.' },
  { id: 'inschool', name: 'In-School Program', icon: 'school', bgClass: 'bg-orange-100', textClass: 'text-orange-700', description: 'Integrated Physical Education frameworks for standard academic schedules.' }
];

const sportsList = [
  { id: 'basketball', name: 'Basketball', tagline: 'Indoor Pro Court', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAugHxv40XhOwiENI3zjB2rilBQeeaUNEIQfMFS0WkZVNtRrFH0eLZQENQF9sITz7jW03bd9gvmBvzv10A2lEhkJpJrAw9Zk8-QhfUi7xDW6ZC9X_CLdP4-gGB4JUEpmHix6dMOsH5uIsYlpF29YIoR9TohdZexVi2HPT1O8gKsM3QittBFRJWuPZyMENhGbKrOc7g1bEaw9EeyX3R2L6mp1CCyE-wrUl5iSYiU4OY_zMYx9n-mbKsz642XbD_POTxwssPQe5gcpCB' },
  { id: 'football', name: 'Football', tagline: 'Full Stadium Access', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-4ejDkYSrjfyLXdpXAvC6yFo0R9WxmTAHleMpb-xYmRByDOU5Q34Sf9X7El2NYe3NIcf5jtdJvOcPRams6U43psMfbS2s_qZ9_zvhZeqhMn2i-fBcIkaFL4lQfHfI-yBttI2TNOf5r4nzwOfKX_bg0Gf0F8XdEgaQrIjz-RMXNTbVsl4R0FYx0JgBtwNc8fOEKR_mqzicUeSXjyo7gUitrSqe6b7YRfuom4fCsT4VVZqnKCTYXFZOGLxTGdTt83ODnU-xWoZkdHyW' },
  { id: 'swimming', name: 'Swimming', tagline: 'Olympic Aquatic Hub', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpi5oBywGfU5TUcJTsTUHJtmLSZKTyu1S5LgKRWxIA3Rp5tjxFQ6Ec9dq9rUzXlV6lOF_NrZXs2Er72ymhmWB_iBK0yv3ao45Vj7IsqERyQTXj5IQr4-QHPCAwtGG8jvChtkKKn7mdYROOvYzvGes4rkeRNZDsyJ8UPa_Jxlj2WnPsPfUzCCTvjjgu5_mqYhMYaVX2mnfA9145RjUB88Qlh48cVxG4NcoCJ3FEPJG3byOuMRMZ7ymcV8WDtyD5fSJ6W0za5PalD_Dd' },
  { id: 'tennis', name: 'Tennis', tagline: 'Clay & Grass Courts', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDo4jAW2TcPsuIfpwsT1PNabkHswUgrIWWQn4ML1SSnA5WrD4MTdxJbIZ7urs0geXUEfnhWHSh6dSXFZkBhAwxF3T5Qs9typ5rlaEfMO3mKlAPXwyycYQKH-LPpYM_hDvJn7FSqFaQlMsnNCQyL8w0g8gJgzEOV2lIeAoOq0S6_t4zlFlKPyXe_rLT26iAZJELmrbvDMf1sihFC95MXA-bb2zsQJnwUsiGbfLBRWDdUSpMPnbsCx8-6Y7tdWH2s2JQUsQmHKvZDvJQC' }
];

const foundationGradesList = [
  { id: 'Nursery', name: 'Nursery', group: 'Pre-K' },
  { id: 'Jr.Kg', name: 'Jr.Kg', group: 'Pre-K' },
  { id: 'Sr.Kg', name: 'Sr.Kg', group: 'Pre-K' }
];

const programTypeName = computed(() => programTypes.find(p => p.id === programType.value)?.name || 'Curriculum');

const getSportName = (id: string | null) => sportsList.find(s => s.id === id)?.name || id || 'Custom Curriculum';
const getSportTagline = (id: string | null) => sportsList.find(s => s.id === id)?.tagline || 'Athletic Mastery';
const getSportImage = (id: string | null) => sportsList.find(s => s.id === id)?.image || 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop';

const getSportIcon = (sportName: string) => {
  const s = String(sportName).toLowerCase();
  if (s.includes('cricket')) return 'sports_cricket';
  if (s.includes('football')) return 'sports_soccer';
  if (s.includes('basketball')) return 'sports_basketball';
  if (s.includes('tennis')) return 'sports_tennis';
  if (s.includes('swimming')) return 'waves';
  return 'sports_kabaddi';
};

const parseList = (text: string | null) => {
  if (!text) return [];
  // Split by bullet point symbols or new lines with dashes/bullets
  return text.split(/\u2022|\n\s*-|\n\s*•|\n\s*\d+\.|\n/).map(s => s.trim().replace(/^[-•]\s*/, '')).filter(s => s.length > 0);
};

const currentLesson = computed(() => liveLessons.value[selectedLessonIdx.value] || null);

const masteryPercentage = computed(() => {
  const objectives = parseList(currentLesson.value?.objective);
  if (objectives.length === 0) return 0;
  return Math.round((checkedObjectives.value.size / objectives.length) * 100);
});

const toggleObjective = (idx: number) => {
  if (checkedObjectives.value.has(idx)) {
    checkedObjectives.value.delete(idx);
  } else {
    checkedObjectives.value.add(idx);
  }
};

watch(selectedLessonIdx, () => {
  checkedObjectives.value.clear();
});

const fetchStandards = async () => {
  loadingGrades.value = true;
  try {
    const res = await fetch('/api/students/standards');
    const data = await res.json();
    if (data.success) availableGrades.value = data.standards;
  } catch (err) { console.error(err); } finally { loadingGrades.value = false; }
};

const fetchDivisions = async () => {
  if (!selectedGrades.value) { availableDivisions.value = []; return; }
  loadingDivisions.value = true;
  try {
    const res = await fetch(`/api/students/divisions?stds=${encodeURIComponent(selectedGrades.value)}`);
    const data = await res.json();
    if (data.success) availableDivisions.value = data.divisions;
  } catch (err) { console.error(err); } finally { loadingDivisions.value = false; }
};

const fetchSportsByGrade = async () => {
  if (!selectedGrades.value) return;
  loadingSports.value = true;
  try {
    const res = await fetch(`/api/curriculum/sports-by-grade?grade=${encodeURIComponent(selectedGrades.value)}`);
    const data = await res.json();
    if (data.success) dynamicSportsList.value = data.sports;
  } catch (err) { console.error(err); } finally { loadingSports.value = false; }
};

const fetchLiveLessons = async () => {
  if (!selectedSport.value || !selectedGrades.value) return;
  loadingFinalContent.value = true;
  try {
    const res = await fetch(`/api/curriculum/master-list?sport=${encodeURIComponent(selectedSport.value)}&grade=${encodeURIComponent(selectedGrades.value)}`);
    const data = await res.json();
    if (data.success) {
      liveLessons.value = data.data;
      selectedLessonIdx.value = 0;
    }
  } catch (err) { console.error(err); } finally { loadingFinalContent.value = false; }
};

watch(selectedGrades, () => { fetchDivisions(); fetchSportsByGrade(); });
watch(currentStep, (newStep) => { if (newStep === 4) fetchLiveLessons(); });
onMounted(() => fetchStandards());

const visibleFoundationGrades = computed(() => {
  return foundationGradesList.filter(fg => availableGrades.value.some(ag => String(ag).toLowerCase() === fg.id.toLowerCase()));
});

const visibleNumericGrades = computed(() => {
  return availableGrades.value.filter(ag => !isNaN(Number(ag)) && !['Nursery', 'Jr.Kg', 'Sr.Kg'].includes(ag)).map(ag => Number(ag)).sort((a,b)=>a-b);
});

const getDivisionIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('a')) return 'stars';
  if (n.includes('b')) return 'workspace_premium';
  if (n.includes('c')) return 'military_tech';
  if (n.includes('elite')) return 'diamond';
  return 'groups';
};

const isStepValid = (step: number) => {
  if (step === 1) return !!programType.value;
  if (step === 2) return !!selectedGrades.value;
  if (step === 3) return selectedDivisions.value.length > 0 && !!selectedSport.value;
  return true;
};

const reviewSelection = async () => {
  if (!currentLesson.value) return;
  loadingFinalContent.value = true;
  try {
    // Mock user_id 1 for now, in real app get from store
    const res = await fetch('/api/curriculum/save-lp-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lp_no: currentLesson.value.lp_no,
        lp_unique_id: currentLesson.value.lp_unique_id,
        user_id: 1,
        status: 'Done',
        remark: extraSessionNotes.value
      })
    });
    const data = await res.json();
    if (data.success) {
      alert('Lesson marked as complete!');
    }
  } catch (err) {
    console.error('Finalize selection error:', err);
  } finally {
    loadingFinalContent.value = false;
  }
};

const saveSessionNotes = async () => {
  console.log('Saving Session Reflections:', extraSessionNotes.value);
  alert('Reflections saved locally!');
};

const printLessonPlan = () => {
  window.print();
};
</script>

<style scoped>
.font-headline { font-family: 'Manrope', sans-serif; }
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
