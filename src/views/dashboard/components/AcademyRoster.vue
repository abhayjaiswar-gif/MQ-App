<template>
  <v-card class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden" variant="text">
    <v-card-item class="pa-8">
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <v-card-title class="text-h4 font-black text-slate-900 mb-0">Academy Student Roster</v-card-title>
          <span class="text-caption text-slate-400 font-bold uppercase tracking-widest">Live listing of active athletes & students</span>
        </div>
        <div class="flex gap-4">
          <v-chip color="primary" variant="tonal" class="rounded-lg font-black text-[10px] uppercase tracking-widest px-4">
            Total: {{ students.length }}
          </v-chip>
        </div>
      </div>

      <v-table class="student-table" hover density="comfortable">
        <thead>
          <tr class="bg-slate-50/50">
            <th class="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest py-6 px-4">ID / GR NO</th>
            <th class="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest py-6 px-4">Student Name</th>
            <th class="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest py-6 px-4">Standard</th>
            <th class="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest py-6 px-4">Academy / School</th>
            <th class="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest py-6 px-4">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student.id" class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
            <td class="py-5 px-4 font-bold text-primary">{{ student.gr_no || student.id }}</td>
            <td class="py-5 px-4">
              <div class="flex items-center gap-3">
                <v-avatar size="32" color="slate-100">
                  <span class="text-[10px] font-black text-slate-400">{{ student.name.charAt(0) }}</span>
                </v-avatar>
                <span class="font-bold text-slate-700">{{ student.name }}</span>
              </div>
            </td>
            <td class="py-5 px-4">
              <v-chip size="x-small" density="comfortable" class="rounded-lg font-black bg-slate-100 text-slate-500 uppercase">
                {{ student.standard || 'N/A' }}
              </v-chip>
            </td>
            <td class="py-5 px-4">
              <span class="text-xs font-bold text-slate-500">{{ student.school || 'Marcos Quay Academy' }}</span>
            </td>
            <td class="py-5 px-4">
              <v-chip variant="flat" size="x-small" :color="student.status === 1 ? 'success' : 'error'" class="rounded-lg px-2 text-[8px] font-black uppercase">
                {{ student.status === 1 ? 'Active' : 'Inactive' }}
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- 🔄 Infinite Scroll Trigger -->
      <div v-intersect="onIntersect" class="flex flex-col items-center justify-center py-12 gap-4">
        <template v-if="loading">
          <v-progress-circular indeterminate color="primary" size="24" width="3"></v-progress-circular>
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching more students...</span>
        </template>
        <template v-else-if="allLoaded">
          <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-bounce">End of Roster 🏔️</span>
        </template>
        <template v-else>
           <v-btn variant="text" size="small" class="text-slate-300 font-bold" @click="fetchStudents">Load More</v-btn>
        </template>
      </div>
    </v-card-item>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const students = ref<any[]>([]);
const loading = ref(false);
const allLoaded = ref(false);
const limit = ref(15);
const offset = ref(0);

const fetchStudents = async () => {
  if (loading.value || allLoaded.value) return;
  
  loading.value = true;
  try {
    const res = await fetch(`/api/dashboard/students?limit=${limit.value}&offset=${offset.value}`);
    const data = await res.json();
    
    if (data.success) {
      if (data.data.length < limit.value) {
        allLoaded.value = true;
      }
      students.value = [...students.value, ...data.data];
      
      // Update offset for next batch
      offset.value += limit.value;
      // After first load, switch to 25 batch size as requested
      if (limit.value === 15) limit.value = 25;
    }
  } catch (err) {
    console.error('Fetch students error:', err);
  } finally {
    loading.value = false;
  }
};

const onIntersect = (isIntersecting: boolean) => {
  if (isIntersecting) {
    fetchStudents();
  }
};

onMounted(() => {
  fetchStudents();
});
</script>

<style scoped>
.text-slate-900 { color: #0F172A !important; }
.text-slate-400 { color: #94A3B8 !important; }
.text-slate-700 { color: #334155 !important; }
.student-table :deep(th) { border-bottom: 2px solid #f1f5f9 !important; }
.tracking-widest { letter-spacing: 0.15em !important; }

/* Animation */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.animate-bounce {
  animation: bounce 2s infinite;
}
</style>
