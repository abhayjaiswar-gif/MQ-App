<template>
  <!-- Page Content -->
  <div class="p-4 md:p-2 space-y-8 flex-1 w-full overflow-x-hidden">
    <!-- Hero Header Section -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h2 class="text-4xl font-extrabold text-gray-900 tracking-tight" style="font-family: 'Manrope', sans-serif;">
          Sports Curricula</h2>
        <p class="text-gray-500 mt-1 font-medium italic">Manage and upload master sports curriculums for regional distribution.</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button
          class="flex items-center gap-2 bg-white text-blue-600 border border-blue-600/20 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-all text-sm shadow-sm">
          <span class="material-symbols-outlined" data-icon="video_library">video_library</span>
          Upload Video
        </button>
        <button
          class="flex items-center gap-2 bg-white text-blue-600 border border-blue-600/20 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-all text-sm shadow-sm">
          <span class="material-symbols-outlined" data-icon="checklist">checklist</span>
          Define Objectives
        </button>
        <button @click="isModalOpen = true"
          class="flex items-center gap-2 bg-gradient-to-b from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg font-bold hover:shadow-lg transition-all text-sm">
          <span class="material-symbols-outlined" data-icon="add">add</span>
          Add Curriculum
        </button>
      </div>
    </div>

    <!-- Dashboard Modules (Bento Style) -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Main Curriculum Grid Table -->
      <div class="lg:col-span-4 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div class="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-gray-50/50">
          <h3 class="font-bold text-gray-900" style="font-family: 'Manrope', sans-serif;">Master Programs</h3>
          <div class="flex gap-2">
            <button @click="fetchCurriculums" class="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 flex items-center gap-1 text-xs font-bold uppercase transition-colors">
              <span class="material-symbols-outlined text-lg">refresh</span>
              Sync
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/80">
                <th class="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Sport / Discipline</th>
                <th class="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">System ID</th>
                <th class="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-if="curriculums.length === 0">
                <td colspan="3" class="px-6 py-12 text-center text-gray-400 font-medium italic">
                  No curricula found. Click "Add Curriculum" to import one.
                </td>
              </tr>
              <tr v-for="curr in curriculums" :key="curr.id_indicate_curriculum"
                class="group hover:bg-blue-50/30 transition-colors">
                <td class="px-6 py-5">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                      <span class="material-symbols-outlined">{{ getSportIcon(curr.sport) }}</span>
                    </div>
                    <div>
                      <div class="text-sm font-bold text-gray-900">{{ curr.sport || 'Unknown Sport' }}</div>
                      <div class="text-[11px] text-gray-500 font-medium">{{ curr.module_count }} Lessons • Uploaded {{ new
                        Date(curr.created_at).toLocaleDateString() }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-5">
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    CID-{{ curr.id_indicate_curriculum.toString().padStart(3, '0') }}
                  </span>
                </td>
                <td class="px-6 py-5 text-right">
                  <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                      <span class="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    <button @click="removeCurriculum(curr.id_indicate_curriculum)" class="p-2 text-slate-400 hover:text-red-500 transition-colors">
                      <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          class="px-6 py-4 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center text-xs text-gray-500 font-medium">
          <span>Active Master Curricula: {{ curriculums.length }}</span>
          <div class="flex gap-4">
            <button class="hover:text-blue-600 transition-colors font-bold uppercase tracking-wider text-[10px]">Templates</button>
            <button class="hover:text-blue-600 transition-colors font-bold uppercase tracking-wider text-[10px]">Help Docs</button>
          </div>
        </div>
      </div>
    </div>


    <!-- Add Curriculum Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden duration-200">
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 class="font-bold text-gray-900" style="font-family: 'Manrope', sans-serif;">Import Curriculum</h3>
          <button @click="isModalOpen = false" class="text-gray-400 hover:text-gray-700 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-7 space-y-6">
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Enter Sport Name</label>
            <input type="text" v-model="sportName" placeholder="e.g. Football, Basketball"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Upload Excel File</label>
            <div class="w-full">
              <input ref="fileInput" type="file" accept=".xls,.xlsx"
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors border border-slate-200 rounded-xl" />
            </div>
            <p class="text-[10px] text-gray-400 mt-1 italic font-medium">Standard format: Sheet names must be Grade numbers (1-12).</p>
          </div>
          <button @click="submitUpload" :disabled="isUploading"
            class="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-blue-500/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-75 disabled:scale-100 disabled:cursor-not-allowed">
            <span v-if="!isUploading" class="material-symbols-outlined text-xl">upload_file</span>
            <span v-else class="material-symbols-outlined text-xl animate-spin">autorenew</span>
            {{ isUploading ? 'Parsing Excellence...' : 'Process & Upload' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isModalOpen = ref(false);
const sportName = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const curriculums = ref<any[]>([]);

const fetchCurriculums = async () => {
  try {
    const res = await fetch('/api/curriculums');
    const data = await res.json();
    if (data.success) {
      curriculums.value = data.curriculums;
    }
  } catch (err) {
    console.error('Fetch curriculums error', err);
  }
};

onMounted(() => {
  fetchCurriculums();
});

const removeCurriculum = async (id: number) => {
  if (!confirm('Are you sure? This will also remove any existing coach assignments for this curriculum.')) return;
  
  try {
    const res = await fetch(`/api/curriculums/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      fetchCurriculums();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('Failed to delete curriculum.');
  }
};

const submitUpload = async () => {
  if (!sportName.value.trim()) {
    alert('Please enter a sport name.');
    return;
  }
  if (!fileInput.value?.files?.length) {
    alert('Please select an Excel file');
    return;
  }

  const file = fileInput.value.files[0];
  const formData = new FormData();
  formData.append('sport_name', sportName.value);
  formData.append('file_name', file);

  isUploading.value = true;
  try {
    const res = await fetch('/api/curriculum/import', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      isModalOpen.value = false;
      sportName.value = '';
      if (fileInput.value) fileInput.value.value = '';
      fetchCurriculums(); // Refresh the list
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('An error occurred during upload.');
  } finally {
    isUploading.value = false;
  }
};

const getSportIcon = (sport: string) => {
  const s = (sport || '').toLowerCase();
  if (s.includes('basket')) return 'sports_basketball';
  if (s.includes('football') || s.includes('soccer')) return 'sports_soccer';
  if (s.includes('tennis')) return 'sports_tennis';
  if (s.includes('swim')) return 'pool';
  if (s.includes('cricket')) return 'sports_cricket';
  if (s.includes('volney')) return 'sports_volleyball';
  return 'sports';
};
</script>

<style scoped>
/* Scoped css if necessary */
</style>
