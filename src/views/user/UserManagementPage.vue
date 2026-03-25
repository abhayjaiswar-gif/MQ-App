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
  active_admins: number;
  system_coaches: number;
  pending_access: number;
}

const users = ref<User[]>([]);
const stats = ref<Stats>({
  total_users: 0,
  active_admins: 0,
  system_coaches: 0,
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
    const response = await fetch('http://localhost:3000/api/users-list');
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
  <div class="p-8 space-y-8 max-w-[1600px] w-full mx-auto min-h-screen font-body">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight mb-1 font-headline">User Management</h2>
        <p class="text-slate-500 font-medium text-sm">Manage institutional access, roles, and administrative permissions.</p>
      </div>
      <button
        @click="$router.push('/management/users/create')"
        class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-95 active:duration-100 transition-all text-sm self-start md:self-center"
      >
        <span class="material-symbols-outlined text-[20px]">person_add</span>
        <span>Add New User</span>
      </button>
    </div>

    <!-- Dashboard Modules -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,28,58,0.04)] border border-slate-100">
        <p class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Users</p>
        <div class="flex items-baseline gap-2">
          <h3 class="text-3xl font-extrabold text-slate-900 font-headline">{{ stats.total_users.toLocaleString() }}</h3>
          <span class="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">+12%</span>
        </div>
      </div>
      <div class="bg-white p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,28,58,0.04)] border border-slate-100">
        <p class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Active Admins</p>
        <div class="flex items-baseline gap-2">
          <h3 class="text-3xl font-extrabold text-slate-900 font-headline">{{ stats.active_admins }}</h3>
          <span class="text-xs font-bold text-slate-400">Stable</span>
        </div>
      </div>
      <div class="bg-white p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,28,58,0.04)] border border-slate-100">
        <p class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">System Coaches</p>
        <div class="flex items-baseline gap-2">
          <h3 class="text-3xl font-extrabold text-slate-900 font-headline">{{ stats.system_coaches }}</h3>
          <span class="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Active</span>
        </div>
      </div>
      <div class="bg-white p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,28,58,0.04)] border border-slate-100">
        <p class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Pending Access</p>
        <div class="flex items-baseline gap-2">
          <h3 class="text-3xl font-extrabold text-slate-900 font-headline">{{ stats.pending_access }}</h3>
          <span class="text-xs font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Action Req</span>
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,28,58,0.06)] overflow-hidden border border-slate-100">
      <!-- Filters Bar -->
      <div class="p-6 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="relative group min-w-[240px]">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-primary transition-colors">search</span>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search by name, email or ID..." 
              class="pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-full transition-all"
            />
          </div>
          <div class="relative">
            <select
              v-model="roleFilter"
              class="appearance-none bg-slate-50 px-4 py-2.5 pr-10 rounded-xl text-sm font-semibold text-slate-600 border-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option>All Roles</option>
              <option>Administrator</option>
              <option>Admin</option>
              <option>Operations Head</option>
              <option>SSGM</option>
              <option>Head Coach</option>
              <option>Coach</option>
              <option>HR</option>
            </select>
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
          </div>
          <div class="relative">
            <select
              v-model="statusFilter"
              class="appearance-none bg-slate-50 px-4 py-2.5 pr-10 rounded-xl text-sm font-semibold text-slate-600 border-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
            <span class="material-symbols-outlined">filter_list</span>
          </button>
          <button class="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
            <span class="material-symbols-outlined">download</span>
          </button>
        </div>
      </div>

      <!-- High Density Data Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-50">
              <th class="px-6 py-5">SR NO.</th>
              <th class="px-6 py-5">MQ ID</th>
              <th class="px-6 py-5">FULL NAME</th>
              <th class="px-6 py-5">ROLE</th>
              <th class="px-6 py-5">EMAIL ID</th>
              <th class="px-6 py-5">MOBILE NUMBER</th>
              <th class="px-6 py-5 text-center">STATUS</th>
              <th class="px-6 py-5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="loading" v-for="i in 5" :key="i" class="animate-pulse">
              <td colspan="8" class="px-6 py-5"><div class="h-4 bg-slate-100 rounded-full w-full"></div></td>
            </tr>
            <tr 
              v-else
              v-for="(user, idx) in paginatedUsers" 
              :key="user.id" 
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <td class="px-6 py-5 text-sm font-medium text-slate-400">
                {{ String((currentPage - 1) * itemsPerPage + idx + 1).padStart(2, '0') }}
              </td>
              <td class="px-6 py-5 text-sm font-bold text-primary">
                {{ user.mq_id }}
              </td>
              <td class="px-6 py-5">
                <div class="flex items-center gap-3">
                  <div :class="['w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm', getAvatarColor(user.name)]">
                    {{ getInitials(user.name) }}
                  </div>
                  <span class="text-sm font-bold text-slate-900">{{ user.name }}</span>
                </div>
              </td>
              <td class="px-6 py-5">
                <span class="text-sm font-semibold text-slate-600 px-3 py-1 bg-slate-100 rounded-lg">{{ user.role_name }}</span>
              </td>
              <td class="px-6 py-5 text-sm text-slate-500 font-medium">{{ user.email }}</td>
              <td class="px-6 py-5 text-sm text-slate-500 font-medium">{{ user.mobile || 'N/A' }}</td>
              <td class="px-6 py-5 text-center">
                <span 
                  class="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border"
                  :class="user.is_active === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'"
                >
                  {{ user.is_active === 1 ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-5 text-right">
                <div class="flex justify-end gap-2 transition-all">
                  <button 
                    @click="$router.push(`/management/users/edit/${user.id}`)"
                    class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-primary/10 text-primary transition-all"
                  >
                    <span class="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-rose-50 text-rose-500 transition-all">
                    <span class="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && paginatedUsers.length === 0">
              <td colspan="8" class="px-6 py-12 text-center text-slate-400 font-medium">
                No users found matching your criteria.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="p-6 bg-slate-50/30 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Showing {{ Math.min((currentPage - 1) * itemsPerPage + 1, totalItems) }} to {{ Math.min(currentPage * itemsPerPage, totalItems) }} of {{ totalItems }} entries
        </p>
        <div class="flex items-center gap-1">
          <button 
            @click="currentPage > 1 && currentPage--"
            :disabled="currentPage === 1"
            class="p-2 rounded-xl hover:bg-white hover:shadow-sm text-slate-400 transition-all disabled:opacity-30"
          >
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          
          <template v-for="p in totalPages" :key="p">
            <button 
              v-if="Math.abs(p - currentPage) < 3 || p === 1 || p === totalPages"
              @click="currentPage = p"
              :class="[
                'w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all',
                currentPage === p ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-white hover:shadow-sm text-slate-400'
              ]"
            >
              {{ p }}
            </button>
            <span v-else-if="p === 2 || p === totalPages - 1" class="px-1 text-slate-300">...</span>
          </template>

          <button 
            @click="currentPage < totalPages && currentPage++"
            :disabled="currentPage === totalPages"
            class="p-2 rounded-xl hover:bg-white hover:shadow-sm text-slate-400 transition-all disabled:opacity-30"
          >
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Info Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
      <div class="lg:col-span-2 bg-gradient-to-br from-primary to-[#004a88] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-primary/10">
        <div class="relative z-10">
          <h4 class="text-xl font-bold mb-2 font-headline">Automate User Onboarding</h4>
          <p class="text-white/80 text-sm max-w-md mb-6 leading-relaxed">System-wide bulk uploads are now available. Easily sync your user database with LDAP or CSV files to save manual entry time.</p>
          <button class="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md px-6 py-2.5 rounded-xl font-bold text-sm transition-all">
            Learn more about bulk imports
          </button>
        </div>
        <span class="material-symbols-outlined absolute -right-6 -bottom-6 text-[180px] text-white/5 rotate-12 pointer-events-none">cloud_upload</span>
      </div>
      <div class="bg-white p-6 rounded-3xl flex flex-col justify-center border border-slate-100 shadow-[0_8px_32px_rgba(0,28,58,0.04)]">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center">
            <span class="material-symbols-outlined text-primary">security</span>
          </div>
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wide">Security Audit</p>
            <p class="text-sm font-bold text-slate-900">98% Protected</p>
          </div>
        </div>
        <p class="text-xs text-slate-500 leading-relaxed mb-4">24 users have not updated their passwords in 90+ days. It is recommended to trigger a force-reset for these accounts.</p>
        <a class="text-primary text-xs font-bold hover:underline flex items-center gap-1" href="#">
          View Audit Log
          <span class="material-symbols-outlined text-xs">arrow_forward</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-headline { font-family: 'Manrope', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }
</style>
