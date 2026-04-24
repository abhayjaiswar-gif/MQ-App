<template>
  <div class="px-4 py-2 mx-auto w-full max-w-7xl">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <span class="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-1 block">System Monitoring</span>
        <h2 class="text-3xl font-extrabold tracking-tighter text-slate-900">Subordinate Activity</h2>
      </div>
      <div class="flex gap-3">
        <v-btn color="indigo" variant="flat"
          class="rounded-xl font-bold tracking-wide shadow-lg shadow-indigo-500/20 text-none" @click="fetchStats">
          <v-icon start>mdi-refresh</v-icon> Refresh
        </v-btn>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
      <!-- Logged In Card -->
      <div class="relative group h-full">
        <div
          class="absolute -top-4 -left-4 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl group-hover:bg-indigo-600/20 transition-all">
        </div>
        <div
          class="bg-white p-8 rounded-[2rem] shadow-sm bg-gradient-to-br from-indigo-600 to-indigo-500 text-white relative overflow-hidden h-full min-h-[160px]">
          <div class="relative z-10 flex flex-col justify-between h-full">
            <span class="text-xs font-bold uppercase tracking-[0.1em] opacity-80">Engagement Focus</span>
            <div class="mt-4">
              <h3 class="text-6xl font-black mb-1">{{ stats.loggedIn.length }}</h3>
              <p class="text-lg font-medium opacity-90">Logged In Today</p>
            </div>
          </div>
          <div class="absolute -right-6 -bottom-6 opacity-10">
            <span class="material-symbols-outlined text-[12rem]"
              style="font-variation-settings: 'FILL' 1;">check_circle</span>
          </div>
        </div>
      </div>

      <!-- Not Logged In Card -->
      <div class="h-full">
        <div
          class="bg-indigo-50/50 p-8 rounded-[2rem] shadow-sm h-full flex flex-col justify-between border-l-8 border-orange-600 min-h-[160px]">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-xs font-bold uppercase tracking-[0.1em] text-orange-700 mb-2 block">Attention
                Required</span>
              <h3 class="text-6xl font-black text-slate-900 tracking-tighter">{{ stats.notLoggedIn.length }}</h3>
            </div>
            <span class="material-symbols-outlined text-orange-600 text-4xl"
              style="font-variation-settings: 'FILL' 1;">warning</span>
          </div>
          <p class="text-lg font-medium text-slate-600 mt-4">Not Logged In Yet</p>
        </div>
      </div>
    </div>

    <!-- Active Personnel List -->
    <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
      <v-tabs v-model="tab" color="indigo" class="mb-8 border-b border-slate-100">
        <v-tab value="active" class="text-sm font-bold uppercase tracking-widest">
          Logged In ({{ stats.loggedIn.length }})
        </v-tab>
        <v-tab value="inactive" class="text-sm font-bold uppercase tracking-widest">
          Pending ({{ stats.notLoggedIn.length }})
        </v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="active">
          <div v-if="stats.loggedIn.length === 0" class="text-center py-16">
            <span class="material-symbols-outlined text-6xl text-slate-300 mb-4">person_off</span>
            <p class="text-slate-500 font-medium text-lg">No active logins recorded today.</p>
          </div>
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div v-for="user in stats.loggedIn" :key="user.id"
              class="flex items-center gap-6 p-6 rounded-[1.5rem] bg-white border border-indigo-50 shadow-sm hover:shadow-md transition-all group">
              <div
                class="w-16 h-16 rounded-full ring-4 ring-indigo-100 overflow-hidden flex-shrink-0 bg-indigo-50 flex items-center justify-center">
                <img v-if="user.profile_pic" :src="'/uploads/' + user.profile_pic" class="w-full h-full object-cover" />
                <span v-else class="text-indigo-600 font-black text-2xl">{{ user.name[0] }}</span>
              </div>
              <div class="flex-grow min-w-0">
                <h5 class="text-lg font-bold text-slate-900 truncate">{{ user.name }}</h5>
                <p class="text-sm text-slate-500 truncate">{{ user.email }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Time</p>
                <p class="text-sm font-medium text-slate-900">{{ formatTime(user.last_login) }}</p>
              </div>
              <div class="flex items-center gap-2 bg-indigo-100/50 px-4 py-2 rounded-full whitespace-nowrap ml-2">
                <span class="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                <span class="text-xs font-bold text-indigo-700">Active</span>
              </div>
            </div>
          </div>
        </v-window-item>

        <v-window-item value="inactive">
          <div v-if="stats.notLoggedIn.length === 0" class="text-center py-16">
            <span class="material-symbols-outlined text-6xl text-emerald-300 mb-4">task_alt</span>
            <p class="text-slate-500 font-medium text-lg">All users have logged in today!</p>
          </div>
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div v-for="user in stats.notLoggedIn" :key="user.id"
              class="flex items-center gap-6 p-6 rounded-[1.5rem] bg-slate-50 border border-slate-100 transition-all group grayscale opacity-80 hover:grayscale-0 hover:opacity-100">
              <div
                class="w-16 h-16 rounded-full ring-4 ring-slate-200 overflow-hidden flex-shrink-0 bg-white flex items-center justify-center">
                <img v-if="user.profile_pic" :src="'/uploads/' + user.profile_pic" class="w-full h-full object-cover" />
                <span v-else class="text-slate-400 font-black text-2xl">{{ user.name[0] }}</span>
              </div>
              <div class="flex-grow min-w-0">
                <h5 class="text-lg font-bold text-slate-700 truncate">{{ user.name }}</h5>
                <p class="text-sm text-slate-500 truncate">{{ user.email }}</p>
              </div>
              <div class="flex items-center gap-2 bg-slate-200 px-4 py-2 rounded-full whitespace-nowrap ml-2">
                <span class="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                <span class="text-xs font-bold text-slate-600">Pending</span>
              </div>
            </div>
          </div>
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const tab = ref('active');
const stats = ref({
  loggedIn: [] as any[],
  notLoggedIn: [] as any[]
});

const formatTime = (dateStr: string) => {
  if (!dateStr) return '--:--';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const fetchStats = async () => {
  try {
    const userId = authStore.user?.id || sessionStorage.getItem('id');
    const res = await fetch(`/api/assigned-users/login-status?user_id=${userId}`);
    const data = await res.json();
    if (data.success) {
      stats.value = data.data;
    }
  } catch (err) {
    console.error('Fetch Assigned Login Stats Error:', err);
  }
};

onMounted(() => {
  fetchStats();
});
</script>
