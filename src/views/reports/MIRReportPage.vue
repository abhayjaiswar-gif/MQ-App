<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface MIRReport {
  id: number;
  school_id: number;
  school_name: string;
  user_id: number;
  file_path: string;
  month_year: string;
  created_at: string;
}

interface School {
  id: number;
  name: string;
}

const reports = ref<MIRReport[]>([]);
const schools = ref<School[]>([]);
const loading = ref(true);
const showUploadModal = ref(false);
const errorMessage = ref('');
const searchQuery = ref('');

const stats = computed(() => {
  return {
    total: reports.value.length,
    activeSchools: new Set(reports.value.map(r => r.school_id)).size,
    thisMonth: reports.value.filter(r => {
      const now = new Date();
      const d = new Date(r.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length
  };
});

const filteredReports = computed(() => {
  if (!searchQuery.value) return reports.value;
  const q = searchQuery.value.toLowerCase();
  return reports.value.filter(r =>
    r.school_name?.toLowerCase().includes(q) ||
    r.month_year?.toLowerCase().includes(q)
  );
});

const form = ref({
  school_id: '',
  month_year: ''
});

const selectedFile = ref<File | null>(null);
const uploading = ref(false);

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const years = [2024, 2025, 2026];

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const fetchReports = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/mir-reports');
    const data = await response.json();
    if (data.success) {
      reports.value = data.reports;
    }
  } catch (error) {
    console.error('Error fetching MIR reports:', error);
  } finally {
    loading.value = false;
  }
};

const fetchSchools = async () => {
  try {
    const response = await fetch(`/api/schools?user_id=${sessionStorage.getItem('id') || ''}`);
    const data = await response.json();
    if (data.success) {
      schools.value = data.schools;
    }
  } catch (error) {
    console.error('Error fetching schools:', error);
  }
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
  }
};

const submitReport = async () => {
  errorMessage.value = '';

  if (!form.value.school_id || !form.value.month_year || !selectedFile.value) {
    errorMessage.value = 'Please fill all fields and select a document.';
    return;
  }

  uploading.value = true;
  const formData = new FormData();
  formData.append('school_id', form.value.school_id);
  formData.append('user_id', sessionStorage.getItem('id') || '0');
  formData.append('month_year', form.value.month_year);
  formData.append('report', selectedFile.value);

  try {
    const response = await fetch('/api/mir-reports', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (data.success) {
      showUploadModal.value = false;
      form.value = { school_id: '', month_year: '' };
      selectedFile.value = null;
      fetchReports();
    } else {
      alert(data.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Error uploading MIR report:', error);
    alert('An error occurred during upload.');
  } finally {
    uploading.value = false;
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

onMounted(() => {
  fetchReports();
  fetchSchools();
});
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] p-4 lg:p-2 font-inter">
    <div class="max-w-7xl mx-auto space-y-10">

      <!-- Header Section -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav
            class="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 font-manrope">
            <span>Registry</span>
            <span class="material-symbols-outlined text-[14px]">chevron_right</span>
            <span class="text-primary">MIR Reports</span>
          </nav>
          <h2 class="text-4xl font-extrabold text-[#1e293b] tracking-tight font-manrope">MIR Report Registry</h2>
          <p class="text-slate-500 mt-1 font-inter italic">Monthly Interaction & Performance Records</p>
        </div>
        <div class="flex items-center gap-3">
          <button @click="showUploadModal = true"
            class="bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-2 font-manrope">
            <span class="material-symbols-outlined text-lg">add_circle</span>
            Register New MIR
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="(val, label, i) in { 'Total Records': stats.total, 'Active Institutions': stats.activeSchools, 'New This Month': stats.thisMonth }"
          :key="i" class="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div class="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-8 -mt-8"></div>
          <p class="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">{{ label }}</p>
          <h3 class="text-3xl font-black text-slate-800">{{ loading ? '---' : val }}</h3>
        </div>
      </div>

      <!-- Registry Table -->
      <section class="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div class="p-8 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div class="relative w-full sm:w-96">
            <span
              class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input v-model="searchQuery" type="text" placeholder="Search school or month..."
              class="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
          </div>
          <button @click="fetchReports" class="p-3 text-slate-400 hover:text-primary transition-colors">
            <span class="material-symbols-outlined">refresh</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">School Details
                </th>
                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporting Period
                </th>
                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Date</th>
                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Document</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 font-bold">
              <template v-if="loading">
                <tr>
                  <td colspan="4" class="py-20 text-center text-slate-400 text-xs">Accessing Secure Registry...</td>
                </tr>
              </template>
              <template v-else-if="filteredReports.length > 0">
                <tr v-for="report in filteredReports" :key="report.id" class="hover:bg-slate-50/50 transition-all">
                  <td class="px-8 py-6">
                    <div class="flex items-center gap-4">
                      <div
                        class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-sm font-black border border-primary/5">
                        {{ getInitials(report.school_name) }}
                      </div>
                      <span class="text-slate-800 text-[13px]">{{ report.school_name }}</span>
                    </div>
                  </td>
                  <td class="px-8 py-6">
                    <span
                      class="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] rounded-full border border-amber-100 uppercase tracking-tighter">{{
                        report.month_year }}</span>
                  </td>
                  <td class="px-8 py-6 text-slate-400 text-[11px]">{{ formatDate(report.created_at) }}</td>
                  <td class="px-8 py-6 text-right">
                    <a :href="`/uploads/${report.file_path}`" target="_blank"
                      class="inline-flex items-center gap-2 text-primary hover:bg-primary/5 px-4 py-2 rounded-xl text-xs transition-all">
                      <span class="material-symbols-outlined text-[18px]">visibility</span>
                      View MIR
                    </a>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="4" class="py-32 text-center text-slate-300 text-sm">No MIR records found matching your
                  criteria.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="showUploadModal = false"></div>
      <div
        class="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden p-10 animate-in zoom-in-95 duration-200">
        <h3 class="text-3xl font-black text-slate-900 mb-8">Register MIR Report</h3>

        <form @submit.prevent="submitReport" class="space-y-6">
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Academic
              Institution</label>
            <select v-model="form.school_id"
              class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all">
              <option value="" disabled>Select School</option>
              <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reporting
                Month</label>
              <select v-model="form.month_year"
                class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold">
                <option v-for="m in months" :key="m" :value="m + '-2024'">{{ m }} 2024</option>
                <option v-for="m in months" :key="m" :value="m + '-2025'">{{ m }} 2025</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select File</label>
              <div
                class="relative bg-slate-50 rounded-2xl px-6 py-4 flex items-center gap-3 border-2 border-dashed border-slate-200 hover:border-primary transition-all cursor-pointer">
                <input type="file" @change="handleFileUpload" class="absolute inset-0 opacity-0 cursor-pointer" />
                <span class="material-symbols-outlined text-primary">cloud_upload</span>
                <span class="text-xs truncate max-w-[120px]">{{ selectedFile ? selectedFile.name : 'Choose PDF'
                }}</span>
              </div>
            </div>
          </div>

          <button type="submit" :disabled="uploading"
            class="w-full py-5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-3xl hover:shadow-2xl hover:scale-[1.01] transition-all disabled:opacity-50">
            {{ uploading ? 'Registering...' : 'Register Report' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-manrope {
  font-family: 'Manrope', sans-serif !important;
}

.font-inter {
  font-family: 'Inter', sans-serif !important;
}
</style>
