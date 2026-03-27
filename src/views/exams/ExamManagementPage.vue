<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const exams = ref([]);
const loading = ref(true);
const error = ref(null);
const currentPage = ref(1);
const perPage = 10;

const fetchExams = async () => {
    loading.value = true;
    error.value = null;
    try {
        const res = await fetch('http://localhost:3000/api/exam-formats');
        const data = await res.json();
        if (data.success) {
            exams.value = data.formats;
        } else {
            error.value = data.message;
        }
    } catch (e) {
        console.error(e);
        error.value = "Failed to fetch exam data.";
    } finally {
        loading.value = false;
    }
};

const deleteExam = async (id) => {
    if (!confirm("Are you sure you want to delete this exam format?")) return;

    try {
        const res = await fetch(`http://localhost:3000/api/exam-formats/${id}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
            await fetchExams();
        } else {
            alert("Error: " + data.message);
        }
    } catch (e) {
        console.error(e);
        alert("Failed to delete exam format.");
    }
};

onMounted(() => {
    fetchExams();
});

const navigateToParameters = () => {
    router.push('/exams');
};

const paginatedExams = computed(() => {
    const start = (currentPage.value - 1) * perPage;
    return exams.value.slice(start, start + perPage);
});

const totalPages = computed(() => Math.ceil(exams.value.length / perPage));

const activeExams = computed(() => exams.value.filter(e => e.is_active === 1).length);
</script>

<template>
    <div class="px-0 py-2 min-h-screen bg-slate-50 font-inter">
        <div class="max-w-7xl mx-auto w-full px-4 sm:px-6">

            <div class="space-y-8">
                <!-- Navigation Toggles -->
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 class="text-3xl font-extrabold text-[#1a1c1c] tracking-tight font-manrope">Exam Management
                        </h1>

                    </div>

                    <!-- Toggle Switch (Buttons) -->
                    <div class="inline-flex p-1.5 bg-slate-200/50 rounded-xl shadow-inner">
                        <button @click="navigateToParameters"
                            class="px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-manrope">
                            <span class="material-symbols-outlined text-[18px]">settings_input_component</span>
                            All Parameters
                        </button>
                        <button
                            class="px-8 py-3 rounded-lg font-bold text-sm transition-all duration-300 flex items-center gap-2 bg-white text-primary shadow-sm ring-1 ring-black/5 font-manrope">
                            <span class="material-symbols-outlined text-[18px]"
                                style="font-variation-settings: 'FILL' 1;">assignment</span>
                            All Exams
                        </button>
                    </div>
                </div>

                <!-- Quick Stat Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Stat Card 1 -->
                    <div
                        class="bg-white p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-b-4 border-[#0075d5] group hover:shadow-md transition-shadow">
                        <div class="flex items-center justify-between">
                            <div
                                class="w-10 h-10 flex items-center justify-center bg-[#d4e3ff] text-[#004785] rounded-xl">
                                <span class="material-symbols-outlined text-[20px]">calendar_today</span>
                            </div>
                            <span
                                class="text-[10px] font-bold uppercase tracking-widest text-[#005daa] px-2 py-1 bg-[#d4e3ff]/30 rounded font-manrope">+4
                                this week</span>
                        </div>
                        <div class="mt-4">
                            <p class="text-3xl font-extrabold text-slate-800 font-manrope">24</p>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Upcoming Exams
                            </p>
                        </div>
                    </div>
                    <!-- Stat Card 2 -->
                    <div
                        class="bg-white p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-b-4 border-[#b95a00] group hover:shadow-md transition-shadow">
                        <div class="flex items-center justify-between">
                            <div
                                class="w-10 h-10 flex items-center justify-center bg-[#ffdbc7] text-[#733600] rounded-xl">
                                <span class="material-symbols-outlined text-[20px]">pending_actions</span>
                            </div>
                            <span
                                class="text-[10px] font-bold uppercase tracking-widest text-[#934600] px-2 py-1 bg-[#ffdbc7]/30 rounded font-manrope">Active
                                Now</span>
                        </div>
                        <div class="mt-4">
                            <p class="text-3xl font-extrabold text-slate-800 font-manrope">{{ activeExams }}</p>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Active Formats
                            </p>
                        </div>
                    </div>
                    <!-- Stat Card 3 -->
                    <div
                        class="bg-white p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-b-4 border-emerald-500 group hover:shadow-md transition-shadow">
                        <div class="flex items-center justify-between">
                            <div
                                class="w-10 h-10 flex items-center justify-center bg-emerald-100 text-emerald-800 rounded-xl">
                                <span class="material-symbols-outlined text-[20px]">check_circle</span>
                            </div>
                            <span
                                class="text-[10px] font-bold uppercase tracking-widest text-emerald-800 px-2 py-1 bg-emerald-100/50 rounded font-manrope">Repository</span>
                        </div>
                        <div class="mt-4">
                            <p class="text-3xl font-extrabold text-slate-800 font-manrope">{{ exams.length }}</p>
                            <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Total Formats
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Main Content: Recent Exam Schedules -->
                <div
                    class="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                    <div
                        class="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-extrabold text-slate-800 font-manrope">Recent Exam Schedules</h2>
                        </div>
                        <div class="flex items-center gap-3">
                            <button
                                class="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 font-manrope">
                                <span class="material-symbols-outlined text-[18px]">filter_list</span>
                                Filter
                            </button>
                            <button @click="router.push('/exams/create')"
                                class="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-[#004a88] shadow-md shadow-primary/20 transition-all flex items-center gap-2 font-manrope">
                                <span class="material-symbols-outlined text-[18px]">add</span>
                                Create New Exam
                            </button>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr class="bg-slate-50/50">
                                    <th
                                        class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                                        Exam Name</th>
                                    <th
                                        class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                                        Type</th>
                                    <th
                                        class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                                        Date Range</th>
                                    <th
                                        class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                                        Status</th>
                                    <th
                                        class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope text-right">
                                        Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr v-if="loading">
                                    <td colspan="5" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        Loading exam formats...
                                    </td>
                                </tr>
                                <tr v-else-if="exams.length === 0">
                                    <td colspan="5" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        No exam formats found in database
                                    </td>
                                </tr>
                                <tr v-for="exam in paginatedExams" :key="exam.id" class="hover:bg-slate-50/50 transition-colors group">
                                    <td class="px-8 py-5">
                                        <p class="font-bold text-primary text-sm font-manrope tracking-tight">{{ exam.test_title }}</p>
                                        <p class="text-xs text-slate-500 max-w-xs truncate font-medium mt-0.5">ID: {{ exam.id }} • {{ exam.academic_year }}</p>
                                    </td>
                                    <td class="px-8 py-5">
                                        <span class="text-sm font-bold text-slate-700">{{ exam.test_name }}</span>
                                    </td>
                                    <td class="px-8 py-5">
                                        <div
                                            class="flex items-center gap-2 text-[11px] font-bold text-slate-500 font-manrope">
                                            <span
                                                class="material-symbols-outlined text-[16px] text-slate-400">calendar_month</span>
                                            {{ exam.academic_year }}
                                        </div>
                                    </td>
                                    <td class="px-8 py-5">
                                        <span :class="['inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider font-manrope', exam.is_active === 1 ? 'bg-primary-100 text-primary-800 border-primary-200' : 'bg-slate-100 text-slate-500 border-slate-200']">
                                            <span :class="['w-1.5 h-1.5 rounded-full', exam.is_active === 1 ? 'bg-primary animate-pulse' : 'bg-slate-400']"></span>
                                            {{ exam.is_active === 1 ? 'Active' : 'Inactive' }}
                                        </span>
                                    </td>
                                    <td class="px-8 py-5 text-right flex justify-end gap-2">
                                        <button @click="router.push('/exams/edit/' + exam.id)"
                                            class="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl border border-transparent transition-all"
                                            title="Edit Details">
                                            <span class="material-symbols-outlined text-[20px]">visibility</span>
                                        </button>
                                        <button @click="deleteExam(exam.id)"
                                            class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent transition-all"
                                            title="Delete Exam">
                                            <span class="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <!-- Pagination -->
                    <div class="p-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                            Showing {{ exams.length > 0 ? (currentPage - 1) * perPage + 1 : 0 }} to {{
                                Math.min(currentPage * perPage,
                                    exams.length) }} of {{ exams.length }} schedules
                        </span>
                        <div class="flex items-center gap-1" v-if="totalPages > 1">
                            <button @click="currentPage--" :disabled="currentPage === 1"
                                class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-50 hover:bg-slate-50 transition-all">
                                <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                            <button
                                class="px-3 py-1 flex items-center justify-center rounded-lg border border-transparent bg-primary text-white text-xs font-bold shadow-sm mx-1">
                                {{ currentPage }} / {{ totalPages }}
                            </button>
                            <button @click="currentPage++" :disabled="currentPage === totalPages"
                                class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-50 hover:bg-slate-50 transition-all ml-1">
                                <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Bottom Contextual Section (Bento Style) -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <!-- Highlight Banner -->
                    <div
                        class="md:col-span-2 bg-[#005daa] rounded-2xl p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-[0_4px_24px_rgba(0,0,0,0.05)] border-b-4 border-[#004785]">
                        <div class="relative z-10">
                            <h3 class="text-2xl font-extrabold leading-tight font-manrope tracking-tight">Automate
                                Grading <br />Workflows</h3>
                            <p class="mt-2 text-[#a5c8ff] font-medium text-sm max-w-xs opacity-90 leading-relaxed">
                                Integrate OMR results and digital submissions directly into the grading system.</p>
                        </div>
                        <button
                            class="relative z-10 mt-6 w-fit px-6 py-2.5 bg-white text-primary font-bold rounded-xl hover:bg-slate-50 transition-all shadow-md flex items-center gap-2 font-manrope">
                            Explore Automation <span class="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                        <!-- Abstract Background Elements -->
                        <div class="absolute -right-12 -bottom-12 w-48 h-48 bg-[#0075d5] rounded-full opacity-30"></div>
                        <div class="absolute right-4 top-8 opacity-20 transform rotate-12">
                            <span class="material-symbols-outlined text-8xl"
                                style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
                        </div>
                    </div>

                    <!-- Top Institutions -->
                    <div
                        class="bg-white p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-center">
                        <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-4">Top
                            Institutions</h4>
                        <div class="space-y-4">
                            <div class="flex items-center gap-3">
                                <div class="w-1.5 h-10 bg-primary rounded-full"></div>
                                <div>
                                    <p class="text-sm font-bold text-slate-800 font-manrope">North Heights High</p>
                                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">8
                                        Exams Scheduled</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="w-1.5 h-10 bg-[#afceff] rounded-full"></div>
                                <div>
                                    <p class="text-sm font-bold text-slate-800 font-manrope">Riverdale Academy</p>
                                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">5
                                        Exams Scheduled</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        class="bg-white p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center text-center">
                        <div
                            class="w-12 h-12 flex items-center justify-center bg-primary/10 text-primary rounded-2xl mb-3">
                            <span class="material-symbols-outlined text-[28px]">analytics</span>
                        </div>
                        <p class="text-3xl font-extrabold text-slate-800 font-manrope mb-1">94.2%</p>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                            Completion Rate</p>
                        <div class="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full bg-primary w-[94%] rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
