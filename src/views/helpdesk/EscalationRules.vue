<script setup lang="ts">
import { ref, onMounted } from 'vue';

const loading = ref(true);
const saving = ref(false);
const rules = ref<{ tier_level: number; assigned_user_id: number | null; timeout_hours: number }[]>([]);
const users = ref<{ id: number; name: string; role_name: string; mq_id: string }[]>([]);

const fetchData = async () => {
    loading.value = true;
    try {
        const [rulesRes, usersRes] = await Promise.all([
            fetch('/api/tickets/rules').then(r => r.json()),
            fetch('/api/users-list').then(r => r.json())
        ]);
        if (rulesRes.success) {
            rules.value = rulesRes.rules.length > 0
                ? rulesRes.rules
                : [{ tier_level: 1, assigned_user_id: null, timeout_hours: 12 }];
        }
        if (usersRes.success) {
            users.value = usersRes.users;
        }
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

onMounted(fetchData);

const getUserById = (id: number | null) => {
    if (!id) return null;
    return users.value.find(u => u.id === id) || null;
};

const addTier = () => {
    rules.value.push({
        tier_level: rules.value.length + 1,
        assigned_user_id: null,
        timeout_hours: 12
    });
};

const removeTier = (index: number) => {
    rules.value.splice(index, 1);
    rules.value.forEach((r, idx) => r.tier_level = idx + 1);
};

const saveRules = async () => {
    saving.value = true;
    try {
        const payload = rules.value.map(r => ({
            tier_level: r.tier_level,
            assigned_user_id: r.assigned_user_id || null,
            assigned_role_id: null,
            timeout_hours: r.timeout_hours || 12
        }));
        const res = await fetch('/api/tickets/rules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rules: payload })
        });
        const data = await res.json();
        if (data.success) {
            alert('Escalation chain saved successfully!');
        } else {
            alert('Error saving rules.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        saving.value = false;
    }
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const tierColors = [
    { bg: 'bg-blue-600', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-600' },
    { bg: 'bg-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-600' },
    { bg: 'bg-purple-600', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-600' },
    { bg: 'bg-rose-600', light: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-600' },
    { bg: 'bg-orange-600', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-600' },
];

const getColor = (index: number) => tierColors[index % tierColors.length];
</script>

<template>
    <div class="min-h-screen bg-slate-50 font-inter">
        <div class="max-w-5xl mx-auto px-6 lg:px-10 py-10 space-y-10">

            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <nav class="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3 font-manrope">
                        <span>Support</span>
                        <span class="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span class="text-primary font-bold">Escalation Rules</span>
                    </nav>
                    <h1 class="text-4xl font-extrabold text-[#1e293b] tracking-tight font-manrope">Escalation Chain</h1>
                    <p class="text-slate-500 mt-1.5 font-medium text-sm">Assign people in order. If one can't solve it in time, the ticket moves to the next person up.</p>
                </div>
                <button @click="saveRules" :disabled="saving"
                    class="bg-primary text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:bg-[#004a88] transition-all flex items-center gap-2 shrink-0 active:scale-95">
                    <span class="material-symbols-outlined text-[18px]">save</span>
                    {{ saving ? 'Saving...' : 'Save Chain' }}
                </button>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center py-24 gap-3 text-slate-400">
                <div class="w-6 h-6 border-2 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                <span class="font-bold text-sm uppercase tracking-widest">Loading...</span>
            </div>

            <div v-else class="space-y-0">
                <!-- Visual Chain Cards -->
                <div v-for="(rule, index) in rules" :key="index" class="flex flex-col items-start">
                    
                    <!-- Tier Card -->
                    <div class="w-full bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <div class="flex items-stretch">
                            <!-- Level Badge Column -->
                            <div :class="['w-16 flex flex-col items-center justify-center py-6 shrink-0', getColor(index).bg]">
                                <span class="text-white/70 text-[9px] font-black uppercase tracking-widest mb-1">Level</span>
                                <span class="text-white text-2xl font-black">{{ rule.tier_level }}</span>
                            </div>

                            <!-- Content -->
                            <div class="flex-1 p-6">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <!-- User Selector -->
                                    <div class="space-y-2">
                                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign To (Person)</label>
                                        <div class="relative">
                                            <select v-model="rule.assigned_user_id"
                                                class="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer pr-10">
                                                <option :value="null">— Select Person —</option>
                                                <option v-for="user in users" :key="user.id" :value="user.id">
                                                    {{ user.name }} ({{ user.role_name }})
                                                </option>
                                            </select>
                                            <span class="material-symbols-outlined absolute right-3 top-3 text-slate-400 pointer-events-none">expand_more</span>
                                        </div>

                                        <!-- Selected User Preview -->
                                        <div v-if="getUserById(rule.assigned_user_id)" :class="['flex items-center gap-3 p-3 rounded-xl border', getColor(index).light, getColor(index).border]">
                                            <div :class="['w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0', getColor(index).badge]">
                                                {{ getInitials(getUserById(rule.assigned_user_id)!.name) }}
                                            </div>
                                            <div>
                                                <p :class="['text-sm font-bold', getColor(index).text]">{{ getUserById(rule.assigned_user_id)!.name }}</p>
                                                <p class="text-[10px] text-slate-500 font-medium">{{ getUserById(rule.assigned_user_id)!.role_name }} · {{ getUserById(rule.assigned_user_id)!.mq_id }}</p>
                                            </div>
                                        </div>
                                        <div v-else class="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                                            <p class="text-[11px] text-slate-400 font-medium">No person assigned yet</p>
                                        </div>
                                    </div>

                                    <!-- Timeout Config -->
                                    <div class="space-y-2">
                                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">SLA Timeout (Hours)</label>
                                        <div class="flex items-center gap-3">
                                            <input v-model="rule.timeout_hours" type="number" min="1" max="72"
                                                class="w-24 bg-slate-50 border border-slate-200 rounded-xl text-lg px-4 py-3 font-black text-slate-700 outline-none text-center focus:ring-2 focus:ring-primary/20">
                                            <div>
                                                <p class="text-sm font-bold text-slate-700">Hours before escalating</p>
                                                <p class="text-[11px] text-slate-400 font-medium mt-0.5">
                                                    <span v-if="index < rules.length - 1">
                                                        If not resolved, goes to <span class="font-black text-slate-600">Level {{ rule.tier_level + 1 }}</span>
                                                    </span>
                                                    <span v-else class="text-rose-500 font-semibold">Final escalation level — ticket will close</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Delete Button -->
                            <div class="flex items-center px-4 border-l border-slate-50">
                                <button v-if="rules.length > 1" @click="removeTier(index)"
                                    class="w-9 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                    <span class="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Arrow Connector -->
                    <div v-if="index < rules.length - 1" class="flex flex-col items-center w-16 py-1">
                        <div class="w-0.5 h-4 bg-slate-200"></div>
                        <span class="material-symbols-outlined text-slate-300 text-[20px]">arrow_downward</span>
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Escalates</p>
                        <div class="w-0.5 h-4 bg-slate-200"></div>
                    </div>
                </div>

                <!-- Add Tier Button -->
                <div class="pt-4">
                    <button @click="addTier"
                        class="w-full py-5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-xs hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined">person_add</span>
                        Add Next Level Person
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.font-manrope { font-family: 'Manrope', sans-serif; }
.font-inter { font-family: 'Inter', sans-serif; }
</style>
