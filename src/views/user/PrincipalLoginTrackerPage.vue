<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const loading = ref(false);
const principals = ref<any[]>([]);

const fetchPrincipals = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/management/principal-logins');
    if (res.data.success) {
      principals.value = res.data.principals;
    }
  } catch (err) {
    console.error('Fetch Principal Logins Error:', err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'Never Logged In';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Never Logged In';

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleString('en-US', options);
};

const checkIsToday = (dateString: string) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

onMounted(() => {
  fetchPrincipals();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-10 px-4 font-sans">
    <div class="max-w-7xl mx-auto">
      <header class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-widest text-[#005daa] mb-2">User Management</p>
          <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Principal Login Tracker</h1>
          <p class="text-slate-500 font-medium mt-1">Monitor which School Principals are actively logging into the
            platform.</p>
        </div>
      </header>

      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div v-if="loading" class="p-20 flex flex-col items-center justify-center gap-4">
          <span class="material-symbols-outlined animate-spin text-4xl text-[#005daa]">refresh</span>
          <p class="text-sm font-bold text-slate-400">Loading Principal activity...</p>
        </div>

        <div v-else-if="principals.length === 0"
          class="p-20 flex flex-col items-center justify-center gap-4 text-center">
          <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
            <span class="material-symbols-outlined text-4xl text-slate-300">school</span>
          </div>
          <h3 class="text-lg font-bold text-slate-700">No Principals Found</h3>
          <p class="text-sm font-medium text-slate-400 max-w-sm">No active users with the Principal role were found in
            the system.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-100">
                <th class="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Principal Name
                </th>
                <th class="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Assigned School
                </th>
                <th class="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Last Login Date
                </th>
                <th class="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Days
                  Inactive</th>
                <th class="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Status
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="user in principals" :key="user.id" class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-full bg-slate-100 text-[#005daa] font-bold flex items-center justify-center shadow-sm">
                      {{ user.name?.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-800">{{ user.name }}</p>
                      <p class="text-[10px] font-bold text-slate-400 mt-0.5">{{ user.email || user.mobile || 'N/A' }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm font-bold text-slate-700">{{ user.school_name || 'No School Assigned' }}</p>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm font-semibold text-slate-600">{{ formatDate(user.last_login) }}</p>
                </td>
                <td class="px-6 py-4 text-center">
                  <span :class="[
                    'text-lg font-black',
                    user.days_inactive > 7 ? 'text-red-500' : 'text-slate-600'
                  ]">
                    {{ user.days_inactive }}
                  </span>
                  <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Days</p>
                </td>
                <td class="px-6 py-4 text-center">
                  <span v-if="checkIsToday(user.last_login)"
                    class="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-widest rounded-full">
                    Active Today
                  </span>
                  <span v-else-if="user.days_inactive <= 7"
                    class="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest rounded-full border border-blue-100">
                    Recent
                  </span>
                  <span v-else
                    class="px-3 py-1 bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest rounded-full border border-red-100">
                    Inactive
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
