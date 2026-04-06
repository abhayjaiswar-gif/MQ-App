<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const defaultImage = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIIwsL-pbkbiNEWxbRRwgfXGFp_KSROv6DrQ&s';

const handleImageError = (event: Event) => {
  (event.target as HTMLImageElement).src = defaultImage;
};

const schools = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedCity = ref('All Cities');

const fetchSchools = async () => {
  try {
    const response = await fetch('/api/schools');
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
  <div class="school-pagel-container">
    <div class="p-2 mt-5 max-w-9xl mx-auto">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <nav
            class="flex items-center gap-2 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
            <span>Portal</span>
            <span class="material-symbols-outlined text-[12px]">chevron_right</span>
            <span class="text-primary">Schools</span>
          </nav>
          <h2 class="text-4xl font-extrabold text-on-surface tracking-tight">Schools</h2>
          <p class="text-on-surface-variant mt-1 font-body">Manage and monitor institutional partnerships and
            operational status.</p>
        </div>
        <button @click="goToAddSchool"
          class="bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95">
          <span class="material-symbols-outlined">add</span>
          <span>Add New School</span>
        </button>
      </div>

      <!-- Dashboard Metric Highlights (Bento Style) -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">

        <!-- Total Schools -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden">
          <div class="absolute bottom-0 left-0 w-full h-2 bg-primary rounded-b-2xl"></div>

          <p class="text-[10px] uppercase font-bold text-outline tracking-wider mb-2">
            Total Schools
          </p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-on-surface">
              {{ stats.total }}
            </h3>
            <span
              class="text-success text-xs font-bold flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <span class="material-symbols-outlined text-sm">trending_up</span>
              +{{ Math.round((stats.active / stats.total) * 100) || 0 }}%
            </span>
          </div>
        </div>

        <!-- Active Institutions -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden">
          <div class="absolute bottom-0 left-0 w-full h-2 bg-emerald-500 rounded-b-2xl"></div>

          <p class="text-[10px] uppercase font-bold text-outline tracking-wider mb-2">
            Active Institutions
          </p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-on-surface">
              {{ stats.active }}
            </h3>
            <span class="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded font-bold">
              {{ stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0 }}%
            </span>
          </div>
        </div>

        <!-- Pending Setup -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden">
          <div class="absolute bottom-0 left-0 w-full h-2 bg-amber-400 rounded-b-2xl"></div>

          <p class="text-[10px] uppercase font-bold text-outline tracking-wider mb-2">
            Pending Setup / Action
          </p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-on-surface">
              {{ stats.pendingUpdates }}
            </h3>
            <span class="text-amber-600 text-[10px] font-bold uppercase tracking-wider">
              {{ stats.pendingUpdates > 0 ? 'Review Needed' : 'Completed' }}
            </span>
          </div>
        </div>

        <!-- Updated This Month -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden">
          <div class="absolute bottom-0 left-0 w-full h-2 bg-secondary rounded-b-2xl"></div>

          <p class="text-[10px] uppercase font-bold text-outline tracking-wider mb-2">
            Updated This Month
          </p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-on-surface">
              {{ stats.updatedThisMonth }}
            </h3>

            <div class="flex -space-x-2">
              <div v-for="i in Math.min(stats.updatedThisMonth, 3)" :key="i"
                class="w-7 h-7 rounded-full border-2 border-white bg-secondary/10 flex items-center justify-center text-[8px] font-bold text-secondary">
                U{{ i }}
              </div>
            </div>
          </div>
        </div>

      </div>
      <!-- Schools Table Card -->
      <div class="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,28,58,0.04)] overflow-hidden">
        <!-- Filter Bar -->
        <div
          class="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-bright/50">
          <div class="flex items-center gap-4 w-full md:w-auto">
            <div class="relative flex-1 md:w-80">
              <span
                class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
              <input v-model="searchQuery"
                class="w-full bg-white border border-outline-variant/30 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all outline-none font-body"
                placeholder="Search by name or code..." type="text" />
            </div>
            <button
              class="flex items-center gap-2 px-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-slate-50 transition-all font-body">
              <span class="material-symbols-outlined text-lg">filter_list</span>
              <span>Filters</span>
            </button>
          </div>
          <div class="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            <span class="text-[10px] font-bold uppercase text-outline px-2 whitespace-nowrap">City:</span>
            <button v-for="city in cities" :key="city" @click="selectedCity = city" :class="[
              'whitespace-nowrap px-4 py-3 rounded-full text-xs font-bold transition-all font-body',
              selectedCity === city ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            ]">
              {{ city }}
            </button>
          </div>
        </div>

        <!-- Table Content -->
        <div class="overflow-x-auto">
          <div v-if="loading" class="p-20 text-center">
            <div class="animate-spin rounded-full h-12 w-20 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p class="text-on-surface-variant font-medium animate-pulse">Synchronizing school records...</p>
          </div>
          <table v-else class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low/30 border-b border-slate-50">
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">School Code</th>
                <th class="px-6 py-4 w-20 text-[10px] font-bold uppercase tracking-widest text-outline">School Name</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">Operation Manager
                </th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">City</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-center">Status
                </th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline text-right">Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="school in filteredSchools" :key="school.id" class="hover:bg-slate-50/80 transition-all group">
                <td class="px-6 py-5">
                  <span
                    class="font-mono text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-700 border border-slate-200/50">
                    {{ school.school_code || '---' }}
                  </span>
                </td>
                <td class="px-6 py-5">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 overflow-hidden shrink-0 shadow-sm">
                      <img v-if="school.school_logo" :src="`/uploads/${school.school_logo}`"
                        alt="Logo" class="w-full h-full object-contain" @error="handleImageError" />
                      <span v-else class="text-primary font-bold text-lg">{{ school.name?.charAt(0) }}</span>
                    </div>
                    <div>
                      <p class="font-bold text-sm text-on-surface leading-snug">{{ school.name }}</p>
                      <p class="text-[10px] text-on-surface-variant font-medium mt-0.5 truncate max-w-[200px]">{{
                        school.address_line1 || 'No address provided' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-5">
                  <div class="flex items-center gap-2.5">
                    <div
                      class="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-[10px] font-bold text-secondary border border-secondary/20 uppercase shadow-sm">
                      {{school.om_name ? school.om_name.split(' ').map((n: string) => n[0]).join('') : 'OM'}}
                    </div>
                    <span class="text-sm font-semibold text-on-surface-variant">{{ school.om_name || 'Unassigned'
                    }}</span>
                  </div>
                </td>
                <td class="px-6 py-5 text-sm font-medium text-on-surface-variant">{{ school.city }}</td>
                <td class="px-6 py-5 text-center">
                  <span :class="[
                    'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all',
                    school.is_active == 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                  ]">
                    {{ school.is_active == 1 ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-5 text-right">
                  <div class="flex items-center justify-end gap-1 transition-all transform group-hover:-translate-x-1">
                    <button @click="goToEditSchool(school.id)"
                      class="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                      title="Edit Details">
                      <span class="material-symbols-outlined text-xl">edit_note</span>
                    </button>
                    <button
                      class="p-2 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-xl transition-all"
                      title="Archive School">
                      <span class="material-symbols-outlined text-xl">delete_outline</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!loading && filteredSchools.length === 0">
                <td colspan="6" class="px-6 py-20 text-center">
                  <span class="material-symbols-outlined text-4xl text-slate-200 mb-2">school</span>
                  <p class="text-on-surface-variant font-medium italic">No schools matched your current search
                    parameters.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          class="p-6 bg-surface-container-low/20 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-50">
          <p class="text-xs text-on-surface-variant font-bold uppercase tracking-widest">
            Showing <span class="text-on-surface">{{ filteredSchools.length }}</span> of <span
              class="text-on-surface">{{ schools.length }}</span> institutions
          </p>
          <div class="flex items-center gap-1">
            <button
              class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:shadow-sm transition-all disabled:opacity-30">
              <span class="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              class="w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20">1</button>
            <button
              class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-white hover:shadow-sm transition-all">2</button>
            <span class="px-2 text-slate-300">...</span>
            <button
              class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:shadow-sm transition-all">
              <span class="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Contextual Help / Insights Section -->
      <div class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
        <div
          class="bg-primary/5 p-8 rounded-3xl border border-primary/10 flex gap-6 group hover:bg-primary/[0.07] transition-all">
          <div
            class="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
            <span class="material-symbols-outlined">analytics</span>
          </div>
          <div>
            <h4 class="font-bold text-lg mb-2 font-headline">School Compliance Overview</h4>
            <p class="text-sm text-on-surface-variant leading-relaxed mb-4 font-body">There are {{ stats.pendingUpdates
            }} schools requiring documentation updates or verification. Keeping data current ensures seamless
              operational oversight.</p>
            <a
              class="text-primary font-bold text-sm inline-flex items-center gap-1 hover:underline cursor-pointer group-hover:translate-x-1 transition-transform">
              View Detailed Metrics <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>
        </div>
        <div
          class="bg-secondary/5 p-8 rounded-3xl border border-secondary/10 flex gap-6 group hover:bg-secondary/[0.07] transition-all">
          <div
            class="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-secondary/20">
            <span class="material-symbols-outlined">auto_stories</span>
          </div>
          <div>
            <h4 class="font-bold text-lg mb-2 font-headline">Management insight</h4>
            <p class="text-sm text-on-surface-variant leading-relaxed mb-4 font-body">Active school count has grown by
              {{ Math.round((stats.updatedThisMonth / stats.total) * 100) || 0 }}% this month. Optimization of OM
              assignments can further enhance retention across regions.</p>
            <a
              class="text-secondary font-bold text-sm inline-flex items-center gap-1 hover:underline cursor-pointer group-hover:translate-x-1 transition-transform">
              Operational Best Practices <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Color Palette Integration */
:deep(.school-pagel-container) {
  --primary: #005daa;
  --primary-container: #0075d5;
  --on-primary: #ffffff;
  --secondary: #40608b;
  --surface: #f9f9f9;
  --on-surface: #1a1c1c;
  --on-surface-variant: #404753;
  --outline: #707785;
  --outline-variant: #c0c7d6;
  --surface-container-low: #f3f3f3;
  --surface-bright: #f9f9f9;
  --error: #ba1a1a;
  --surface-dim: #dadada;
}

.school-pagel-container {
  min-height: 100vh;
  background-color: var(--surface);
  color: var(--on-surface);
  font-family: 'Inter', sans-serif;
}

.font-headline {
  font-family: 'Manrope', sans-serif;
}

.font-body {
  font-family: 'Inter', sans-serif;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
}

.text-primary {
  color: var(--primary);
}

.bg-primary {
  background-color: var(--primary);
}

.bg-primary-container {
  background-color: var(--primary-container);
}

.text-on-surface-variant {
  color: var(--on-surface-variant);
}

.text-on-surface {
  color: var(--on-surface);
}

.text-outline {
  color: var(--outline);
}

.text-error {
  color: var(--error);
}

.bg-error {
  background-color: var(--error);
}

.bg-surface-bright {
  background-color: var(--surface-bright);
}

.bg-surface-container-low {
  background-color: var(--surface-container-low);
}

/* Custom layout adjustments */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
