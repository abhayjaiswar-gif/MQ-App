<script setup lang="ts">
import { ref, onMounted } from 'vue';

const tickets = ref<any[]>([]);
const loading = ref(true);

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

onMounted(fetchTickets);

const updateStatus = async (ticketId: number, status: string) => {
    try {
        const res = await fetch(`/api/tickets/${ticketId}/action`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (data.success) {
            const ticket = tickets.value.find(t => t.id === ticketId);
            if (ticket) ticket.status = status;
        }
    } catch (e) {
        console.error(e);
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};
</script>

<template>
    <div class="px-0 py-2 min-h-screen bg-slate-50 font-inter">
        <div class="max-w-7xl mx-auto w-full px-4 sm:px-6">
            <div class="space-y-8">
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 class="text-3xl font-extrabold text-[#1a1c1c] tracking-tight font-manrope">Helpdesk Tickets
                        </h1>
                        <p class="text-slate-500 mt-2 font-inter max-w-xl text-sm">Review, mark actions, and track hierarchical escalations for raised complaints.</p>
                    </div>
                </div>

                <div class="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr class="bg-slate-50/50">
                                    <th class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Ticket Details</th>
                                    <th class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Requester</th>
                                    <th class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope text-center">Status</th>
                                    <th class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Current Assignment</th>
                                    <th class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr v-if="loading">
                                    <td colspan="5" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        Loading tickets...
                                    </td>
                                </tr>
                                <tr v-else-if="tickets.length === 0">
                                    <td colspan="5" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        No tickets found
                                    </td>
                                </tr>
                                <tr v-for="ticket in tickets" :key="ticket.id" class="hover:bg-slate-50/50 transition-colors group">
                                    <td class="px-8 py-5">
                                        <p class="font-bold text-primary text-sm font-manrope tracking-tight">{{ ticket.subject || 'No Subject' }}</p>
                                        <p class="text-xs text-slate-500 max-w-xs truncate font-medium mt-0.5" :title="ticket.message">{{ ticket.message }}</p>
                                        <p class="text-[10px] text-slate-400 mt-1 font-bold">{{ formatDate(ticket.created_at) }}</p>
                                    </td>
                                    <td class="px-8 py-5">
                                        <span class="text-sm font-bold text-slate-700">{{ ticket.name }}</span>
                                        <p class="text-[11px] text-slate-500">{{ ticket.email }}</p>
                                    </td>
                                    <td class="px-8 py-5 text-center">
                                        <span :class="['inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider font-manrope', 
                                            ticket.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                            ticket.status === 'closed' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-rose-50 text-rose-700 border-rose-200']">
                                            {{ ticket.status }}
                                        </span>
                                    </td>
                                    <td class="px-8 py-5">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-black flex items-center justify-center text-xs shrink-0 border border-indigo-100">
                                                T{{ ticket.current_tier }}
                                            </div>
                                            <div>
                                                <p class="text-xs font-bold text-slate-700">{{ ticket.role_name || ticket.user_name || 'Unassigned' }}</p>
                                                <p class="text-[10px] text-slate-400 font-medium">Escalated: {{ formatDate(ticket.last_escalated_at) }}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-8 py-5 text-right">
                                        <div class="relative inline-block text-left group/dropdown">
                                            <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-2 font-manrope">
                                                Mark Action
                                                <span class="material-symbols-outlined text-[16px]">expand_more</span>
                                            </button>
                                            <div class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 z-50 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all">
                                                <div class="p-2 space-y-1">
                                                    <button @click="updateStatus(ticket.id, 'resolved')" class="w-full text-left px-3 py-2 text-xs font-bold font-manrope text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-2">
                                                        <span class="material-symbols-outlined text-[16px]">check_circle</span> Mark as Resolved
                                                    </button>
                                                    <button @click="updateStatus(ticket.id, 'closed')" class="w-full text-left px-3 py-2 text-xs font-bold font-manrope text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2">
                                                        <span class="material-symbols-outlined text-[16px]">cancel</span> Mark as Closed
                                                    </button>
                                                    <button @click="updateStatus(ticket.id, 'pending')" class="w-full text-left px-3 py-2 text-xs font-bold font-manrope text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-2">
                                                        <span class="material-symbols-outlined text-[16px]">schedule</span> Revert to Pending
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.font-manrope { font-family: 'Manrope', sans-serif; }
.font-inter { font-family: 'Inter', sans-serif; }
</style>
