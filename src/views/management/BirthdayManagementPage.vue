<template>
  <v-row>
    <v-col cols="12">
      <v-card class="birthday-card rounded-xl overflow-hidden border-0 shadow-2xl">
        <div class="premium-header pa-10 text-white">
          <div class="d-flex align-center gap-4 mb-2">
            <span class="material-symbols-outlined text-4xl text-amber-400">cake</span>
            <h1 class="text-4xl font-black tracking-tighter">Birthday Calendar</h1>
          </div>
          <p class="text-white/60 text-lg font-medium">Tracking celebrations across the Academy</p>
        </div>

        <v-card-text class="pa-0">
          <div class="table-container">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/50 border-b border-slate-100">
                  <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Student/Staff</th>
                  <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Birthday</th>
                  <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Countdown</th>
                  <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in birthdays" :key="user.user_id" 
                    class="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors duration-300">
                  <td class="px-8 py-6">
                    <div class="d-flex align-center gap-4">
                      <v-avatar color="indigo-lighten-5" size="48" class="font-weight-bold text-indigo">
                        {{ user.user_name.charAt(0) }}
                      </v-avatar>
                      <div>
                        <div class="text-base font-bold text-slate-900 leading-tight">{{ user.user_name }}</div>
                        <div class="text-[11px] font-medium text-slate-400">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-8 py-6 text-sm font-bold text-slate-600">
                    {{ formatDate(user.birthday_date) }}
                  </td>
                  <td class="px-8 py-6">
                    <div class="d-flex flex-col gap-1">
                      <span :class="getCountdownClass(user.days_remaining)" class="text-sm font-black tracking-tight">
                        {{ user.days_remaining === 0 ? 'TODAY! 🎈' : `${user.days_remaining} Days Left` }}
                      </span>
                      <v-progress-linear
                        :model-value="getProgress(user.days_remaining)"
                        :color="getCountdownColor(user.days_remaining)"
                        height="4"
                        rounded
                        class="w-24"
                      ></v-progress-linear>
                    </div>
                  </td>
                  <td class="px-8 py-6 text-right">
                    <v-chip
                      size="small"
                      :color="getStatusColor(user.days_remaining)"
                      variant="tonal"
                      class="font-black text-[10px] uppercase tracking-widest px-4"
                    >
                      {{ getStatusText(user.days_remaining) }}
                    </v-chip>
                  </td>
                </tr>
                <tr v-if="birthdays.length === 0 && !loading">
                  <td colspan="4" class="pa-20 text-center">
                    <div class="text-slate-300 text-lg font-bold">No birthdays found</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </v-card-text>

        <v-overlay :model-value="loading" class="align-center justify-center" persistent>
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        </v-overlay>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface BirthdayUser {
  user_id: number;
  user_name: string;
  email: string;
  birthday_date: string;
  days_remaining: number;
}

const birthdays = ref<BirthdayUser[]>([]);
const loading = ref(true);

const fetchBirthdays = async () => {
  try {
    const res = await fetch('/api/all-birthdays');
    const data = await res.json();
    if (data.success) {
      birthdays.value = data.birthdays;
    }
  } catch (err) {
    console.error('Error fetching birthdays:', err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long'
  });
};

const getCountdownClass = (days: number) => {
  if (days === 0) return 'text-amber-500 animate-pulse';
  if (days < 30) return 'text-indigo-600';
  return 'text-slate-400';
};

const getCountdownColor = (days: number) => {
  if (days === 0) return 'amber';
  if (days < 30) return 'indigo';
  return 'slate';
};

const getProgress = (days: number) => {
  // Simple logic: closer to 0, more progress
  return Math.max(0, 100 - (days / 365) * 100);
};

const getStatusColor = (days: number) => {
  if (days === 0) return 'amber';
  if (days < 30) return 'indigo';
  return 'slate';
};

const getStatusText = (days: number) => {
  if (days === 0) return 'Celebrating';
  if (days < 30) return 'Upcoming';
  return 'Upcoming Later';
};

onMounted(fetchBirthdays);
</script>

<style scoped>
.birthday-card {
  background: white;
}

.premium-header {
  background: linear-gradient(135deg, #13121b 0%, #3525cd 100%);
}

.table-container {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

.gap-4 { gap: 1rem; }

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .7; }
}
</style>
