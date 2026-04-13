<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import * as XLSX from 'xlsx';

const router = useRouter();

// ── BATCH CONTEXT STATE ──
const schools = ref([]);
const selectedSchool = ref('');
const isUploading = ref(false);

// ── NEXT ID SUGGESTIONS ──
const nextMqId = ref('');
const nextRollNumber = ref('');

const fetchNextIds = async () => {
    try {
        const res = await fetch('/api/students/next-ids');
        const data = await res.json();
        if (data.success) {
            nextMqId.value = data.nextMqId;
            nextRollNumber.value = data.nextRollNumber;
        }
    } catch (e) {
        console.error('Error fetching next IDs:', e);
    }
};

const fetchSchools = async () => {
    try {
        const res = await fetch(`/api/schools?user_id=${sessionStorage.getItem('id') || ''}`);
        const data = await res.json();
        if (data.success) {
            schools.value = data.schools;
            if (data.schools.length > 0) selectedSchool.value = data.schools[0].id;
        }
    } catch (e) {
        console.error('Error fetching schools:', e);
    }
};

onMounted(() => {
    fetchSchools();
    fetchNextIds();
});

// ── SINGLE STUDENT FORM STATE ──
const singleStudent = ref({
    name: '',
    gender: 'Male',
    std: '',
    division: '',
    roll_number: '',
    mq_id: ''
});
const isRegisteringSingle = ref(false);

// 🪄 AUTO-FILL LOGIC: When name is typed, populate IDs if empty
watch(() => singleStudent.value.name, (newVal, oldVal) => {
    if (newVal && !oldVal) {
        if (!singleStudent.value.mq_id) singleStudent.value.mq_id = nextMqId.value;
        if (!singleStudent.value.roll_number) singleStudent.value.roll_number = nextRollNumber.value;
    }
});

// 📥 DOWNLOAD STUDENT TEMPLATE (Now fully automated: Name, Gender, Std, Div only)
const handleDownloadTemplate = () => {
    // Only 4 mandatory columns now: IDs are fully automated in the backend
    const headers = [['Full Name', 'Gender (Optional)', 'Standard', 'Division']];
    
    // Sample data
    const sampleData = [
        ['John Doe', 'Male', '8th', 'A'],
        ['Jane Doe', 'Female', '9th', 'B']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
    const wscols = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students_List');
    XLSX.writeFile(workbook, 'MQ_Student_Import_Template.xlsx');
};

// 📤 BATCH UPLOAD HANDLERS
const fileInput = ref(null);

const handleUploadClick = () => {
    if (!selectedSchool.value) {
        alert("Please select a School in Step 2 first.");
        return;
    }
    fileInput.value.click();
};

const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    isUploading.value = true;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const studentPayload = jsonData.map(row => {
                const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name')) || 'Full Name';
                const genderKey = Object.keys(row).find(k => k.toLowerCase().includes('gender')) || 'Gender (Optional)';
                const stdKey = Object.keys(row).find(k => k.toLowerCase().includes('std') || k.toLowerCase().includes('standard')) || 'Standard';
                const divKey = Object.keys(row).find(k => k.toLowerCase().includes('div') || k.toLowerCase().includes('division')) || 'Division';
                const mqKey = Object.keys(row).find(k => k.toLowerCase().includes('mq')) || 'MQ ID';
                const rollKey = Object.keys(row).find(k => k.toLowerCase().includes('roll') || k.toLowerCase().includes('gr')) || 'Roll Number';

                return {
                    name: row[nameKey],
                    gender: row[genderKey] || 'Male',
                    school_id: selectedSchool.value,
                    std: row[stdKey] || '',
                    division: row[divKey] || '',
                    roll_number: row[rollKey] || '', 
                    mq_id: row[mqKey] || null
                };
            }).filter(s => s.name);

            if (studentPayload.length === 0) {
                alert("No valid student data found in the file.");
                isUploading.value = false;
                return;
            }

            const response = await fetch('/api/students/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ students: studentPayload })
            });

            const result = await response.json();
            if (result.success) {
                alert(`Successfully imported ${result.results.imported} students!`);
                router.push('/student');
            } else {
                alert("Import failed: " + (result.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('File Analysis Error:', err);
            alert("Error parsing file.");
        } finally {
            isUploading.value = false;
        }
    };
    reader.readAsArrayBuffer(file);
};

