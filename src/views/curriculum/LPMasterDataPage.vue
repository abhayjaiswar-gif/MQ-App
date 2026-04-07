<template>
  <v-row>
    <v-col cols="12">
      <v-card elevation="0" class="bg-surface rounded-xl overflow-hidden">
        <v-card-text class="pa-8">
          <!-- Filter Data Card -->
          <div class="bg-white p-6 rounded-2xl shadow-sm filter-card mb-8 flex flex-wrap items-end gap-6 border border-slate-100">
            <div class="flex-1 min-w-[200px]">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Grade</label>
              <select v-model="filters.grade" @change="fetchMasterData"
                class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#005daa]/20 text-[#1a1c1c]">
                <option value="All">All Grades</option>
                <option v-for="grade in availableGrades" :key="grade" :value="grade">{{ formatGrade(grade) }}</option>
              </select>
            </div>
            <div class="flex-1 min-w-[200px]">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sport</label>
              <select v-model="filters.sport" @change="fetchMasterData"
                class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#005daa]/20 text-[#1a1c1c]">
                <option value="All">All Sports</option>
                <option v-for="sport in sports" :key="sport" :value="sport">{{ sport }}</option>
              </select>
            </div>
            <div class="flex-1 min-w-[200px]">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
              <select v-model="filters.status" @change="fetchMasterData"
                class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#005daa]/20 text-[#1a1c1c]">
                <option value="All">All Status</option>
                <option value="Done">Done</option>
                <option value="Pending">Pending</option>
                <option value="Unmarked">Unmarked</option>
              </select>
            </div>
            <button @click="fetchMasterData"
              class="flex items-center gap-2 bg-[#005daa] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#004785] transition-all active:scale-95 text-sm">
              <span class="material-symbols-outlined text-lg">filter_alt</span>
              <span>Apply Filters</span>
            </button>
          </div>

          <!-- Data Table Section -->
          <div class="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 relative min-h-[400px]">
            <!-- Loading Overlay -->
            <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <div class="w-10 h-10 border-4 border-[#005daa] border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-slate-50/50">
                    <th class="text-left py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">LP No</th>
                    <th class="text-left py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Sport</th>
                    <th class="text-left py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Grade</th>
                    <th class="text-left py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Skill</th>
                    <th class="text-left py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Objective</th>
                    <th class="text-right py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-[220px]">Status / Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-if="!loading && masterData.length === 0">
                    <td colspan="6" class="py-12 text-center text-slate-500 font-medium">
                      No lesson plans currently assigned to you matching these filters.
                    </td>
                  </tr>
                  
                  <tr v-for="lp in masterData" :key="lp.id" class="hover:bg-slate-50/50 transition-colors group">
                    <td class="py-5 px-6 font-headline font-bold text-sm text-[#005daa]">{{ lp.lp_no }}</td>
                    <td class="py-5 px-6">
                      <span class="px-3 py-1 rounded-full bg-slate-100 text-[#1a1c1c] text-[10px] font-black uppercase tracking-tighter">{{ lp.sport }}</span>
                    </td>
                    <td class="py-5 px-6">
                      <p class="text-xs font-bold text-[#1a1c1c]">{{ formatGrade(lp.grade) }}</p>
                    </td>
                    <td class="py-5 px-6">
                      <p class="text-sm font-bold text-[#1a1c1c] mb-0.5">{{ lp.skill }}</p>
                      <p class="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{{ lp.sub_skill }}</p>
                    </td>
                    <td class="py-5 px-6">
                      <p class="text-[11px] text-slate-500 italic leading-relaxed max-w-xs">{{ lp.objective }}</p>
                    </td>
                    <td class="py-5 px-6 text-right">
                      <div class="flex items-center justify-end gap-2 flex-wrap">
                        
                        <!-- Saved Status Section -->
                        <template v-if="lp.saved_status">
                          <div v-if="lp.saved_status === 'Done'" class="flex flex-col items-end gap-1">
                            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <span class="material-symbols-outlined text-[16px] font-bold">check_circle</span>
                              <span class="text-[10px] font-black uppercase">Done</span>
                            </div>
                            <button @click="removeStatus(lp.lp_unique_id)" class="text-[10px] font-bold text-red-500 hover:text-red-700 underline underline-offset-2">Remove</button>
                          </div>
                          <div v-else class="flex flex-col items-end gap-1">
                             <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                              <span class="material-symbols-outlined text-[16px] font-bold">schedule</span>
                              <span class="text-[10px] font-black uppercase">Pending</span>
                            </div>
                            <button @click="removeStatus(lp.lp_unique_id)" class="text-[10px] font-bold text-red-500 hover:text-red-700 underline underline-offset-2">Remove</button>
                          </div>
                        </template>

                        <!-- Action Buttons Section -->
                        <template v-else>
                          <button @click="openDoneModal(lp)" class="flex items-center gap-1 bg-[#10b981] hover:bg-[#059669] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm transition-colors">
                            <span class="material-symbols-outlined text-[14px]">done</span> Done
                          </button>
                          <button @click="openPendingModal(lp)" class="flex items-center gap-1 bg-[#f59e0b] hover:bg-[#d97706] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm transition-colors">
                            <span class="material-symbols-outlined text-[14px]">schedule</span> Pending
                          </button>
                        </template>

                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="bg-slate-50/50 px-8 py-6 border-t border-slate-100 text-center">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Entries: {{ masterData.length }}</span>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- PENDING MODAL -->
    <div v-if="showPendingModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-[#1a1c1c]/60 backdrop-blur-sm" @click="showPendingModal = false"></div>
      <div class="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="p-6 bg-amber-500 border-b border-amber-600 flex items-center justify-between">
          <h3 class="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
            <span class="material-symbols-outlined">schedule</span> Pending Remark
          </h3>
          <button @click="showPendingModal = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-6">
          <p class="text-xs font-bold text-slate-500 mb-4 tracking-wide">LP NO: <span class="text-[#1a1c1c]">{{ currentLpContext?.lp_no }}</span></p>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Remark / Reason</label>
          <textarea v-model="pendingRemark" rows="4" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:border-amber-500 focus:ring-amber-500/20 text-[#1a1c1c] resize-none" placeholder="Enter reason for keeping this pending..."></textarea>
        </div>
        <div class="p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
          <button @click="showPendingModal = false" class="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 bg-white hover:bg-slate-100 transition-colors">Cancel</button>
          <button @click="submitPending" :disabled="submitting" class="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2">
             <span v-if="submitting" class="material-symbols-outlined animate-spin text-sm">progress_activity</span>
             Save Pending
          </button>
        </div>
      </div>
    </div>

    <!-- DONE MODAL (Photos) -->
    <div v-if="showDoneModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-[#1a1c1c]/60 backdrop-blur-sm" @click="showDoneModal = false"></div>
      <div class="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="p-6 bg-emerald-500 border-b border-emerald-600 flex items-center justify-between">
          <h3 class="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
            <span class="material-symbols-outlined">check_circle</span> Mark as Done
          </h3>
          <button @click="showDoneModal = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-6">
          <p class="text-xs font-bold text-slate-500 mb-4 tracking-wide">LP NO: <span class="text-[#1a1c1c]">{{ currentLpContext?.lp_no }}</span></p>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Upload Proof Photos (Optional)</label>
          
          <div class="border-2 border-dashed border-emerald-200 rounded-2xl p-8 text-center bg-emerald-50/50 hover:bg-emerald-50 transition-colors relative">
            <input type="file" ref="fileInput" multiple accept="image/*" @change="handleFileChange" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div class="flex flex-col items-center gap-2 pointer-events-none">
              <span class="material-symbols-outlined text-4xl text-emerald-400">cloud_upload</span>
              <p class="text-sm font-bold text-[#1a1c1c]">Click or drag photos here</p>
              <p class="text-xs text-slate-400">Maximum 5 photos allowed</p>
            </div>
          </div>
          
          <div v-if="selectedFiles.length > 0" class="mt-4">
            <p class="text-xs font-bold text-slate-500 mb-2">Selected Files ({{ selectedFiles.length }}):</p>
            <ul class="space-y-1">
              <li v-for="(file, index) in selectedFiles" :key="index" class="text-xs text-slate-700 bg-slate-100 py-1.5 px-3 rounded-md flex items-center justify-between">
                <span class="truncate pr-2">{{ file.name }}</span>
                <button @click.stop="removeFile(index)" class="text-red-400 hover:text-red-600"><span class="material-symbols-outlined text-[14px]">cancel</span></button>
              </li>
            </ul>
          </div>
        </div>
        <div class="p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
          <button @click="showDoneModal = false" class="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 bg-white hover:bg-slate-100 transition-colors">Cancel</button>
          <button @click="submitDone" :disabled="submitting" class="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2">
            <span v-if="submitting" class="material-symbols-outlined animate-spin text-sm">progress_activity</span>
            Confirm Done
          </button>
        </div>
      </div>
    </div>

  </v-row>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const masterData = ref<any[]>([]);
const loading = ref(true);
const submitting = ref(false);

const filters = ref({
  grade: 'All',
  sport: 'All',
  status: 'All'
});

const currentUserId = ref<string | null>(null);

// Modals State
const showPendingModal = ref(false);
const showDoneModal = ref(false);
const currentLpContext = ref<any>(null);

// Forms State
const pendingRemark = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<File[]>([]);

onMounted(() => {
  currentUserId.value = sessionStorage.getItem('id') || '4'; // Fallback for dev
  fetchMasterData();
});

const fetchMasterData = async () => {
  if (!currentUserId.value) return;
  loading.value = true;
  try {
    const params = new URLSearchParams({
      userId: currentUserId.value,
      sport: filters.value.sport,
      grade: filters.value.grade,
      status: filters.value.status
    });
    const res = await fetch(`/api/curriculum/my-assigned-master?${params}`);
    const data = await res.json();
    if (data.success) {
      masterData.value = data.data;
    }
  } catch (err) {
    console.error('Fetch error:', err);
  } finally {
    loading.value = false;
  }
};

const sports = computed(() => {
  const uniqueSports = [...new Set(masterData.value.map(lp => lp.sport))];
  return uniqueSports.sort();
});

const availableGrades = computed(() => {
  const uniqueGrades = [...new Set(masterData.value.map(lp => lp.grade))].filter(Boolean);
  return uniqueGrades.sort((a, b) => Number(a) - Number(b));
});

const formatGrade = (grade: any) => {
  if (!grade) return 'N/A';
  const g = String(grade);
  if (g === '-3') return 'Nursery';
  if (g === '-2') return 'LKG';
  if (g === '-1') return 'UKG';
  if (g === '1') return '1st';
  if (g === '2') return '2nd';
  if (g === '3') return '3rd';
  return g + 'th';
};

// --- Actions ---

const removeStatus = async (lp_unique_id: string) => {
  if (!confirm("Are you sure you want to remove this status?")) return;
  try {
    const res = await fetch('/api/curriculum/remove-lp-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lp_unique_id, user_id: currentUserId.value })
    });
    const result = await res.json();
    if (result.success) {
      fetchMasterData();
    } else {
      alert(result.message);
    }
  } catch (err) {
    console.error('Remove status failed:', err);
  }
};

