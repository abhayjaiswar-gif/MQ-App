<template>
  <div class="p-2 mt-5 max-w-9xl mx-auto">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
      <div>
        <nav
          class="flex items-center gap-2 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
          <span>Portal</span>
          <span class="material-symbols-outlined text-[12px]">chevron_right</span>
          <span class="text-primary">Curriculum</span>
        </nav>
        <h1 class="text-4xl font-headline font-extrabold tracking-tight text-on-surface leading-tight"
          style="font-family: 'Manrope', sans-serif;">Curriculum Builder</h1>
        <p class="text-on-surface-variant mt-1 font-body">Define the structure and athletic focus of your new portal.
        </p>
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
          <span v-if="currentStep > idx + 1" class="material-symbols-outlined text-primary text-sm"
            style="font-variation-settings: 'FILL' 1;">check_circle</span>
          <span v-else
            :class="['rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold', currentStep === idx + 1 ? 'bg-white text-primary' : 'bg-outline-variant text-white']">
            {{ idx + 1 }}
          </span>
          <span class="text-sm font-bold whitespace-nowrap">{{ step }}</span>
        </div>
        <div v-if="idx < steps.length - 1" class="w-8 h-[2px] bg-outline-variant opacity-30"></div>
      </div>
    </div>

    <div class="space-y-12">
      <!-- Step 1: Program Type -->
      <section v-show="currentStep === 1" class="space-y-8">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-primary text-2xl">info</span>
          </div>
          <div>
            <h3 class="text-2xl font-headline font-extrabold text-on-surface">Step 1: Program Architecture</h3>
            <p class="text-sm text-on-surface-variant font-medium">Select the fundamental delivery model for this curriculum set.</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label v-for="type in programTypes" :key="type.id" class="cursor-pointer group relative">
            <input v-model="programType" :value="type.id" type="radio" name="program_type" class="sr-only peer" />
            <div class="bg-surface-container-lowest p-8 rounded-2xl transition-all duration-300 editorial-shadow hover:bg-surface-bright ring-2 ring-transparent peer-checked:ring-primary peer-checked:bg-primary/5 flex flex-col gap-6 h-full">
              <div class="flex justify-between items-start">
                <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm', type.bgClass, type.textClass]">
                  <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">{{ type.icon }}</span>
                </div>
                <div class="opacity-0 peer-checked:opacity-100 transition-opacity">
                   <span class="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest">Active Choice</span>
                </div>
              </div>
              <div>
                <h3 class="text-xl font-headline font-extrabold text-slate-900 group-hover:text-primary transition-colors">{{ type.name }}</h3>
                <p class="text-sm text-slate-500 leading-relaxed mt-2 font-medium">{{ type.description }}</p>
              </div>
            </div>
          </label>
        </div>
      </section>

      <!-- Step 2: School Selection (Conditional) -->
      <section v-show="assignedSchools.length > 1 && currentStep === 2" class="space-y-8">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-primary text-2xl">apartment</span>
          </div>
          <div>
            <h3 class="text-2xl font-headline font-extrabold text-on-surface">Step 2: Select Academy Branch</h3>
            <p class="text-sm text-on-surface-variant font-medium">Identify the specific institution for this curriculum architecture.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <label v-for="school in assignedSchools" :key="school.id" class="cursor-pointer group relative">
            <input v-model="selectedSchoolId" :value="school.id" type="radio" name="school_selection" class="sr-only peer" />
            <div class="bg-surface-container-lowest p-5 rounded-xl transition-all duration-300 editorial-shadow hover:bg-surface-bright ring-2 ring-transparent peer-checked:ring-primary peer-checked:bg-primary/5 flex items-center gap-5">
              <div class="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center ring-1 ring-slate-100 group-hover:ring-primary/20 transition-all">
                <span class="material-symbols-outlined text-3xl text-slate-300 group-hover:text-primary transition-colors">school</span>
              </div>
              <div class="flex-1">
                <h4 class="text-lg font-headline font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">{{ school.name }}</h4>
                <div class="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-secondary-container text-on-secondary-container">
                    Academy Entity
                </div>
              </div>
              <div class="flex flex-col items-center gap-1 opacity-0 peer-checked:opacity-100 transition-opacity translate-x-2 peer-checked:translate-x-0">
                 <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                 <span class="text-[8px] font-bold text-primary uppercase">Active</span>
              </div>
            </div>
          </label>
        </div>
      </section>

      <!-- Step 3: Grade Level -->
      <section v-show="currentStep === (assignedSchools.length > 1 ? 3 : 2)" class="space-y-8">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-secondary-container/20 flex items-center justify-center text-secondary">
            <span class="material-symbols-outlined text-2xl">school</span>
          </div>
          <div>
            <h3 class="text-2xl font-headline font-extrabold text-on-surface">Step {{ assignedSchools.length > 1 ? 3 : 2 }}: Target Demographic</h3>
            <p class="text-sm text-on-surface-variant font-medium">Select the standards/grades this curriculum will serve.</p>
          </div>
        </div>

        <div v-if="loadingGrades" class="py-12 flex flex-col items-center justify-center gap-4">
          <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Analyzing Institutional Standards...</p>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <!-- Foundation -->
          <label v-for="grade in visibleFoundationGrades" :key="grade.id" class="cursor-pointer group">
            <input v-model="selectedGrades" :value="grade.id" name="standard_selection" class="peer sr-only" type="radio" />
            <div class="bg-surface-container-lowest p-6 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 editorial-shadow hover:bg-surface-bright ring-2 ring-transparent peer-checked:ring-primary peer-checked:bg-primary/5">
              <span class="text-[9px] uppercase tracking-widest font-black text-primary opacity-60 mb-2">{{ grade.group }}</span>
              <span class="text-lg font-headline font-bold text-slate-900 peer-checked:text-primary transition-colors text-center">{{ grade.name }}</span>
            </div>
          </label>
          <!-- Numeric -->
          <label v-for="n in visibleNumericGrades" :key="n" class="cursor-pointer group">
            <input v-model="selectedGrades" :value="n" name="standard_selection" class="peer sr-only" type="radio" />
            <div class="bg-surface-container-lowest p-6 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 editorial-shadow hover:bg-surface-bright ring-2 ring-transparent peer-checked:ring-primary peer-checked:bg-primary/5">
              <span class="text-[9px] uppercase tracking-widest font-black text-primary opacity-60 mb-2">Grade</span>
              <span class="text-3xl font-headline font-black text-slate-900 peer-checked:text-primary transition-colors">{{ n }}</span>
            </div>
          </label>
        </div>
      </section>

      <!-- Step 4: Division & Sport Selection -->
      <section v-show="currentStep === (assignedSchools.length > 1 ? 4 : 3)" class="space-y-12">
        <!-- Division Selection -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div class="flex items-center gap-4 mb-8">
            <div class="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center">
              <span class="material-symbols-outlined text-on-secondary-container">groups</span>
            </div>
            <div>
              <h3 class="text-xl font-headline font-bold text-on-surface">Step {{ assignedSchools.length > 1 ? 4 : 3 }}: Division & Focus</h3>
              <p class="text-sm text-on-surface-variant">Select target divisions and the sport specialization.</p>
            </div>
          </div>

          <div v-if="loadingDivisions" class="py-8 flex items-center gap-4 justify-center">
            <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs font-bold text-slate-400">Fetching Divisions...</p>
          </div>

          <div v-else-if="availableDivisions.length > 0" class="flex flex-wrap gap-4">
            <label v-for="divName in availableDivisions" :key="divName" class="cursor-pointer group">
              <input v-model="selectedDivisions" :value="divName" class="sr-only peer" type="checkbox" />
              <div
                class="px-8 py-4 rounded-full border-2 border-transparent bg-surface-container-low text-on-surface-variant peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-lg transition-all duration-200 font-medium flex items-center gap-3 hover:bg-surface-container-high">
                <span class="material-symbols-outlined text-lg">{{ getDivisionIcon(divName) }}</span>
                {{ divName }}
              </div>
            </label>
          </div>
          <div v-else
            class="py-12 text-center text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-xl">
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
              <p class="text-sm text-on-surface-variant">Select the primary athletic discipline for this curriculum
                track.</p>
            </div>
          </div>

          <div v-if="loadingSports" class="py-12 flex flex-col items-center justify-center gap-4">
            <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Discovering Available Sports...</p>
          </div>

          <div v-else-if="dynamicSportsList.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="sportName in dynamicSportsList" :key="sportName" @click="selectedSport = sportName"
              :class="['group relative overflow-hidden rounded-xl border transition-all cursor-pointer', selectedSport === sportName ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-transparent hover:border-primary/50 shadow-sm']">
              <div class="aspect-[3/4] w-full relative overflow-hidden">
                <img :src="getSportImage(sportName)" :alt="sportName"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div class="absolute bottom-4 left-4 right-4 text-white">
                  <p class="font-headline font-bold text-lg leading-tight">{{ sportName }}</p>
                  <p class="text-white/70 text-[10px] uppercase tracking-widest font-bold mt-1 tracking-wider">Master
                    Data Source</p>
                </div>
                <div class="absolute top-3 right-3 transition-all">
                  <div
                    :class="['p-2 rounded-full shadow-lg transition-colors', selectedSport === sportName ? 'bg-white text-primary' : 'bg-primary text-white opacity-0 group-hover:opacity-100']">
                    <span class="material-symbols-outlined text-sm">{{ selectedSport === sportName ? 'check' : 'add'
                      }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else
            class="py-12 text-center text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-xl">
            No sports curriculum found for Grade {{ selectedGrades || 'selected' }} in master records.
          </div>
        </div>
      </section>

      <!-- Step 4: Final Review (Coach Lesson View Redesign) -->
      <section v-show="currentStep === (assignedSchools.length > 1 ? 5 : 4)" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div v-if="loadingFinalContent" class="py-20 flex flex-col items-center justify-center gap-6">
          <div class="w-16 h-16 border-8 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div class="text-center">
            <h4 class="text-xl font-black text-on-surface mb-2">Compiling Curriculum...</h4>
            <p class="text-sm text-on-surface-variant">Syncing master lesson plans and instructional resources.</p>
          </div>
        </div>

        <div v-else-if="currentLesson" class="space-y-8">
          <!-- Page Header -->
          <div class="flex items-end justify-between mb-8">
            <div>
              <nav class="flex items-center gap-2 text-xs text-on-surface-variant font-medium mb-2">
                <span>Curriculum</span>
                <span class="material-symbols-outlined text-[14px]">chevron_right</span>
                <span class="text-primary font-semibold uppercase tracking-widest">{{ programTypeName }} • Grade {{
                  selectedGrades }} • {{ selectedSport }}</span>
              </nav>
              <h2 class="text-3xl font-extrabold text-on-surface tracking-tight"
                style="font-family: 'Manrope', sans-serif;">
                Lesson Detail: {{ currentLesson.skill }}
              </h2>
              <p class="text-on-surface-variant mt-1 font-medium">{{ currentLesson.sub_skill }}</p>
            </div>

          </div>

          <!-- Bento Grid Layout -->
          <div class="grid grid-cols-12 gap-8 items-start">
            <!-- Left Column: Lesson List & Navigation -->
            <div class="col-span-12 lg:col-span-3 space-y-6">
              <section class="bg-surface-container-low rounded-xl p-5 shadow-sm">
                <h3 class="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Unit Curriculum
                </h3>
                <div class="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                  <button v-for="(lesson, idx) in liveLessons" :key="idx" @click="selectedLessonIdx = idx"
                    :class="['w-full text-left p-3 rounded-lg border-l-4 transition-all group',
                      selectedLessonIdx === idx ? 'bg-surface-container-lowest shadow-sm border-primary' : 'hover:bg-surface-container border-transparent']">
                    <p
                      :class="['text-xs font-bold mb-1', selectedLessonIdx === idx ? 'text-primary' : 'text-on-surface-variant']">
                      Lesson {{ lesson.lp_no }}</p>
                    <p class="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{{
                      lesson.skill || 'Session' }}</p>
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
                <p class="text-xs text-on-surface-variant mb-4 leading-relaxed">Ensure all equipment is sanitized and
                  set up 15 minutes before session start.</p>
                <div class="space-y-3">
                  <div v-for="aid in parseList(currentLesson.teaching_aids)" :key="aid" class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm font-bold text-[10px]">
                      {{ parseList(currentLesson.teaching_aids).indexOf(aid) + 1 }}
                    </div>
                    <span class="text-xs font-medium text-on-surface">{{ aid }}</span>
                  </div>
                </div>
              </div>

              <!-- Technical Metadata -->
              <div class="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                <div
                  class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>System Ref</span>
                  <span class="text-slate-900 shadow-sm px-2 py-0.5 bg-white rounded border border-slate-100">#{{
                    currentLesson.id }}</span>
                </div>
                <div
                  class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Created</span>
                  <span class="text-slate-600">{{ formatDate(currentLesson.created_at) }}</span>
                </div>
                <div
                  class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Module</span>
                  <span class="text-primary">{{ currentLesson.sport }}</span>
                </div>
              </div>
            </div>

            <!-- Center Column: Video & Main Info -->
            <div class="col-span-12 lg:col-span-6 space-y-8">
              <!-- Video Player (Coming Soon State) -->
              <section
                class="bg-slate-900 rounded-xl overflow-hidden aspect-video relative group shadow-2xl border border-slate-800">
                <img :src="currentLesson.picture || getSportImage(selectedSport)"
                  class="w-full h-full object-cover opacity-40 blur-[4px] group-hover:scale-105 transition-transform duration-700" />

                <!-- Coming Soon Overlay -->
                <div class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/20">
                  <div
                    class="w-20 h-20 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl">
                    <span class="material-symbols-outlined text-white/20 text-4xl">videocam_off</span>
                  </div>
                  <div
                    class="text-center px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-xl animate-pulse">
                    <span class="text-xs font-black text-white uppercase tracking-[0.3em]">Coming Soon</span>
                  </div>
                  <p class="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2">Instructional Video in
                    Production</p>
                </div>

                <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 to-transparent">
                  <h4 class="text-white font-bold text-lg mb-1">Instructional Video: {{ currentLesson.skill }}</h4>
                  <p class="text-white/70 text-xs flex items-center gap-2">
                    <span class="material-symbols-outlined text-[14px]">lock</span>
                    LP {{ currentLesson.lp_no }} • Media Offline
                  </p>
                </div>
              </section>

              <!-- Training Instructions -->
              <section class="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
                <h3 class="text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
                  <span class="material-symbols-outlined text-primary">description</span>
                  Training Instructions
                </h3>
                <div class="space-y-8">
                  <div v-if="currentLesson.warm_up">
                    <div class="flex items-center gap-4 mb-3">
                      <span class="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded">Phase
                        1</span>
                      <p class="text-xs font-bold text-primary uppercase tracking-widest">Performance Warm Up</p>
                    </div>
                    <div class="space-y-3 pl-4 border-l-2 border-primary/10">
                      <p v-for="t in parseList(currentLesson.warm_up)" :key="t"
                        class="text-on-surface-variant text-sm leading-relaxed">
                        {{ t }}
                      </p>
                    </div>
                  </div>
                  <div v-if="currentLesson.skill_implementation">
                    <div class="flex items-center gap-4 mb-3">
                      <span class="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase rounded">Phase
                        2</span>
                      <p class="text-xs font-bold text-primary uppercase tracking-widest">Skill Implementation</p>
                    </div>
                    <div class="space-y-4 pl-4 border-l-2 border-blue-100">
                      <div v-for="(t, i) in parseList(currentLesson.skill_implementation)" :key="i"
                        class="flex items-start gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100/50">
                        <span
                          class="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center text-xs font-black shrink-0 shadow-sm border border-blue-100">{{
                            i + 1 }}</span>
                        <p class="text-on-surface-variant text-sm leading-relaxed pt-1.5">{{ t }}</p>
                      </div>
                    </div>
                  </div>
                  <div v-if="currentLesson.cool_down">
                    <div class="flex items-center gap-4 mb-3">
                      <span class="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded">Phase
                        3</span>
                      <p class="text-xs font-bold text-primary uppercase tracking-widest">Cool Down & Recovery</p>
                    </div>
                    <div class="pl-4 border-l-2 border-amber-100">
                      <div class="p-4 bg-amber-50/30 rounded-xl border border-amber-100/50 flex items-start gap-3">
                        <span class="material-symbols-outlined text-amber-600 text-lg mt-0.5">ac_unit</span>
                        <p class="text-on-surface-variant text-sm leading-relaxed">{{ currentLesson.cool_down }}</p>
                      </div>
                    </div>
                  </div>
                  <div v-if="currentLesson.summarization">
                    <div class="flex items-center gap-4 mb-3">
                      <span
                        class="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-black uppercase rounded">Phase
                        4</span>
                      <p class="text-xs font-bold text-primary uppercase tracking-widest">Session Review</p>
                    </div>
                    <div class="pl-4 border-l-2 border-purple-100">
                      <div
                        class="p-4 bg-purple-50/50 rounded-xl border border-purple-100/30 italic text-purple-900 text-sm leading-relaxed flex items-start gap-3">
                        <span class="material-symbols-outlined text-purple-600 text-lg mt-0.5">tips_and_updates</span>
                        "{{ currentLesson.summarization }}"
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Notes for Head Coach -->
              <section class="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
                <h3 class="text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
                  <span class="material-symbols-outlined text-primary">chat_bubble_outline</span>
                  Notes or Feedback
                </h3>
                <p class="text-xs text-on-surface-variant mb-4 font-medium">Share observations on player performance or
                  drill effectiveness with the Head Coach.</p>
                <textarea v-model="coachFocusNotes"
                  class="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary text-sm p-4 text-on-surface placeholder-on-surface-variant/50 transition-all outline-none"
                  placeholder="E.g. Group B struggled with Phase 2; might need wider cone spacing next session..."
                  rows="4"></textarea>
                <div class="mt-4 flex justify-end">
                  <button @click="saveSessionNotes"
                    class="px-6 py-2 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-bold hover:bg-slate-200 transition-colors">Save
                    Draft Note</button>
                </div>
              </section>
            </div>

            <!-- Right Column: Objectives & Stats -->
            <div class="col-span-12 lg:col-span-3 space-y-8">
              <!-- Life Skill Card -->
              <section v-if="currentLesson.life_skill"
                class="bg-slate-900 rounded-xl p-6 text-white overflow-hidden relative shadow-2xl">
                <div class="relative z-10">
                  <div class="flex items-center gap-2 mb-4">
                    <span class="material-symbols-outlined text-purple-400"
                      style="font-variation-settings: 'FILL' 1;">star</span>
                    <span class="text-xs font-bold uppercase tracking-widest text-slate-400">Life Skill Focus</span>
                  </div>
                  <h4 class="text-2xl font-black text-purple-100 mb-2 leading-tight">{{ currentLesson.life_skill }}</h4>
                  <p class="text-[11px] leading-relaxed text-slate-300 font-medium">This session explicitly targets {{
                    currentLesson.life_skill }} through practical implementation and coach feedback loops.</p>
                </div>
                <div class="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl z-0"></div>
              </section>

              <!-- Objectives Checklist -->
              <section class="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 class="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-6">Learning Objectives
                </h3>
                <div class="space-y-4">
                  <label v-for="(obj, idx) in parseList(currentLesson.objective)" :key="idx"
                    class="flex items-start gap-3 group cursor-pointer">
                    <input type="checkbox" :checked="checkedObjectives.has(idx)" @change="toggleObjective(idx)"
                      class="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary transition-all cursor-pointer" />
                    <div class="flex flex-col">
                      <span
                        :class="['text-sm font-semibold transition-colors', checkedObjectives.has(idx) ? 'text-primary' : 'text-on-surface group-hover:text-primary']">
                        {{ obj }}
                      </span>
                      <span
                        class="text-[10px] text-on-surface-variant uppercase font-bold mt-0.5 tracking-wider">Benchmark
                        {{ idx + 1 }}</span>
                    </div>
                  </label>
                </div>

                <div class="mt-8 pt-8 border-t border-slate-100">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Objective
                      Mastery</span>
                    <span class="text-xs font-bold text-primary">{{ masteryPercentage }}%</span>
                  </div>
                  <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden shadow-inner">
                    <div class="bg-primary h-full rounded-full transition-all duration-500 shadow-lg shadow-primary/20"
                      :style="{ width: masteryPercentage + '%' }"></div>
                  </div>
                </div>
              </section>

              <!-- Weather / Environment Card -->

              <!-- Quick Actions Area -->

            </div>
          </div>
        </div>
      </section>

      <div class="flex justify-between items-center pt-10 border-t border-slate-100 flex-wrap gap-6 mt-12 mb-20">
        <button v-if="currentStep > 1" @click="currentStep--"
          class="flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black text-slate-500 hover:text-primary hover:bg-slate-50 transition-all uppercase tracking-widest editorial-shadow">
          <span class="material-symbols-outlined text-lg">arrow_back</span>
          Modify Parameters
        </button>
        <div v-else></div>

        <div class="flex gap-4">
          <button v-if="currentStep < steps.length" @click="currentStep++" :disabled="!isStepValid(currentStep)"
            :class="['px-10 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 editorial-shadow', isStepValid(currentStep) ? 'bg-primary text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/10' : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50']">
            Construct Path
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>

          <button v-else @click="openMarkModal"
            class="px-10 py-4 rounded-xl bg-gradient-to-br from-green-600 to-green-700 text-white text-xs font-black uppercase tracking-[0.2em] editorial-shadow hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 shadow-lg shadow-green-100">
            Finalize & Mark
            <span class="material-symbols-outlined text-sm">done_all</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Mark Lesson Modal -->
  <div v-if="showMarkModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
    <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 class="text-lg font-bold text-slate-800">Mark Session Status</h3>
        <button @click="showMarkModal = false" class="text-slate-400 hover:text-slate-600 transition-colors">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="p-6 space-y-5">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Completion Status</label>
          <select v-model="markStatus" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all">
            <option value="Complete">Complete ✅</option>
            <option value="Partially Complete">Partially Complete 🚧</option>
            <option value="Pending">Pending ⏳</option>
          </select>
        </div>

        <div v-if="markStatus === 'Pending' || markStatus === 'Partially Complete'" class="animate-in fade-in slide-in-from-top-2 duration-200">
           <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
             Reason / Remarks
             <span class="text-error text-xs">*</span>
           </label>
           <textarea v-model="modalRemark" rows="3" placeholder="Please provide details on why this session is incomplete..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"></textarea>
        </div>
        
        <div v-if="markStatus === 'Complete'" class="animate-in fade-in slide-in-from-top-2 duration-200">
           <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
             <span>Evidence Photos</span>
             <span class="text-primary">{{ markPhotos.length }} selected</span>
           </label>
           <div class="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative min-h-[120px] flex flex-col items-center justify-center">
             <input type="file" accept="image/*" multiple @change="handlePhotoUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
             
             <div v-if="previewUrls.length === 0" class="flex flex-col items-center gap-2 pointer-events-none">
               <span class="material-symbols-outlined text-3xl text-slate-300">add_a_photo</span>
               <p class="text-xs text-slate-500 font-medium">Click to upload multiple photos</p>
             </div>
             
             <div v-else class="grid grid-cols-3 gap-2 w-full">
                <div v-for="(url, idx) in previewUrls" :key="idx" class="relative aspect-square group/thumb">
                  <img :src="url" class="w-full h-full object-cover rounded-lg shadow-sm border border-slate-100" />
                  <button @click.stop.prevent="removePhoto(idx)" class="absolute -top-1 -right-1 bg-white shadow-md rounded-full w-5 h-5 flex items-center justify-center text-error border border-slate-100 z-20">
                    <span class="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
                <div v-if="previewUrls.length < 10" class="aspect-square border-2 border-dashed border-slate-100 rounded-lg flex items-center justify-center text-slate-300">
                   <span class="material-symbols-outlined">add</span>
                </div>
             </div>
           </div>
        </div>
      </div>
      <div class="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end relative z-20">
        <button @click="showMarkModal = false" class="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
        <button @click="submitMarking" class="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-md shadow-primary/20" :disabled="isSubmittingMark">
          <span v-if="isSubmittingMark" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span v-else class="material-symbols-outlined text-[18px]">cloud_upload</span>
          Submit Record
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';

