<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';

interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  is_active: number;
  role_name: string;
  mq_id: string;
}

interface Stats {
  total_users: number;
  total_ssgm: number;
  total_head_coaches: number;
  total_coaches: number;
  total_ops: number;
  total_admins: number;
  pending_access: number;
}

const users = ref<User[]>([]);
const stats = ref<Stats>({
  total_users: 0,
  total_ssgm: 0,
  total_head_coaches: 0,
  total_coaches: 0,
  total_ops: 0,
  total_admins: 0,
  pending_access: 0
});
const loading = ref(true);
const searchQuery = ref('');
const roleFilter = ref('All Roles');
const statusFilter = ref('All Status');

// Pagination
const currentPage = ref(1);
const itemsPerPage = 10;

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/users-list');
    const data = await response.json();
    if (data.success) {
      users.value = data.users;
      stats.value = data.stats;
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchUsers);

// Reset pagination on filter change
watch([searchQuery, roleFilter, statusFilter], () => {
  currentPage.value = 1;
});

// Dynamic Roles extraction for filter dropdown
const uniqueRoles = computed(() => {
  const roles = new Set(users.value.map(u => u.role_name).filter(Boolean));
  return ['All Roles', ...Array.from(roles)];
});

// Add Role Modal Logic
const isRoleModalOpen = ref(false);
const newRoleName = ref('');
const newRoleStatus = ref('Active');
const submittingRole = ref(false);
const roleErrorMsg = ref('');
const roleSuccessMsg = ref('');

const submitRole = async () => {
  if (!newRoleName.value) return;
  submittingRole.value = true;
  roleErrorMsg.value = '';
  roleSuccessMsg.value = '';
  
  try {
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: newRoleName.value,
        status: newRoleStatus.value === 'Active' ? 1 : 0 
      })
    });
    const data = await res.json();
    if (data.success) {
      roleSuccessMsg.value = 'Role added successfully!';
      setTimeout(() => {
        isRoleModalOpen.value = false;
        newRoleName.value = '';
        newRoleStatus.value = 'Active';
        roleSuccessMsg.value = '';
      }, 1500);
    } else {
      roleErrorMsg.value = data.message;
    }
  } catch (err) {
    roleErrorMsg.value = 'Network error occurred.';
  } finally {
    submittingRole.value = false;
  }
};

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.mq_id.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesRole = roleFilter.value === 'All Roles' || user.role_name === roleFilter.value;

    const statusText = user.is_active === 1 ? 'Active' : 'Inactive';
    const matchesStatus = statusFilter.value === 'All Status' || statusText === statusFilter.value;

    return matchesSearch && matchesRole && matchesStatus;
  });
});

