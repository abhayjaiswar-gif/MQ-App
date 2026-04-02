<script setup>
import { ref, onMounted, watch } from 'vue';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const toastMessage = ref('');
const toastType = ref('success');

const showToast = (message, type = 'success') => {
    toastMessage.value = message;
    toastType.value = type;
    setTimeout(() => {
        toastMessage.value = '';
    }, 4000); // Auto-hide after 4 seconds
};

const examFormats = ref([]);
const schoolsList = ref([]);
const standardsList = ref([]);
const divisionsList = ref([]);
const termsList = ref([]);

const selectedFormatId = ref(null);
const selectedSchoolId = ref(null);
const selectedStandard = ref(null);
const selectedDivision = ref(null);
const selectedTerm = ref(null);

const parameters = ref([]);
const students = ref([]);
const ranges = ref([]);

const loading = ref(false);
const isSavingAll = ref(false);
const bulkUploadInput = ref(null);

// ─────────────────────────────
// FETCH FILTERS
// ─────────────────────────────
const fetchFilters = async (schoolId = null) => {
    try {
        const formatRes = await fetch('http://localhost:3000/api/exam-formats');
        const formatData = await formatRes.json();
        if (formatData.success) examFormats.value = formatData.formats;

        const url = schoolId
            ? `http://localhost:3000/api/fill-marks/filters?school_id=${schoolId}`
            : 'http://localhost:3000/api/fill-marks/filters';

        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
            schoolsList.value = data.filters.schools;
            standardsList.value = data.filters.standards;
            divisionsList.value = data.filters.divisions;
            termsList.value = data.filters.terms;
        }
    } catch (e) {
        console.error(e);
    }
};

// ─────────────────────────────
// FETCH PARAMETERS
// ─────────────────────────────
const fetchParameters = async () => {
    if (!selectedFormatId.value) return;

    try {
        const res = await fetch(`http://localhost:3000/api/fill-marks/format/${selectedFormatId.value}`);
        const data = await res.json();

        if (data.success) parameters.value = data.parameters;
    } catch (e) {
        console.error(e);
    }
};

