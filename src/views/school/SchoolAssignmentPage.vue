<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface Assignment {
  user_id: number;
  user_name: string;
  email: string;
  role_id: number;
  role_name: string;
  assigned_schools: string;
  school_ids: string; // Comma separated string from backend
  school_count: number;
}

interface Stats {
  total_assignments: number;
  active_institutions: number;
  pending_requests: number;
}

const assignments = ref<Assignment[]>([]);
const stats = ref<Stats>({
  total_assignments: 0,
  active_institutions: 0,
  pending_requests: 0
});
const loading = ref(true);
const searchQuery = ref('');
const showAssignModal = ref(false);
const isEdit = ref(false);
const allUsers = ref<{id: number, name: string}[]>([]);
const allSchools = ref<{id: number, name: string}[]>([]);

const assignmentForm = ref({
  user_id: '',
  school_ids: [] as number[],
  role_id: 1,
  effective_until: ''
});

const fetchInitialData = async () => {
  loading.value = true;
  try {
    const [asgnRes, usersRes, schoolsRes] = await Promise.all([
      fetch('http://localhost:3000/api/school-assignments').then(r => r.json()),
      fetch('http://localhost:3000/api/schools').then(r => r.json()), // Assuming this exists or using existing school list
      // In a real app we might have a specific users endpoint, but let's assume we can fetch them
      fetch('http://localhost:3000/api/schools').then(r => r.json()) // Mocking user fetch with school list if no user api
    ]);

    if (asgnRes.success) {
      assignments.value = asgnRes.assignments;
      stats.value = asgnRes.stats;
    }
    if (usersRes.success) {
      allSchools.value = usersRes.schools;
    }
    // For users, let's fetch from basic login or assume we need a user endpoint
    // MOCK: Let's just use the assignments users for now or fetch from a known endpoint
    const userRes = await fetch('http://localhost:3000/api/school-assignments').then(r => r.json());
    if (userRes.success) {
      // Extract unique users
      const seen = new Set();
      allUsers.value = userRes.assignments.map((a: any) => ({ id: a.user_id, name: a.user_name }));
    }

  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    loading.value = false;
  }
};

const fetchAssignments = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/school-assignments');
    const data = await response.json();
    if (data.success) {
      assignments.value = data.assignments;
      stats.value = data.stats;
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

onMounted(fetchInitialData);

const filteredAssignments = computed(() => {
  if (!searchQuery.value) return assignments.value;
  const query = searchQuery.value.toLowerCase();
  return assignments.value.filter(a => 
    a.user_name.toLowerCase().includes(query) || 
    a.email.toLowerCase().includes(query) ||
    (a.assigned_schools && a.assigned_schools.toLowerCase().includes(query))
  );
});

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

// Pagination
const currentPage = ref(1);
const itemsPerPage = 10;
const totalPages = computed(() => Math.ceil(filteredAssignments.value.length / itemsPerPage));
const paginatedAssignments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredAssignments.value.slice(start, start + itemsPerPage);
});

const submitAssignment = async () => {
  if (!assignmentForm.value.user_id || assignmentForm.value.school_ids.length === 0) {
    alert('Please select a user and at least one school.');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/school-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: Number(assignmentForm.value.user_id),
        school_ids: assignmentForm.value.school_ids
      })
    });
    const data = await response.json();
    if (data.success) {
      showAssignModal.value = false;
      // Reset form
      assignmentForm.value = {
        user_id: '',
        school_ids: [],
        role_id: 1,
        effective_until: ''
      };
      fetchAssignments();
    } else {
      alert(data.message || 'Operation failed');
    }
  } catch (error) {
    console.error('Error saving assignment:', error);
    alert('An error occurred during save.');
  }
};

const openAddModal = () => {
  isEdit.value = false;
  assignmentForm.value = {
    user_id: '',
    school_ids: [],
    role_id: 1,
    effective_until: ''
  };
  showAssignModal.value = true;
};

const editAssignment = (asgn: Assignment) => {
  isEdit.value = true;
  assignmentForm.value = {
    user_id: String(asgn.user_id),
    school_ids: asgn.school_ids ? asgn.school_ids.split(',').map(Number) : [],
    role_id: asgn.role_id,
    effective_until: '' // Not in DB yet, keeping empty
  };
  showAssignModal.value = true;
};

