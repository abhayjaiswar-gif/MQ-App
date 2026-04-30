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
        <p class="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Total Assignments</p>
        <h3 class="text-5xl font-black">{{ records.length }}</h3>
      </div>
      <div class="bg-gradient-to-br from-red-500 to-rose-600 text-white p-6 rounded-[2rem]">
        <p class="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">🔒 Locked</p>
        <h3 class="text-5xl font-black">{{ lockedRecords.length }}</h3>
      </div>
      <div class="bg-gradient-to-br from-emerald-500 to-green-600 text-white p-6 rounded-[2rem]">
        <p class="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">🔓 Unlocked</p>
        <h3 class="text-5xl font-black">{{ unlockedRecords.length }}</h3>
      </div>
    </div>

    <!-- User List -->
    <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      <!-- Search bar -->
      <div class="p-6 border-b border-slate-100 flex items-center gap-4">
        <v-text-field
          v-model="search"
          placeholder="Search by user or school..."
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
              <th class="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Target School</th>
              <th class="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
              <th class="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Unlocked At</th>
              <th class="text-right px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="filteredRecords.length === 0">
              <td colspan="5" class="text-center py-16 text-slate-400 font-medium">No records found.</td>
            </tr>
            <tr v-for="rec in filteredRecords" :key="rec.user_id + '-' + rec.school_id" class="hover:bg-slate-50/60 transition-all">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
                    :class="rec.is_unlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-red-400'">
                    {{ rec.user_name[0] }}
                  </div>
                  <div>
                    <span class="font-bold text-slate-800 text-sm block leading-tight">{{ rec.user_name }}</span>
                    <span class="text-[10px] text-slate-400 uppercase font-bold">{{ rec.email }}</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-slate-300 text-sm">school</span>
                  <span class="text-sm font-semibold text-indigo-900">{{ rec.school_name }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span v-if="rec.is_unlocked"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Unlocked
                </span>
                <span v-else
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">
                  <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Locked
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                <template v-if="rec.is_unlocked && rec.unlocked_at">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-[10px] text-slate-400 font-semibold">{{ formatDateTime(rec.unlocked_at) }}</span>
                    <span :class="getExpiryClass(rec.unlocked_at)" class="text-[10px] font-black uppercase tracking-widest">
                      ⏱ {{ getExpiryText(rec.unlocked_at) }}
                    </span>
                  </div>
                </template>
                <span v-else class="text-slate-300">—</span>
              </td>
              <td class="px-6 py-4 text-right">
                <v-btn v-if="!rec.is_unlocked"
                  color="indigo" variant="flat" size="small" rounded="lg"
                  class="text-none font-bold" :loading="loadingId === rec.user_id + '-' + rec.school_id"
                  @click="unlockRecord(rec)">
                  <v-icon start size="16">mdi-lock-open</v-icon> Unlock School
                </v-btn>
                <v-btn v-else
                  color="red" variant="tonal" size="small" rounded="lg"
                  class="text-none font-bold" :loading="loadingId === rec.user_id + '-' + rec.school_id"
                  @click="relockRecord(rec)">
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
const records = ref<any[]>([]);
const ptmDate = ref<string | null>(null);
const search = ref('');
const filterTab = ref('all');
const loadingId = ref<string | null>(null);
const snackbar = ref({ show: false, message: '', color: 'success' });

const lockedRecords = computed(() => records.value.filter(r => !r.is_unlocked));
const unlockedRecords = computed(() => records.value.filter(r => r.is_unlocked));

const filteredRecords = computed(() => {
  let list = records.value;
  if (filterTab.value === 'locked') list = lockedRecords.value;
  if (filterTab.value === 'unlocked') list = unlockedRecords.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(r => 
      r.user_name.toLowerCase().includes(q) || 
      r.email.toLowerCase().includes(q) ||
      r.school_name.toLowerCase().includes(q)
    );
  }
  return list;
});

