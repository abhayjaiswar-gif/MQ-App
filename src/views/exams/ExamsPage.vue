<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const parameters = ref([]);
const loading = ref(true);
const error = ref(null);
const currentPage = ref(1);
const perPage = 10;

// Edit Modal State
const showEditModal = ref(false);
const editingParam = ref(null);
const isSaving = ref(false);

// Grading Modal State
const showGradingModal = ref(false);
const gradingTiers = ref([]);
const isSavingGrading = ref(false);

// Parameter Grades State
const standards = ref([]);
const showParameterListModal = ref(false);
const showParameterGradesModal = ref(false);
const selectedParamForGrades = ref(null);
const selectedStdsForGrades = ref([0]);
const selectedSourceStd = ref(0);
const parameterGrades = ref([]);
const isSavingParameterGrades = ref(false);
const isLoadingParameterGrades = ref(false);

const defaultGradesTemplate = [
    { grade: 'A+', grade_label: 'Excellent', min_score: 0, max_score: 0 },
    { grade: 'A', grade_label: 'Good', min_score: 0, max_score: 0 },
    { grade: 'B+', grade_label: 'Developing', min_score: 0, max_score: 0 },
    { grade: 'B', grade_label: 'Needs Improvement', min_score: 0, max_score: 0 },
];

const openEditModal = (param) => {
    editingParam.value = { ...param };
    showEditModal.value = true;
};

const closeEditModal = () => {
    showEditModal.value = false;
    editingParam.value = null;
};

const openNewParamModal = () => {
    editingParam.value = {
        title: '',
        description: '',
        parameter: '', // This will be the slug
        test_display: '',
        ctype: 'Decimal',
        clabel: '',
        video_link: '',
        chart_heading: '',
        chart_format: 'createSectorPlotJS',
        is_active: 1
    };
    showEditModal.value = true;
};

const saveChanges = async () => {
    if (!editingParam.value) return;

    isSaving.value = true;
    try {
        const url = editingParam.value.id
            ? `/api/parameters/${editingParam.value.id}`
            : `/api/parameters`;
        const method = editingParam.value.id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingParam.value)
        });

        const data = await res.json();
        if (data.success) {
            alert(editingParam.value.id ? 'Parameter updated successfully!' : 'New parameter created successfully!');
            await fetchParameters();
            closeEditModal();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (e) {
        console.error(e);
        alert('Could not connect to server.');
    } finally {
        isSaving.value = false;
    }
};

