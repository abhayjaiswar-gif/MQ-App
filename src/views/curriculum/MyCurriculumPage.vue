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
        <button @click="fetchData"
          class="bg-[#005daa] hover:bg-[#0075d5] text-white px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-3 transition-all shadow-lg shadow-[#005daa]/20 active:scale-95 group">
          <span class="material-symbols-outlined group-hover:rotate-180 transition-transform duration-700">sync</span>
          <span>Refresh Path</span>
        </button>
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
          <div class="flex items-center gap-4 w-full md:w-auto">
            <div class="relative flex-1 md:w-80 group">
              <span
                class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707785] text-lg">search</span>
              <input v-model="searchQuery"
                class="w-full bg-white border border-[#c0c7d6]/30 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:border-[#005daa]/50 focus:ring-4 focus:ring-[#005daa]/5 transition-all outline-none"
                placeholder="Search modules, sports, or level..." type="text" />
            </div>
            <button
              class="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#c0c7d6]/30 rounded-xl text-sm font-semibold text-[#404753] hover:bg-slate-50 transition-all">
              <span class="material-symbols-outlined text-lg">filter_list</span>
              <span>Filters</span>
            </button>
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
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753] text-center">Plan
                  No.</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753]">Sport / Program
                </th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753]">Module Name</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753] text-center">Grade
                </th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753] text-center">Status
                </th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#404753] text-right">Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="module in filteredModules" :key="module.module_id"
                class="hover:bg-slate-50/80 transition-all group">
                <td class="px-6 py-5 text-center">
                  <span
                    class="font-mono text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500 border border-slate-200">
                    LP-{{ module.lp_no || module.module_id }}
                  </span>
                </td>
                <td class="px-6 py-5">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-xl bg-[#d4e3ff] flex items-center justify-center text-[#005daa] font-extrabold text-lg">
                      {{ module.sport.charAt(0) }}
                    </div>
                    <div>
                      <p class="font-bold text-sm text-[#1a1c1c] leading-snug">{{ module.sport }}</p>
                      <p class="text-[10px] text-[#404753] uppercase font-bold tracking-tight">Active Program</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-5">
                  <p class="font-bold text-sm text-[#1a1c1c]">{{ module.module_name }}</p>
                  <p class="text-[10px] text-[#404753] font-medium leading-relaxed truncate max-w-md italic mt-0.5"
                    :title="module.lesson_details">{{ module.lesson_details }}</p>
                </td>
                <td class="px-6 py-5 text-center">
                  <div
                    class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 mx-auto border border-slate-200">
                    {{ module.grade || '-' }}
                  </div>
                </td>
                <td class="px-6 py-5 text-center">
                  <span
                    class="px-3 py-1 rounded-full bg-[#f0fdf4] text-[#059669] text-[10px] font-bold border border-[#f0fdf4]">Active</span>
                </td>
                <td class="px-6 py-5 text-right">
                  <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      class="p-2 text-[#404753] hover:text-[#005daa] hover:bg-[#d4e3ff] rounded-lg transition-all">
                      <span class="material-symbols-outlined text-xl">menu_book</span>
                    </button>
                    <button
                      class="p-2 text-[#404753] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-all">
                      <span class="material-symbols-outlined text-xl">ios_share</span>
                    </button>
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
    const [assignRes, modulesRes] = await Promise.all([
      fetch(`/api/curriculum/my-assignments/${userId}`),
      fetch(`/api/curriculum/my-modules/${userId}`)
    ]);

    const assignData = await assignRes.json();
    const modulesData = await modulesRes.json();

    if (assignData.success) assignments.value = assignData.assignments;
    if (modulesData.success) curriculumModules.value = modulesData.modules;

  } catch (err) {
    console.error('Fetch data error:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);

const sports = computed(() => {
  const uniqueSports = [...new Set(curriculumModules.value.map(m => m.sport))];
  return uniqueSports.sort();
});

const filteredModules = computed(() => {
  let filtered = curriculumModules.value;

  if (selectedSport.value !== 'All') {
    filtered = filtered.filter(m => m.sport === selectedSport.value);
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    filtered = filtered.filter(m =>
      m.module_name.toLowerCase().includes(q) ||
      m.sport.toLowerCase().includes(q) ||
      (m.grade && m.grade.toString().includes(q))
    );
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