const totalItems = computed(() => filteredUsers.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage));

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredUsers.value.slice(start, end);
});

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getAvatarColor = (name: string) => {
  const colors = ['bg-blue-100 text-blue-700', 'bg-orange-100 text-orange-700', 'bg-purple-100 text-purple-700', 'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};
</script>

<template>
  <div class="min-h-screen bg-[#f9fafb] p-4 lg:p-2">
    <div class="max-w-9xl mx-auto">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <nav
            class="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 font-manrope">
            <span>Portal</span>
            <span class="material-symbols-outlined text-[14px]">chevron_right</span>
            <span class="text-primary font-bold">User Management</span>
          </nav>
          <h2 class="text-4xl font-extrabold text-[#1e293b] tracking-tight font-manrope">User Registry</h2>
          <p class="text-slate-500 mt-1 font-inter">Manage institutional access, roles, and administrative permissions
            for
            all academic staff.</p>
        </div>
        <div class="flex items-center gap-3">
          <button @click="isRoleModalOpen = true"
            class="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95">
            <span class="material-symbols-outlined">badge</span>
            <span>Add Role</span>
          </button>
          <button @click="$router.push('/management/users/create')"
            class="bg-[#005faa] hover:bg-[#004a88] text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-[#005faa]/20 active:scale-95">
            <span class="material-symbols-outlined">person_add</span>
            <span>Add New User</span>
          </button>
        </div>
      </div>

      <!-- Bento Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <!-- Total Users -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-slate-900 rounded-b-2xl opacity-80"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">
            Total Users
          </p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-[#1e293b] font-manrope">
              {{ loading ? '—' : stats.total_users.toLocaleString() }}
            </h3>
            <span
              class="text-slate-400 text-xs font-bold flex items-center bg-slate-50 px-2 py-1 rounded-lg font-inter">
              All roles
            </span>
          </div>
        </div>

        <!-- Total SSGM -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-[#005faa] rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">
            Total SSGM
          </p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-[#005faa] font-manrope">
              {{ loading ? '—' : stats.total_ssgm.toLocaleString() }}
            </h3>
            <span
              class="text-primary text-xs font-bold flex items-center bg-[#005faa]/5 px-2 py-1 rounded-lg font-inter">
              Lead
            </span>
          </div>
        </div>

        <!-- Head Coaches -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-indigo-500 rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">
            Head Coaches
          </p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-[#1e293b] font-manrope">
              {{ loading ? '—' : stats.total_head_coaches.toLocaleString() }}
            </h3>
            <span class="text-indigo-600 text-xs font-bold flex items-center bg-indigo-50 px-2 py-1 rounded-lg font-inter">
              Leaders
            </span>
          </div>
        </div>

        <!-- Total Coaches -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-blue-500 rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">
            Total Coaches
          </p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-[#1e293b] font-manrope">
              {{ loading ? '—' : stats.total_coaches.toLocaleString() }}
            </h3>
            <span class="text-blue-600 text-xs font-bold flex items-center bg-blue-50 px-2 py-1 rounded-lg font-inter">
              On-field
            </span>
          </div>
        </div>

        <!-- Admins & Ops -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-amber-500 rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">
            Admins & Ops
          </p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-[#1e293b] font-manrope">
              {{ loading ? '—' : (stats.total_ops + stats.total_admins).toLocaleString() }}
            </h3>
            <span
              class="text-amber-600 text-xs font-bold flex items-center bg-amber-50 px-2 py-1 rounded-lg font-inter">
              HQ Staff
            </span>
          </div>
        </div>
      </div>

      <!-- User Registry Table Card -->
      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-10">
        <!-- Enhanced Filters Bar -->
        <div class="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            <h2 class="font-bold text-lg text-slate-800 font-manrope whitespace-nowrap">User Registry</h2>
            <div class="relative w-full sm:w-64">
              <span
                class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input v-model="searchQuery" type="text" placeholder="Search by name or ID..."
                class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent focus:border-primary/20 focus:bg-white rounded-xl text-sm transition-all focus:ring-0 outline-none font-inter" />
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div class="relative flex-1 sm:flex-none sm:min-w-[160px]">
              <select v-model="roleFilter"
                class="w-full appearance-none bg-slate-50 px-4 py-2.5 pr-10 rounded-xl text-sm font-bold text-slate-600 border-none focus:ring-2 focus:ring-primary/20 cursor-pointer font-inter">
                <option v-for="role in uniqueRoles" :key="role" :value="role">{{ role }}</option>
              </select>
              <span
                class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
            </div>

            <div class="relative flex-1 sm:flex-none sm:min-w-[140px]">
              <select v-model="statusFilter"
                class="w-full appearance-none bg-slate-50 px-4 py-2.5 pr-10 rounded-xl text-sm font-bold text-slate-600 border-none focus:ring-2 focus:ring-primary/20 cursor-pointer font-inter">
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <span
                class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
            </div>

            <div class="flex items-center gap-2 sm:ml-2">
              <button
                class="flex-1 sm:flex-none p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-400 transition-all flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
              <button
                class="flex-1 sm:flex-none p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-400 transition-all flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">download</span>
              </button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-manrope w-16">
                  No.</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-manrope">ID /
                  Badge</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-manrope">Full
                  Name</th>
                <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-manrope">Access
                  Role</th>
                <th
                  class="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-manrope text-center">
                  Status</th>
                <th
                  class="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-manrope text-right">
                  Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <template v-if="!loading && paginatedUsers.length > 0">
                <tr v-for="(user, idx) in paginatedUsers" :key="user.id"
                  class="hover:bg-slate-50/30 transition-colors group">
                  <td class="px-6 py-4 text-xs font-bold text-slate-300 font-manrope">
                    {{ String((currentPage - 1) * itemsPerPage + idx + 1).padStart(2, '0') }}
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-xs font-extrabold text-[#005faa] font-manrope">{{ user.mq_id }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div
                        :class="['w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm font-manrope border border-white/20', getAvatarColor(user.name)]">
                        {{ getInitials(user.name) }}
                      </div>
                      <div class="flex flex-col">
                        <span class="text-sm font-bold text-slate-700 font-manrope leading-tight">{{ user.name }}</span>
                        <span class="text-[10px] text-slate-400 font-inter">{{ user.email }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase font-inter tracking-tight">
                      {{ user.role_name }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wide border"
                      :class="user.is_active === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'">
                      {{ user.is_active === 1 ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-1.5 transition-all">
                      <button @click="$router.push(`/management/users/edit/${user.id}`)"
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                        <span class="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>

              <!-- Loading State -->
              <tr v-else-if="loading">
                <td colspan="6" class="py-24 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-manrope">Syncing
                      Registry...</p>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-else>
                <td colspan="6" class="py-24 text-center">
                  <div class="flex flex-col items-center gap-2 opacity-30">
                    <span class="material-symbols-outlined text-[48px]">person_off</span>
                    <p class="font-bold uppercase text-[10px] tracking-widest font-manrope">No users found</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Enhanced Pagination Footer -->
        <div
          class="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider font-manrope order-2 sm:order-1">
            Displaying {{ paginatedUsers.length }} of {{ totalItems }} staff entries
          </p>
          <div class="flex items-center gap-1 order-1 sm:order-2">
            <button @click="currentPage > 1 && currentPage--" :disabled="currentPage === 1"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white transition-all disabled:opacity-30">
              <span class="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            <template v-for="p in totalPages" :key="p">
              <button v-if="Math.abs(p - currentPage) < 2 || p === 1 || p === totalPages" @click="currentPage = p"
                :class="['w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all font-manrope',
                  currentPage === p ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-400 hover:bg-white border border-transparent hover:border-slate-200']">
                {{ p }}
              </button>
              <span v-else-if="p === 2 || p === totalPages - 1" class="px-1 text-slate-300 text-xs">...</span>
            </template>

            <button @click="currentPage < totalPages && currentPage++" :disabled="currentPage === totalPages"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white transition-all disabled:opacity-30">
              <span class="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Premium Info Sections -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <!-- Automation Banner -->
        <div class="lg:col-span-2 relative bg-slate-900 rounded-[32px] p-8 overflow-hidden group">
          <div class="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          <div class="relative z-10">
            <span
              class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 border border-white/10 text-white/80 text-[10px] uppercase font-bold tracking-widest mb-4 font-manrope">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              New Feature
            </span>
            <h4 class="text-2xl font-extrabold text-white mb-3 font-manrope">Automate User Onboarding</h4>
            <p class="text-white/60 text-sm max-w-md mb-8 leading-relaxed font-inter font-medium italic">
              "System-wide bulk uploads are now active. Sync your directory with LDAP or CSV files seamlessly."
            </p>
            <button
              class="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-slate-100 flex items-center gap-2 group/btn">
              <span>Get Started</span>
              <span
                class="material-symbols-outlined text-[18px] group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
          <span
            class="material-symbols-outlined absolute -right-8 -bottom-8 text-[200px] text-white/5 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700">cloud_upload</span>
        </div>

        <!-- Security Audit -->
        <div
          class="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
          <div>
            <div class="flex items-center justify-between mb-6">
              <div class="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">
                <span class="material-symbols-outlined text-[24px]">security</span>
              </div>
              <div class="text-right">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Audit Score</p>
                <p class="text-lg font-extrabold text-emerald-500 font-manrope leading-none">98.4</p>
              </div>
            </div>
            <h5 class="font-bold text-slate-800 font-manrope mb-2">Governance Review</h5>
            <p class="text-xs text-slate-500 leading-relaxed font-inter mb-6">
              24 user profiles exhibit outdated compliance tokens. A system-wide re-validation is recommended for
              high-tier
              roles.
            </p>
          </div>
          <a href="#"
            class="inline-flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-widest font-manrope hover:translate-x-1 transition-transform group/link">
            Review Audit Trail
            <span class="material-symbols-outlined text-[14px]">history</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Add Role Modal -->
    <v-dialog v-model="isRoleModalOpen" max-width="480" persistent>
      <v-card class="rounded-[2rem] pa-8 bg-white border-0 shadow-2xl">
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold relative overflow-hidden">
                <span class="material-symbols-outlined text-[20px] relative z-10">badge</span>
             </div>
             <h3 class="text-2xl font-black text-slate-900 tracking-tight">Create Role</h3>
          </div>
          <v-btn icon variant="text" @click="isRoleModalOpen = false" color="slate-400" class="hover:text-slate-800">
            <span class="material-symbols-outlined">close</span>
          </v-btn>
        </div>
        
        <p class="text-slate-500 font-medium text-sm mb-6 leading-relaxed">Add a new functional role to the system. Once created, you can assign users to this new tier.</p>

        <v-form @submit.prevent="submitRole" class="space-y-6">
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Role Name</label>
            <v-text-field v-model="newRoleName" placeholder="e.g. Master Trainer" variant="outlined" density="comfortable" class="modern-input"></v-text-field>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Account Status</label>
            <v-select
              v-model="newRoleStatus"
              :items="['Active', 'Inactive']"
              variant="outlined"
              density="comfortable"
              class="modern-input"
            ></v-select>
          </div>
          
          <v-alert v-if="roleErrorMsg" type="error" variant="tonal" class="rounded-xl border border-red-200">
             <span class="text-xs font-bold">{{ roleErrorMsg }}</span>
          </v-alert>
          <v-alert v-if="roleSuccessMsg" type="success" variant="tonal" class="rounded-xl border border-emerald-200">
             <span class="text-xs font-bold">{{ roleSuccessMsg }}</span>
          </v-alert>
          
          <div class="pt-2">
             <v-btn type="submit" :loading="submittingRole" block size="x-large" color="primary" class="rounded-xl font-black text-[12px] h-[56px] shadow-[0_8px_20px_rgba(0,93,170,0.25)] hover:scale-[1.02] transition-transform lowercase-override tracking-widest">
               <span class="material-symbols-outlined mr-2">add_circle</span> SAVE ROLE
             </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.font-headline {
  font-family: 'Manrope', sans-serif;
}

.font-body {
  font-family: 'Inter', sans-serif;
}

.lowercase-override { text-transform: uppercase !important; }
.modern-input :deep(.v-field__outline) { border-radius: 16px !important; border-color: #f1f5f9 !important; }
.modern-input :deep(.v-field__input) { color: #1e293b !important; font-weight: 600 !important; font-size: 13px !important; }
</style>