// 👤 SINGLE STUDENT REGISTRATION
const handleSingleRegister = async () => {
    if (!selectedSchool.value || !singleStudent.value.name || !singleStudent.value.std || !singleStudent.value.division) {
        alert("Please fill all mandatory fields (Name, Std, Div).");
        return;
    }

    isRegisteringSingle.value = true;
    try {
        const response = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...singleStudent.value,
                school_id: selectedSchool.value
            })
        });

        const result = await response.json();
        if (result.success) {
            alert("Student registered successfully!");
            router.push('/student');
        } else {
            alert("Registration failed: " + result.message);
        }
    } catch (err) {
        console.error('Registration Error:', err);
        alert("An error occurred during registration.");
    } finally {
        isRegisteringSingle.value = false;
    }
};

</script>

<template>
    <div class="px-3 sm:px-6 py-8 tailwind-wrapper min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-inter text-slate-800">
        <div class="max-w-6xl mx-auto w-full">

            <!-- Hidden File Input -->
            <input type="file" ref="fileInput" @change="handleFileSelect" accept=".xlsx, .xls, .csv" class="hidden" />

            <!-- Header -->
            <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 class="text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight mb-2 font-manrope">Manage Student Directory</h3>
                    <p class="text-slate-500 text-sm">Bulk import or manually register students. Automated IDs and roll numbers enabled.</p>
                </div>
                <button @click="router.push('/student')"
                    class="w-full sm:w-auto justify-center px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold text-sm shadow-sm flex items-center gap-2 font-manrope">
                    <span class="material-symbols-outlined text-[18px]">arrow_back</span>
                    Back to Directory
                </button>
            </div>

            <div class="space-y-8 pb-20">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Step 1: Template Download -->
                    <section class="md:col-span-1 bg-white p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between h-full">
                        <div>
                            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                                <span class="material-symbols-outlined text-[24px]">download_for_offline</span>
                            </div>
                            <h3 class="font-manrope font-bold text-lg text-slate-800 mb-2">Step 1: Get Template</h3>
                            <p class="text-xs text-slate-500 mb-8 leading-relaxed">
                                Download the updated format. The template now includes **suggested IDs** starting from <span class="font-bold text-primary">{{ nextMqId }}</span>.
                            </p>
                        </div>
                        <button @click="handleDownloadTemplate"
                            class="w-full py-3.5 bg-white border-2 border-primary text-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/5 transition-all font-manrope uppercase tracking-widest text-[10px]">
                            <span class="material-symbols-outlined text-lg">download</span>
                            Download Template (v2)
                        </button>
                    </section>

                    <!-- Step 2: Batch Context -->
                    <section class="md:col-span-2 bg-white p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 h-full">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 bg-[#40608b]/10 rounded-xl flex items-center justify-center text-[#40608b]">
                                <span class="material-symbols-outlined text-[24px]">account_tree</span>
                            </div>
                            <div>
                                <h3 class="font-manrope font-bold text-lg text-slate-800">Step 2: School Context</h3>
                                <p class="text-xs text-slate-500">Last MQ ID detected: <span class="font-bold">{{ nextMqId }} (Planned)</span></p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 gap-6">
                            <div class="space-y-2">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Assign to School</label>
                                <select v-model="selectedSchool" class="w-full bg-slate-50 border-none rounded-xl text-sm px-4 py-4 focus:ring-2 focus:ring-primary/20 font-bold text-slate-700 outline-none appearance-none cursor-pointer">
                                    <option value="" disabled>Select School</option>
                                    <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
                                </select>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Step 3: Bulk Upload -->
                <section class="bg-white p-2 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100">
                    <div @click="handleUploadClick"
                        class="cursor-pointer border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-slate-50/50 rounded-xl p-16 flex flex-col items-center justify-center text-center transition-all group relative">
                        <div v-if="isUploading" class="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
                            <div class="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin mb-4"></div>
                            <p class="text-sm font-bold text-slate-600 font-manrope">Uploading Students...</p>
                        </div>
                        <div class="w-20 h-20 bg-primary/5 group-hover:bg-primary/10 transition-colors rounded-full flex items-center justify-center mb-6">
                            <span class="material-symbols-outlined text-primary text-[40px]">upload_file</span>
                        </div>
                        <h3 class="font-manrope font-bold text-slate-800 text-xl mb-2">Step 3: Upload Bulk File</h3>
                        <p class="text-slate-500 text-sm max-w-sm">Drop your student list here. Suggested starting ID is <span class="font-bold text-primary">{{ nextMqId }}</span>.</p>
                        <p class="text-[10px] text-slate-400 mt-6 font-bold uppercase tracking-widest font-manrope">Supports .XLSX, .CSV</p>
                    </div>
                </section>

                <!-- Section: Quick Add (New Automation) -->
                <section class="bg-white p-8 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.02)] border border-slate-100 border-t-4 border-t-emerald-500">
                    <div class="flex items-center justify-between mb-8">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                                <span class="material-symbols-outlined text-[24px]">bolt</span>
                            </div>
                            <div>
                                <h3 class="font-manrope font-bold text-xl text-slate-800 tracking-tight">Quick Add Student</h3>
                                <p class="text-xs text-slate-400">Automated MQ ID & Roll Number assignment enabled.</p>
                            </div>
                        </div>
                        <div class="hidden sm:flex flex-col items-end">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Available ID</span>
                            <span class="text-lg font-black text-emerald-600 font-manrope">{{ nextMqId }}</span>
                        </div>
                    </div>

                    <form @submit.prevent="handleSingleRegister" class="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <!-- Name -->
                        <div class="md:col-span-2 space-y-2">
                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Student Full Name</label>
                            <input v-model="singleStudent.name" type="text" placeholder="Start typing name..." 
                                class="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" required />
                        </div>

                        <!-- Gender -->
                        <div class="space-y-2">
                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Gender</label>
                            <div class="flex p-1 bg-slate-50 rounded-xl">
                                <button type="button" @click="singleStudent.gender = 'Male'" :class="[
                                    'flex-1 py-3 text-xs font-bold rounded-lg transition-all',
                                    singleStudent.gender === 'Male' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                ]">Male</button>
                                <button type="button" @click="singleStudent.gender = 'Female'" :class="[
                                    'flex-1 py-3 text-xs font-bold rounded-lg transition-all',
                                    singleStudent.gender === 'Female' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                ]">Female</button>
                            </div>
                        </div>

                        <!-- MQ ID (Automated) -->
                        <div class="space-y-2">
                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">MQ ID (Next Suggested)</label>
                            <input v-model="singleStudent.mq_id" type="text" :placeholder="nextMqId" 
                                class="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                        </div>

                        <!-- Standard -->
                        <div class="space-y-2">
                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Standard</label>
                            <select v-model="singleStudent.std" class="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none transition-all cursor-pointer" required>
                                <option value="" disabled>Select</option>
                                <option v-for="std in ['Nursery','Jr.Kg','Sr.Kg','LKG','UKG','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th']" :key="std">{{ std }}</option>
                            </select>
                        </div>

                        <!-- Division -->
                        <div class="space-y-2">
                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Division</label>
                            <input v-model="singleStudent.division" type="text" placeholder="A" 
                                class="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all uppercase" required />
                        </div>

                        <!-- Roll Number / GR (Automated) -->
                        <div class="space-y-2">
                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope ml-1">Roll / GR (Next Suggested)</label>
                            <input v-model="singleStudent.roll_number" type="text" :placeholder="nextRollNumber" 
                                class="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                        </div>

                        <!-- Action -->
                        <div class="flex items-end">
                            <button type="submit" :disabled="isRegisteringSingle"
                                class="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 font-manrope uppercase tracking-widest text-xs disabled:opacity-70">
                                <span v-if="!isRegisteringSingle" class="material-symbols-outlined text-lg">bolt</span>
                                <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                {{ isRegisteringSingle ? 'Saving...' : 'Instant Register' }}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    </div>
</template>
