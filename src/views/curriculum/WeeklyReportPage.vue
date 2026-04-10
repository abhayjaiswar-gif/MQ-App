<template>
  <div class="min-h-screen bg-slate-50 py-10 px-4 font-sans print:p-0 print:bg-white">
    <!-- BEGIN: Navigation Header (Hidden on Print) -->
    <div class="max-w-[850px] mx-auto mb-6 flex justify-between items-center px-4 print:hidden">
      <div class="flex items-center gap-2">
        <button @click="$router.back()" class="p-2 hover:bg-white rounded-full transition-colors group">
          <span class="material-symbols-outlined text-slate-400 group-hover:text-[#1890FF]">arrow_back</span>
        </button>
        <h1 class="text-xl font-bold text-slate-800">Weekly Summary</h1>
      </div>
      <div class="flex gap-3">
        <button @click="printReport" class="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
          <span class="material-symbols-outlined text-sm">print</span>
          Print
        </button>
        <button @click="printReport" class="flex items-center gap-2 px-4 py-2 bg-[#1890FF] text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm">
          <span class="material-symbols-outlined text-sm">download</span>
          Download PDF
        </button>
      </div>
    </div>

    <!-- BEGIN: Report Container -->
    <main v-if="reportData" class="report-page max-w-[850px] mx-auto bg-white rounded-xl shadow-xl p-12 min-h-[1100px] print:shadow-none print:p-0 print:m-0" id="report-content">
      
      <!-- Report Header -->
      <div class="flex justify-between items-center mb-12 border-b border-slate-100 pb-8">
        <div>
          <h1 class="text-3xl font-black text-slate-800 tracking-tight">
            {{ reportData.is_individual ? 'Coach Progress Report' : 'Student Progress Report' }}
          </h1>
          <p class="text-sm font-bold text-[#1890FF] uppercase tracking-widest mt-1">
            {{ reportData.is_individual ? reportData.coach_name : 'Elite Sports Academy - Consolidated' }}
          </p>
        </div>
        <div class="text-right">
          <div class="text-lg font-bold text-slate-900">{{ reportData.school_name }}</div>
          <div class="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">{{ reportData.month_year }} — {{ reportData.week_no }}</div>
        </div>
      </div>

      <!-- Sport Sections loop -->
      <div v-if="reportData.assignments && reportData.assignments.length">
        <section v-for="(group, sportName) in groupedAssignments" :key="sportName" class="sport-section bg-white rounded-xl p-8 mb-8 border border-slate-200 shadow-sm">
          <!-- Header with Coach -->
          <div class="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
            <div>
              <h2 class="text-2xl font-extrabold text-slate-800">{{ sportName }}</h2>
              <p class="text-sm text-slate-500 font-medium">Coach {{ group[0].coach_name || 'Michael (Demo)' }}</p>
            </div>
            <div class="relative">
              <img alt="Coach Profile" class="w-16 h-16 rounded-full border-4 border-white shadow-sm object-cover" 
                   src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXoaD2BtwnX8E2AjayHRL27zxuvpenPsIUleXxNOZa8ubQvOcZiWytN2cDP3J_PtzqUBRAakOEbom3Dulfryiayqu1qkaPnjodz2XN7Vm63qxiHHOuK4yqFkA7eAP8ecavnv_gbq0yH1STP0efHLE-q9PLylDrCXCwtH1g4eIGk_iQ2emWWhKuRzpRJfTB5YrnHcRQ2Lk6YqREfn_inNKTC8_TGZbobLHkxHmd_QnnUVU58Owcub7mxmEXTZ11EjwHaeUsatlbbA4x"/>
            </div>
          </div>

          <!-- Performance Overview -->
          <div class="mb-8">
            <h3 class="section-title text-[0.75rem] font-black text-slate-400 uppercase tracking-widest mb-3">Performance Overview</h3>
            <div class="space-y-4">
              <div v-for="item in group" :key="item.lp_no" class="flex gap-4 items-start bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                <div class="w-2 h-2 rounded-full bg-[#1890FF] mt-1.5 shrink-0 shadow-[0_0_8px_rgba(24,144,255,0.4)]"></div>
                <div>
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-[10px] font-black text-slate-800 uppercase tracking-widest">{{ item.skill }}</span>
                    <span :class="getStatusClass(item.lp_status)" class="text-[8px] font-black px-2 py-0.5 rounded-full border">
                      {{ item.lp_status || 'UNMARKED' }}
                    </span>
                  </div>
                  <p class="text-[13px] text-slate-600 leading-relaxed italic font-medium">
                    "{{ item.lp_remark || item.objective }}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Gallery Placeholder -->
          <div>
            <h3 class="section-title text-[0.75rem] font-black text-slate-400 uppercase tracking-widest mb-3">Gallery & Evidence</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                <img alt="Sport Gallery" class="w-full h-40 object-cover opacity-80 hover:opacity-100 transition-all cursor-pointer" 
                     src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9bgIzHLCklH-aGDLn4GV2An952-_AAcD-8dfMamDDRN5lTdZycdcIHYxdhmJLiiLA4wvkV00g3Qr_n0w1q7TosIBbGThhjhcXnmgRK9HpJ4y8g0UUG0XD8v3Ybr9Qf5Fzw3FZ1x7dNpbNry59VWcrC0uBp9KuSPJDHQ-uJIW18_eJBbDVbByXO0-O4pjLay0qflhh2MtE744r_URqAtlCzgDPOVQ8nYFzQ446zJowMW-k8PDA1ZYwUyIdUvAfQeIorOBXxRDQ0rwP"/>
              </div>
              <div class="rounded-lg overflow-hidden border border-slate-200 bg-slate-200 flex items-center justify-center relative group cursor-pointer">
                <span class="material-symbols-outlined text-4xl text-slate-400 group-hover:text-[#1890FF] transition-colors">videocam</span>
                <div class="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-all"></div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div v-else class="py-32 text-center text-slate-400 italic font-medium">
        No performance data mapped for this period.
      </div>

      <!-- BEGIN: Footer -->
      <footer class="mt-12 pt-8 border-t border-slate-100 text-center">
        <p class="text-[0.65rem] text-slate-400 font-black uppercase tracking-widest">
          © 2026 Elite Sports Academy. Confidential Performance Report.
        </p>
      </footer>
    </main>

    <!-- Loading State -->
    <div v-else class="flex flex-col items-center justify-center py-32">
      <div class="w-12 h-12 border-4 border-[#1890FF] border-t-transparent rounded-full animate-spin mb-6"></div>
      <p class="text-slate-400 font-bold text-xs uppercase tracking-widest">Compiling performance summary...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const reportData = ref<any>(null);
const loading = ref(true);

const fetchReportData = async () => {
  const { school_id, week_no, month_year, coach_id } = route.query;
  if (!school_id || !week_no || !month_year) return;

  try {
    const params = new URLSearchParams({
      school_id: school_id as string,
      week_no: week_no as string,
      month_year: month_year as string
    });
    if (coach_id) params.append('coach_id', coach_id as string);
    
    const res = await fetch(`/api/curriculum/weekly-report-data?${params}`);
    const data = await res.json();
    if (data.success) {
      reportData.value = data.data;
    }
  } catch (err) {
    console.error('Report fetch error:', err);
  } finally {
    loading.value = false;
  }
};

const groupedAssignments = computed(() => {
  if (!reportData.value?.assignments) return {};
  return reportData.value.assignments.reduce((acc: any, item: any) => {
    const sport = item.sport || 'General';
    if (!acc[sport]) acc[sport] = [];
    acc[sport].push(item);
    return acc;
  }, {});
});

const getStatusClass = (status: string) => {
  if (status === 'Done') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  if (status === 'Pending') return 'bg-amber-50 text-amber-600 border-amber-100';
  return 'bg-slate-50 text-slate-400 border-slate-100';
};

const printReport = () => {
  window.print();
};

onMounted(() => {
  fetchReportData();
});
</script>

<style scoped>
.report-page {
  font-family: 'Manrope', sans-serif;
}

@media print {
  body {
    background: white;
  }
  .min-h-screen {
    background-color: white !important;
    padding: 0 !important;
  }
  .report-page {
    box-shadow: none !important;
    max-width: 100% !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .sport-section {
    break-inside: avoid;
    box-shadow: none !important;
    border: 1px solid #E2E8F0 !important;
  }
}
</style>