const openPendingModal = (lp: any) => {
  currentLpContext.value = lp;
  pendingRemark.value = '';
  showPendingModal.value = true;
};

const submitPending = async () => {
  if (!currentLpContext.value) return;
  submitting.value = true;
  try {
    const res = await fetch('/api/curriculum/save-lp-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lp_no: currentLpContext.value.lp_no,
        lp_unique_id: currentLpContext.value.lp_unique_id,
        user_id: currentUserId.value,
        status: 'Pending',
        remark: pendingRemark.value
      })
    });
    const result = await res.json();
    if (result.success) {
      showPendingModal.value = false;
      fetchMasterData();
    } else {
      alert(result.message);
    }
  } catch (err) {
    console.error('Save pending failed:', err);
  } finally {
    submitting.value = false;
  }
};

const openDoneModal = (lp: any) => {
  currentLpContext.value = lp;
  selectedFiles.value = [];
  showDoneModal.value = true;
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    const newFiles = Array.from(target.files);
    if (selectedFiles.value.length + newFiles.length > 5) {
      alert('You can only upload a maximum of 5 photos.');
      return;
    }
    selectedFiles.value = [...selectedFiles.value, ...newFiles];
  }
};

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1);
};

const submitDone = async () => {
    if (!currentLpContext.value) return;
    submitting.value = true;
    
    const formData = new FormData();
    formData.append('lp_no', currentLpContext.value.lp_no);
    formData.append('lp_unique_id', currentLpContext.value.lp_unique_id);
    if (currentUserId.value) {
        formData.append('user_id', currentUserId.value.toString());
    }
    formData.append('status', 'Done');
    
    selectedFiles.value.forEach(file => {
      formData.append('photos', file);
    });

    try {
      const res = await fetch('/api/curriculum/save-lp-status', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      if (result.success) {
        showDoneModal.value = false;
        fetchMasterData();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error('Save done failed:', err);
    } finally {
      submitting.value = false;
    }
};

</script>

<style scoped>
.filter-card {
  backdrop-filter: blur(10px);
}
</style>
