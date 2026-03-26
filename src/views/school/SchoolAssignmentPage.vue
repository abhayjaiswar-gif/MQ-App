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
  total_users: number;
}

const assignments = ref<Assignment[]>([]);
const stats = ref<Stats>({
  total_assignments: 0,
  active_institutions: 0,
  pending_requests: 0,
  total_users: 0
});
const loading = ref(true);
const searchQuery = ref('');
const showAssignModal = ref(false);
const isEdit = ref(false);
const allUsers = ref<{ id: number, name: string }[]>([]);
const allSchools = ref<{ id: number, name: string }[]>([]);

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
  <div class="min-h-screen bg-[#f9fafb] p-4 lg:p-3">
    <div class="max-w-9xl mx-auto">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <nav
            class="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 font-manrope">
            <span>Portal</span>
            <span class="material-symbols-outlined text-[14px]">chevron_right</span>
            <span class="text-primary">Assignments</span>
          </nav>
          <h2 class="text-4xl font-extrabold text-[#1e293b] tracking-tight font-manrope">School Assignments</h2>
          <p class="text-slate-500 mt-1 font-inter">Manage and oversee institutional access for academic staff and
            administrators.</p>
        </div>
        <button @click="openAddModal"
          class="bg-[#005faa] hover:bg-[#004a88] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-[#005faa]/20 active:scale-95">
          <span class="material-symbols-outlined">add</span>
          <span>Assign School</span>
        </button>
      </div>

      <!-- Bento Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <!-- Total Staff Pool -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-slate-900 rounded-b-2xl op-80"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">
            Total Staff Pool
          </p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-[#1e293b] font-manrope">
              {{ loading ? '—' : stats.total_users.toLocaleString() }}
            </h3>
            <span
              class="text-slate-400 text-xs font-bold flex items-center bg-slate-50 px-2 py-1 rounded-lg font-inter">
              Registered
            </span>
          </div>
        </div>

        <!-- Total Assignments -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-[#005faa] rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">
            Total Assignments
          </p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-[#005faa] font-manrope">
              {{ loading ? '—' : stats.total_assignments.toLocaleString() }}
            </h3>
            <span
              class="text-primary text-xs font-bold flex items-center bg-[#005faa]/5 px-2 py-1 rounded-lg font-inter">
              Allocated
            </span>
          </div>
        </div>

        <!-- Active Institutions -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-emerald-500 rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">
            Active Institutions
          </p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-[#1e293b] font-manrope">
              {{ loading ? '—' : stats.active_institutions }}
            </h3>
            <span
              class="text-emerald-600 text-xs font-bold flex items-center bg-emerald-50 px-2 py-1 rounded-lg font-inter">
              Active
            </span>
          </div>
        </div>

        <!-- Pending Requests -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-orange-500 rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">
            Needs Review
          </p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-orange-600 font-manrope">
              {{ loading ? '—' : stats.pending_requests }}
            </h3>
            <span
              class="text-orange-600 text-xs font-bold flex items-center bg-orange-50 px-2 py-1 rounded-lg font-inter">
              Pending
            </span>
          </div>
        </div>
      </div>

      <!-- Allocation Registry Table -->
      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-10">
        <div
          class="p-6 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <h2 class="font-bold text-lg text-slate-800 font-manrope">Allocation Registry</h2>
            <div class="relative w-full sm:w-64">
              <span
                class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input v-model="searchQuery" type="text" placeholder="Search staff or schools..."
                class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-xl text-sm transition-all focus:ring-0 outline-none font-inter" />
            </div>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button
              class="flex-1 sm:flex-none p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-500 transition-all flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
            <button
              class="flex-1 sm:flex-none p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-500 transition-all flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">download</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-manrope w-16">
                  No.</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-manrope">User
                  Details</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-manrope">Access
                  Role</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-manrope">
                  Assigned Schools</th>
                <th
                  class="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-manrope text-right">
                  Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <template v-if="!loading && paginatedAssignments.length > 0">
                <tr v-for="(assignment, idx) in paginatedAssignments" :key="assignment.user_id"
                  class="hover:bg-slate-50/30 transition-colors group">
                  <td class="px-6 py-4 text-xs font-bold text-slate-300 font-manrope">
                    {{ (idx + 1 + (currentPage - 1) * itemsPerPage).toString().padStart(2, '0') }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary text-xs font-bold border border-primary/10 font-manrope">
                        {{ getInitials(assignment.user_name) }}
                      </div>
                      <div class="flex flex-col">
                        <span class="text-sm font-bold text-slate-700 font-manrope">{{ assignment.user_name }}</span>
                        <span class="text-[11px] text-slate-400 font-inter">{{ assignment.email }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#eff6ff] text-[#1e40af] border border-[#dbeafe] uppercase font-inter tracking-tight">
                      {{ assignment.role_name }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-1.5 max-w-xs xl:max-w-md">
                      <template v-if="assignment.assigned_schools">
                        <span v-for="school in assignment.assigned_schools.split(', ')" :key="school"
                          class="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-medium font-inter">
                          {{ school }}
                        </span>
                      </template>
                      <span v-else class="text-[11px] italic text-slate-400 font-inter">No schools assigned</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button @click="editAssignment(assignment)"
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                        <span class="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button @click="deleteAssignment(assignment.user_id)"
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>

              <!-- Loading State -->
              <tr v-else-if="loading">
                <td colspan="5" class="py-24 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-manrope">Syncing
                      Registry...</p>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-else>
                <td colspan="5" class="py-24 text-center">
                  <div class="flex flex-col items-center gap-2 opacity-30">
                    <span class="material-symbols-outlined text-[48px]">domain_disabled</span>
                    <p class="font-bold uppercase text-[10px] tracking-widest font-manrope">No active allocations</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          class="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider font-manrope order-2 sm:order-1">
            Displaying {{ paginatedAssignments.length }} of {{ filteredAssignments.length }} staff entries
          </p>
          <div class="flex items-center gap-2 order-1 sm:order-2">
            <button @click="currentPage > 1 ? currentPage-- : null" :disabled="currentPage === 1"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white transition-all disabled:opacity-30">
              <span class="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <div
              class="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 font-manrope shadow-sm">
              {{ currentPage }} / {{ totalPages || 1 }}
            </div>
            <button @click="currentPage < totalPages ? currentPage++ : null"
              :disabled="currentPage === totalPages || totalPages === 0"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white transition-all disabled:opacity-30">
              <span class="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div
          class="bg-gradient-to-br from-[#005faa]/[0.02] to-transparent p-6 rounded-3xl border border-[#005faa]/5 flex items-center gap-6 group hover:translate-y-[-2px] transition-all">
          <div
            class="w-14 h-14 bg-[#005faa] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#005faa]/20 group-hover:scale-105 transition-transform">
            <span class="material-symbols-outlined text-[28px]">batch_prediction</span>
          </div>
          <div>
            <h4 class="font-bold text-[#1e293b] font-manrope">Bulk Assignment</h4>
            <p class="text-xs text-slate-500 mt-1 font-inter">Download CSV template to map multiple users to school
              clusters
              at once.</p>
            <button
              class="mt-3 text-[#005faa] text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1 font-manrope">
              Get Template <span class="material-symbols-outlined text-[14px]">download</span>
            </button>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-slate-900/[0.02] to-transparent p-6 rounded-3xl border border-slate-900/5 flex items-center gap-6 group hover:translate-y-[-2px] transition-all">
          <div
            class="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-900/10 group-hover:scale-105 transition-transform">
            <span class="material-symbols-outlined text-[28px]">policy</span>
          </div>
          <div>
            <h4 class="font-bold text-[#1e293b] font-manrope">Governance Logs</h4>
            <p class="text-xs text-slate-500 mt-1 font-inter">Review historical changes to school access permissions and
              user
              role elevations.</p>
            <button
              class="mt-3 text-slate-700 text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1 font-manrope">
              View Audit Trail <span class="material-symbols-outlined text-[14px]">history</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Overlay -->
    <div v-if="showAssignModal"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <!-- Assign New School Modal -->
      <div
        class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        <!-- Modal Header -->
        <div class="px-8 py-6 flex justify-between items-center border-b border-slate-100">
          <h2 class="text-xl font-extrabold text-slate-900 tracking-tight" style="font-family: 'Manrope', sans-serif;">
            Assign New School</h2>
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
              <select v-model="assignmentForm.user_id" :disabled="isEdit"
                class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                <option value="">Search for staff member...</option>
                <option v-for="user in allUsers" :key="user.id" :value="user.id">{{ user.name }}</option>
              </select>
              <span
                class="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400">expand_more</span>
            </div>
          </div>

          <!-- ASSIGNED SCHOOLS -->
          <div class="space-y-3">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Assign Schools</label>
            <div
              class="min-h-[100px] w-full bg-slate-50 rounded-xl p-3 border border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all">
              <div class="flex flex-wrap gap-2 mb-2">
                <span v-for="sId in assignmentForm.school_ids" :key="sId"
                  class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                  {{allSchools.find(s => s.id === sId)?.name}}
                  <button @click="assignmentForm.school_ids = assignmentForm.school_ids.filter(id => id !== sId)"
                    class="hover:text-red-500 transition-colors"><span
                      class="material-symbols-outlined !text-sm">close</span></button>
                </span>
              </div>
              <select
                @change="(e: any) => { if (e.target.value) { if (!assignmentForm.school_ids.includes(Number(e.target.value))) assignmentForm.school_ids.push(Number(e.target.value)); e.target.value = ''; } }"
                class="w-full bg-transparent border-none p-1 text-sm focus:ring-0 placeholder:text-slate-400">
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
                <select v-model="assignmentForm.role_id"
                  class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary appearance-none cursor-pointer">
                  <option value="1">ADMINISTRATOR</option>
                  <option value="2">STAFF USER</option>
                  <option value="3">REGIONAL LEAD</option>
                </select>
                <span
                  class="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400">expand_more</span>
              </div>
            </div>
            <!-- EFFECTIVE UNTIL -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Effective Until</label>
              <div class="relative">
                <input v-model="assignmentForm.effective_until"
                  class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                  type="date" />
                <span
                  class="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400">calendar_today</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-8 py-6 bg-slate-50 flex justify-end gap-4">
          <button @click="showAssignModal = false"
            class="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
          <button @click="submitAssignment"
            class="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
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