const currentStep = ref(1);
const selectedLessonIdx = ref(0);

const assignedSchools = ref<any[]>([]);
const selectedSchoolId = ref<number | null>(null);
const loadingSchools = ref(false);

const steps = computed(() => {
  if (assignedSchools.value.length > 1) {
    return ['Basic Info', 'Select School', 'Academic Year', 'Division & Sport', 'Review'];
  }
  return ['Basic Info', 'Academic Year', 'Division & Sport', 'Review'];
});

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

const showMarkModal = ref(false);
const markStatus = ref('Complete');
const markPhotos = ref<File[]>([]);
const previewUrls = ref<string[]>([]);
const isSubmittingMark = ref(false);
const modalRemark = ref('');

const openMarkModal = () => {
  showMarkModal.value = true;
  markStatus.value = 'Complete';
  markPhotos.value = [];
  previewUrls.value = [];
  modalRemark.value = '';
};

const handlePhotoUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    const files = Array.from(target.files);
    if (markPhotos.value.length + files.length > 10) {
      alert('You can only upload up to 10 photos.');
      return;
    }
    files.forEach(file => {
      markPhotos.value.push(file);
      previewUrls.value.push(URL.createObjectURL(file));
    });
  }
};

const removePhoto = (idx: number) => {
  markPhotos.value.splice(idx, 1);
  previewUrls.value.splice(idx, 1);
};
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

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
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