// ─────────────────────────────
// FETCH STUDENTS
// ─────────────────────────────
const fetchStudentsWithMarks = async () => {
    if (!selectedFormatId.value || !selectedSchoolId.value || !selectedStandard.value || !selectedDivision.value || !selectedTerm.value) return;

    loading.value = true;

    try {
        const res = await fetch(
            `http://localhost:3000/api/fill-marks/students?school_id=${selectedSchoolId.value}&std=${selectedStandard.value}&division=${selectedDivision.value}&format_id=${selectedFormatId.value}&term=${selectedTerm.value}`
        );

        const data = await res.json();

        if (data.success) {
            students.value = data.students.map(s => {
                const marks = s.marks || {};

                Object.keys(marks).forEach(pId => {
                    const param = parameters.value.find(p => p.id === parseInt(pId));

                    if (param && (param.ctype === 'Yes/No' || param.ctype === 'Boolean')) {
                        if (marks[pId] == 1 || marks[pId] === '1.00') marks[pId] = 'Yes';
                        else if (marks[pId] == 0 || marks[pId] === '0.00') marks[pId] = 'No';
                    }
                });

                return { ...s, marks };
            });

            ranges.value = data.ranges || [];
        }

    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

// ─────────────────────────────
// RANGE TEXT
// ─────────────────────────────
const getRangeText = (paramId) => {
    const range = ranges.value.find(r => r.parameter_id == paramId);
    if (!range) return '';

    const minValue = parseFloat(range.min_val);
    const maxValue = parseFloat(range.max_val);

    if (!isNaN(minValue) || !isNaN(maxValue)) {
        return `Range: ${minValue} - ${maxValue}`;
    }

    return '';
};

// ─────────────────────────────
// VALIDATION (GENDER AWARE)
// ─────────────────────────────
const isInvalid = (student, paramId, value) => {
    if (value === '' || value === null || value === undefined) return false;

    const range = ranges.value.find(r => r.parameter_id == paramId);
    if (!range) return false;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return true;

    const minValue = parseFloat(range.min_val);
    const maxValue = parseFloat(range.max_val);

    const hasMin = !isNaN(minValue);
    const hasMax = !isNaN(maxValue);

    if (hasMin && numValue < minValue) return true;
    if (hasMax && numValue > maxValue) return true;

    return false;
};

const hasInvalidMarks = (student) => {
    if (!student.marks) return false;
    for (const param of parameters.value) {
        if (isInvalid(student, param.id, student.marks[param.id])) {
            return true;
        }
    }
    return false;
};

// ─────────────────────────────
// SUBMIT ALL (PHP-COMPATIBLE BATCH)
// ─────────────────────────────
const submitAll = async () => {
    if (students.value.length === 0) return;

    // (REMOVED VALIDATION BLOCK TO ALLOW SAVING OUT-OF-RANGE MARKS AS REQUESTED)

    isSavingAll.value = true;

    try {
        // Build flat marks array: [{student_id, parameter_id, value}, ...]
        const marksArray = [];
        students.value.forEach(student => {
            Object.entries(student.marks || {}).forEach(([paramId, value]) => {
                if (value === '' || value === null || value === undefined) return;
                marksArray.push({
                    student_id: student.id,
                    parameter_id: parseInt(paramId),
                    value: String(value)
                });
            });
        });

        if (marksArray.length === 0) {
            showToast('No marks to save', 'error');
            return;
        }

        const res = await fetch('http://localhost:3000/api/fill-marks/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                format_id: selectedFormatId.value,
                school_id: selectedSchoolId.value,
                std: selectedStandard.value,
                division: selectedDivision.value,
                term: selectedTerm.value,
                entry_mode: 'division',
                examiner_name: '',
                marks: marksArray
            })
        });

        const data = await res.json();
        if (data.success) {
            showToast('Progress saved successfully!', 'success');
        } else {
            showToast('Error: ' + (data.message || data.error || 'Unknown error'), 'error');
        }

    } catch (e) {
        console.error(e);
        showToast('Network error saving marks', 'error');
    } finally {
        isSavingAll.value = false;
    }
};

// ─────────────────────────────
// AI FILL
// ─────────────────────────────
const aiFillMarks = () => {
    students.value.forEach(student => {
        parameters.value.forEach(param => {
            if (param.ctype === 'Yes/No' || param.ctype === 'Boolean') {
                student.marks[param.id] = Math.random() > 0.5 ? 'Yes' : 'No';
            } else {
                const range = ranges.value.find(r => r.parameter_id === param.id);
                const min = range ? (range.min_male ?? range.min_female ?? 0) : 10;
                const max = range ? (range.max_male ?? range.max_female ?? 50) : 100;

                const val = (Math.random() * (max - min) + min).toFixed(1);
                student.marks[param.id] = parseFloat(val);
            }
        });
    });

    showToast('AI filled marks!', 'success');
};

