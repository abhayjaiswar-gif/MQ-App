<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTeamStore } from '@/stores/teams';
import * as XLSX from 'xlsx';


const router = useRouter();
const teamStore = useTeamStore();

const teamName = ref('');
const sportType = ref('');
const selectedSchoolId = ref('');
const selectedCoachId = ref('');
const description = ref('');
const isSaving = ref(false);
const roster = ref<any[]>([]);

const schools = ref<any[]>([]);
const coaches = ref<any[]>([]);

onMounted(async () => {
  try {
    const res = await fetch('/api/schools');
    const data = await res.json();
    if (data.success) schools.value = data.schools;
  } catch (err) {
    console.error('Error fetching schools:', err);
  }

  try {
    const res = await fetch('/api/coaches');
    const data = await res.json();
    if (data.success) coaches.value = data.coaches;
  } catch (err) {
    console.error('Error fetching coaches:', err);
  }
});

const goBack = () => {
  router.push('/management/teams');
};

const handleCreateTeam = async () => {
  if (!teamName.value || !sportType.value) {
    alert('Please enter Team Name and Sport Type');
    return;
  }
  
  isSaving.value = true;
  const success = await teamStore.addTeam({
    name: teamName.value,
    sport: sportType.value,
    school_id: selectedSchoolId.value,
    coach_id: selectedCoachId.value,
    description: description.value,
    roster: roster.value
  });
  
  isSaving.value = false;
  if (success) {
    goBack();
  } else {
    alert('Failed to create team. Please try again.');
  }
};


const downloadTemplate = () => {
  const headers = [['Name', 'Std', 'Division']];
  const worksheet = XLSX.utils.aoa_to_sheet(headers);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Roster Template');
  XLSX.writeFile(workbook, 'Team_Roster_Template.xlsx');
};

