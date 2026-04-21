<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const showAddModal = ref(false);
const loading = ref(false);
const submitting = ref(false);

const schools = ref<any[]>([]);
const coaches = ref<any[]>([]);
const lectures = ref<any[]>([]);
const selectedSchoolId = ref<string | number>('');

const metrics = reactive({
  total: 0,
  avgDuration: 0,
  activeCoaches: 0
});

const form = reactive({
  coachId: '',
  sport: '',
  date: new Date().toISOString().split('T')[0],
  startTime: '10:00',
  endTime: '11:00'
});

const grades = ref<string[]>([]);
const selectedGrades = ref<string[]>([]);
const divisions = ref<string[]>([]);
const selectedDivision = ref('');

const fetchMetadata = async () => {
  try {
    const res = await axios.get(`/api/management/lecture-metadata?user_id=${authStore.user?.id}`);
    if (res.data.success) {
      schools.value = res.data.schools;
      if (schools.value.length === 1) {
        selectedSchoolId.value = schools.value[0].id;
      }
      // Coaches are also returned in metadata now if needed globally, 
      // but we currently fetch them per school in fetchCoaches.
    }
  } catch (err) {
    console.error('Fetch Metadata Error:', err);
  }
};

const fetchCoaches = async (schoolId: string | number) => {
  if (!schoolId) {
    coaches.value = [];
    return;
  }
  try {
    const res = await axios.get(`/api/coaches?school_id=${schoolId}`);
    if (res.data.success) {
      coaches.value = res.data.coaches;

      // Auto-select logged in user if they are in the coaches list (Head Coach or Coach role)
      if (authStore.user && (authStore.user.role_id === 4 || authStore.user.role_id === 5)) {
        const found = coaches.value.find(c => c.id === authStore.user.id);
        if (found) {
          form.coachId = found.id;
        }
      }
    }
  } catch (err) {
    console.error('Fetch Coaches Error:', err);
  }
};

const fetchSchoolMetadata = async (schoolId: string | number) => {
  if (!schoolId) {
    grades.value = [];
    divisions.value = [];
    return;
  }
  try {
    const res = await axios.get(`/api/school-metadata/${schoolId}`);
    if (res.data.success) {
      grades.value = res.data.grades || [];
      divisions.value = res.data.divisions || [];

      // Auto-select first division if available
      if (divisions.value.length > 0) {
        selectedDivision.value = divisions.value[0];
      } else {
        selectedDivision.value = '';
      }
    }
  } catch (err) {
    console.error('Fetch Metadata Error:', err);
  }
};

const fetchLectures = async () => {
  loading.value = true;
  try {
    const params = selectedSchoolId.value ? `?school_id=${selectedSchoolId.value}` : '';
    const res = await axios.get(`/api/management/lectures${params}`);
    if (res.data.success) {
      lectures.value = res.data.lectures;
      metrics.total = res.data.metrics.total;
      metrics.avgDuration = res.data.metrics.avgDuration;
      metrics.activeCoaches = res.data.metrics.activeCoaches;
    }
  } catch (err) {
    console.error('Fetch Lectures Error:', err);
  } finally {
    loading.value = false;
  }
};

watch(selectedSchoolId, (newVal) => {
  if (newVal) {
    fetchCoaches(newVal);
    fetchSchoolMetadata(newVal);
  }
  fetchLectures();
  form.coachId = ''; // Reset coach when school changes
  selectedGrades.value = []; // Reset grades
});

const toggleGrade = (grade: string) => {
  if (selectedGrades.value.includes(grade)) {
    selectedGrades.value = selectedGrades.value.filter(g => g !== grade);
  } else {
    selectedGrades.value.push(grade);
  }
};

const getStatusClass = (status: string) => {
  return status === 'Completed'
    ? 'bg-green-100 text-green-800'
    : 'bg-secondary-container text-on-secondary-container';
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric'
  });
};