// ─────────────────────────────
// EXPORT TEMPLATE
// ─────────────────────────────
const exportTemplate = async () => {
    if (students.value.length === 0 || parameters.value.length === 0) {
        showToast('Load students and parameters first', 'error');
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Mark Entry');

    // ── Title Row ──
    const schoolName = schoolsList.value.find(s => s.id === selectedSchoolId.value)?.name || 'School';
    const formatName = examFormats.value.find(f => f.id === selectedFormatId.value)?.test_name || 'Exam';
    sheet.mergeCells(1, 1, 1, 4 + parameters.value.length);
    const titleCell = sheet.getCell('A1');
    titleCell.value = `${formatName} — ${schoolName} — Std ${selectedStandard.value} / Div ${selectedDivision.value} — ${selectedTerm.value}`;
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF003C71' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
    sheet.getRow(1).height = 36;

    // ── Header Row ──
    const headerRow = sheet.getRow(3);
    const headers = ['Sr.', 'Student Name', 'MQ ID', 'Std / Div', ...parameters.value.map(p => p.title)];
    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003C71' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF003C71' } },
            bottom: { style: 'thin', color: { argb: 'FF003C71' } },
            left: { style: 'thin', color: { argb: 'FFD0D5DD' } },
            right: { style: 'thin', color: { argb: 'FFD0D5DD' } }
        };
    });
    headerRow.height = 28;

    // ── Range Row ──
    const rangeRow = sheet.getRow(4);
    rangeRow.getCell(1).value = '';
    rangeRow.getCell(2).value = '';
    rangeRow.getCell(3).value = '';
    rangeRow.getCell(4).value = '';
    parameters.value.forEach((p, i) => {
        const rangeText = getRangeText(p.id);
        const cell = rangeRow.getCell(5 + i);
        cell.value = rangeText ? `(${rangeText})` : '';
        cell.font = { name: 'Calibri', size: 8, italic: true, color: { argb: 'FF6B7280' } };
        cell.alignment = { horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
    });

    // ── Student Data Rows ──
    students.value.forEach((student, idx) => {
        const row = sheet.getRow(5 + idx);
        row.getCell(1).value = idx + 1;
        row.getCell(2).value = student.name;
        row.getCell(3).value = student.mq_id;
        row.getCell(4).value = `${student.std} / ${student.division}`;

        parameters.value.forEach((p, pi) => {
            const cell = row.getCell(5 + pi);
            const existingVal = student.marks?.[p.id];
            cell.value = existingVal ?? '';

            if (p.ctype === 'Yes/No' || p.ctype === 'Boolean') {
                cell.dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: ['"Yes,No"']
                };
            }

            cell.alignment = { horizontal: 'center' };
            cell.border = {
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
            };
        });

        // Zebra striping
        if (idx % 2 === 1) {
            for (let c = 1; c <= 4 + parameters.value.length; c++) {
                row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
            }
        }
    });

    // ── Column Widths ──
    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 28;
    sheet.getColumn(3).width = 14;
    sheet.getColumn(4).width = 12;
    parameters.value.forEach((_, i) => { sheet.getColumn(5 + i).width = 16; });

    // ── Download ──
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Marks_Template_${selectedStandard.value}_${selectedDivision.value}_${selectedTerm.value}.xlsx`);
};

// ─────────────────────────────
// TRIGGER BULK UPLOAD
// ─────────────────────────────
const triggerBulkUpload = () => {
    bulkUploadInput.value?.click();
};

// ─────────────────────────────
// EXCEL IMPORT FIXED
// ─────────────────────────────
const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file);
    const sheet = workbook.worksheets[0];

    let headerRowIdx = -1;

    sheet.eachRow((row, rowNumber) => {
        if (row.getCell(3).value === 'MQ ID') headerRowIdx = rowNumber;
    });

    if (headerRowIdx === -1) {
        showToast('Invalid template uploaded', 'error');
        return;
    }

    const headers = sheet.getRow(headerRowIdx);

    sheet.eachRow((row, rowNumber) => {
        if (rowNumber <= headerRowIdx + 1) return;

        const mqId = row.getCell(3).value;
        const student = students.value.find(s => s.mq_id === mqId);

        if (student) {
            parameters.value.forEach(p => {
                let colIdx = -1;

                headers.eachCell((cell, cIdx) => {
                    if (cell.value && cell.value.toString().trim() === p.title) {
                        colIdx = cIdx;
                    }
                });

                if (colIdx !== -1) {
                    let value;

                    if (p.title.includes('BMI') || p.title.includes('Flexibility')) {
                        const cell = row.getCell(colIdx + 2);
                        value = cell.result ?? cell.value;
                    } else {
                        value = row.getCell(colIdx).value;
                    }

                    if (p.ctype === 'Yes/No' || p.ctype === 'Boolean') {
                        if (String(value).toLowerCase().startsWith('y')) value = 'Yes';
                        else if (String(value).toLowerCase().startsWith('n')) value = 'No';
                    }

                    if (value !== null && value !== undefined) {
                        student.marks[p.id] = value;
                    }
                }
            });
        }
    });

    showToast('Excel data imported successfully!', 'success');
    event.target.value = '';
};

// ─────────────────────────────
// WATCHERS (OPTIMIZED)
// ─────────────────────────────
watch(selectedFormatId, async () => {
    await fetchParameters();
    await fetchStudentsWithMarks();
});

watch(selectedSchoolId, async (val) => {
    selectedStandard.value = null;
    selectedDivision.value = null;

    await fetchFilters(val);
    await fetchStudentsWithMarks();
});

watch([selectedStandard, selectedDivision, selectedTerm], fetchStudentsWithMarks);

// ─────────────────────────────
onMounted(fetchFilters);
</script>
<template>
    <div class="bg-surface text-on-surface antialiased flex min-h-screen overflow-hidden font-inter text-sm relative">
        <!-- Custom Toast Notification -->
        <div v-if="toastMessage" 
            class="fixed bottom-8 right-8 z-[9999] px-6 py-4 rounded-2xl shadow-xl border font-manrope font-extrabold flex items-center gap-3 transition-all duration-300 animate-in slide-in-from-bottom-8 fade-in"
            :class="toastType === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'">
            <span class="material-symbols-outlined text-[24px]">
                {{ toastType === 'success' ? 'check_circle' : 'error' }}
            </span>
            <span class="text-sm tracking-tight">{{ toastMessage }}</span>
        </div>

        <main class="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar pb-20">
            <div class="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <nav class="flex text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            <span>Records</span>
                            <span class="mx-2">/</span>
                            <span class="text-primary">Mark Entry</span>
                        </nav>
                        <h1 class="text-3xl font-extrabold text-on-surface tracking-tight font-manrope">Student Grading
                            Terminal</h1>
                        <p class="text-on-surface-variant text-sm mt-1">Configure parameters and record academic
                            performance metrics.</p>
                    </div>
                    <div class="flex flex-wrap gap-3">
                        <button @click="aiFillMarks"
                            class="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg shadow-lg shadow-purple-200 transition-all uppercase tracking-widest font-manrope">
                            <span class="material-symbols-outlined text-[18px]">psychology</span>
                            AI Fill Marks
                        </button>
                        <button @click="exportTemplate"
                            class="flex items-center gap-2 px-4 py-2 text-xs font-bold text-primary bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all uppercase tracking-widest font-manrope shadow-sm">
                            <span class="material-symbols-outlined text-[18px]">download</span>
                            Export Template
                        </button>
                        <button @click="triggerBulkUpload"
                            class="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-[#004a88] rounded-lg shadow-sm transition-all uppercase tracking-widest font-manrope">
                            <span class="material-symbols-outlined text-[18px]">upload</span>
                            Bulk Upload
                        </button>
                        <input type="file" ref="bulkUploadInput" class="hidden" accept=".xlsx, .xls"
                            @change="handleBulkUpload" />
                    </div>
                </div>

                <!-- Filters -->
                <section
                    class="bg-white p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,28,58,0.06)] border border-slate-100 backdrop-blur-sm bg-white/80">
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div class="space-y-2">
                            <label
                                class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-manrope flex items-center gap-1.5">
                                Exam Type
                                <span v-if="!selectedFormatId"
                                    class="w-1 h-1 rounded-full bg-red-400 animate-pulse"></span>
                            </label>
                            <select v-model="selectedFormatId"
                                class="w-full px-3 py-2.5 bg-slate-50/50 text-xs border-none rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-primary appearance-none outline-none font-bold transition-all text-slate-700">
                                <option :value="null" disabled>Select Exam Type</option>
                                <option v-for="item in examFormats" :key="item.id" :value="item.id">{{ item.test_name }}
                                </option>
                            </select>
                        </div>

                        <div class="space-y-2">
                            <label
                                class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-manrope flex items-center gap-1.5">School
                                Entity</label>
                            <select v-model="selectedSchoolId"
                                class="w-full px-3 py-2.5 bg-slate-50/50 text-xs border-none rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-primary appearance-none outline-none font-bold transition-all text-slate-700">
                                <option :value="null" disabled>Select School</option>
                                <option v-for="item in schoolsList" :key="item.id" :value="item.id">{{ item.name }}
                                </option>
                            </select>
                        </div>

                        <div class="space-y-2">
                            <label
                                class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-manrope flex items-center gap-1.5">Standard</label>
                            <select v-model="selectedStandard"
                                class="w-full px-3 py-2.5 bg-slate-50/50 text-xs border-none rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-primary appearance-none outline-none font-bold transition-all text-slate-700">
                                <option :value="null" disabled>Select Standard</option>
                                <option v-for="item in standardsList" :key="item.id" :value="item.id">{{ item.name }}
                                </option>
                            </select>
                        </div>

                        <div class="space-y-2">
                            <label
                                class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-manrope flex items-center gap-1.5">Division</label>
                            <select v-model="selectedDivision"
                                class="w-full px-3 py-2.5 bg-slate-50/50 text-xs border-none rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-primary appearance-none outline-none font-bold transition-all text-slate-700">
                                <option :value="null" disabled>Select Division</option>
                                <option v-for="item in divisionsList" :key="item" :value="item">{{ item }}</option>
                            </select>
                        </div>

                        <div class="space-y-2">
                            <label
                                class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-manrope flex items-center gap-1.5">Academic
                                Term</label>
                            <select v-model="selectedTerm"
                                class="w-full px-3 py-2.5 bg-slate-50/50 text-xs border-none rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-primary appearance-none outline-none font-bold transition-all text-slate-700">
                                <option :value="null" disabled>Select Term</option>
                                <option v-for="item in termsList" :key="item" :value="item">{{ item }}</option>
                            </select>
                        </div>
                    </div>
                </section>

                <!-- Grading Table -->
                <section
                    class="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,28,58,0.06)] overflow-hidden border border-slate-100 flex flex-col min-h-[400px]">
                    <div class="overflow-x-auto flex-1">
                        <table class="w-full text-left border-collapse min-w-[1200px]">
                            <thead class="sticky top-0 z-20">
                                <tr class="bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
                                    <th
                                        class="px-6 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-manrope">
                                        SR.</th>
                                    <th
                                        class="px-6 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-manrope">
                                        ID / GR NO.</th>
                                    <th
                                        class="px-6 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-manrope">
                                        STUDENT</th>
                                    <th v-for="param in parameters" :key="param.id"
                                        class="px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center font-manrope border-x border-slate-50">
                                        <div class="flex flex-col items-center gap-1">
                                            <span class="block line-clamp-1 truncate max-w-[130px] leading-tight">{{
                                                param.title }}</span>
                                            <div class="flex flex-col items-center gap-1 mt-0.5">
                                                <span
                                                    class="block text-[7px] font-bold py-0.5 px-2 bg-slate-100 rounded-full w-fit">{{
                                                        param.ctype }}</span>
                                                <span v-if="getRangeText(param.id)"
                                                    class="whitespace-nowrap flex items-center gap-0.5 text-[8px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-sky-100">
                                                    {{ getRangeText(param.id) }}
                                                </span>
                                            </div>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-50">
                                <tr v-if="loading" class="animate-pulse">
                                    <td :colspan="10" class="text-center py-32">
                                        <div class="flex flex-col items-center gap-4">
                                            <div
                                                class="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin">
                                            </div>
                                            <p
                                                class="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">
                                                Syncing Database...</p>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-else-if="!selectedFormatId || !selectedSchoolId || !selectedStandard || !selectedDivision"
                                    class="animate-in fade-in duration-500">
                                    <td :colspan="10" class="text-center py-32">
                                        <div class="flex flex-col items-center gap-4 opacity-30 grayscale">
                                            <div
                                                class="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
                                                <span class="material-symbols-outlined text-[40px]">dataset</span>
                                            </div>
                                            <p class="text-sm font-bold text-slate-500 tracking-tight">Apply selection
                                                filters to unlock grading</p>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-else v-for="(student, index) in students" :key="student.id"
                                    :class="['transition-all group border-l-4', hasInvalidMarks(student) ? '!border-red-500 bg-red-100/50 outline outline-1 outline-red-400' : 'border-transparent hover:border-primary hover:bg-slate-50/80']">
                                    <td class="px-6 py-5 text-[11px] font-bold text-slate-400 font-manrope">{{
                                        String(index + 1).padStart(2, '0') }}</td>
                                    <td class="px-6 py-5">
                                        <span
                                            class="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-extrabold tracking-tight">{{
                                                student.mq_id || `ID:${student.id}` }}</span>
                                    </td>
                                    <td class="px-6 py-5">
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-extrabold font-manrope border border-slate-200 shadow-sm">
                                                {{student.name.split(' ').map(n => n[0]).join('')}}
                                            </div>
                                            <div>
                                                <div
                                                    class="text-xs font-extrabold text-slate-700 tracking-tight leading-tight">
                                                    {{ student.name }}</div>
                                                <div
                                                    class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                                                    Section: {{ student.division }}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td v-for="param in parameters" :key="param.id" class="px-4 py-5">
                                        <template v-if="param.ctype === 'Yes/No' || param.ctype === 'Boolean'">
                                            <select v-model="student.marks[param.id]"
                                                class="w-[90px] mx-auto block bg-slate-50/50 border rounded-xl text-[11px] font-bold py-2 focus:ring-4 focus:ring-primary/10 focus:border-primary shadow-sm transition-all cursor-pointer outline-none text-center"
                                                :class="student.marks[param.id] ? 'border-primary/30' : 'border-slate-200'">
                                                <option value="">N/A</option>
                                                <option value="Yes">YES</option>
                                                <option value="No">NO</option>
                                            </select>
                                        </template>
                                        <template v-else>
                                            <div class="relative min-h-[50px] flex flex-col items-center justify-center">
                                                <input v-model="student.marks[param.id]"
                                                    class="w-[90px] text-center border rounded-xl text-[11px] font-bold py-2 shadow-sm transition-all font-manrope outline-none"
                                                    :type="param.ctype === 'Text' ? 'text' : 'number'"
                                                    :placeholder="param.clabel || '0.0'"
                                                    :class="isInvalid(student, param.id, student.marks[param.id]) 
                                                            ? '!border-red-500 !ring-2 !ring-red-200 !bg-red-50 text-red-700' 
                                                            : 'bg-slate-50/50 border-slate-200 text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary'" />

                                                <!-- Validation Message -->
                                                <div v-if="isInvalid(student, param.id, student.marks[param.id])"
                                                    class="absolute -bottom-2.5 left-0 right-0 text-[8px] text-red-600 font-extrabold text-center uppercase tracking-tighter animate-pulse truncate px-1">
                                                    Out of Range
                                                </div>
                                            </div>
                                        </template>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination / Footer -->
                    <div
                        class="p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50 backdrop-blur-sm">
                        <div class="flex items-center gap-6">
                            <div v-if="students.length > 0" class="flex flex-col">
                                <span
                                    class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Terminal
                                    Status</span>
                                <span class="text-xs font-bold text-slate-600 mt-1">Found {{ students.length }} Student
                                    Records</span>
                            </div>
                        </div>
                        <div class="flex gap-4">
                            <button @click="fetchStudentsWithMarks"
                                class="px-8 py-3 text-[10px] font-extrabold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest font-manrope">Refresh
                                Table</button>
                            <button @click="submitAll" :disabled="isSavingAll || students.length === 0"
                                class="px-10 py-3 bg-primary text-white text-[10px] font-extrabold rounded-2xl shadow-[0_8px_32px_rgba(0,93,170,0.2)] hover:bg-[#004a88] transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3 font-manrope disabled:opacity-50 disabled:translate-y-0 uppercase tracking-widest">
                                <template v-if="isSavingAll">
                                    <div
                                        class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin">
                                    </div>
                                    Finalizing...
                                </template>
                                <template v-else>
                                    Commit All Marks
                                    <span class="material-symbols-outlined text-[18px]">verified</span>
                                </template>
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
    display: none;
}

.font-manrope {
    font-family: 'Manrope', sans-serif;
}

.font-inter {
    font-family: 'Inter', sans-serif;
}
</style>
