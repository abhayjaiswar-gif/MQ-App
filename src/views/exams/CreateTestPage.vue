<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const editId = ref(route.params.id || null);

const form = reactive({
    test_name: '',
    test_title: '',
    is_active: 1
});

const allParameters = ref([]);
const selectedParameters = ref([]); // Array of { parameter_id, order, required }
const loading = ref(true);
const isSaving = ref(false);

const fetchAllParameters = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/parameters');
        const data = await res.json();
        if (data.success) {
            allParameters.value = data.parameters.map(p => ({
                ...p,
                selected: false,
                order: 1,
                required: true
            }));
        }
    } catch (e) {
        console.error('Fetch parameters error:', e);
    }
};

const fetchFormatDetails = async (id) => {
    try {
        const res = await fetch(`http://localhost:3000/api/exam-formats/${id}`);
        const data = await res.json();
        if (data.success) {
            form.test_name = data.format.test_name;
            form.test_title = data.format.test_title;
            form.is_active = data.format.is_active;

            // Sync with allParameters
            data.selectedParameters.forEach(sp => {
                const p = allParameters.value.find(ap => ap.id === sp.parameter_id);
                if (p) {
                    p.selected = true;
                    p.order = sp.parameter_order;
                    p.required = sp.is_required === 1;
                }
            });
        }
    } catch (e) {
        console.error('Fetch format error:', e);
    }
};

onMounted(async () => {
    await fetchAllParameters();
    if (editId.value) {
        await fetchFormatDetails(editId.value);
    }
    loading.value = false;
});

const selectedCount = computed(() => allParameters.value.filter(p => p.selected).length);