const deleteAssignment = async (userId: number) => {
  if (!confirm('Are you sure you want to remove all school assignments for this user?')) return;
  
  try {
    const response = await fetch('http://localhost:3000/api/school-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        school_ids: [] // Empty array deletes all
      })
    });
    const data = await response.json();
    if (data.success) {
      fetchAssignments();
    } else {
      alert(data.message || 'Delete failed');
    }
  } catch (error) {
    console.error('Error deleting assignment:', error);
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight" style="font-family: 'Manrope', sans-serif;">
            School Assignments
          </h1>
          <p class="text-slate-500 mt-2 font-medium">Manage and oversee institutional access for academic staff and administrators.</p>
        </div>
        <button
          @click="openAddModal"
          class="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-sm"
        >
          <span class="material-symbols-outlined text-lg">add</span>
          Assign School
        </button>
      </div>

      <!-- Bento Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div class="bg-white p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,28,58,0.04)] group hover:translate-y-[-2px] transition-all border border-slate-100">
          <p class="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Assignments</p>
          <h3 class="text-3xl font-bold text-primary" style="font-family: 'Manrope', sans-serif;">
            {{ loading ? '—' : stats.total_assignments.toLocaleString() }}
          </h3>
          <div class="mt-2 text-[11px] text-green-600 flex items-center gap-1 font-bold">
            <span class="material-symbols-outlined text-[14px]">trending_up</span>
            12% increase this month
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,28,58,0.04)] group hover:translate-y-[-2px] transition-all border border-slate-100">
          <p class="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active Institutions</p>
          <h3 class="text-3xl font-bold text-slate-900" style="font-family: 'Manrope', sans-serif;">
             {{ loading ? '—' : stats.active_institutions }}
          </h3>
          <p class="mt-2 text-[11px] text-slate-400 font-bold uppercase">Across all regional clusters</p>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,28,58,0.04)] group hover:translate-y-[-2px] transition-all border border-slate-100">
          <p class="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Pending Requests</p>
          <h3 class="text-3xl font-bold text-orange-600" style="font-family: 'Manrope', sans-serif;">
            {{ loading ? '—' : stats.pending_requests }}
          </h3>
          <div class="mt-2 text-[11px] text-orange-600 font-bold uppercase">Requires immediate review</div>
        </div>
      </div>

      <!-- High-Density Table Card -->
      <div class="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,28,58,0.04)] overflow-hidden border border-slate-100">
        <div class="p-6 border-b border-slate-50 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h2 class="font-bold text-lg text-slate-900" style="font-family: 'Manrope', sans-serif;">Allocation Registry</h2>
            <div class="relative group">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-primary transition-colors">search</span>
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Search staff or schools..." 
                class="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-64 transition-all"
              />
            </div>
          </div>
          <div class="flex gap-2">
            <button class="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-slate-500">
              <span class="material-symbols-outlined text-xl">filter_list</span>
            </button>
            <button class="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-slate-500">
              <span class="material-symbols-outlined text-xl">download</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Sr. No.</th>
                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">User Name</th>
                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Role</th>
                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Schools</th>
                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <template v-if="!loading && paginatedAssignments.length > 0">
                <tr v-for="(assignment, idx) in paginatedAssignments" :key="assignment.user_id" class="hover:bg-slate-50/50 transition-colors group">
                  <td class="px-6 py-5 text-xs font-bold text-slate-400">
                    {{ (idx + 1 + (currentPage - 1) * itemsPerPage).toString().padStart(2, '0') }}
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary text-xs font-bold border border-primary/10">
                        {{ getInitials(assignment.user_name) }}
                      </div>
                      <div>
                        <p class="text-sm font-bold text-slate-900">{{ assignment.user_name }}</p>
                        <p class="text-[11px] font-medium text-slate-400">{{ assignment.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-tight bg-blue-50 text-blue-700 uppercase border border-blue-100">
                      {{ assignment.role_name }}
                    </span>
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex flex-wrap gap-1.5 max-w-md">
                      <template v-if="assignment.assigned_schools">
                        <span 
                          v-for="school in assignment.assigned_schools.split(', ')" 
                          :key="school"
                          class="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-600 border border-slate-200 font-medium"
                        >
                          {{ school }}
                        </span>
                      </template>
                      <span v-else class="text-[11px] italic text-slate-400">No schools assigned</span>
                    </div>
                  </td>
                  <td class="px-6 py-5 text-right">
                    <div class="flex justify-end gap-2 transition-all">
                      <button @click="editAssignment(assignment)" class="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors">
                        <span class="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button @click="deleteAssignment(assignment.user_id)" class="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors">
                        <span class="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
              
              <tr v-else-if="loading">
                <td colspan="5" class="py-20 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Records...</p>
                  </div>
                </td>
              </tr>

              <tr v-else>
                <td colspan="5" class="py-20 text-center opacity-40">
                  <span class="material-symbols-outlined text-4xl">domain_disabled</span>
                  <p class="font-bold uppercase text-xs tracking-widest mt-2">No records found</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Area -->
        <div class="p-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
          <p class="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            Showing {{ paginatedAssignments.length }} of {{ filteredAssignments.length }} entries
          </p>
          <div class="flex gap-1">
            <button 
              @click="currentPage > 1 ? currentPage-- : null"
              :disabled="currentPage === 1"
              class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-white transition-all disabled:opacity-30"
            >
              <span class="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <div class="flex items-center px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900">
              Page {{ currentPage }} of {{ totalPages || 1 }}
            </div>
            <button 
              @click="currentPage < totalPages ? currentPage++ : null"
              :disabled="currentPage === totalPages || totalPages === 0"
              class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-white transition-all disabled:opacity-30"
            >
              <span class="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Actions Secondary Grid -->
      <div class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-primary/[0.03] p-6 rounded-3xl border border-primary/5 flex items-center gap-6 group hover:translate-y-[-2px] transition-all">
          <div class="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span class="material-symbols-outlined text-2xl">batch_prediction</span>
          </div>
          <div>
            <h4 class="font-bold text-slate-900" style="font-family: 'Manrope', sans-serif;">Bulk Assignment</h4>
            <p class="text-xs text-slate-500 mt-1">Download CSV template to map multiple users to school clusters at once.</p>
            <button class="mt-3 text-primary text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
              Get Template <span class="material-symbols-outlined text-xs">download</span>
            </button>
          </div>
        </div>

        <div class="bg-slate-900/[0.03] p-6 rounded-3xl border border-slate-900/5 flex items-center gap-6 group hover:translate-y-[-2px] transition-all">
          <div class="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
            <span class="material-symbols-outlined text-2xl">policy</span>
          </div>
          <div>
            <h4 class="font-bold text-slate-900" style="font-family: 'Manrope', sans-serif;">Governance Logs</h4>
            <p class="text-xs text-slate-500 mt-1">Review historical changes to school access permissions and user role elevations.</p>
            <button class="mt-3 text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
              View Audit Trail <span class="material-symbols-outlined text-xs">history</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Overlay -->
    <div v-if="showAssignModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <!-- Assign New School Modal -->
      <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        <!-- Modal Header -->
        <div class="px-8 py-6 flex justify-between items-center border-b border-slate-100">
          <h2 class="text-xl font-extrabold text-slate-900 tracking-tight" style="font-family: 'Manrope', sans-serif;">Assign New School</h2>
          <button @click="showAssignModal = false" class="text-slate-400 hover:text-slate-600 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <!-- Modal Content -->
        <div class="px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <!-- SELECT USER -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Select User</label>
            <div class="relative">
              <select 
                v-model="assignmentForm.user_id" 
                :disabled="isEdit"
                class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">Search for staff member...</option>
                <option v-for="user in allUsers" :key="user.id" :value="user.id">{{ user.name }}</option>
              </select>
              <span class="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400">expand_more</span>
            </div>
          </div>

          <!-- ASSIGNED SCHOOLS -->
          <div class="space-y-3">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Assign Schools</label>
            <div class="min-h-[100px] w-full bg-slate-50 rounded-xl p-3 border border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all">
              <div class="flex flex-wrap gap-2 mb-2">
                <span v-for="sId in assignmentForm.school_ids" :key="sId" class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                  {{ allSchools.find(s => s.id === sId)?.name }}
                  <button @click="assignmentForm.school_ids = assignmentForm.school_ids.filter(id => id !== sId)" class="hover:text-red-500 transition-colors"><span class="material-symbols-outlined !text-sm">close</span></button>
                </span>
              </div>
              <select 
                @change="(e: any) => { if(e.target.value) { if(!assignmentForm.school_ids.includes(Number(e.target.value))) assignmentForm.school_ids.push(Number(e.target.value)); e.target.value = ''; } }"
                class="w-full bg-transparent border-none p-1 text-sm focus:ring-0 placeholder:text-slate-400"
              >
                <option value="">Type to add more schools...</option>
                <option v-for="school in allSchools" :key="school.id" :value="school.id">{{ school.name }}</option>
              </select>
            </div>
          </div>

          <!-- Role and Date Grid -->
          <div class="grid grid-cols-2 gap-4">
            <!-- ACCESS ROLE -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Access Role</label>
              <div class="relative">
                <select v-model="assignmentForm.role_id" class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary appearance-none cursor-pointer">
                  <option value="1">ADMINISTRATOR</option>
                  <option value="2">STAFF USER</option>
                  <option value="3">REGIONAL LEAD</option>
                </select>
                <span class="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400">expand_more</span>
              </div>
            </div>
            <!-- EFFECTIVE UNTIL -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Effective Until</label>
              <div class="relative">
                <input v-model="assignmentForm.effective_until" class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary appearance-none cursor-pointer" type="date"/>
                <span class="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400">calendar_today</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-8 py-6 bg-slate-50 flex justify-end gap-4">
          <button @click="showAssignModal = false" class="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
          <button @click="submitAssignment" class="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
            <span class="material-symbols-outlined !text-lg">check</span>
            Assign Schools
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-manrope {
  font-family: 'Manrope', sans-serif;
}
.font-inter {
  font-family: 'Inter', sans-serif;
}
</style>
