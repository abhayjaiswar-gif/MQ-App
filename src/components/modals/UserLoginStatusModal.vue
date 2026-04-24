<template>
  <v-dialog v-model="show" max-width="800px" persistent>
    <v-card class="rounded-[24px] overflow-hidden">
      <div class="bg-slate-900 p-4 sm:p-8 text-white relative">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-2xl sm:text-3xl font-black tracking-tight mb-1">Today's Login Activity</h2>
            <p class="text-slate-400 text-xs sm:text-sm font-medium">Real-time status of all active MQ-App users</p>
          </div>
          <v-btn icon variant="text" color="white" @click="close" class="mt-n2 mr-n2">
            <span class="material-symbols-outlined">close</span>
          </v-btn>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-6 sm:mt-8">
          <div class="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex-1">
            <p class="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Logged In Today</p>
            <p class="text-2xl sm:text-3xl font-black text-white">{{ stats.loggedIn.length }}</p>
          </div>
          <div class="bg-slate-700/50 border border-slate-600 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex-1">
            <p class="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Not Logged In Yet</p>
            <p class="text-2xl sm:text-3xl font-black text-white">{{ stats.notLoggedIn.length }}</p>
          </div>
        </div>
      </div>

      <v-card-text class="pa-0 bg-slate-50">
        <v-tabs v-model="tab" color="primary" grow class="border-b border-slate-200">
          <v-tab value="active" class="text-xs font-black uppercase tracking-widest">
            Logged In ({{ stats.loggedIn.length }})
          </v-tab>
          <v-tab value="inactive" class="text-xs font-black uppercase tracking-widest">
            Not Logged In ({{ stats.notLoggedIn.length }})
          </v-tab>
        </v-tabs>

        <div class="max-h-[500px] overflow-y-auto p-6">
          <v-window v-model="tab">
            <v-window-item value="active">
              <div v-if="stats.loggedIn.length === 0" class="text-center py-12">
                <p class="text-slate-400 font-bold">No active logins recorded today.</p>
              </div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="user in stats.loggedIn" :key="user.id" 
                  class="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md transition-all">
                  <v-avatar size="40" sm-size="48" class="bg-slate-100 border border-slate-200">
                    <img v-if="user.profile_pic" :src="'/uploads/' + user.profile_pic" class="object-cover" />
                    <span v-else class="text-slate-400 font-black text-sm">{{ user.name[0] }}</span>
                  </v-avatar>
                  <div class="overflow-hidden">
                    <h4 class="font-bold text-slate-800 leading-tight text-sm sm:text-base truncate">{{ user.name }}</h4>
                    <p class="text-[10px] sm:text-xs text-slate-400 font-medium font-bold truncate max-w-[150px]">{{ user.email }}</p>
                    <div class="flex items-center gap-1 mt-1 text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-tighter">
                      <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      Logged in at {{ formatTime(user.last_login) }}
                    </div>
                  </div>
                </div>
              </div>
            </v-window-item>

            <v-window-item value="inactive">
              <div v-if="stats.notLoggedIn.length === 0" class="text-center py-12">
                <p class="text-slate-400 font-bold">All users have logged in today!</p>
              </div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="user in stats.notLoggedIn" :key="user.id" 
                  class="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-sm grayscale opacity-70">
                  <v-avatar size="40" sm-size="48" class="bg-slate-50 border border-slate-100">
                    <img v-if="user.profile_pic" :src="'/uploads/' + user.profile_pic" class="object-cover" />
                    <span v-else class="text-slate-300 font-black text-sm">{{ user.name[0] }}</span>
                  </v-avatar>
                  <div class="overflow-hidden">
                    <h4 class="font-bold text-slate-600 leading-tight text-sm sm:text-base truncate">{{ user.name }}</h4>
                    <p class="text-[10px] sm:text-xs text-slate-400 font-medium font-bold truncate max-w-[150px]">{{ user.email }}</p>
                    <p class="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-tighter mt-1">Pending Login</p>
                  </div>
                </div>
              </div>
            </v-window-item>
          </v-window>
        </div>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="pa-6 bg-white">
        <v-spacer></v-spacer>
        <v-btn
          color="#005daa"
          variant="flat"
          class="rounded-xl font-black px-8 uppercase tracking-widest text-[11px]"
          @click="close"
          height="48"
        >
          Close Report
        </v-btn>
      </v-card-actions>
    </v-card>
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
    const roleId = authStore.user?.role_id || sessionStorage.getItem('role_id');
    
    const res = await fetch(`/api/users/login-status?user_id=${userId}&role_id=${roleId}`);
    const data = await res.json();
    if (data.success) {
      stats.value = data.data;
    }
  } catch (err) {
    console.error('Fetch Login Stats Error:', err);
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
