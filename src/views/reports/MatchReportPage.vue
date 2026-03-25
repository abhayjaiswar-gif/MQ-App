<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface MatchReport {
  id: number;
  school_id: number;
  school_name: string;
  user_id: number;
  file_path: string;
  created_at: string;
}

interface School {
  id: number;
  name: string;
}

const reports = ref<MatchReport[]>([]);
const schools = ref<School[]>([]);
const loading = ref(true);
const showUploadModal = ref(false);
const errorMessage = ref('');

const form = ref({
  school_id: '',
  match_date: '',
  category: 'Football',
  status: 'DRAFT' as const
});

const selectedFile = ref<File | null>(null);
const uploading = ref(false);

const fetchReports = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/match-reports');
    const data = await response.json();
    if (data.success) {
      reports.value = data.reports;
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
  } finally {
    loading.value = false;
  }
};

const fetchSchools = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/schools');
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
  
  if (!form.value.school_id || !selectedFile.value) {
    errorMessage.value = 'Please fill all required fields and select a file.';
    return;
  }

  uploading.value = true;
  const formData = new FormData();
  formData.append('school_id', form.value.school_id);
  // Default values for hidden fields
  formData.append('match_date', new Date().toISOString().split('T')[0]);
  formData.append('category', 'General');
  formData.append('status', 'PUBLISHED'); // Defaulting to published for now
  formData.append('report', selectedFile.value);

  try {
    const response = await fetch('http://localhost:3000/api/match-reports', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (data.success) {
      showUploadModal.value = false;
      // Reset form
      form.value = { school_id: '', match_date: '', category: 'Football', status: 'DRAFT' };
      selectedFile.value = null;
      fetchReports();
    } else {
      alert(data.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Error uploading report:', error);
    alert('An error occurred during upload.');
  } finally {
    uploading.value = false;
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const stats = computed(() => {
  return {
    total: reports.value.length,
    activeSchools: new Set(reports.value.map(r => r.school_id)).size,
    pending: 0
  };
});

onMounted(() => {
  fetchReports();
  fetchSchools();
});
</script>

<template>
  <div class="match-report-root p-0 min-h-screen bg-surface">
    <main class="p-8 space-y-8 flex-1">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav class="flex text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 gap-2 items-center">
            <span>Reports</span>
            <span class="material-symbols-outlined text-[10px]">chevron_right</span>
            <span class="text-primary">Management</span>
          </nav>
          <h2 class="text-4xl font-extrabold text-slate-900 tracking-tight">Match Report Management</h2>
          <p class="text-on-surface-variant mt-1 font-medium">Manage and review precision performance analytics for all partner schools.</p>
        </div>
        <div class="flex items-center gap-3">
          <button 
            @click="showUploadModal = true"
            class="bg-primary bg-gradient-to-b from-primary to-primary-container text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-lg">upload_file</span>
            Upload Match Report
          </button>
        </div>
      </div>

      <!-- Dashboard Stats Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white p-8 rounded-3xl border border-white shadow-[0_8px_32px_rgba(0,28,58,0.04)] flex justify-between items-center group hover:border-primary/20 transition-all">
          <div>
            <p class="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Total Reports</p>
            <h3 class="text-3xl font-black text-slate-900">{{ stats.total }}</h3>
          </div>
          <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <span class="material-symbols-outlined text-3xl">description</span>
          </div>
        </div>
        <div class="bg-white p-8 rounded-3xl border border-white shadow-[0_8px_32_rgba(0,28,58,0.04)] flex justify-between items-center group hover:border-emerald-200 transition-all">
          <div>
            <p class="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Schools Active</p>
            <h3 class="text-3xl font-black text-slate-900">{{ stats.activeSchools }}</h3>
          </div>
          <div class="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
            <span class="material-symbols-outlined text-3xl">school</span>
          </div>
        </div>
        <div class="bg-white p-8 rounded-3xl border border-white shadow-[0_8px_32_rgba(0,28,58,0.04)] flex justify-between items-center group hover:border-amber-200 transition-all">
          <div>
            <p class="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Pending Review</p>
            <h3 class="text-3xl font-black text-slate-900">{{ stats.pending }}</h3>
          </div>
          <div class="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
            <span class="material-symbols-outlined text-3xl">pending_actions</span>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <section class="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(0,28,58,0.04)] border border-white overflow-hidden">
        <div class="px-10 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 class="font-bold text-slate-800 flex items-center gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            Recent Match Reports
          </h3>
          <div class="flex gap-2">
            <button @click="fetchReports" class="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all shadow-sm">
              <span class="material-symbols-outlined text-xl">refresh</span>
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-10 py-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">School Name</th>
                <th class="px-10 py-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Uploaded On</th>
                <th class="px-10 py-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <template v-if="loading">
                <tr>
                   <td colspan="5" class="py-20 text-center">
                      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p class="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Reports...</p>
                   </td>
                </tr>
              </template>
              <template v-else-if="reports.length > 0">
                <tr v-for="report in reports" :key="report.id" class="hover:bg-slate-50 transition-all group">
                  <td class="px-10 py-6">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary font-black text-sm border border-white shadow-sm">
                        {{ report.school_name?.charAt(0) }}
                      </div>
                      <span class="font-bold text-slate-800 text-sm tracking-tight">{{ report.school_name }}</span>
                    </div>
                  </td>
                  <td class="px-10 py-6">
                    <span class="text-slate-500 font-semibold text-xs">{{ formatDate(report.created_at) }}</span>
                  </td>
                  <td class="px-10 py-6 text-right">
                    <a 
                      :href="`http://localhost:3000/uploads/${report.file_path}`" 
                      target="_blank"
                      class="inline-flex items-center gap-2 text-primary hover:text-primary-container font-black text-xs uppercase tracking-widest transition-all hover:translate-x-1"
                    >
                      <span class="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                      View Report
                    </a>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="3" class="py-20 text-center opacity-40">
                  <span class="material-symbols-outlined text-4xl mb-2">description</span>
                  <p class="font-bold uppercase text-xs tracking-widest">No reports found</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-10 py-6 bg-slate-50/30 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
           <span>Showing {{ reports.length }} Reports</span>
           <span>AthleticDirector Pro &copy; 2026</span>
        </div>
      </section>

      <!-- Bottom Grid Highlights -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white p-10 rounded-3xl shadow-[0_8px_40px_rgba(0,28,58,0.03)] border border-white">
          <h4 class="font-bold text-slate-800 mb-8 flex items-center gap-3">
            <span class="material-symbols-outlined text-primary">trending_up</span>
            Performance Insights
          </h4>
          <div class="h-40 flex items-end gap-3 px-2">
            <div class="flex-1 bg-slate-100/50 rounded-2xl h-1/4 hover:bg-primary/10 transition-colors"></div>
            <div class="flex-1 bg-primary/20 rounded-2xl h-3/4 hover:bg-primary/30 transition-colors"></div>
            <div class="flex-1 bg-primary rounded-2xl h-full shadow-lg shadow-primary/20"></div>
            <div class="flex-1 bg-primary/40 rounded-2xl h-2/3 hover:bg-primary/50 transition-colors"></div>
            <div class="flex-1 bg-slate-100/50 rounded-2xl h-1/2 hover:bg-primary/10 transition-colors"></div>
          </div>
          <div class="flex justify-between mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>WK1</span><span>WK2</span><span>WK3</span><span>WK4</span><span>WK5</span>
          </div>
        </div>
        <div class="bg-primary-container p-10 rounded-[32px] shadow-2xl text-white relative overflow-hidden group">
          <div class="absolute -right-16 -top-16 w-60 h-60 bg-white/10 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-1000"></div>
          <h4 class="font-black text-2xl mb-3 tracking-tight">Professional Analytics</h4>
          <p class="text-white/70 text-sm mb-8 max-w-xs leading-relaxed font-medium">Gain deep behavioral insights and heatmaps across all institutional reports.</p>
          <button class="bg-white text-primary px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
            Learn More
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </main>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" @click="showUploadModal = false"></div>
      
      <div class="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="px-10 pt-10 pb-6 flex items-center justify-between">
          <h3 class="text-3xl font-black tracking-tight text-slate-900">Add Match Report</h3>
          <button @click="showUploadModal = false" class="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div v-if="errorMessage" class="mx-10 mb-4 p-4 bg-error-container/10 border border-error/20 rounded-2xl flex items-center gap-3 text-error text-xs font-bold animate-in slide-in-from-top-2 duration-300">
          <span class="material-symbols-outlined text-lg">error</span>
          {{ errorMessage }}
        </div>

        <form @submit.prevent="submitReport" class="px-10 pb-10 space-y-6">
          <div class="space-y-5">
            <div class="space-y-2">
              <label class="block text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1 opacity-60">Select School</label>
              <div class="relative">
                <select 
                  v-model="form.school_id"
                  class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 appearance-none transition-all"
                  required
                >
                  <option value="" disabled>Select School</option>
                  <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1 opacity-60">Upload PDF</label>
              <div 
                class="border-2 border-dashed border-slate-200 rounded-[24px] p-8 flex flex-col items-center justify-center bg-slate-50/50 group hover:bg-primary/5 hover:border-primary transition-all cursor-pointer relative"
              >
                <input 
                  type="file" 
                  accept="application/pdf"
                  class="absolute inset-0 opacity-0 cursor-pointer"
                  @change="handleFileUpload"
                />
                <div class="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-all border border-slate-100">
                  <span class="material-symbols-outlined text-primary text-3xl">upload_file</span>
                </div>
                <p class="text-sm font-black text-slate-800">{{ selectedFile ? selectedFile.name : 'Select PDF Document' }}</p>
                <p class="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{{ selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'Max size 10MB' }}</p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4 pt-4">
            <button 
              type="submit"
              :disabled="uploading"
              class="w-full py-5 px-8 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-primary-container transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {{ uploading ? 'Uploading...' : 'Submit Report' }}
              <span class="material-symbols-outlined text-lg" v-if="!uploading">send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.match-report-root {
  font-family: 'Inter', sans-serif;
}
h2, h3, h4 {
  font-family: 'Manrope', sans-serif;
}
.material-symbols-outlined {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
</style>
