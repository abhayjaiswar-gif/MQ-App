<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const loading = ref(true);
const hData = ref<any>(null);
const errorMessage = ref('');

// Responsive Scaling state
const chartScale = ref(1);
const zoomLevel = ref(100);

const fetchAssignedSchool = async () => {
  try {
    const userId = sessionStorage.getItem('id') || '';
    if (!userId) {
      errorMessage.value = 'User context not found. Please log in again.';
      loading.value = false;
      return;
    }

    // Fetch schools assigned to this user
    const res = await fetch(`/api/schools?user_id=${userId}`);
    const data = await res.json();

    if (data.success && data.schools.length > 0) {
      // Pick the first assigned school
      const schoolId = data.schools[0].id;
      await fetchHierarchy(schoolId);
    } else {
      errorMessage.value = 'No institution assigned to your account.';
      loading.value = false;
    }
  } catch (err) {
    console.error('Error fetching assignments:', err);
    errorMessage.value = 'Failed to load institutional context.';
    loading.value = false;
  }
};

const fetchHierarchy = async (schoolId: number) => {
  loading.value = true;
  try {
    const res = await fetch(`/api/staff-hierarchy/automated/${schoolId}`);
    const data = await res.json();
    if (data.success) {
      hData.value = data.data;
    } else {
      errorMessage.value = data.message || 'Failed to generate hierarchy.';
    }
  } catch (err) {
    console.error('Error fetching hierarchy:', err);
    errorMessage.value = 'Communication error with staff server.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAssignedSchool();
});

const adjustZoom = (delta: number) => {
  const newZoom = zoomLevel.value + delta;
  if (newZoom >= 50 && newZoom <= 150) {
    zoomLevel.value = newZoom;
  }
};

</script>

