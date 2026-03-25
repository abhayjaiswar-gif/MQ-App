<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface ParentReport {
  id: number;
  report_id: number;
  fitness_test_id: number;
  report_type: string;
  report_key: string;
  student_id: number;
  parent_name: string;
  email: string;
  mobile: string;
  otp: string;
  otp_verified: string | number;
  report_sent_status: string;
  request_date: string;
  request_ip: string;
  request_device: string;
}

const reports = ref<ParentReport[]>([]);
const loading = ref(true);
const search = ref('');
const activeTab = ref('all');
const currentPage = ref(1);
const perPage = 10;

const fetchReports = async () => {
  loading.value = true;
  try {
    const response = await fetch('http://localhost:3000/api/parents-reports');
    const data = await response.json();
    if (data.success) reports.value = data.reports;
  } catch (error) {
    console.error('Error fetching parent reports:', error);
  } finally {
    loading.value = false;
  }
};

const filteredReports = computed(() => {
  let list = reports.value;
  if (activeTab.value === 'term-end') list = list.filter(r => r.report_type === 'term_end');
  else if (activeTab.value === 'monthly') list = list.filter(r => r.report_type === 'monthly');
  if (!search.value) return list;
  const q = search.value.toLowerCase();
  return list.filter(r =>
    r.parent_name?.toLowerCase().includes(q) ||
    r.email?.toLowerCase().includes(q) ||
    r.mobile?.includes(q) ||
    String(r.student_id)?.includes(q)
  );
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredReports.value.length / perPage)));
const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredReports.value.slice(start, start + perPage);
});

const stats = computed(() => ({
  accessed: reports.value.length,
  verified: reports.value.filter(r => String(r.otp_verified) === '0').length,
  recent: reports.value.filter(r => {
    if (!r.request_date) return false;
    const today = new Date().toISOString().split('T')[0];
    const recordDate = new Date(r.request_date).toISOString().split('T')[0];
    return recordDate === today;
  }).length,
}));

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getInitials = (name: string) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

const avatarColors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700', 'bg-green-100 text-green-700', 'bg-rose-100 text-rose-700'];
const getAvatarColor = (id: number) => avatarColors[id % avatarColors.length];

const getDeviceIcon = (device: string) => {
  if (!device) return 'devices';
  const d = device.toLowerCase();
  if (d.includes('iphone') || d.includes('android') || d.includes('mobile')) return 'smartphone';
  if (d.includes('ipad') || d.includes('tablet')) return 'tablet';
  return 'laptop';
};

const verifiedPercent = computed(() => {
  if (!stats.value.accessed) return 0;
  return Math.round((stats.value.verified / stats.value.accessed) * 100);
});
const circleCircumference = 364.4;
const circleOffset = computed(() => circleCircumference - (circleCircumference * verifiedPercent.value / 100));

onMounted(fetchReports);
</script>