const lockWindowText = computed(() => {
  if (!ptmDate.value) return '';
  const ptm = new Date(ptmDate.value);
  const lockStart = new Date(ptm.getFullYear(), ptm.getMonth() - 1, 1);
  const lockEnd = new Date(ptm.getFullYear(), ptm.getMonth() + 1, 0); 
  return `${lockStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${lockEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
});

const formatMonth = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const nowTime = ref(new Date());

// Returns remaining time string like "11h 23m left" or "Expired"
const getExpiryText = (unlockedAt: string) => {
  const unlocked = new Date(unlockedAt);
  const expiresAt = new Date(unlocked.getTime() + 12 * 60 * 60 * 1000);
  const diffMs = expiresAt.getTime() - nowTime.value.getTime();
  if (diffMs <= 0) return 'Expired';
  const h = Math.floor(diffMs / (1000 * 60 * 60));
  const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${h}h ${m}m left`;
};

const getExpiryClass = (unlockedAt: string) => {
  const unlocked = new Date(unlockedAt);
  const expiresAt = new Date(unlocked.getTime() + 12 * 60 * 60 * 1000);
  const diffMs = expiresAt.getTime() - nowTime.value.getTime();
  if (diffMs <= 0) return 'text-red-400';
  if (diffMs < 2 * 60 * 60 * 1000) return 'text-orange-400'; // < 2h
  return 'text-emerald-500';
};

const fetchAll = async () => {
  try {
    const [ptmRes, lockRes] = await Promise.all([
      fetch('/api/latest-ptm-date'),
      fetch('/api/ptm-locks')
    ]);
    const ptmData = await ptmRes.json();
    const lockData = await lockRes.json();
    if (ptmData.success) ptmDate.value = ptmData.ptmDate;
    if (lockData.success) records.value = lockData.data;
  } catch (e) {
    console.error(e);
  }
};

const unlockRecord = async (rec: any) => {
  const id = `${rec.user_id}-${rec.school_id}`;
  loadingId.value = id;
  try {
    const adminId = authStore.user?.id || sessionStorage.getItem('id') || 0;
    const res = await fetch('/api/ptm-unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: rec.user_id, 
        school_id: rec.school_id,
        unlocked_by: adminId 
      })
    });
    const data = await res.json();
    if (data.success) {
      snackbar.value = { show: true, message: `✅ ${rec.school_name} unlocked for ${rec.user_name}!`, color: 'success' };
      await fetchAll(); // ← refresh from DB to ensure UI is in sync
    } else {
      snackbar.value = { show: true, message: data.message || 'Unlock failed', color: 'error' };
    }
  } catch (e) {
    snackbar.value = { show: true, message: 'Network error while unlocking', color: 'error' };
  } finally {
    loadingId.value = null;
  }
};

const relockRecord = async (rec: any) => {
  const id = `${rec.user_id}-${rec.school_id}`;
  loadingId.value = id;
  try {
    const res = await fetch('/api/ptm-relock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: rec.user_id,
        school_id: rec.school_id 
      })
    });
    const data = await res.json();
    if (data.success) {
      snackbar.value = { show: true, message: `🔒 ${rec.school_name} re-locked for ${rec.user_name}!`, color: 'warning' };
      await fetchAll(); // ← refresh from DB to ensure UI is in sync
    } else {
      snackbar.value = { show: true, message: data.message || 'Re-lock failed', color: 'error' };
    }
  } catch (e) {
    snackbar.value = { show: true, message: 'Network error while re-locking', color: 'error' };
  } finally {
    loadingId.value = null;
  }
};

onMounted(() => {
  fetchAll();

  // Update countdown clock every minute
  setInterval(() => {
    nowTime.value = new Date();
  }, 60 * 1000);

  // Auto-refresh table every minute so expired unlocks disappear
  setInterval(() => {
    fetchAll();
  }, 60 * 1000);
});
</script>
