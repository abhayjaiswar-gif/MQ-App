<template>
  <v-container fluid class="pa-6 bg-slate-50 min-h-screen">
    <!-- Header -->
    <div class="mb-8 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">Support Tickets (Complaints)</h1>
        <p class="text-slate-500 text-sm mt-1">Manage and resolve complaints from the Help & Support Chat.</p>
      </div>
      <v-btn icon variant="text" @click="fetchTickets" :loading="loading">
        <span class="material-symbols-outlined">refresh</span>
      </v-btn>
    </div>

    <!-- Tickets List -->
    <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <v-table>
        <thead class="bg-slate-50">
          <tr>
            <th class="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Details</th>
            <th class="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Requester</th>
            <th class="text-center py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
            <th class="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
          </tr>
        </thead>
        
        <tbody v-if="loading">
          <tr>
            <td colspan="4" class="text-center py-20">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </td>
          </tr>
        </tbody>

        <tbody v-else-if="tickets.length === 0">
          <tr>
            <td colspan="4" class="text-center py-32 text-slate-400">
              <span class="material-symbols-outlined text-5xl mb-4 opacity-20">confirmation_number</span>
              <p class="text-sm font-bold uppercase tracking-widest opacity-30">No complaints found</p>
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr v-for="ticket in tickets" :key="ticket.id" class="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
            <td class="py-5 px-6">
              <div class="font-bold text-slate-800 text-sm mb-0.5">{{ ticket.subject || 'Complaint' }}</div>
              <p class="text-xs text-slate-500 max-w-sm line-clamp-1">{{ ticket.message }}</p>
              <div class="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{{ formatDate(ticket.created_at) }}</div>
            </td>
            <td class="py-5 px-6">
              <div class="text-sm font-bold text-slate-700">{{ ticket.name }}</div>
              <div class="text-[10px] text-slate-400 font-medium">{{ ticket.email }}</div>
            </td>
            <td class="py-5 px-6 text-center">
              <span :class="['px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border', 
                ticket.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100']">
                {{ ticket.status }}
              </span>
            </td>
            <td class="py-5 px-6 text-right">
              <v-btn v-if="ticket.status === 'pending' && ticket.user_id == currentUserId" size="small" variant="flat" color="emerald-darken-1" class="rounded-xl px-4 font-black text-[10px] uppercase tracking-widest" @click="markSolved(ticket.id)">
                Mark Solved
              </v-btn>
              <span v-else-if="ticket.status === 'solved'" class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Completed</span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const tickets = ref<any[]>([]);
const loading = ref(true);
const currentUserId = ref(sessionStorage.getItem('id'));

const fetchTickets = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/tickets/all');
    const data = await res.json();
    if (data.success) {
      tickets.value = data.tickets;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const markSolved = async (id: number) => {
  try {
    const res = await fetch('/api/complaints/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'solved' })
    });
    const data = await res.json();
    if (data.success) {
      const ticket = tickets.value.find(t => t.id === id);
      if (ticket) ticket.status = 'solved';
    }
  } catch (e) {
    console.error(e);
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

onMounted(fetchTickets);
</script>

<style scoped>
:deep(.v-table) { background: transparent !important; }
:deep(th) { border-bottom: 1px solid #f1f5f9 !important; }
:deep(td) { border-bottom: 1px solid #f8fafc !important; }
.line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
</style>