<template>
  <div class="min-h-screen bg-surface" style="font-family: 'Inter', sans-serif;">
    <div class="p-8 max-w-7xl mx-auto space-y-10">

      <!-- Header -->
      <div class="flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight" style="font-family: 'Manrope', sans-serif;">
            Parent Report Access
          </h1>
          <p class="text-on-surface-variant mt-1">Real-time monitoring of academic report visibility and verification.</p>
        </div>
        <div class="flex gap-3">
          <button class="px-4 py-2 bg-white border border-outline-variant rounded-xl text-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">filter_list</span>
            Advanced Filters
          </button>
          <button class="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-95 transition-all shadow-md shadow-primary/20 flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">share</span>
            Share Portal Link
          </button>
        </div>
      </div>

      <!-- Stats Cards (3 cards) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Removed: Total Reports Sent card -->

        <div class="bg-white p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,28,58,0.04)] group hover:translate-y-[-2px] transition-all">
          <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <span class="material-symbols-outlined">visibility</span>
            </div>
            <span class="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-md flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">trending_up</span>8%
            </span>
          </div>
          <p class="text-on-surface-variant text-xs font-semibold mb-1">Reports Accessed</p>
          <h3 class="text-3xl font-bold text-slate-900" style="font-family: 'Manrope', sans-serif;">
            {{ loading ? '—' : stats.accessed.toLocaleString() }}
          </h3>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,28,58,0.04)] group hover:translate-y-[-2px] transition-all">
          <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <span class="material-symbols-outlined">verified_user</span>
            </div>
            <span class="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-md flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">trending_up</span>{{ verifiedPercent }}%
            </span>
          </div>
          <p class="text-on-surface-variant text-xs font-semibold mb-1">OTP Verified Sessions</p>
          <h3 class="text-3xl font-bold text-slate-900" style="font-family: 'Manrope', sans-serif;">
            {{ loading ? '—' : stats.verified.toLocaleString() }}
          </h3>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,28,58,0.04)] group hover:translate-y-[-2px] transition-all">
          <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <span class="material-symbols-outlined">download_done</span>
            </div>
            <span class="text-slate-400 text-xs font-bold bg-slate-50 px-2 py-1 rounded-md">Last 24h</span>
          </div>
          <p class="text-on-surface-variant text-xs font-semibold mb-1">Recent Downloads</p>
          <h3 class="text-3xl font-bold text-slate-900" style="font-family: 'Manrope', sans-serif;">
            {{ loading ? '—' : stats.recent.toLocaleString() }}
          </h3>
        </div>
      </div>

      <!-- Main Data Table -->
      <div class="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,28,58,0.06)] overflow-hidden">

        <!-- Filters Bar -->
        <div class="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                @click="activeTab = 'all'; currentPage = 1"
                :class="['px-4 py-1.5 rounded-md text-sm font-semibold transition-all', activeTab === 'all' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary']"
              >All Reports</button>
              <button
                @click="activeTab = 'term-end'; currentPage = 1"
                :class="['px-4 py-1.5 text-sm font-medium transition-colors', activeTab === 'term-end' ? 'bg-white shadow-sm rounded-md text-primary' : 'text-on-surface-variant hover:text-primary']"
              >Term End</button>
              <button
                @click="activeTab = 'monthly'; currentPage = 1"
                :class="['px-4 py-1.5 text-sm font-medium transition-colors', activeTab === 'monthly' ? 'bg-white shadow-sm rounded-md text-primary' : 'text-on-surface-variant hover:text-primary']"
              >Monthly Progress</button>
            </div>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                v-model="search"
                type="text"
                placeholder="Search parent, email, mobile..."
                @input="currentPage = 1"
                class="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
              />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <p class="text-xs font-semibold text-on-surface-variant mr-2">
              Showing {{ paginatedReports.length }} of {{ filteredReports.length }} entries
            </p>
            <button @click="fetchReports" class="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-all" title="Refresh">
              <span class="material-symbols-outlined text-xl">refresh</span>
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100">
                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">ID</th>
                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Parent Name</th>
                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Contact Details</th>
                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Student ID</th>
                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Report Type</th>
                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">OTP Verified</th>
                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Access Time</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <template v-if="loading">
                <tr>
                  <td colspan="8" class="py-20 text-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p class="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</p>
                  </td>
                </tr>
              </template>
              <template v-else-if="paginatedReports.length > 0">
                <tr v-for="report in paginatedReports" :key="report.id" class="hover:bg-slate-50/60 transition-colors group">
                  <td class="px-6 py-5 text-sm font-medium text-on-surface-variant">#RP-{{ report.id }}</td>
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                      <div :class="['w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0', getAvatarColor(report.id)]">
                        {{ getInitials(report.parent_name) }}
                      </div>
                      <p class="text-sm font-bold text-slate-900">{{ report.parent_name || '—' }}</p>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <p class="text-sm font-medium text-slate-900">{{ report.email || '—' }}</p>
                    <p class="text-[11px] text-on-surface-variant">{{ report.mobile || '—' }}</p>
                  </td>
                  <td class="px-6 py-5 text-sm font-medium text-slate-700">
                    {{ report.student_id ? 'MQ-' + report.student_id : '—' }}
                  </td>
                  <td class="px-6 py-5">
                    <span class="px-2.5 py-1 bg-secondary-container/30 text-on-secondary-container text-[11px] font-bold rounded-lg border border-secondary-container/50">
                      {{ report.report_type || 'General' }}
                    </span>
                  </td>
                  <td class="px-6 py-5">
                    <span v-if="String(report.otp_verified) === '0'" class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-[11px] font-bold rounded-lg border border-green-100">
                      <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>Verified
                    </span>
                    <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 text-[11px] font-bold rounded-lg">
                      <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Pending
                    </span>
                  </td>
                  <td class="px-6 py-5">
                    <p class="text-sm font-medium text-slate-900">{{ formatDate(report.request_date) }}</p>
                    <p class="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span class="material-symbols-outlined text-[12px]">{{ getDeviceIcon(report.request_device) }}</span>
                      {{ report.request_device || '—' }}
                    </p>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="7" class="py-20 text-center opacity-40">
                  <span class="material-symbols-outlined text-4xl">family_restroom</span>
                  <p class="font-bold uppercase text-xs tracking-widest mt-2">No records found</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="p-6 border-t border-slate-100 flex items-center justify-between">
          <button
            @click="currentPage > 1 ? currentPage-- : null"
            :disabled="currentPage === 1"
            class="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span class="material-symbols-outlined text-[16px]">chevron_left</span>Previous
          </button>
          <div class="flex items-center gap-1">
            <template v-for="p in totalPages" :key="p">
              <button
                v-if="p <= 3 || p === totalPages || Math.abs(p - currentPage) <= 1"
                @click="currentPage = p"
                :class="['w-8 h-8 rounded-lg text-xs font-bold transition-all', p === currentPage ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-slate-100']"
              >{{ p }}</button>
              <span v-else-if="p === 4 && currentPage > 5" class="px-2 text-on-surface-variant">...</span>
            </template>
          </div>
          <button
            @click="currentPage < totalPages ? currentPage++ : null"
            :disabled="currentPage === totalPages"
            class="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next<span class="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        <!-- Security Audit Card -->
        <div class="lg:col-span-2 bg-slate-50 rounded-2xl p-8 flex items-center justify-between border border-white">
          <div class="max-w-md">
            <h4 class="text-lg font-bold text-slate-900 mb-2" style="font-family: 'Manrope', sans-serif;">Automated Security Audit</h4>
            <p class="text-sm text-on-surface-variant leading-relaxed">
              System has verified {{ verifiedPercent }}% of sessions today. No unauthorized access attempts detected. Security protocols are operating within normal parameters.
            </p>
            <div class="mt-6 flex gap-4 items-center">
              <div class="flex -space-x-2">
                <div class="w-8 h-8 rounded-full bg-blue-200 border-2 border-white flex items-center justify-center text-blue-700 text-[10px] font-black">AU</div>
                <div class="w-8 h-8 rounded-full bg-purple-200 border-2 border-white flex items-center justify-center text-purple-700 text-[10px] font-black">MK</div>
                <div class="w-8 h-8 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center text-amber-700 text-[10px] font-black">SR</div>
              </div>
              <span class="text-xs font-bold text-primary">+ 4 active auditors</span>
            </div>
          </div>
          <div class="hidden md:block shrink-0">
            <div class="relative w-32 h-32">
              <svg class="w-full h-full -rotate-90">
                <circle class="text-slate-200" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" stroke-width="8"/>
                <circle class="text-primary" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor"
                  :stroke-dasharray="circleCircumference"
                  :stroke-dashoffset="circleOffset"
                  stroke-width="8" stroke-linecap="round"
                  style="transition: stroke-dashoffset 1s ease;"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-xl font-bold text-primary" style="font-family: 'Manrope', sans-serif;">{{ verifiedPercent }}%</span>
                <span class="text-[9px] uppercase font-bold text-slate-400">Verified</span>
              </div>
            </div>
          </div>
        </div>

        <!-- System Status Card -->
        <div class="bg-primary-container text-white rounded-2xl p-8 relative overflow-hidden group">
          <div class="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <span class="material-symbols-outlined" style="font-size: 160px;">verified_user</span>
          </div>
          <h4 class="text-lg font-bold mb-2 relative z-10" style="font-family: 'Manrope', sans-serif;">System Status</h4>
          <p class="text-sm text-white/80 leading-relaxed mb-6 relative z-10">All notification services (Email/SMS) are currently healthy.</p>
          <div class="space-y-3 relative z-10">
            <div class="flex items-center justify-between text-xs bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <span class="font-semibold">SMS Gateway</span>
              <span class="font-bold flex items-center gap-1">Online <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span></span>
            </div>
            <div class="flex items-center justify-between text-xs bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <span class="font-semibold">Email SMTP</span>
              <span class="font-bold flex items-center gap-1">Online <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span></span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
}
</style>