const triggerUpload = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx, .xls';
  input.onchange = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event: any) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      roster.value = jsonData;
      console.log('Parsed Roster:', jsonData);
    };
    reader.readAsArrayBuffer(file);
  };
  input.click();
};
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] p-6 md:p-12 flex items-center justify-center animate-in fade-in duration-500">
    <!-- Premium Card Container -->
    <div class="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100/80 flex flex-col overflow-hidden">
      
      <!-- Premium Header -->
      <div class="px-10 py-10 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-white to-slate-50/30">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span class="text-[10px] font-black text-primary uppercase tracking-[0.2em] font-headline">New Academic Program</span>
          </div>
          <h2 class="text-3xl font-extrabold font-headline text-slate-900 tracking-tight">Create Athletic Team</h2>
          <p class="text-[13px] text-slate-400 font-medium font-body mt-1">Initialize team rosters and personnel assignments for the new session.</p>
        </div>
        <button @click="goBack" class="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center hover:bg-slate-50 hover:scale-105 transition-all text-slate-400 hover:text-slate-600">
          <span class="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      <!-- Enhanced Form Container -->
      <div class="p-10 overflow-y-auto space-y-10 custom-scrollbar max-h-[70vh]">
        
        <!-- Identity Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-2.5">
            <label class="text-[11px] font-black font-headline text-slate-400 uppercase tracking-widest ml-1">Team Identity</label>
            <input v-model="teamName" 
                   class="w-full bg-slate-50/50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 rounded-2xl px-6 py-4.5 text-sm transition-all placeholder:text-slate-300 font-bold text-slate-700 outline-none" 
                   placeholder="e.g. Varsity Bulldogs" type="text"/>
          </div>
          
          <div class="space-y-2.5">
            <label class="text-[11px] font-black font-headline text-slate-400 uppercase tracking-widest ml-1">Sport Category</label>
            <div class="relative">
              <input v-model="sportType"
                     class="w-full bg-slate-50/50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 rounded-2xl px-6 py-4.5 text-sm transition-all placeholder:text-slate-300 font-bold text-slate-700 outline-none" 
                     placeholder="e.g. Basketball" type="text"/>
              <span class="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 scale-90">sports_kabaddi</span>
            </div>
          </div>
        </div>

        <!-- Assignment Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-2.5">
            <label class="text-[11px] font-black font-headline text-slate-400 uppercase tracking-widest ml-1">Select Institution</label>
            <div class="relative">
              <select v-model="selectedSchoolId"
                      class="w-full appearance-none bg-slate-50/50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 rounded-2xl px-6 py-4.5 text-sm transition-all cursor-pointer font-bold text-slate-700 outline-none">
                <option value="">Choose School</option>
                <option v-for="school in schools" :key="school.id" :value="school.id">{{ school.name }}</option>
              </select>
              <span class="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 scale-90">business</span>
            </div>
          </div>
          <div class="space-y-2.5">
            <label class="text-[11px] font-black font-headline text-slate-400 uppercase tracking-widest ml-1">Assigned Head Coach</label>
            <div class="relative">
              <select v-model="selectedCoachId"
                      class="w-full appearance-none bg-slate-50/50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 rounded-2xl px-6 py-4.5 text-sm transition-all cursor-pointer font-bold text-slate-700 outline-none">
                <option value="">Assign Coach</option>
                <option v-for="coach in coaches" :key="coach.id" :value="coach.id">{{ coach.name }}</option>
              </select>
              <span class="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 scale-90">badge</span>
            </div>
          </div>
        </div>

        <!-- Premium Upload Zone -->
        <div class="space-y-4">
          <label class="text-[11px] font-black font-headline text-slate-400 uppercase tracking-widest ml-1">Roster Import</label>
          <div class="bg-indigo-50/30 rounded-[2rem] p-10 border-2 border-dashed border-indigo-100 flex flex-col items-center justify-center text-center space-y-6 group hover:border-primary/30 hover:bg-white transition-all cursor-default relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 blur-3xl -mr-16 -mt-16"></div>
            <div class="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 outline outline-slate-100">
              <span class="material-symbols-outlined text-3xl">upload_file</span>
            </div>
            <div>
              <p class="font-bold text-slate-800 font-headline">Import Team Roster</p>
              <p class="text-xs text-slate-400 font-body mt-1 max-w-[280px]">Download the standardized student template first for bulk automated enrollment.</p>
              <div v-if="roster.length > 0" class="mt-3 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 animate-bounce">
                <span class="material-symbols-outlined text-sm">check_circle</span>
                <span class="text-[11px] font-bold uppercase tracking-wider">{{ roster.length }} Students Loaded</span>
              </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-4 w-full relative z-10 font-headline">
              <button @click="triggerUpload" 
                      class="flex-1 bg-slate-900 text-white px-7 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-200">
                <span class="material-symbols-outlined text-base">file_upload</span>
                Upload Excel
              </button>
              <button @click="downloadTemplate" 
                      class="flex-1 bg-white text-slate-600 border border-slate-200 px-7 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all hover:text-primary">
                <span class="material-symbols-outlined text-base">sim_card_download</span>
                Download Template
              </button>
            </div>
          </div>
        </div>

        <!-- Philosophical Bio -->
        <div class="space-y-2.5">
          <label class="text-[11px] font-black font-headline text-slate-400 uppercase tracking-widest ml-1">Season Objectives / Notes</label>
          <textarea v-model="description" 
                    class="w-full bg-slate-50/50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 rounded-2xl px-6 py-5 text-sm transition-all placeholder:text-slate-300 font-medium text-slate-600 outline-none resize-none min-h-[120px]" 
                    placeholder="Describe team philosophy, practice schedule requirements, or core objectives for the upcoming athletic season..."></textarea>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4">
        <button @click="goBack" 
                class="px-8 py-3 rounded-2xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all text-xs uppercase tracking-widest">Cancel</button>
        <button @click="handleCreateTeam" :disabled="isSaving"
                class="bg-primary text-white px-12 py-3 rounded-2xl font-bold hover:bg-primary-container hover:scale-105 transition-all text-xs uppercase tracking-widest shadow-xl shadow-primary/25 disabled:opacity-50">
          {{ isSaving ? 'Establishing...' : 'Confirm & Create Team' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-headline { font-family: 'Manrope', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 24;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #f1f5f9;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #e2e8f0;
}
</style>

