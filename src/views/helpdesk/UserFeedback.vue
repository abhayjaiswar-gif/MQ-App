<template>
  <v-container fluid class="pa-6 bg-slate-50 min-h-screen">
    <!-- Simple Header -->
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-black text-slate-800 tracking-tight">User Feedback List</h1>
      <v-btn icon variant="text" @click="fetchData" :loading="loading">
        <span class="material-symbols-outlined">refresh</span>
      </v-btn>
    </div>

    <!-- The List Form -->
    <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <v-table>
        <thead class="bg-slate-50">
          <tr>
            <th class="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
            <th class="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Subject</th>
            <th class="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Message</th>
            <th class="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
          </tr>
        </thead>
        
        <tbody v-if="loading">
          <tr>
            <td colspan="4" class="text-center py-20">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </td>
          </tr>
        </tbody>

        <tbody v-else-if="feedback.length === 0">
          <tr>
            <td colspan="4" class="text-center py-32 text-slate-400">
              <span class="material-symbols-outlined text-5xl mb-4 opacity-20">inbox</span>
              <p class="text-sm font-bold uppercase tracking-widest opacity-30">No feedback entries found</p>
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr v-for="item in feedback" :key="item.id" class="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
            <td class="py-4 px-6">
              <div class="flex items-center gap-3">
                <v-avatar color="indigo-lighten-4" size="32" class="text-indigo-darken-2 font-bold text-xs">
                  {{ item.name.charAt(0).toUpperCase() }}
                </v-avatar>
                <div>
                  <div class="font-bold text-slate-800 text-sm">{{ item.name }}</div>
                  <div class="text-[10px] text-slate-400 font-medium">{{ item.email }}</div>
                </div>
              </div>
            </td>
            <td class="py-4 px-6">
              <v-chip size="x-small" variant="flat" color="slate-100" class="text-slate-600 font-black uppercase text-[9px] px-2">
                {{ item.subject || 'General' }}
              </v-chip>
            </td>
            <td class="py-4 px-6 max-w-md">
              <p class="text-xs text-slate-600 leading-relaxed">{{ item.message }}</p>
            </td>
            <td class="py-4 px-6 text-right">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {{ formatDate(item.created_at) }}
              </span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const feedback = ref<any[]>([]);
const loading = ref(true);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/support/feedback');
    const data = await res.json();
    if (data.success) {
      feedback.value = data.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

onMounted(fetchData);
</script>

<style scoped>
:deep(.v-table) {
  background: transparent !important;
}
:deep(th) {
  border-bottom: 1px solid #f1f5f9 !important;
}
:deep(td) {
  border-bottom: 1px solid #f8fafc !important;
}
</style>