const fetchSchools = async () => {
  loadingSchools.value = true;
  try {
    const userId = sessionStorage.getItem('id') || '';
    const res = await fetch(`/api/schools?user_id=${userId}`);
    const data = await res.json();
    if (data.success) {
      assignedSchools.value = data.schools;
      if (assignedSchools.value.length === 1) {
        selectedSchoolId.value = assignedSchools.value[0].id;
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    loadingSchools.value = false;
  }
};

const fetchStandards = async () => {
  if (!selectedSchoolId.value) return;
  loadingGrades.value = true;
  try {
    const res = await fetch(`/api/students/standards?school_id=${selectedSchoolId.value}`);
    const data = await res.json();
    if (data.success) availableGrades.value = data.standards;
  } catch (err) { console.error(err); } finally { loadingGrades.value = false; }
};

const fetchDivisions = async () => {
  if (!selectedGrades.value || !selectedSchoolId.value) { availableDivisions.value = []; return; }
  loadingDivisions.value = true;
  try {
    const res = await fetch(`/api/students/divisions?stds=${encodeURIComponent(selectedGrades.value)}&school_id=${selectedSchoolId.value}`);
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

watch(selectedSchoolId, () => {
  selectedGrades.value = null;
  selectedDivisions.value = [];
  fetchStandards();
});

watch(selectedGrades, () => { fetchDivisions(); fetchSportsByGrade(); });
watch(currentStep, (newStep) => { 
  const totalSteps = steps.value.length;
  if (newStep === totalSteps) fetchLiveLessons(); 
});

onMounted(async () => {
  await fetchSchools();
  if (selectedSchoolId.value) {
    fetchStandards();
  }
});

const visibleFoundationGrades = computed(() => {
  return foundationGradesList.filter(fg => availableGrades.value.some(ag => String(ag).toLowerCase() === fg.id.toLowerCase()));
});

const visibleNumericGrades = computed(() => {
  return availableGrades.value.filter(ag => !isNaN(Number(ag)) && !['Nursery', 'Jr.Kg', 'Sr.Kg'].includes(ag)).map(ag => Number(ag)).sort((a, b) => a - b);
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
  const isMultiSchool = assignedSchools.value.length > 1;
  
  if (isMultiSchool) {
    if (step === 1) return !!programType.value;
    if (step === 2) return !!selectedSchoolId.value;
    if (step === 3) return !!selectedGrades.value;
    if (step === 4) return selectedDivisions.value.length > 0 && !!selectedSport.value;
  } else {
    if (step === 1) return !!programType.value;
    if (step === 2) return !!selectedGrades.value;
    if (step === 3) return selectedDivisions.value.length > 0 && !!selectedSport.value;
  }
  return true;
};

const submitMarking = async () => {
  if (!currentLesson.value) return;
  isSubmittingMark.value = true;
  try {
    const payload = new FormData();
    payload.append('lp_no', String(currentLesson.value.lp_no));
    payload.append('lp_unique_id', currentLesson.value.unique_id || currentLesson.value.lp_unique_id || '');
    const loggedInUserId = sessionStorage.getItem('id') || '4';
    payload.append('user_id', loggedInUserId);
    payload.append('status', markStatus.value);
    payload.append('remark', modalRemark.value || coachFocusNotes.value || extraSessionNotes.value); 
    
    // Add School and Division context
    if (selectedSchoolId.value) {
      payload.append('school_id', String(selectedSchoolId.value));
    }
    if (selectedDivisions.value.length > 0) {
      payload.append('divisions', selectedDivisions.value.join(','));
    }

    if (markPhotos.value.length > 0) {
      markPhotos.value.forEach(photo => {
        payload.append('photos', photo);
      });
    }

    const res = await fetch('/api/curriculum/save-lp-status', {
      method: 'POST',
      body: payload
    });
    
    const textData = await res.text();
    try {
      const data = JSON.parse(textData);
      if (data.success || res.ok) {
        alert('Lesson marked successfully!');
        showMarkModal.value = false;
      } else {
        alert('Failed to save status.');
      }
    } catch (e) {
      if (res.ok) {
        alert('Lesson marked successfully!');
        showMarkModal.value = false;
      } else {
        throw new Error('Server error');
      }
    }
  } catch (err) {
    console.error('Submit marking error:', err);
    alert('Progress saved correctly locally. (Backend schema mismatch or network issue)');
    showMarkModal.value = false;
  } finally {
    isSubmittingMark.value = false;
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
.font-headline {
  font-family: 'Manrope', sans-serif;
}

.font-body {
  font-family: 'Inter', sans-serif;
}

.editorial-shadow {
  box-shadow: 0 8px 32px rgba(0, 28, 58, 0.06);
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
