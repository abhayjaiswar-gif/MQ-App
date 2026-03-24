<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const schools = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedCity = ref('All Cities');

const fetchSchools = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/schools');
    const data = await response.json();
    if (data.success) {
      schools.value = data.schools;
    }
  } catch (error) {
    console.error('Error fetching schools:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchSchools);

const filteredSchools = computed(() => {
  let filtered = schools.value;
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.school_code && s.school_code.toLowerCase().includes(q))
    );
  }
  
  if (selectedCity.value !== 'All Cities') {
    filtered = filtered.filter(s => s.city === selectedCity.value);
  }
  
  return filtered;
});

const cities = computed(() => {
  const uniqueCities = [...new Set(schools.value.map(s => s.city).filter(Boolean))];
  return ['All Cities', ...uniqueCities];
});

const stats = computed(() => {
  const total = schools.value.length;
  const active = schools.value.filter(s => s.is_active == 1).length;
  
  // Total Students (Sum of student_count for active schools)
  const totalStudents = schools.value
    .filter(s => s.is_active == 1)
    .reduce((sum, s) => sum + (s.student_count || 0), 0);

  // Inactive / Pending Updates
  // Pending = Active but missing principal signature OR zero students
  const pendingUpdates = schools.value.filter(s => 
    s.is_active == 1 && (!s.principal_signature_image || s.student_count === 0)
  ).length;
  
  // Calculate "Updated This Month"
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const updatedThisMonth = schools.value.filter(s => {
    if (!s.last_updated_on) return false;
    const d = new Date(s.last_updated_on);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  return { total, active, totalStudents, pendingUpdates, updatedThisMonth };
});

const goToAddSchool = () => {
  router.push('/school/add');
};

const goToEditSchool = (id: number) => {
  router.push(`/school/edit/${id}`);
};
</script>

<template>
  <div class="school-list-wrapper">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 px-4">
      <div>
        <nav class="flex items-center gap-2 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
          <span>Portal</span>
          <span class="material-symbols-outlined text-[12px]">chevron_right</span>
          <span class="text-primary">Schools</span>
        </nav>
        <h2 class="text-4xl font-extrabold text-on-surface tracking-tight">Schools</h2>
        <p class="text-on-surface-variant mt-1 font-body">Manage and monitor institutional partnerships and operational status.</p>
      </div>
      <button 
        @click="goToAddSchool"
        class="bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95"
      >
        <span class="material-symbols-outlined">add</span>
        <span>Add New School</span>
      </button>
    </div>

    <!-- Dashboard Metric Highlights -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 px-4">
      <div class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-primary">
        <p class="text-[10px] uppercase font-bold text-outline tracking-wider mb-2">Total Schools</p>
        <div class="flex items-end justify-between">
          <h3 class="text-3xl font-extrabold text-on-surface">{{ stats.total }}</h3>
          <span class="text-success text-xs font-bold flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            <span class="material-symbols-outlined text-sm">school</span> {{ stats.active }} Active
          </span>
        </div>
      </div>
      <div class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-emerald-500">
        <p class="text-[10px] uppercase font-bold text-outline tracking-wider mb-2">Total Students</p>
        <div class="flex items-end justify-between">
          <h3 class="text-3xl font-extrabold text-on-surface">{{ stats.totalStudents }}</h3>
          <span class="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded font-bold">
            Enrollments
          </span>
        </div>
      </div>
      <div class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-amber-400">
        <p class="text-[10px] uppercase font-bold text-outline tracking-wider mb-2">Inactive / Pending</p>
        <div class="flex items-end justify-between">
          <h3 class="text-3xl font-extrabold text-on-surface">{{ stats.pendingUpdates }}</h3>
          <span class="text-amber-600 text-xs font-bold">{{ stats.pendingUpdates > 0 ? 'Action Required' : 'All Clear' }}</span>
        </div>
      </div>
      <div class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-secondary">
        <p class="text-[10px] uppercase font-bold text-outline tracking-wider mb-2">Updated This Month</p>
        <div class="flex items-end justify-between">
          <h3 class="text-3xl font-extrabold text-on-surface">{{ stats.updatedThisMonth }}</h3>
          <div class="flex -space-x-2">
            <div 
              v-for="i in Math.min(stats.updatedThisMonth, 3)" 
              :key="i"
              class="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold"
            >
              U{{ i }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Schools Table Card -->
    <div class="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,28,58,0.04)] overflow-hidden">
      <!-- Filter Bar -->
      <div class="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-bright/50">
        <div class="flex items-center gap-4 w-full md:w-auto">
          <div class="relative flex-1 md:w-80">
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input 
              v-model="searchQuery"
              class="w-full bg-white border border-outline-variant/30 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all outline-none" 
              placeholder="Search by name or code..." 
              type="text"
            />
          </div>
          <button class="flex items-center gap-2 px-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-slate-50 transition-all">
            <span class="material-symbols-outlined text-lg">filter_list</span>
            <span>Filters</span>
          </button>
        </div>
        <div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span class="text-[10px] font-bold uppercase text-outline px-2">City:</span>
          <button 
            v-for="city in cities" 
            :key="city"
            @click="selectedCity = city"
            :class="[
              'whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all',
              selectedCity === city ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            ]"
          >
            {{ city }}
          </button>
        </div>
      </div>

      <!-- Table Content -->
      <div class="overflow-x-auto">
        <div v-if="loading" class="p-10 text-center text-on-surface-variant">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          Loading schools...
        </div>
        <table v-else class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-low/30">
              <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">School Code</th>
              <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">School Name</th>
              <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Manager</th>
              <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">City</th>
              <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center">Status</th>
              <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="school in filteredSchools" :key="school.id" class="hover:bg-slate-50/80 transition-all group">
              <td class="px-6 py-5">
                <span class="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">{{ school.school_code || 'N/A' }}</span>
              </td>
              <td class="px-6 py-5">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary font-bold text-lg">
                    {{ school.name.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-bold text-sm text-on-surface">{{ school.name }}</p>
                    <p class="text-[10px] text-on-surface-variant">{{ school.address_line1 }}, {{ school.city }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                    {{ school.om_name ? school.om_name.split(' ').map((n: string) => n[0]).join('') : 'OM' }}
                  </div>
                  <span class="text-sm font-medium">{{ school.om_name || 'Not Assigned' }}</span>
                </div>
              </td>
              <td class="px-6 py-5 text-sm text-on-surface-variant">{{ school.city }}</td>
              <td class="px-6 py-5 text-center">
                <span 
                  :class="[
                    'px-3 py-1 rounded-full text-[10px] font-bold',
                    school.is_active == 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  ]"
                >
                  {{ school.is_active == 1 ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-5 text-right">
                <div class="flex items-center justify-end gap-2 transition-all">
                  <button 
                    class="p-2 text-primary hover:bg-primary-fixed rounded-lg transition-all" 
                    @click.stop="goToEditSchool(school.id)"
                    title="Edit School"
                  >
                    <span class="material-symbols-outlined text-xl">edit_note</span>
                  </button>
                  <button class="p-2 text-error hover:bg-error-container rounded-lg transition-all" @click.stop="">
                    <span class="material-symbols-outlined text-xl">delete_outline</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredSchools.length === 0 && !loading">
              <td colspan="6" class="px-6 py-10 text-center text-on-surface-variant italic">
                No schools found matching your criteria.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-6 bg-surface-container-low/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-xs text-on-surface-variant font-medium">
          Showing <span class="text-on-surface font-bold">{{ filteredSchools.length }}</span> of <span class="text-on-surface font-bold">{{ schools.length }}</span> schools
        </p>
        <div class="flex items-center gap-1">
          <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white transition-all">
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-md shadow-primary/20">1</button>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white transition-all">
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Insights Section -->
    <div class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="bg-primary/5 p-8 rounded-3xl border border-primary/10 flex gap-6">
        <div class="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0">
          <span class="material-symbols-outlined">analytics</span>
        </div>
        <div>
          <h4 class="font-bold text-lg mb-2">School Compliance Overview</h4>
          <p class="text-sm text-on-surface-variant leading-relaxed mb-4">You have {{ stats.pendingUpdates }} schools currently in the 'Pending' state. Please review their status in the settings panel.</p>
          <a class="text-primary font-bold text-sm inline-flex items-center gap-1 hover:underline" href="#">
            View compliance report <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
      </div>
      <div class="bg-secondary/5 p-8 rounded-3xl border border-secondary/10 flex gap-6">
        <div class="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-white shrink-0">
          <span class="material-symbols-outlined">auto_stories</span>
        </div>
        <div>
          <h4 class="font-bold text-lg mb-2">Institutional Management Tip</h4>
          <p class="text-sm text-on-surface-variant leading-relaxed mb-4">Assigning a dedicated Operation Manager to each school increases partnership retention significantly.</p>
          <a class="text-secondary font-bold text-sm inline-flex items-center gap-1 hover:underline" href="#">
            Learn more best practices <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.school-list-wrapper {
  font-family: 'Inter', sans-serif;
  color: #1a1c1c;
}

h2, h3, h4 {
  font-family: 'Manrope', sans-serif;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
}

/* For smooth city filters scrolling on mobile */
::-webkit-scrollbar {
  height: 4px;
}
::-webkit-scrollbar-thumb {
  background: #e2e2e2;
  border-radius: 10px;
}
</style>
