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
const searchQuery = ref('');

const stats = computed(() => {
  const now = new Date();
  const thisMonth = reports.value.filter(r => {
    const d = new Date(r.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return {
    total: reports.value.length,
    activeSchools: new Set(reports.value.map(r => r.school_id)).size,
    pending: 0, // Mocked for now
    thisMonth: thisMonth
  };
});

const filteredReports = computed(() => {
  if (!searchQuery.value) return reports.value;
  const q = searchQuery.value.toLowerCase();
  return reports.value.filter(r =>
    r.school_name?.toLowerCase().includes(q)
  );
});

const form = ref({
  school_id: '',
  match_date: '',
  category: 'Football',
  status: 'DRAFT' as const
});

const selectedFile = ref<File | null>(null);
const uploading = ref(false);

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const fetchReports = async () => {
  try {
    const response = await fetch('/api/match-reports');
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
    const response = await fetch('/api/schools');
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
    const response = await fetch('/api/match-reports', {
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
            <span>Portal</span>
            <span class="material-symbols-outlined text-[14px]">chevron_right</span>
            <span class="text-primary">Reports</span>
          </nav>
          <h2 class="text-4xl font-extrabold text-[#1e293b] tracking-tight font-manrope">Match Report Registry</h2>
          <p class="text-slate-500 mt-1 font-inter">Monitor and manage precision performance analytics for all
            institutional matches.</p>
        </div>
        <div class="flex items-center gap-3">
          <button @click="showUploadModal = true"
            class="bg-primary hover:bg-[#004a88] text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-2 font-manrope">
            <span class="material-symbols-outlined text-lg">upload_file</span>
            Upload Report
          </button>
        </div>
      </div>

      <!-- Bento Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Reports -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-primary rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">Total Reports</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-[#1e293b] font-manrope">{{ loading ? '—' : stats.total }}</h3>
            <span
              class="text-primary text-xs font-bold flex items-center bg-primary/5 px-2 py-1 rounded-lg font-inter">Archive</span>
          </div>
        </div>

        <!-- Schools Active -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-emerald-500 rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">Schools Active</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-[#1e293b] font-manrope">{{ loading ? '—' : stats.activeSchools }}
            </h3>
            <span
              class="text-emerald-600 text-xs font-bold flex items-center bg-emerald-50 px-2 py-1 rounded-lg font-inter">Institutions</span>
          </div>
        </div>

        <!-- This Month -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-violet-500 rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">This Month</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-[#1e293b] font-manrope">{{ loading ? '—' : stats.thisMonth }}</h3>
            <span
              class="text-violet-600 text-xs font-bold flex items-center bg-violet-50 px-2 py-1 rounded-lg font-inter">New</span>
          </div>
        </div>

        <!-- Pending Review -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-amber-500 rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">Pending Review</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-amber-600 font-manrope">{{ loading ? '—' : stats.pending }}</h3>
            <span
              class="text-amber-600 text-xs font-bold flex items-center bg-amber-50 px-2 py-1 rounded-lg font-inter">Needs
              Audit</span>
          </div>
        </div>
      </div>

      <!-- Report Registry Table Section -->
      <section
        class="bg-white rounded-[32px] shadow-[0_8px_32px_rgba(0,28,58,0.04)] border border-slate-100 overflow-hidden">
        <div
          class="p-8 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full sm:w-auto">
            <h3 class="font-bold text-slate-800 text-lg font-manrope flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              Report Registry
            </h3>
            <div class="relative w-full sm:w-80">
              <span
                class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input v-model="searchQuery" type="text" placeholder="Filter by school name..."
                class="w-full pl-12 pr-4 py-3 bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-primary/20 rounded-2xl text-sm font-inter transition-all outline-none" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="fetchReports"
              class="p-3 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all border border-slate-100">
              <span class="material-symbols-outlined text-xl">refresh</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                  Institutional Details</th>
                <th
                  class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope text-center">
                  Reference ID</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                  Registry Date</th>
                <th
                  class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope text-right">
                  Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <template v-if="loading">
                <tr>
                  <td colspan="4" class="py-24 text-center">
                    <div class="flex flex-col items-center gap-4">
                      <div class="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Accessing
                        Registry...</p>
                    </div>
                  </td>
                </tr>
              </template>
              <template v-else-if="filteredReports.length > 0">
                <tr v-for="report in filteredReports" :key="report.id"
                  class="hover:bg-slate-50/50 transition-all group">
                  <td class="px-8 py-6">
                    <div class="flex items-center gap-4">
                      <div
                        class="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-bold text-sm border border-primary/10 font-manrope">
                        {{ getInitials(report.school_name || 'S') }}
                      </div>
                      <div class="flex flex-col">
                        <span class="font-bold text-slate-700 text-sm tracking-tight font-manrope">{{ report.school_name
                          }}</span>
                        <span class="text-[11px] text-slate-400 font-inter">Verified Participant</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-8 py-6 text-center">
                    <span
                      class="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-manrope tracking-tighter">
                      #MR-{{ report.id.toString().padStart(4, '0') }}
                    </span>
                  </td>
                  <td class="px-8 py-6">
                    <div class="flex flex-col">
                      <span class="text-slate-700 font-bold text-xs font-manrope">{{ formatDate(report.created_at)
                        }}</span>
                      <span class="text-[10px] text-slate-400 font-inter uppercase tracking-tighter">Certified
                        Upload</span>
                    </div>
                  </td>
                  <td class="px-8 py-6 text-right">
                    <a :href="`/uploads/${report.file_path}`" target="_blank"
                      class="inline-flex items-center gap-2 bg-[#f8fafc] text-primary hover:bg-primary hover:text-white px-5 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all shadow-sm border border-slate-100 font-manrope">
                      <span class="material-symbols-outlined text-[18px]">visibility</span>
                      View
                    </a>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="4" class="py-32 text-center opacity-40">
                  <div class="flex flex-col items-center gap-3">
                    <span class="material-symbols-outlined text-[64px] mb-2">find_in_page</span>
                    <p class="font-bold uppercase text-[10px] tracking-widest font-manrope">No match reports discovered
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-8 py-5 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-manrope">Displaying {{
            filteredReports.length }} certified reports</span>
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-manrope">End-to-End
              Encrypted
              Registry</span>
          </div>
        </div>
      </section>

      <!-- Bottom Insight Panels -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div class="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div class="flex items-center justify-between mb-8">
            <h4 class="font-bold text-slate-800 flex items-center gap-3 font-manrope">
              <span class="material-symbols-outlined text-primary">analytics</span>
              Reporting Compliance
            </h4>
            <span
              class="text-[10px] font-black text-primary uppercase bg-primary/5 px-3 py-1 rounded-full font-manrope">Q1
              Update</span>
          </div>
          <div class="space-y-6">
            <div v-for="(p, i) in [85, 92, 78]" :key="i" class="space-y-2">
              <div class="flex justify-between text-[11px] font-bold text-slate-500 font-manrope">
                <span>{{ ['Data Integrity', 'Submission SLA', 'Verified Schools'][i] }}</span>
                <span>{{ p }}%</span>
              </div>
              <div class="h-2 bg-slate-50 rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full transition-all duration-1000" :style="{ width: p + '%' }">
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-[#005faa] to-[#003d70] p-8 rounded-[32px] shadow-2xl text-white relative overflow-hidden group">
          <div
            class="absolute -right-16 -top-16 w-60 h-60 bg-white/10 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-1000">
          </div>
          <div class="flex flex-col h-full justify-between relative z-10">
            <div>
              <div class="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
                <span class="material-symbols-outlined text-white text-3xl">insights</span>
              </div>
              <h4 class="font-extrabold text-2xl mb-3 tracking-tight font-manrope">Institutional Insights</h4>
              <p class="text-white/70 text-sm max-w-xs leading-relaxed font-medium font-inter">Deep-dive into
                performance
                heatmaps and precision behavioral metrics across all reported matches.</p>
            </div>
            <div class="mt-8">
              <button
                class="bg-white text-primary px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-manrope">
                Generate Analytics Report
                <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        @click="showUploadModal = false">
      </div>

      <div
        class="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="px-10 pt-10 pb-6 flex items-center justify-between">
          <h3 class="text-3xl font-black tracking-tight text-slate-900">Add Match Report</h3>
          <button @click="showUploadModal = false"
            class="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div v-if="errorMessage"
          class="mx-10 mb-4 p-4 bg-error-container/10 border border-error/20 rounded-2xl flex items-center gap-3 text-error text-xs font-bold animate-in slide-in-from-top-2 duration-300">
          <span class="material-symbols-outlined text-lg">error</span>
          {{ errorMessage }}
        </div>

        <form @submit.prevent="submitReport" class="px-10 pb-10 space-y-6">
          <div class="space-y-5">
            <div class="space-y-2">
              <label
                class="block text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1 opacity-60">Select
                School</label>
              <div class="relative">
                <select v-model="form.school_id"
                  class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 appearance-none transition-all"
                  required>
                  <option value="" disabled>Select School</option>
                  <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
                </select>
                <span
                  class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
              </div>
            </div>

            <div class="space-y-2">
              <label
                class="block text-[10px] uppercase tracking-widest font-black text-slate-500 ml-1 opacity-60">Upload
                PDF</label>
              <div
                class="border-2 border-dashed border-slate-200 rounded-[24px] p-8 flex flex-col items-center justify-center bg-slate-50/50 group hover:bg-primary/5 hover:border-primary transition-all cursor-pointer relative">
                <input type="file" accept="application/pdf" class="absolute inset-0 opacity-0 cursor-pointer"
                  @change="handleFileUpload" />
                <div
                  class="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-all border border-slate-100">
                  <span class="material-symbols-outlined text-primary text-3xl">upload_file</span>
                </div>
                <p class="text-sm font-black text-slate-800">{{ selectedFile ? selectedFile.name : 'Select PDF Document'
                  }}
                </p>
                <p class="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{{ selectedFile ?
                  (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'Max size 10MB' }}</p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4 pt-4">
            <button type="submit" :disabled="uploading"
              class="w-full py-5 px-8 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-primary-container transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50">
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

h2,
h3,
h4 {
  font-family: 'Manrope', sans-serif;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
</style>
