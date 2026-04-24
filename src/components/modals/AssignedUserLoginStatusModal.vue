<template>
  <v-dialog v-model="show" max-width="900px" persistent>
    <div class="bg-[#f8f9ff] rounded-[2.5rem] shadow-[0_20px_40px_rgba(11,28,48,0.04)] overflow-hidden flex flex-col relative">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 sm:p-8 bg-[#f8f9ff]/70 backdrop-blur-xl border-b border-[#e5eeff] sticky top-0 z-20">
        <div>
          <span class="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-[#777587] mb-1 block">System Monitoring</span>
          <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tighter text-[#0b1c30]">Subordinate Activity</h2>
        </div>
        <v-btn icon variant="text" color="#0b1c30" @click="close" class="-mt-2 -mr-2">
          <span class="material-symbols-outlined">close</span>
        </v-btn>
      </div>

      <!-- Scrollable Content -->
      <div class="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
        
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <!-- Logged In Card -->
          <div class="relative group h-full">
            <div class="absolute -top-4 -left-4 w-24 h-24 bg-[#3525cd]/10 rounded-full blur-2xl group-hover:bg-[#3525cd]/20 transition-all"></div>
            <div class="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] shadow-[0_12px_24px_rgba(11,28,48,0.06)] bg-gradient-to-br from-[#3525cd] to-[#4f46e5] text-white relative overflow-hidden h-full">
              <div class="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
                <span class="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] opacity-80">Engagement Focus</span>
                <div class="mt-4">
                  <h3 class="text-4xl sm:text-5xl font-black mb-1">{{ stats.loggedIn.length }}</h3>
                  <p class="text-sm sm:text-lg font-medium opacity-90">Logged In Today</p>
                </div>
              </div>
              <div class="absolute -right-6 -bottom-6 opacity-10">
                <span class="material-symbols-outlined text-[8rem] sm:text-[10rem]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
              </div>
            </div>
          </div>

          <!-- Not Logged In Card -->
          <div class="h-full">
            <div class="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] shadow-[0_12px_24px_rgba(11,28,48,0.06)] bg-[#eff4ff] h-full flex flex-col justify-between border-l-8 border-[#7e3000] min-h-[140px]">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-[#7e3000] mb-2 block">Attention Required</span>
                  <h3 class="text-4xl sm:text-5xl font-black text-[#0b1c30] tracking-tighter">{{ stats.notLoggedIn.length }}</h3>
                </div>
                <span class="material-symbols-outlined text-[#7e3000] text-3xl" style="font-variation-settings: 'FILL' 1;">warning</span>
              </div>
              <p class="text-sm sm:text-lg font-medium text-[#464555] mt-4">Not Logged In Yet</p>
            </div>
          </div>
        </div>

        <!-- Active Personnel List -->
        <div>
          <v-tabs v-model="tab" color="#3525cd" class="mb-6">
            <v-tab value="active" class="text-xs font-bold uppercase tracking-widest">
              Logged In ({{ stats.loggedIn.length }})
            </v-tab>
            <v-tab value="inactive" class="text-xs font-bold uppercase tracking-widest">
              Pending ({{ stats.notLoggedIn.length }})
            </v-tab>
          </v-tabs>

          <v-window v-model="tab">
            <v-window-item value="active">
              <div v-if="stats.loggedIn.length === 0" class="text-center py-12">
                <p class="text-[#777587] font-medium">No active logins recorded today.</p>
              </div>
              <div v-else class="space-y-4">
                <div v-for="user in stats.loggedIn" :key="user.id" class="flex items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-[1.5rem] bg-white border border-[#e5eeff] shadow-sm hover:shadow-md transition-all group">
                  <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full ring-4 ring-[#e2dfff] overflow-hidden flex-shrink-0 bg-[#eff4ff] flex items-center justify-center">
                    <img v-if="user.profile_pic" :src="'/uploads/' + user.profile_pic" class="w-full h-full object-cover" />
                    <span v-else class="text-[#3525cd] font-black text-xl">{{ user.name[0] }}</span>
                  </div>
                  <div class="flex-grow min-w-0">
                    <h5 class="text-sm sm:text-base font-bold text-[#0b1c30] truncate">{{ user.name }}</h5>
                    <p class="text-[10px] sm:text-xs text-[#464555] truncate">{{ user.email }}</p>
                  </div>
                  <div class="hidden sm:block text-right">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-[#777587] mb-1">Time</p>
                    <p class="text-xs font-medium text-[#0b1c30]">{{ formatTime(user.last_login) }}</p>
                  </div>
                  <div class="flex items-center gap-2 bg-[#e2dfff]/40 px-3 sm:px-4 py-1.5 rounded-full whitespace-nowrap ml-auto sm:ml-0">
                    <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#3525cd] animate-pulse"></span>
                    <span class="text-[10px] sm:text-xs font-bold text-[#3525cd]">Active</span>
                  </div>
                </div>
              </div>
            </v-window-item>

            <v-window-item value="inactive">
              <div v-if="stats.notLoggedIn.length === 0" class="text-center py-12">
                <p class="text-[#777587] font-medium">All users have logged in today!</p>
              </div>
              <div v-else class="space-y-4">
                <div v-for="user in stats.notLoggedIn" :key="user.id" class="flex items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-[1.5rem] bg-[#eff4ff]/50 border border-[#eff4ff] transition-all group grayscale opacity-80">
                  <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full ring-4 ring-[#d3e4fe] overflow-hidden flex-shrink-0 bg-[#f8f9ff] flex items-center justify-center">
                    <img v-if="user.profile_pic" :src="'/uploads/' + user.profile_pic" class="w-full h-full object-cover" />
                    <span v-else class="text-[#777587] font-black text-xl">{{ user.name[0] }}</span>
                  </div>
                  <div class="flex-grow min-w-0">
                    <h5 class="text-sm sm:text-base font-bold text-[#0b1c30] opacity-70 truncate">{{ user.name }}</h5>
                    <p class="text-[10px] sm:text-xs text-[#464555] opacity-80 truncate">{{ user.email }}</p>
                  </div>
                  <div class="flex items-center gap-2 bg-[#d3e4fe] px-3 sm:px-4 py-1.5 rounded-full whitespace-nowrap ml-auto">
                    <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#777587]"></span>
                    <span class="text-[10px] sm:text-xs font-bold text-[#464555]">Pending</span>
                  </div>
                </div>
              </div>
            </v-window-item>
          </v-window>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="bg-white p-6 border-t border-[#e5eeff] flex justify-end relative z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <v-btn
          color="#3525cd"
          variant="flat"
          class="rounded-xl font-bold px-8 shadow-lg shadow-[#3525cd]/20 tracking-wide text-none"
          @click="close"
          height="48"
        >
          Dismiss
        </v-btn>
      </div>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue']);
const authStore = useAuthStore();

const show = ref(props.modelValue);
const tab = ref('active');
const stats = ref({
  loggedIn: [] as any[],
  notLoggedIn: [] as any[]
});

watch(() => props.modelValue, (val) => {
  show.value = val;
  if (val) fetchStats();
});

const formatTime = (dateStr: string) => {
  if (!dateStr) return '--:--';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const fetchStats = async () => {
  try {
    const userId = authStore.user?.id || sessionStorage.getItem('id');
    
    // Uses the NEW endpoint for assigned users
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
  if (show.value) fetchStats();
});

const close = () => {
  show.value = false;
  emit('update:modelValue', false);
};
</script>