<template>
  <div
    class="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8 font-manrope selection:bg-[#005faa]/20 flex flex-col overflow-hidden">

    <!-- Top Header (Cleaned up) -->
    <div class="max-w-7xl mx-auto w-full mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black text-[#001c3a] tracking-tighter">Organizational Blueprint</h1>
          <p class="text-slate-400 font-bold text-[11px] uppercase tracking-[0.3em]">Operational Structure & Hierarchy
          </p>
        </div>

        <!-- Zoom Controls for Responsiveness -->
        <div class="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-slate-100 print:hidden">
          <v-btn icon="remove" size="small" variant="text" color="slate-400" @click="adjustZoom(-10)" />
          <div class="text-[10px] font-black text-[#005daa] w-12 text-center">{{ zoomLevel }}%</div>
          <v-btn icon="add" size="small" variant="text" color="slate-400" @click="adjustZoom(10)" />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex flex-col items-center justify-center">
      <v-progress-circular indeterminate color="#005daa" size="64" />
      <p class="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[9px] animate-pulse">Mapping assigned
        school context...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="flex-1 flex flex-col items-center justify-center">
      <div class="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 text-center max-w-md">
        <v-icon size="48" color="orange-lighten-2">warning</v-icon>
        <p class="text-slate-700 font-bold mt-4">{{ errorMessage }}</p>
        <p class="text-slate-400 text-xs mt-2 leading-relaxed">Please contact the administrator if you believe your
          assignments are missing.</p>
      </div>
    </div>

    <!-- Chart Canvas -->
    <div v-else-if="hData"
      class="flex-1 overflow-auto bg-white rounded-[40px] shadow-inner border border-slate-100/50 p-12 relative flex flex-col items-center min-h-[800px]">

      <!-- Scaling Container -->
      <div class="transition-transform duration-300 origin-top flex flex-col items-center"
        :style="{ transform: `scale(${zoomLevel / 100})` }">

        <!-- LEVEL 0: SCHOOL CARD -->
        <div class="flex flex-col items-center mb-0">
          <div
            class="bg-[#f1f5f9] p-6 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] w-72 border border-slate-200 text-center relative group">
            <div
              class="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#001c3a] text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">
              Primary Node
            </div>
            <!-- Photo Frame -->
            <div
              class="w-16 h-16 bg-white rounded-2xl mx-auto mb-3 flex items-center justify-center p-3 ring-1 ring-slate-200 shadow-sm overflow-hidden">
              <img v-if="hData.school.logo" :src="`/uploads/${hData.school.logo}`"
                class="w-full h-full object-contain" />
              <v-icon v-else size="24" color="#005daa">school</v-icon>
            </div>
            <h2 class="text-[13px] font-black text-[#1a1c1c] leading-tight px-2">{{ hData.school.name }}</h2>
            <p class="text-[#005daa]/50 font-black text-[8px] mt-1 uppercase tracking-[0.2em]">{{ hData.school.code }}
            </p>
          </div>
          <div class="org-line-v h-12"></div>
        </div>

        <!-- MAIN SPLIT -->
        <div class="w-full relative px-20">
          <div class="org-line-h absolute top-0 left-[25%] right-[25%] h-[2px]"></div>
          <div class="flex justify-between">
            <div class="org-line-v h-8 ml-[25%]"></div>
            <div class="org-line-v h-8 mr-[25%]"></div>
          </div>
        </div>

        <div class="flex flex-row gap-12 lg:gap-24 w-full justify-center px-4">

          <!-- BRANCH: GROUND STAFF -->
          <div class="flex flex-col items-center flex-1 max-w-[45%]">
            <div
              class="text-[8px] font-black text-[#005daa] uppercase tracking-[0.4em] mb-6 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 whitespace-nowrap">
              In Ground Staff</div>

            <!-- HEAD COACH -->
            <div
              class="bg-[#f1f5f9] p-5 rounded-[2.5rem] shadow-[0_15px_35px_rgba(0,0,0,0.02)] w-full max-w-[240px] text-center border border-slate-200">
              <!-- Photo Frame -->
              <div
                class="w-14 h-14 rounded-2xl mx-auto mb-3 overflow-hidden bg-white ring-1 ring-slate-200 flex items-center justify-center shadow-inner">
                <img v-if="hData.ground.headCoach.profile_pic" :src="`/uploads/${hData.ground.headCoach.profile_pic}`"
                  class="w-full h-full object-cover" />
                <div v-else class="text-[#005daa] font-black text-base">{{ hData.ground.headCoach.name?.charAt(0) }}
                </div>
              </div>
              <h3 class="font-black text-[11px] text-[#1a1c1c] truncate px-1">{{ hData.ground.headCoach.name }}</h3>
              <p class="text-[#005daa] font-black text-[7px] uppercase tracking-widest mt-1">{{
                hData.ground.headCoach.role_name || 'Head Coach' }}</p>
            </div>

            <div class="org-line-v h-8"></div>

            <!-- COACHES ROW -->
            <div class="relative w-full">
              <div v-if="hData.ground.coaches.length > 1"
                class="org-line-h absolute top-0 left-[10%] right-[10%] h-[2px]"></div>
              <div class="flex flex-wrap justify-center gap-2 pt-0 w-full">
                <div v-for="coach in hData.ground.coaches" :key="coach.id"
                  class="flex flex-col items-center flex-1 min-w-[100px] max-w-[140px]">
                  <div class="org-line-v h-4"></div>
                  <div class="bg-[#f1f5f9] p-2 rounded-2xl shadow-sm border border-slate-200 w-full text-center">
                    <!-- Small Photo Frame -->
                    <div
                      class="w-7 h-7 rounded-lg mx-auto mb-1 overflow-hidden ring-1 ring-slate-100 shadow-sm bg-white">
                      <img v-if="coach.profile_pic" :src="`/uploads/${coach.profile_pic}`"
                        class="w-full h-full object-cover" />
                      <div v-else
                        class="w-full h-full flex items-center justify-center text-[9px] text-slate-400 font-bold">
                        {{ coach.name?.charAt(0) }}
                      </div>
                    </div>
                    <div class="text-[9px] font-bold text-[#1a1c1c] truncate px-0.5">{{ coach.name }}</div>
                    <div class="text-[7px] font-black text-[#005daa]/60 uppercase mt-0.5">{{ coach.role_name }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- BRANCH: HEAD OFFICE -->
          <div class="flex flex-col items-center flex-1 max-w-[45%]">
            <div
              class="text-[8px] font-black text-[#005daa] uppercase tracking-[0.4em] mb-6 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 whitespace-nowrap">
              Head Office Staff</div>

            <!-- SSGM -->
            <div
              class="bg-[#f1f5f9] p-5 rounded-[2.5rem] shadow-[0_15px_35px_rgba(0,0,0,0.02)] w-full max-w-[240px] text-center border border-slate-200">
              <!-- Photo Frame -->
              <div
                class="w-14 h-14 rounded-2xl mx-auto mb-3 overflow-hidden bg-white ring-1 ring-slate-200 flex items-center justify-center shadow-inner">
                <img v-if="hData.headOffice.ssgm.profile_pic" :src="`/uploads/${hData.headOffice.ssgm.profile_pic}`"
                  class="w-full h-full object-cover" />
                <div v-else class="text-[#005daa] font-black text-base">{{ hData.headOffice.ssgm.name?.charAt(0) }}
                </div>
              </div>
              <h3 class="font-black text-[11px] text-[#1a1c1c] truncate px-1">{{ hData.headOffice.ssgm.name }}</h3>
              <p class="text-[#005daa] font-black text-[8px] uppercase tracking-widest mt-1">{{
                hData.headOffice.ssgm.role_name || 'SSGM' }}</p>
            </div>

            <div class="org-line-v h-8"></div>

            <!-- Personnel row (Nandni/Laxman) -->
            <div class="relative w-full">
              <div class="org-line-h absolute top-0 left-[20%] right-[20%] h-[2px]"></div>
              <div class="flex justify-center gap-3">
                <div v-for="person in hData.headOffice.personnel" :key="person.name"
                  class="flex flex-col items-center flex-1 max-w-[160px]">
                  <div class="org-line-v h-4"></div>
                  <div class="bg-[#f1f5f9] p-2.5 rounded-2xl shadow-sm border border-slate-200 w-full text-center">
                    <div
                      class="w-8 h-8 rounded-lg mx-auto mb-1 overflow-hidden ring-1 ring-slate-100 border border-slate-100 bg-white">
                      <img v-if="person.image" :src="`/uploads/${person.image}`" class="w-full h-full object-cover" />
                      <div v-else class="w-full h-full flex items-center justify-center">
                        <v-icon size="12" color="slate-300">person</v-icon>
                      </div>
                    </div>
                    <div class="text-[10px] font-black text-[#1a1c1c] truncate">{{ person.name }}</div>
                    <div class="text-[7px] text-[#005daa] font-bold uppercase tracking-widest mt-0.5 leading-none">{{
                      person.role }}</div>
                  </div>
                  <div class="org-line-v h-8"></div>
                </div>
              </div>
            </div>

            <!-- TEAMS ROW -->
            <div class="relative w-full">
              <div class="org-line-h absolute top-0 left-[10%] right-[10%] h-[2px]"></div>
              <div class="flex justify-center gap-2 pt-0 w-full">
                <div v-for="team in hData.headOffice.teams" :key="team.id"
                  class="flex flex-col items-center flex-1 min-w-[90px] max-w-[140px]">
                  <div class="org-line-v h-4"></div>
                  <div
                    class="bg-[#f1f5f9] p-2 rounded-2xl shadow-sm border border-slate-200 w-full text-center group transition-colors hover:bg-white">
                    <div
                      class="w-7 h-7 rounded-lg mx-auto mb-1 flex items-center justify-center bg-[#001c3a]/5 group-hover:bg-[#001c3a]/10 transition-colors">
                      <v-icon size="14" color="#001c3a">{{ team.id === 'it' ? 'code' : (team.id === 'creative' ?
                        'palette' : 'menu_book') }}</v-icon>
                    </div>
                    <div class="text-[7px] font-black text-[#005daa] uppercase tracking-widest mb-0.5 opacity-80">{{
                      team.role }}</div>
                    <div class="text-[11px] font-black tracking-tighter text-[#1a1c1c] truncate">{{ team.name }}</div>
                    <div v-if="team.member" class="mt-0.5 text-[8px] font-bold text-[#005daa] truncate">{{ team.member
                    }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.org-line-v {
  width: 2px;
  background-color: #cbd5e1;
}

.org-line-h {
  background-color: #cbd5e1;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

@media print {
  .min-h-screen {
    background-color: white !important;
    padding: 0 !important;
  }

  .overflow-auto {
    overflow: visible !important;
    height: auto !important;
    width: auto !important;
    border: none !important;
    box-shadow: none !important;
  }
}
</style>