const deleteParameter = async (id) => {
    if (!confirm("Are you sure you want to delete this parameter? This action cannot be undone.")) return;

    try {
        const res = await fetch(`/api/parameters/${id}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
            await fetchParameters();
        } else {
            alert("Error: " + data.message);
        }
    } catch (e) {
        console.error(e);
        alert("Failed to delete parameter.");
    }
};

const fetchGradingConfig = async () => {
    try {
        const res = await fetch('/api/grading-config');
        const data = await res.json();
        if (data.success) {
            gradingTiers.value = data.tiers;
        }
    } catch (e) {
        console.error('Failed to fetch grading config:', e);
    }
};

const saveGradingConfig = async () => {
    isSavingGrading.value = true;
    try {
        const res = await fetch('/api/grading-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tiers: gradingTiers.value })
        });
        const data = await res.json();
        if (data.success) {
            alert('Grading configuration updated successfully!');
            showGradingModal.value = false;
        } else {
            alert('Error: ' + data.message);
        }
    } catch (e) {
        console.error(e);
        alert('Could not save grading configuration.');
    } finally {
        isSavingGrading.value = false;
    }
};

const fetchStandards = async () => {
    try {
        const res = await fetch('/api/standards');
        const data = await res.json();
        if (data.success) {
            standards.value = data.standards;
        }
    } catch (e) {
        console.error('Failed to fetch standards:', e);
    }
};

const openParameterGrades = async (param) => {
    selectedParamForGrades.value = param;
    selectedStdsForGrades.value = [0];
    selectedSourceStd.value = 0;
    showParameterListModal.value = false;
    showParameterGradesModal.value = true;
    await loadParameterGrades();
};

const toggleStdSelection = (stdCode) => {
    const code = parseInt(stdCode);
    const index = selectedStdsForGrades.value.indexOf(code);
    if (index === -1) {
        selectedStdsForGrades.value.push(code);
        // Automatically make the last clicked one the source for loading
        selectedSourceStd.value = code;
        loadParameterGrades();
    } else if (selectedStdsForGrades.value.length > 1) {
        selectedStdsForGrades.value.splice(index, 1);
        if (selectedSourceStd.value === code) {
            selectedSourceStd.value = selectedStdsForGrades.value[0];
            loadParameterGrades();
        }
    }
};

const loadParameterGrades = async () => {
    if (!selectedParamForGrades.value) return;
    isLoadingParameterGrades.value = true;
    try {
        const res = await fetch(`/api/parameter-grades?parameter=${selectedParamForGrades.value.parameter}&std=${selectedSourceStd.value}`);
        const data = await res.json();
        if (data.success && data.grades && data.grades.length > 0) {
            parameterGrades.value = data.grades;
        } else {
            parameterGrades.value = JSON.parse(JSON.stringify(defaultGradesTemplate));
        }
    } catch (e) {
        console.error(e);
        parameterGrades.value = JSON.parse(JSON.stringify(defaultGradesTemplate));
    } finally {
        isLoadingParameterGrades.value = false;
    }
};

const saveParameterGrades = async () => {
    if (!selectedParamForGrades.value || selectedStdsForGrades.value.length === 0) return;
    isSavingParameterGrades.value = true;

    try {
        const payload = {
            parameter: selectedParamForGrades.value.parameter,
            std_codes: selectedStdsForGrades.value,
            grades: parameterGrades.value
        };

        const res = await fetch('/api/parameter-grades/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
            alert(data.message || 'Parameter grades saved successfully!');
            showParameterGradesModal.value = false;
        } else {
            alert('Error: ' + (data.error || data.message));
        }
    } catch (e) {
        console.error(e);
        alert('Failed to save parameter grades');
    } finally {
        isSavingParameterGrades.value = false;
    }
};

const fetchParameters = async () => {
    loading.value = true;
    error.value = null;
    try {
        const res = await fetch('/api/parameters');
        const data = await res.json();
        if (data.success) {
            parameters.value = data.parameters;
        } else {
            error.value = 'Failed to load parameters: ' + data.message;
        }
    } catch (e) {
        error.value = 'Could not connect to server.';
        console.error(e);
    } finally {
        loading.value = false;
    }
};
const paginatedParameters = computed(() => {
    const start = (currentPage.value - 1) * perPage;
    return parameters.value.slice(start, start + perPage);
});
const totalPages = computed(() => Math.ceil(parameters.value.length / perPage));
const getStatusClass = (status) => {
    if (status === 'STABLE' || status === 'Active' || status === 1) {
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    } else if (status === 'PENDING') {
        return 'bg-amber-50 text-amber-700 border-amber-100';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
};
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
onMounted(() => {
    fetchParameters();
    fetchGradingConfig();
    fetchStandards();
});
</script>
<template>
    <div class="px-0 py-2 min-h-screen bg-slate-50 font-inter">
        <div class="max-w-7xl mx-auto w-full px-4 sm:px-6">

            <!-- Dashboard Content Container (Copied from HTML) -->
            <div class="space-y-8">
                <!-- Header Section with Toggles -->
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 class="text-3xl font-extrabold text-[#1a1c1c] tracking-tight font-manrope">System Management
                        </h1>
                        <p class="text-slate-500 mt-2 font-inter max-w-xl text-sm">Configure global settings, academic
                            metrics, and institutional behavior parameters across the entire Quay Professional network.
                        </p>
                    </div>
                    <!-- Toggle Switch (Buttons) -->
                    <div class="inline-flex p-1.5 bg-slate-200/50 rounded-xl shadow-inner">
                        <button
                            class="px-8 py-3 rounded-lg font-bold text-sm transition-all duration-300 flex items-center gap-2 bg-white text-primary shadow-sm ring-1 ring-black/5 font-manrope">
                            <span class="material-symbols-outlined text-[18px]"
                                style="font-variation-settings: 'FILL' 1;">settings_input_component</span>
                            All Parameters
                        </button>
                        <button @click="router.push('/exams/all')"
                            class="px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-manrope">
                            <span class="material-symbols-outlined text-[18px]">assignment</span>
                            All Exams
                        </button>
                    </div>
                </div>

                <!-- Bento Grid of Parameters -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <!-- Grading Scales Card -->
                    <div
                        class="bg-white p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-b-4 border-[#afceff] group hover:shadow-md transition-shadow">
                        <div class="flex items-start justify-between mb-4">
                            <div
                                class="w-10 h-10 flex items-center justify-center bg-[#d4e3ff] text-[#274871] rounded-xl">
                                <span class="material-symbols-outlined text-[20px]">percent</span>
                            </div>
                        </div>
                        <h3 class="font-manrope font-extrabold text-lg text-slate-800 mb-1">Grading Scales</h3>
                        <p class="text-slate-500 text-xs mb-6 font-bold">12 Active schemas configured</p>
                        <div class="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                            <span
                                class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-manrope">Academic
                                Policy</span>
                            <button @click="showParameterListModal = true"
                                class="text-[#274871] text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all font-manrope">
                                Manage <span class="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div
                    class="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                    <div
                        class="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-extrabold text-slate-800 font-manrope">Parameter Repository</h2>
                            <p class="text-sm text-slate-500 mt-1">Manage detailed configuration strings and system
                                constants</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <button
                                class="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 font-manrope">
                                <span class="material-symbols-outlined text-[18px]">filter_list</span>
                                Filter
                            </button>
                            <button @click="openNewParamModal"
                                class="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-[#004a88] shadow-md shadow-primary/20 transition-all flex items-center gap-2 font-manrope">
                                <span class="material-symbols-outlined text-[18px]">add</span>
                                New Parameter
                            </button>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr class="bg-slate-50/50">
                                    <th
                                        class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                                        Parameter Key</th>
                                    <th
                                        class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                                        Description</th>
                                    <th
                                        class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                                        Current Value</th>
                                    <th
                                        class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                                        Data Type</th>
                                    <th
                                        class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                                        Status</th>
                                    <th
                                        class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope text-right">
                                        Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <template v-if="loading">
                                    <tr>
                                        <td colspan="6" class="py-16 text-center">
                                            <div class="flex flex-col items-center justify-center gap-3">
                                                <div
                                                    class="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin">
                                                </div>
                                                <p
                                                    class="text-xs font-bold text-slate-400 font-manrope tracking-widest uppercase">
                                                    Loading parameters...</p>
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                                <template v-else-if="error">
                                    <tr>
                                        <td colspan="6" class="py-16 text-center">
                                            <p class="text-rose-500 font-bold text-sm">{{ error }}</p>
                                        </td>
                                    </tr>
                                </template>
                                <template v-else-if="parameters.length === 0">
                                    <tr>
                                        <td colspan="6" class="py-16 text-center">
                                            <p class="text-slate-400 font-bold text-sm">No parameters found in the
                                                database.</p>
                                        </td>
                                    </tr>
                                </template>
                                <template v-else>
                                    <tr v-for="param in paginatedParameters" :key="param.id"
                                        class="hover:bg-slate-50/50 transition-colors group">
                                        <td class="px-8 py-5">
                                            <div class="font-bold text-primary text-sm font-manrope tracking-tight">
                                                {{ param.title || param.parameter || 'UNKNOWN_KEY' }}
                                            </div>
                                        </td>
                                        <td class="px-8 py-5">
                                            <div class="text-xs text-slate-500 max-w-xs truncate font-medium"
                                                :title="param.description">
                                                {{ param.description || 'No description provided.' }}
                                            </div>
                                        </td>
                                        <td class="px-8 py-5">
                                            <span
                                                class="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] rounded shrink-0 font-bold"
                                                :title="`Unit: ${param.clabel}`">
                                                {{ param.test_display || param.clabel || '--' }}
                                            </span>
                                        </td>
                                        <td class="px-8 py-5">
                                            <div class="text-[11px] font-bold text-slate-400 font-manrope uppercase">
                                                {{ param.ctype || 'Text' }}
                                            </div>
                                        </td>
                                        <td class="px-8 py-5">
                                            <span
                                                :class="['inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider font-manrope', (param.is_active == 1) ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-700 border-slate-200']">
                                                <span
                                                    :class="['w-1.5 h-1.5 rounded-full', (param.is_active == 1) ? 'bg-emerald-500' : 'bg-slate-400']"></span>
                                                {{ (param.is_active == 1) ? 'ACTIVE' : 'INACTIVE' }}
                                            </span>
                                        </td>
                                        <td class="px-8 py-5 text-right flex justify-end gap-2">
                                            <button @click="openEditModal(param)"
                                                class="p-2 text-primary hover:bg-primary/10 rounded-xl border border-transparent hover:border-primary/20 transition-all"
                                                title="Edit Parameter">
                                                <span class="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            <button @click="deleteParameter(param.id)"
                                                class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent transition-all"
                                                title="Delete Parameter">
                                                <span class="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </div>

                    <div class="p-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                            Showing {{ parameters.length > 0 ? (currentPage - 1) * perPage + 1 : 0 }} to {{
                                Math.min(currentPage * perPage,
                                    parameters.length) }} of {{ parameters.length }} parameters
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
            </div>
        </div>
    </div>

    <!-- Edit Parameter Modal -->
    <div v-if="showEditModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
        <div class="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            @click.stop>
            <!-- Modal Header -->
            <div class="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-extrabold text-slate-800 font-manrope">
                        {{ editingParam.id ? 'Edit Parameter' : 'Create New Parameter' }}
                    </h2>
                    <p v-if="editingParam.id" class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        ID: {{
                            editingParam.id }} • {{ editingParam.parameter }}</p>
                    <p v-else class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">New System
                        Constant
                    </p>
                </div>
                <button @click="closeEditModal"
                    class="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-slate-400">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar font-inter">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Left Column -->
                    <div class="space-y-6">
                        <div class="space-y-2">
                            <label
                                class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Title*</label>
                            <input v-model="editingParam.title"
                                @input="!editingParam.id && (editingParam.parameter = editingParam.title.toLowerCase().replace(/\s+/g, '_'))"
                                type="text"
                                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold text-slate-700 outline-none"
                                placeholder="e.g., Speed">
                        </div>

                        <div v-if="!editingParam.id" class="space-y-2">
                            <label
                                class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">System
                                Key (Parameter Name)*</label>
                            <input v-model="editingParam.parameter" type="text"
                                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold text-slate-700 outline-none"
                                placeholder="e.g., vertical_jump">
                        </div>

                        <div class="space-y-2">
                            <label
                                class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Description</label>
                            <textarea v-model="editingParam.description" rows="4"
                                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-slate-600 outline-none resize-none"
                                placeholder="Detail the parameter's purpose..."></textarea>
                        </div>

                        <div class="space-y-2">
                            <label
                                class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Test
                                Display Name</label>
                            <input v-model="editingParam.test_display" type="text"
                                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold text-slate-700 outline-none"
                                placeholder="e.g., 50-Yards Dash">
                            <p class="text-[10px] text-slate-400 font-medium ml-1">Displayed in report columns.</p>
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div class="space-y-6">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label
                                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Data
                                    Type</label>
                                <select v-model="editingParam.ctype"
                                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-slate-700 outline-none cursor-pointer">
                                    <option value="Decimal">Decimal</option>
                                    <option value="Integer">Integer</option>
                                    <option value="Text">Text</option>
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label
                                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Measured
                                    In</label>
                                <input v-model="editingParam.clabel" type="text"
                                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold text-slate-700 outline-none"
                                    placeholder="e.g., Seconds / Minutes">
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label
                                class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">YouTube
                                Video Link</label>
                            <input v-model="editingParam.video_link" type="text"
                                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold text-slate-700 outline-none"
                                placeholder="https://youtube.com/...">
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label
                                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Heading
                                    Above Chart</label>
                                <input v-model="editingParam.chart_heading" type="text"
                                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold text-slate-700 outline-none"
                                    placeholder="Chart Title">
                            </div>
                            <div class="space-y-2">
                                <label
                                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Chart
                                    Format</label>
                                <select v-model="editingParam.chart_format"
                                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-slate-700 outline-none cursor-pointer">
                                    <option value="createSectorPlotJS">Sector Plot</option>
                                    <option value="lineChart">Line Chart</option>
                                    <option value="barChart">Bar Chart</option>
                                </select>
                            </div>
                        </div>

                        <div
                            class="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                            <div>
                                <p class="text-xs font-extra-bold text-slate-800 font-manrope">Status</p>
                                <p class="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{{
                                    editingParam.is_active == 1 ? 'Parameter Active' : 'Parameter Inactive' }}</p>
                            </div>
                            <button @click="editingParam.is_active = (editingParam.is_active == 1 ? 0 : 1)"
                                :class="['w-12 h-6 rounded-full p-1 transition-all duration-300 relative', editingParam.is_active == 1 ? 'bg-primary' : 'bg-slate-300']">
                                <div
                                    :class="['w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm', editingParam.is_active == 1 ? 'translate-x-6' : 'translate-x-0']">
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button @click="closeEditModal"
                    class="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest font-manrope">Cancel</button>
                <button @click="saveChanges" :disabled="isSaving"
                    class="px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:bg-[#004a88] transition-all flex items-center gap-2 font-manrope disabled:opacity-50">
                    <template v-if="isSaving">
                        <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                    </template>
                    <template v-else>
                        {{ editingParam.id ? 'Save Changes' : 'Create Parameter' }}
                    </template>
                </button>
            </div>
        </div>
    </div>

    <!-- Grading Scales Modal (Performance Levels) -->
    <div v-if="showGradingModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
        <div class="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            @click.stop>
            <!-- Modal Header -->
            <div class="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-extrabold text-slate-800 font-manrope tracking-tight">Configure Performance
                        Levels</h2>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Define thresholds and
                        behavioral descriptors</p>
                </div>
                <button @click="showGradingModal = false"
                    class="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-slate-400">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar font-inter">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div v-for="tier in gradingTiers" :key="tier.id"
                        :class="['p-6 rounded-2xl bg-white border-l-4 shadow-sm transition-all hover:shadow-md h-full', tier.color === 'green' ? 'border-emerald-500' : tier.color === 'blue' ? 'border-primary' : tier.color === 'amber' ? 'border-amber-500' : 'border-rose-500']">

                        <div class="flex items-center gap-3 mb-5">
                            <div
                                :class="['w-10 h-10 rounded-xl flex items-center justify-center', tier.color === 'green' ? 'bg-emerald-50 text-emerald-600' : tier.color === 'blue' ? 'bg-blue-50 text-primary' : tier.color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600']">
                                <span class="material-symbols-outlined text-[20px]">{{ tier.icon }}</span>
                            </div>
                            <h3 class="font-manrope font-extrabold text-lg">{{ tier.name }}</h3>
                        </div>

                        <div class="space-y-5">
                            <div class="space-y-2">
                                <label
                                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Range
                                    Threshold</label>
                                <div class="flex items-center gap-3">
                                    <template v-if="tier.name === 'Needs Improvement'">
                                        <span
                                            class="text-sm font-bold text-slate-400 uppercase tracking-widest font-manrope">Below</span>
                                        <div class="flex-1 flex items-center gap-2">
                                            <input v-model="tier.max_percent" type="number"
                                                class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-slate-700 outline-none">
                                            <span class="text-sm font-bold text-slate-400">%</span>
                                        </div>
                                    </template>
                                    <template v-else>
                                        <div class="flex-1 flex items-center gap-2">
                                            <input v-model="tier.min_percent" type="number"
                                                class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-slate-700 outline-none">
                                            <span class="text-sm font-bold text-slate-400">%</span>
                                        </div>
                                        <span class="text-slate-300">—</span>
                                        <div class="flex-1 flex items-center gap-2">
                                            <input v-model="tier.max_percent" type="number"
                                                class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-slate-700 outline-none">
                                            <span class="text-sm font-bold text-slate-400">%</span>
                                        </div>
                                    </template>
                                </div>
                            </div>

                            <div class="space-y-2">
                                <label
                                    class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Behavioral
                                    Descriptor</label>
                                <textarea v-model="tier.descriptor" rows="3"
                                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-semibold text-slate-600 outline-none resize-none leading-relaxed"
                                    placeholder="Describe this level..."></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button @click="showGradingModal = false"
                    class="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest font-manrope font-bold">Cancel</button>
                <button @click="saveGradingConfig" :disabled="isSavingGrading"
                    class="px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:bg-[#004a88] transition-all flex items-center gap-2 font-manrope font-extrabold disabled:opacity-50">
                    <template v-if="isSavingGrading">
                        <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                    </template>
                    <template v-else>
                        Save Changes
                    </template>
                </button>
            </div>
        </div>
    </div>

    <!-- Parameter Selection Modal -->
    <div v-if="showParameterListModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
        <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            @click.stop>
            <div class="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-extrabold text-slate-800 font-manrope">Select a Parameter</h2>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configure grading limits</p>
                </div>
                <button @click="showParameterListModal = false"
                    class="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-slate-400">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar font-inter space-y-3">
                <button v-for="param in parameters" :key="param.id" @click="openParameterGrades(param)"
                    class="w-full p-4 rounded-2xl border border-slate-100 bg-white hover:border-primary/30 hover:shadow-md transition-all text-left flex items-center justify-between group">
                    <div>
                        <h4 class="font-extrabold text-slate-800 font-manrope text-sm">{{ param.title || param.parameter }}</h4>
                        <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase">{{ param.parameter }} • {{ param.ctype }}</p>
                    </div>
                    <span class="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Parameter Grades Config Modal -->
    <div v-if="showParameterGradesModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
        <div class="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            @click.stop>
            <div class="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-extrabold text-[#005daa] font-manrope">Limits: {{ selectedParamForGrades?.title }}</h2>
                    <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{{ selectedParamForGrades?.parameter }}</p>
                </div>
                <button @click="showParameterGradesModal = false"
                    class="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-slate-400">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <div class="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar font-inter">
                <!-- Standard Selection Box -->
                <div class="mb-8">
                    <div class="flex items-center justify-between mb-3">
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">
                            Applied Standards (Click to Select Multiple)
                        </label>
                        <span class="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-full uppercase">
                            Source: Standard {{ standards.find(s => s.std_code === selectedSourceStd)?.name || 'Default' }}
                        </span>
                    </div>
                    
                    <div class="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <button @click="toggleStdSelection(0)"
                            :class="['px-4 py-2 rounded-xl text-xs font-bold transition-all border', 
                                    selectedStdsForGrades.includes(0) 
                                    ? 'bg-primary text-white border-primary shadow-md' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-primary/30']">
                            Default (0)
                        </button>
                        
                        <button v-for="std in standards" :key="std.id" @click="toggleStdSelection(std.std_code)"
                            :class="['px-4 py-2 rounded-xl text-xs font-bold transition-all border', 
                                    selectedStdsForGrades.includes(parseInt(std.std_code))
                                    ? 'bg-primary text-white border-primary shadow-md' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-primary/30']">
                            Std {{ std.name }}
                        </button>
                    </div>
                    <p class="text-[10px] text-slate-400 font-medium mt-2 ml-1 italic">
                        * Clicking a standard toggles it. The most recently selected standard serves as the template for the ranges below.
                    </p>
                </div>
                
                <template v-if="isLoadingParameterGrades">
                    <div class="py-12 flex justify-center">
                        <div class="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                    </div>
                </template>
                <template v-else>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div v-for="(gradeInfo, idx) in parameterGrades" :key="idx"
                            class="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex-1 space-y-3">
                                    <div class="flex items-center gap-2">
                                        <input v-model="gradeInfo.grade_label" type="text" placeholder="e.g. Excellent"
                                            class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none focus:border-primary">
                                        <input v-model="gradeInfo.grade" type="text" placeholder="e.g. A+"
                                            class="w-16 px-3 py-1.5 bg-primary/5 text-primary border border-primary/20 rounded-lg font-extrabold text-sm uppercase text-center outline-none focus:bg-primary/10">
                                    </div>
                                </div>
                                <button @click="parameterGrades.splice(idx, 1)" class="ml-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all h-fit">
                                    <span class="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Min. Score</label>
                                    <input v-model="gradeInfo.min_score" type="number" step="0.01"
                                        class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-slate-700 outline-none">
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Max. Score</label>
                                    <input v-model="gradeInfo.max_score" type="number" step="0.01"
                                        class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-slate-700 outline-none">
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            <!-- Modal Footer -->
            <div class="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div>
                   <button @click="parameterGrades.push({grade: '', grade_label: '', min_score: 0, max_score: 0})"
                        class="px-4 py-2 text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/5 rounded-xl transition-colors font-manrope flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">add</span> Add Grade Config
                   </button>
                </div>
                <div class="flex items-center gap-3">
                    <button @click="showParameterGradesModal = false"
                        class="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest font-manrope">Cancel</button>
                    <button @click="saveParameterGrades" :disabled="isSavingParameterGrades || isLoadingParameterGrades"
                        class="px-8 py-2.5 bg-[#005daa] text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:bg-[#004a88] transition-all flex items-center gap-2 font-manrope disabled:opacity-50">
                        <template v-if="isSavingParameterGrades">
                            <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Saving...
                        </template>
                        <template v-else>
                            Save Limits
                        </template>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
