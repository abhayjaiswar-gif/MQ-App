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
      <div v-if="assignments.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
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
              <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#707785] pointer-events-none">expand_more</span>
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
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753] text-center w-20">No.</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753] w-32">Sport</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753] w-40">Skill</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753] w-48">Sub-Skill</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753]">Objective</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753] text-center w-20">Grade</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="module in filteredModules" :key="module.module_id"
                @click="selectedModule = module"
                class="hover:bg-slate-50/80 transition-all group cursor-pointer">
                <td class="px-6 py-5 text-center">
                  <span class="font-mono text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500 border border-slate-200">
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
                  <p class="text-[11px] text-[#404753] font-medium leading-relaxed line-clamp-2 italic" :title="module.objective">
                    {{ module.objective }}
                  </p>
                </td>
                <td class="px-6 py-5 text-center">
                  <div class="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 mx-auto border border-slate-200 shadow-sm">
                    {{ module.grade || '-' }}
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
    <div v-if="selectedModule" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-[#001c3a]/60 backdrop-blur-sm" @click="selectedModule = null"></div>
      <div class="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <p class="text-[10px] font-black uppercase text-[#005daa] tracking-widest mb-1">Plan Module #{{ selectedModule.lp_no || selectedModule.module_id }}</p>
            <h3 class="text-xl font-extrabold text-[#1a1c1c]">{{ selectedModule.sport }} Training</h3>
          </div>
          <button @click="selectedModule = null" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-all text-slate-500">
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
            <div class="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm italic text-sm text-[#404753] leading-relaxed">
              {{ selectedModule.sub_skill || 'No specific sub-skill defined for this plan.' }}
            </div>
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">Training Objective</p>
            <div class="p-6 bg-[#005daa]/5 border border-[#005daa]/10 rounded-2xl text-sm text-[#1a1c1c] leading-loose font-medium">
              {{ selectedModule.objective }}
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-50 flex items-center justify-between border-t border-slate-100">
          <p class="text-[10px] font-bold text-slate-400 uppercase">Interactive Path Learning System</p>
          <div class="flex gap-3">
            <button @click="selectedModule = null" class="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-white/50 transition-all">Close Details</button>
            <button class="px-6 py-2.5 bg-[#005daa] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#005daa]/20 hover:bg-[#0075d5] transition-all">Download PDF</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign CRM Modal -->
    <div v-if="showAssignModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-[#001c3a]/60 backdrop-blur-md" @click="showAssignModal = false"></div>
      <div class="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        <!-- Modal Header -->
        <div class="p-8 border-b border-slate-100 bg-[#f9fafb]">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h3 class="text-2xl font-extrabold text-[#1a1c1c] flex items-center gap-3">
                <span class="material-symbols-outlined text-[#005daa] text-3xl">assignment_add</span>
                Assign Learning Plan
              </h3>
              <p class="text-xs text-[#404753] font-medium mt-1">Distribute curriculum modules to your specialized coaches.</p>
            </div>
            <button @click="showAssignModal = false" class="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-slate-200 transition-all text-slate-400 hover:text-slate-600">
              <span class="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          <!-- Assignment Controls -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Coach</label>
              <div class="relative group">
                <select v-model="assignForm.teacher_id" 
                  class="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold text-[#1a1c1c] appearance-none outline-none focus:ring-4 focus:ring-[#005daa]/5 focus:border-[#005daa]/40 transition-all">
                  <option value="">Choose a Coach</option>
                  <option v-for="c in coaches" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform">expand_more</span>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Week</label>
              <div class="relative group">
                <select v-model="assignForm.week"
                  class="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold text-[#1a1c1c] appearance-none outline-none focus:ring-4 focus:ring-[#005daa]/5 focus:border-[#005daa]/40 transition-all">
                  <option value="">Select Week</option>
                  <option value="Week1">Week 1</option>
                  <option value="Week2">Week 2</option>
                  <option value="Week3">Week 3</option>
                  <option value="Week4">Week 4</option>
                </select>
                <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform">calendar_view_week</span>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Month & Year</label>
              <div class="relative group">
                <select v-model="assignForm.month_year"
                  class="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold text-[#1a1c1c] appearance-none outline-none focus:ring-4 focus:ring-[#005daa]/5 focus:border-[#005daa]/40 transition-all">
                  <option value="">Select Month</option>
                  <option v-for="m in next24Months" :key="m" :value="m">{{ m }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform">event</span>
              </div>
            </div>
          </div>

          <!-- Selection Filters (Sport/Grade) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Filter Sport</label>
              <div class="relative group">
                <select v-model="modalFilters.sport"
                  class="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-[#1a1c1c] appearance-none outline-none focus:ring-4 focus:ring-[#005daa]/5 transition-all">
                  <option value="All">All Sports</option>
                  <option v-for="s in sports" :key="s" :value="s">{{ s }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">sports_soccer</span>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Filter Grade</label>
              <div class="relative group">
                <select v-model="modalFilters.grade"
                  class="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-[#1a1c1c] appearance-none outline-none focus:ring-4 focus:ring-[#005daa]/5 transition-all">
                  <option value="All">All Grades</option>
                  <option v-for="g in availableGrades" :key="g" :value="g">Grade {{ g }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">school</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Selection Area -->
        <div class="flex-1 overflow-y-auto p-8 pt-4">
          <div class="flex items-center justify-between mb-4 px-2">
            <h4 class="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Available Modules ({{ modalFilteredModules.length }})</h4>
            <div class="flex items-center gap-4">
              <span class="text-[10px] font-bold text-[#005daa] bg-[#005daa]/10 px-3 py-1 rounded-full uppercase">{{ selectedAssignments.length }} Selected</span>
              <button @click="toggleSelectAllModal" class="text-[10px] font-bold text-slate-500 hover:text-[#005daa] transition-colors uppercase">
                {{ selectedAssignments.length > 0 && selectedAssignments.length === modalFilteredModules.length ? 'Deselect All' : 'Select All Filtered' }}
              </button>
            </div>
          </div>
          <div class="border border-slate-100 rounded-2xl overflow-hidden">
            <table class="w-full text-left">
              <thead class="bg-[#f9fafb] border-b border-slate-100">
                <tr>
                  <th class="px-6 py-4 w-12 text-center">
                    <input type="checkbox" @change="toggleSelectAllModal" :checked="selectedAssignments.length > 0 && selectedAssignments.length === modalFilteredModules.length" class="rounded border-slate-300 text-[#005daa] focus:ring-[#005daa]">
                  </th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Sport & Plan</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Skill / Objective</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase text-slate-500 text-center">Grade</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="m in modalFilteredModules" :key="m.module_id" 
                  @click="toggleSelection(m.module_id)"
                  :class="['hover:bg-slate-50 cursor-pointer transition-colors', selectedAssignments.includes(m.module_id) ? 'bg-[#005daa]/5' : '']">
                  <td class="px-6 py-4 text-center">
                    <input type="checkbox" :checked="selectedAssignments.includes(m.module_id)" @click.stop class="rounded border-slate-300 text-[#005daa] focus:ring-[#005daa]">
                  </td>
                  <td class="px-6 py-4">
                    <p class="text-xs font-black text-[#005daa] mb-0.5">LP-{{ m.lp_no }}</p>
                    <p class="text-[10px] uppercase font-bold text-[#1a1c1c] tracking-tighter">{{ m.sport }}</p>
                  </td>
                  <td class="px-6 py-4">
                    <p class="text-xs font-bold text-[#1a1c1c] line-clamp-1">{{ m.skill }}</p>
                    <p class="text-[10px] text-[#404753] line-clamp-1 italic">{{ m.objective }}</p>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">G {{ m.grade }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-8 border-t border-slate-100 bg-white flex items-center justify-between">
          <p class="text-[10px] font-bold text-slate-400 max-w-[200px]">Ensure details are correct before assigning.</p>
          <div class="flex gap-4">
            <button @click="showAssignModal = false" class="px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all border border-slate-100">Cancel</button>
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
</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const curriculumModules = ref<any[]>([]);
const assignments = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedSport = ref('All');
const selectedGrade = ref('All');
const selectedModule = ref<any>(null);
const showAssignModal = ref(false);
const assigning = ref(false);
const coaches = ref<any[]>([]);
const selectedAssignments = ref<number[]>([]);
const assignForm = ref({
  teacher_id: '',
  week: '',
  month_year: '',
});
const modalFilters = ref({
  sport: 'All',
  grade: 'All'
});

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
    const [assignRes, modulesRes, coachesRes] = await Promise.all([
      fetch(`/api/curriculum/my-assignments/${userId}`),
      fetch(`/api/curriculum/my-modules/${userId}`),
      fetch('/api/curriculum/coaches')
    ]);

    const assignData = await assignRes.json();
    const modulesData = await modulesRes.json();
    const coachesData = await coachesRes.json();

    if (assignData.success) assignments.value = assignData.assignments;
    if (modulesData.success) curriculumModules.value = modulesData.modules;
    if (coachesData.success) coaches.value = coachesData.coaches;

  } catch (err) {
    console.error('Fetch data error:', err);
  } finally {
    loading.value = false;
  }
};

const openAssignModal = () => {
  showAssignModal.value = true;
  selectedAssignments.value = [];
  assignForm.value = {
    teacher_id: '',
    week: '',
    month_year: '',
  };
  modalFilters.value = {
    sport: 'All',
    grade: 'All'
  };
};

const toggleSelection = (id: number) => {
  if (selectedAssignments.value.includes(id)) {
    selectedAssignments.value = selectedAssignments.value.filter(i => i !== id);
  } else {
    selectedAssignments.value.push(id);
  }
};

const toggleSelectAllModal = () => {
  if (selectedAssignments.value.length > 0 && selectedAssignments.value.length === modalFilteredModules.value.length) {
    selectedAssignments.value = [];
  } else {
    selectedAssignments.value = modalFilteredModules.value.map(m => m.module_id);
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

onMounted(fetchData);

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

  if (modalFilters.value.grade !== 'All') {
    filtered = filtered.filter(m => m.grade.toString() === modalFilters.value.grade.toString());
  }

  return filtered;
});
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
</style>