const calculateDuration = (start: string, end: string) => {
  if (!start || !end) return '0 min';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 1440; // Next day fallback (though unlikely for lectures)
  return `${diff} min`;
};

const createLecture = async () => {
  if (!selectedSchoolId.value || !form.coachId || !form.sport || !form.date) {
    alert('Please fill in all required fields');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      school_id: selectedSchoolId.value,
      coach_id: form.coachId,
      sport: form.sport,
      lecture_date: form.date,
      start_time: form.startTime,
      end_time: form.endTime,
      grades: selectedGrades.value,
      division: selectedDivision.value
    };

    const res = await axios.post('/api/management/lectures', payload);
    if (res.data.success) {
      showAddModal.value = false;
      // Reset form
      form.sport = '';
      selectedGrades.value = [];
      await fetchLectures();
    } else {
      alert('Error: ' + res.data.message);
    }
  } catch (err) {
    console.error('Create Lecture Error:', err);
    alert('Failed to save lecture. Please try again.');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  fetchMetadata();
  fetchLectures();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-2 relative">
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Page Header Section -->
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">Mark Lecture</h1>
          <p class="text-slate-500 text-sm">Manage and track coaching sessions across all academy divisions.</p>
        </div>
        <button @click="showAddModal = true"
          class="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">add</span>
          Mark New Lecture
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Summary Card 1 -->
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <span class="material-symbols-outlined font-variation-fill">history</span>
          </div>
          <div>
            <p class="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              {{ selectedSchoolId ? 'School Sessions' : 'Total Sessions' }}
            </p>
            <h3 class="text-2xl font-black text-slate-900">{{ metrics.total }}</h3>
          </div>
        </div>

        <!-- Summary Card 2 -->
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <span class="material-symbols-outlined font-variation-fill">timer</span>
          </div>
          <div>
            <p class="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Avg. Duration</p>
            <h3 class="text-2xl font-black text-slate-900">{{ metrics.avgDuration }} min</h3>
          </div>
        </div>

        <!-- Summary Card 3 -->
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <span class="material-symbols-outlined font-variation-fill">groups</span>
          </div>
          <div>
            <p class="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active Coaches</p>
            <h3 class="text-2xl font-black text-slate-900">{{ metrics.activeCoaches }}</h3>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="p-6 flex items-center justify-between border-b border-slate-50">
          <h3 class="font-bold text-lg text-slate-900">Recent Lecture Sessions</h3>
          <div class="flex items-center gap-3">
            <button @click="fetchLectures"
              class="p-2 border border-outline-variant/30 rounded-lg hover:bg-surface-container-low transition-colors">
              <span class="material-symbols-outlined text-on-surface-variant"
                :class="{ 'animate-spin': loading }">refresh</span>
            </button>
            <button
              class="p-2 border border-outline-variant/30 rounded-lg hover:bg-surface-container-low transition-colors">
              <span class="material-symbols-outlined text-on-surface-variant">download</span>
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sr
                  No.</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Coach Name</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Sport</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Grade</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  School</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date
                </th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Duration</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                  Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="loading">
                <td colspan="9" class="px-6 py-12 text-center text-slate-400 italic">Fetching
                  latest coaching records...</td>
              </tr>
              <tr v-else-if="lectures.length === 0">
                <td colspan="9" class="px-6 py-12 text-center text-slate-400 italic">No sessions
                  recorded yet. Click "Mark New Lecture" to begin.</td>
              </tr>
              <tr v-for="(item, index) in lectures" :key="item.id" class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-6 py-5 text-sm text-slate-500">{{ (index + 1).toString().padStart(2,
                  '0') }}</td>
                <td class="px-6 py-5">
                  <div class="flex items-center gap-3">
                    <div :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm',
                      ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700'][index % 5]
                    ]">
                      {{item.coach_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}}
                    </div>
                    <span class="text-sm font-bold text-slate-900">{{
                      item.coach_name }}</span>
                  </div>
                </td>
                <td class="px-6 py-5 text-sm text-slate-500">{{ item.sport }}</td>
                <td class="px-6 py-5 text-sm text-slate-500">
                  <template v-if="item.grades">
                    {{
                      (() => {
                        try {
                          const parsed = typeof item.grades === 'string' ? JSON.parse(item.grades) : item.grades;
                          return Array.isArray(parsed) ? (parsed[0] + (parsed.length > 1 ? ` +${parsed.length - 1}` : '')) :
                            item.grades;
                        } catch (e) {
                          return item.grades;
                        }
                      })()
                    }}
                  </template>
                  <span v-if="item.division"
                    class="ml-1 text-[10px] font-black bg-slate-200 px-1 rounded opacity-70 uppercase tracking-tighter">{{
                      item.division }}</span>
                </td>
                <td class="px-6 py-5 text-xs text-blue-600 font-semibold italic">{{ item.school_name }}</td>
                <td class="px-6 py-5 text-sm text-slate-500">{{ formatDate(item.lecture_date) }}</td>
                <td class="px-6 py-5 text-sm text-slate-500">{{ calculateDuration(item.start_time,
                  item.end_time) }}
                </td>
                <td class="px-6 py-5">
                  <span :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-tight uppercase shadow-sm',
                    item.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                  ]">
                    {{ item.status || 'Completed' }}
                  </span>
                </td>
                <td class="px-6 py-5 text-right">
                  <button class="text-slate-400 hover:text-blue-600 transition-all hover:scale-110">
                    <span class="material-symbols-outlined">more_vert</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="p-6 border-t border-slate-100 flex items-center justify-between">
          <p class="text-sm text-slate-500 italic">Showing {{ lectures.length }} sessions</p>
          <div class="flex gap-2">
            <button
              class="px-3 py-1 border border-slate-200 rounded text-sm text-slate-600 disabled:opacity-50 transition-all hover:bg-slate-50"
              disabled>Previous</button>
            <button
              class="px-4 py-1 bg-blue-600 text-white rounded text-sm font-bold shadow-md shadow-blue-200">1</button>
            <button
              class="px-4 py-1 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 transition-all">2</button>
            <button
              class="px-3 py-1 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 transition-all">Next</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL OVERLAY -->
    <Transition name="fade">
      <div v-if="showAddModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <!-- MODAL CONTAINER -->
        <div class="bg-white w-full max-w-2xl max-h-[94vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
          <!-- Modal Header -->
          <div class="px-6 md:px-8 py-5 md:py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div>
              <h2 class="text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">Add New Lecture
              </h2>
              <p class="text-slate-500 text-xs md:text-sm mt-0.5">Configure session details and student
                assignments.</p>
            </div>
            <button @click="showAddModal = false" class="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <span class="material-symbols-outlined text-slate-400">close</span>
            </button>
          </div>

          <!-- Modal Content (Scrollable Form) -->
          <div class="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
            <!-- Row 0: School Selection -->
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Select
                School</label>
              <div class="relative group">
                <span
                  class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-blue-600 transition-colors">school</span>
                <select v-model="selectedSchoolId"
                  class="w-full bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 rounded-lg py-3 pl-10 pr-4 text-sm font-medium appearance-none">
                  <option value="">Select a School</option>
                  <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
                </select>
              </div>
            </div>

            <!-- Row 1: Coach & Sport -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Coach
                  Name</label>
                <div class="relative group">
                  <span
                    class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-blue-600 transition-colors">person</span>
                  <select v-model="form.coachId" :disabled="!selectedSchoolId"
                    class="w-full bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 rounded-lg py-3 pl-10 pr-4 text-sm font-medium appearance-none disabled:opacity-50">
                    <option value="">{{ selectedSchoolId ? 'Select a Coach' : 'First select a school' }}</option>
                    <option v-for="coach in coaches" :key="coach.id" :value="coach.id">{{ coach.name }} ({{
                      coach.role_name
                      }})</option>
                  </select>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Sport /
                  Activity
                  (Manual Input)</label>
                <div class="relative group">
                  <span
                    class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-blue-600 transition-colors">sports_basketball</span>
                  <input v-model="form.sport" placeholder="Enter Sport Name"
                    class="w-full bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 rounded-lg py-3 pl-10 pr-4 text-sm font-medium"
                    type="text" />
                </div>
              </div>
            </div>
            <!-- Row 2: Date & Schedule Details -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Session
                  Date</label>
                <div class="relative group">
                  <span
                    class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-blue-600 transition-colors">calendar_today</span>
                  <input v-model="form.date"
                    class="w-full bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 rounded-lg py-3 pl-10 pr-4 text-sm font-medium"
                    type="date" />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Start
                  Time</label>
                <input v-model="form.startTime"
                  class="w-full bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 rounded-lg py-3 px-4 text-sm font-medium"
                  type="time" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">End
                  Time</label>
                <input v-model="form.endTime"
                  class="w-full bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 rounded-lg py-3 px-4 text-sm font-medium"
                  type="time" />
              </div>
            </div>
            <!-- Multi-select sections -->
            <div class="space-y-6 pt-2">
              <div class="space-y-3">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Standard /
                  Grade</label>
                <div v-if="!selectedSchoolId" class="text-xs text-slate-400 italic px-1">Select a school to see
                  available grades.</div>
                <div v-else-if="grades.length === 0" class="text-xs text-slate-400 italic px-1">No grades found
                  for
                  this school.</div>
                <div v-else class="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  <div v-for="grade in grades" :key="grade" @click="toggleGrade(grade)" :class="[
                    'flex items-center justify-center py-2.5 px-2 rounded-md cursor-pointer border-2 transition-all',
                    selectedGrades.includes(grade)
                      ? 'bg-blue-50 text-blue-700 border-blue-600 shadow-sm'
                      : 'bg-slate-50 border-transparent hover:border-slate-200'
                  ]">
                    <span class="text-[10px] font-bold tracking-tight">{{ grade }}</span>
                  </div>
                </div>
              </div>
              <!-- Division -->
              <div class="space-y-3">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Division</label>
                <div v-if="!selectedSchoolId" class="text-xs text-slate-400 italic px-1">Select a school to see
                  available divisions.</div>
                <div v-else-if="divisions.length === 0" class="text-xs text-slate-400 italic px-1">No divisions
                  found for this school.</div>
                <div v-else class="flex flex-wrap gap-2 md:gap-3">
                  <div v-for="div in divisions" :key="div" @click="selectedDivision = div" :class="[
                    'flex-1 min-w-[60px] flex items-center justify-center py-3 rounded-lg cursor-pointer border-2 transition-all',
                    selectedDivision === div
                      ? 'bg-blue-50 text-blue-700 border-blue-600 shadow-sm'
                      : 'bg-slate-50 border-transparent hover:border-slate-200'
                  ]">
                    <span class="text-sm font-bold"
                      :class="selectedDivision === div ? 'text-blue-700' : 'text-slate-600'">{{ div }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div
            class="px-6 md:px-8 py-5 md:py-6 bg-slate-50 border-t border-slate-100 flex justify-end items-center gap-4 shrink-0">
            <button @click="showAddModal = false"
              class="px-4 md:px-6 py-2.5 text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
              Discard Draft
            </button>
            <button @click="createLecture" :disabled="submitting"
              class="bg-blue-600 hover:bg-blue-700 text-white px-6 md:px-8 py-2.5 rounded-lg text-xs md:text-sm font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50">
              <span v-if="submitting"
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span v-else class="material-symbols-outlined text-lg">check_circle</span>
              Create Lecture
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
}

.font-variation-fill {
  font-variation-settings: 'FILL' 1;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