const handleSubmit = async () => {
    if (selectedCount.value === 0) {
        alert('Please select at least one parameter.');
        return;
    }
    if (selectedCount.value > 12) {
        alert('Maximum 12 parameters allowed.');
        return;
    }

    isSaving.value = true;
    const formData = new FormData();
    formData.append('test_name', form.test_name);
    formData.append('test_title', form.test_title);
    formData.append('is_active', form.is_active);

    const paramsToSync = allParameters.value
        .filter(p => p.selected)
        .map(p => ({
            parameter_id: p.id,
            parameter_order: p.order,
            is_required: p.required ? 1 : 0
        }));
    
    formData.append('parameters', JSON.stringify(paramsToSync));

    try {
        const url = editId.value 
            ? `http://localhost:3000/api/exam-formats/${editId.value}`
            : 'http://localhost:3000/api/exam-formats';
        const method = editId.value ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            alert(editId.value ? 'Test format updated successfully!' : 'Test format created successfully!');
            router.push('/exams/all');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (e) {
        console.error('Submit error:', e);
        alert('Failed to save assessment template.');
    } finally {
        isSaving.value = false;
    }
};

const cancel = () => {
    router.push('/exams/all');
};
</script>

<template>
    <div class="px-0 py-2 min-h-screen bg-slate-50 font-inter">
        <div class="max-w-5xl mx-auto w-full px-4 sm:px-6">
            <!-- Page Header -->
            <div class="mb-10">
                <h2 class="text-3xl font-extrabold text-[#1a1c1c] tracking-tight font-manrope mb-2">
                    {{ editId ? 'Edit' : 'Create' }} Test & Select Parameters
                </h2>
                <p class="text-slate-500 max-w-2xl text-sm">Configure your assessment criteria. Ensure all fields are completed accurately.</p>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex items-center justify-center p-20 bg-white rounded-2xl shadow-sm border border-slate-100 italic text-slate-400">
                Loading configuration data...
            </div>

            <!-- Form Container -->
            <div v-else class="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                <form @submit.prevent="handleSubmit">
                    <!-- Section 1: Basic Info -->
                    <div class="p-8 border-b border-slate-100">
                        <div class="flex items-center gap-3 mb-8">
                            <span class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">01</span>
                            <h3 class="text-lg font-extrabold text-slate-800 font-manrope">Basic Information</h3>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div class="space-y-2">
                                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Test Name*</label>
                                <input v-model="form.test_name"
                                    class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 bg-slate-50/50 outline-none transition-all text-sm font-medium"
                                    placeholder="e.g. Mid-Season Performance" required type="text" />
                            </div>
                            <div class="space-y-2">
                                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Report Title*</label>
                                <input v-model="form.test_title"
                                    class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 bg-slate-50/50 outline-none transition-all text-sm font-medium"
                                    placeholder="e.g. Athlete Technical Profile" required type="text" />
                            </div>
                        </div>
                    </div>

                    <!-- Section 2: Parameters -->
                    <div class="p-8">
                        <div class="flex items-center justify-between mb-10">
                            <div class="flex items-center gap-3">
                                <span class="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">02</span>
                                <h3 class="text-lg font-extrabold text-slate-800 font-manrope">Select Parameters <span
                                        class="text-slate-400 font-bold text-sm ml-2 uppercase tracking-widest">(Max 12)</span></h3>
                            </div>
                            <div
                                :class="['px-4 py-1.5 text-xs font-bold rounded-xl shadow-sm border font-manrope', selectedCount > 12 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100']">
                                {{ selectedCount }} / 12 Selected
                            </div>
                        </div>
                        <div class="overflow-hidden border border-slate-100 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-slate-50/50 border-b border-slate-100">
                                        <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope w-16 text-center">Select</th>
                                        <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Parameter</th>
                                        <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope w-32">Order</th>
                                        <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope w-32 text-center">Required</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    <tr v-for="param in allParameters" :key="param.id" class="hover:bg-slate-50/30 transition-all group">
                                        <td class="px-8 py-5 text-center">
                                            <div class="flex items-center justify-center">
                                                <input v-model="param.selected"
                                                    class="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer transition-all"
                                                    type="checkbox" />
                                            </div>
                                        </td>
                                        <td class="px-8 py-5" :class="{'opacity-50 text-slate-400': !param.selected}">
                                            <div class="flex items-center gap-4">
                                                <span class="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-[20px]">drag_indicator</span>
                                                <span class="text-sm font-bold text-slate-800 font-manrope">{{ param.title || param.parameter }}</span>
                                                <span class="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-tighter">{{ param.ctype }}</span>
                                            </div>
                                        </td>
                                        <td class="px-8 py-5">
                                            <input v-model.number="param.order" :disabled="!param.selected"
                                                class="w-16 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-center focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                type="number" min="1" max="12" />
                                        </td>
                                        <td class="px-8 py-5 text-center">
                                            <label class="inline-flex items-center cursor-pointer" :class="{'opacity-30 cursor-not-allowed pointer-events-none': !param.selected}">
                                                <input v-model="param.required" class="sr-only peer" type="checkbox" :disabled="!param.selected" />
                                                <div class="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary relative"></div>
                                            </label>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Footer Actions -->
                    <div class="px-10 py-8 bg-slate-50/50 flex items-center justify-end gap-5 border-t border-slate-100">
                        <button @click="cancel"
                            class="px-10 py-3 rounded-2xl text-xs font-extrabold text-slate-500 hover:bg-slate-200/50 transition-all font-manrope uppercase tracking-widest"
                            type="button">Cancel</button>
                        <button :disabled="isSaving"
                            class="px-12 py-3.5 rounded-2xl text-xs font-extrabold text-white bg-primary shadow-xl shadow-primary/20 hover:shadow-2xl hover:bg-[#004a88] transition-all disabled:opacity-50 flex items-center gap-3 font-manrope uppercase tracking-widest">
                            <span v-if="isSaving" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            {{ editId ? 'Update' : 'Create' }} Test Format
                        </button>
                    </div>
                </form>
            </div>

            <!-- Configuration Info -->
            <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                <div class="p-6 bg-[#005faa]/5 rounded-2xl border border-primary/10 flex items-start gap-4">
                    <span class="material-symbols-outlined text-primary mt-0.5 text-[22px]">info</span>
                    <div>
                        <h4 class="text-sm font-bold text-primary font-manrope mb-1">Priority Ordering</h4>
                        <p class="text-[11px] text-primary/70 font-medium leading-relaxed uppercase tracking-tight">The 'Order' field determines how parameters appear in the final PDF report. Use 1 for top position.</p>
                    </div>
                </div>
                <div class="p-6 bg-slate-100/50 rounded-2xl flex items-start gap-4 border border-slate-200/50">
                    <span class="material-symbols-outlined text-slate-400 mt-0.5 text-[22px]">auto_stories</span>
                    <div>
                        <h4 class="text-sm font-bold text-slate-700 font-manrope mb-1">Parameter Requirements</h4>
                        <p class="text-[11px] text-slate-500 font-medium leading-relaxed uppercase tracking-tight">Mandatory parameters must be filled by coaches before a student's final report can be generated.</p>
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
