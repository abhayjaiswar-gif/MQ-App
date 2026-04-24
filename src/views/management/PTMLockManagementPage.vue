<template>
  <div class="px-4 py-2 mx-auto w-full max-w-7xl">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <span class="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-1 block">PTM Administration</span>
        <h2 class="text-3xl font-extrabold tracking-tighter text-slate-900">PTM Lock Manager</h2>
        <p class="text-sm text-slate-500 mt-1" v-if="ptmDate">
          Active PTM Period: <strong class="text-indigo-600">{{ formatMonth(ptmDate) }}</strong>
          &nbsp;·&nbsp; Lock window: <strong>{{ lockWindowText }}</strong>
        </p>
        <p class="text-sm text-orange-500 font-semibold mt-1" v-else>⚠️ No PTM date has been scheduled yet.</p>
      </div>
      <v-btn color="indigo" variant="flat" class="rounded-xl font-bold tracking-wide shadow-lg shadow-indigo-500/20 text-none" @click="fetchAll">
        <v-icon start>mdi-refresh</v-icon> Refresh
      </v-btn>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-[2rem]">
        <p class="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Total Users</p>
        <h3 class="text-5xl font-black">{{ users.length }}</h3>
      </div>
      <div class="bg-gradient-to-br from-red-500 to-rose-600 text-white p-6 rounded-[2rem]">
        <p class="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">🔒 Locked</p>
        <h3 class="text-5xl font-black">{{ lockedUsers.length }}</h3>
      </div>
      <div class="bg-gradient-to-br from-emerald-500 to-green-600 text-white p-6 rounded-[2rem]">
        <p class="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">🔓 Unlocked</p>
        <h3 class="text-5xl font-black">{{ unlockedUsers.length }}</h3>
      </div>
    </div>

    <!-- User List -->
    <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      <!-- Search bar -->
      <div class="p-6 border-b border-slate-100 flex items-center gap-4">
        <v-text-field
          v-model="search"
          placeholder="Search users..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          class="max-w-sm"
          bg-color="white"
        />
        <v-chip-group v-model="filterTab" mandatory>
          <v-chip value="all" color="indigo" variant="tonal">All</v-chip>
          <v-chip value="locked" color="red" variant="tonal">Locked</v-chip>
          <v-chip value="unlocked" color="green" variant="tonal">Unlocked</v-chip>
        </v-chip-group>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50/50">
              <th class="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">User</th>
              <th class="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Email</th>
              <th class="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
              <th class="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Unlocked At</th>
              <th class="text-right px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="filteredUsers.length === 0">
              <td colspan="5" class="text-center py-16 text-slate-400 font-medium">No users found.</td>
            </tr>
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-slate-50/60 transition-all">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
                    :class="user.is_unlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-red-400'">
                    {{ user.name[0] }}
                  </div>
                  <span class="font-bold text-slate-800 text-sm">{{ user.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-500">{{ user.email }}</td>
              <td class="px-6 py-4">
                <span v-if="user.is_unlocked"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Unlocked
                </span>
                <span v-else
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">
                  <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Locked
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-slate-400">
                {{ user.unlocked_at ? formatDateTime(user.unlocked_at) : '—' }}
              </td>
              <td class="px-6 py-4 text-right">
                <v-btn v-if="!user.is_unlocked"
                  color="indigo" variant="flat" size="small" rounded="lg"
                  class="text-none font-bold" :loading="loadingUserId === user.id"
                  @click="unlockUser(user)">
                  <v-icon start size="16">mdi-lock-open</v-icon> Unlock
                </v-btn>
                <v-btn v-else
                  color="red" variant="tonal" size="small" rounded="lg"
                  class="text-none font-bold" :loading="loadingUserId === user.id"
                  @click="relockUser(user)">
                  <v-icon start size="16">mdi-lock</v-icon> Re-Lock
                </v-btn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="xl" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const users = ref<any[]>([]);
const ptmDate = ref<string | null>(null);
const search = ref('');
const filterTab = ref('all');
const loadingUserId = ref<number | null>(null);
const snackbar = ref({ show: false, message: '', color: 'success' });

const lockedUsers = computed(() => users.value.filter(u => !u.is_unlocked));
const unlockedUsers = computed(() => users.value.filter(u => u.is_unlocked));

const filteredUsers = computed(() => {
  let list = users.value;
  if (filterTab.value === 'locked') list = lockedUsers.value;
  if (filterTab.value === 'unlocked') list = unlockedUsers.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  return list;
});

const lockWindowText = computed(() => {
  if (!ptmDate.value) return '';
  const ptm = new Date(ptmDate.value);
  const lockStart = new Date(ptm.getFullYear(), ptm.getMonth() - 1, 1);
  const lockEnd = new Date(ptm.getFullYear(), ptm.getMonth() + 1, 0); // last day of PTM month
  return `${lockStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${lockEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
});

const formatMonth = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const fetchAll = async () => {
  try {
    const [ptmRes, usersRes] = await Promise.all([
      fetch('/api/latest-ptm-date'),
      fetch('/api/ptm-locks')
    ]);
    const ptmData = await ptmRes.json();
    const usersData = await usersRes.json();
    if (ptmData.success) ptmDate.value = ptmData.ptmDate;
    if (usersData.success) users.value = usersData.data;
  } catch (e) {
    console.error(e);
  }
};

const unlockUser = async (user: any) => {
  loadingUserId.value = user.id;
  try {
    const adminId = authStore.user?.id || sessionStorage.getItem('id');
    const res = await fetch('/api/ptm-unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, unlocked_by: adminId })
    });
    const data = await res.json();
    if (data.success) {
      user.is_unlocked = 1;
      user.unlocked_at = new Date().toISOString();
      snackbar.value = { show: true, message: `✅ ${user.name} has been unlocked!`, color: 'success' };
    }
  } catch (e) {
    snackbar.value = { show: true, message: 'Error unlocking user', color: 'error' };
  } finally {
    loadingUserId.value = null;
  }
};

const relockUser = async (user: any) => {
  loadingUserId.value = user.id;
  try {
    const res = await fetch('/api/ptm-relock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id })
    });
    const data = await res.json();
    if (data.success) {
      user.is_unlocked = 0;
      user.unlocked_at = null;
      snackbar.value = { show: true, message: `🔒 ${user.name} has been re-locked!`, color: 'warning' };
    }
  } catch (e) {
    snackbar.value = { show: true, message: 'Error re-locking user', color: 'error' };
  } finally {
    loadingUserId.value = null;
  }
};

onMounted(fetchAll);
</script>
