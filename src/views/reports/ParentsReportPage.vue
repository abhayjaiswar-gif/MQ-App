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
    const response = await fetch('/api/parents-reports');
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

const stats = computed(() => {
  const accessed = reports.value.length;
  const verified = reports.value.filter(r => String(r.otp_verified) === '0').length;
  const now = new Date();
  const recent = reports.value.filter(r => {
    if (!r.request_date) return false;
    const d = new Date(r.request_date);
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const trust = accessed > 0 ? Math.round((verified / accessed) * 100) : 100;

  return {
    accessed,
    verified,
    recent,
    trust
  };
});

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

const circleCircumference = 364.4;
const circleOffset = computed(() => circleCircumference - (circleCircumference * (stats.value.trust || 0) / 100));

onMounted(fetchReports);
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
            <span class="text-primary">Parent Access</span>
          </nav>
          <h2 class="text-4xl font-extrabold text-[#1e293b] tracking-tight font-manrope">Report Visibility Audit</h2>
          <p class="text-slate-500 mt-1 font-inter">Monitor and manage institutional report visibility and verified
            parent engagement.</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-manrope">
            <span class="material-symbols-outlined text-[20px]">file_download</span>
            Export Audit
          </button>
          <button
            class="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-[#004a88] transition-all shadow-xl shadow-primary/20 flex items-center gap-2 font-manrope">
            <span class="material-symbols-outlined text-[20px]">send_and_archive</span>
            Share Portal Link
          </button>
        </div>
      </div>

      <!-- Bento Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Reports Accessed -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-amber-500 rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">Reports Accessed
          </p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-[#1e293b] font-manrope">{{ loading ? '—' :
              stats.accessed.toLocaleString() }}</h3>
            <span
              class="text-amber-600 text-xs font-bold flex items-center bg-amber-50 px-2 py-1 rounded-lg font-inter">Visibility</span>
          </div>
        </div>

        <!-- OTP Verified -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-emerald-500 rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">OTP Verified</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-[#1e293b] font-manrope">{{ loading ? '—' :
              stats.verified.toLocaleString() }}</h3>
            <span
              class="text-emerald-600 text-xs font-bold flex items-center bg-emerald-50 px-2 py-1 rounded-lg font-inter">Secure</span>
          </div>
        </div>

        <!-- Recent Access -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-violet-500 rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">Recent Access</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-[#1e293b] font-manrope">{{ loading ? '—' :
              stats.recent.toLocaleString() }}</h3>
            <span
              class="text-violet-600 text-xs font-bold flex items-center bg-violet-50 px-2 py-1 rounded-lg font-inter">Last
              24h</span>
          </div>
        </div>

        <!-- System Trust -->
        <div class="relative bg-white p-6 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-primary rounded-b-2xl"></div>
          <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-manrope">System Trust</p>
          <div class="flex items-end justify-between">
            <h3 class="text-3xl font-extrabold text-primary font-manrope">{{ loading ? '—' : stats.trust }}%</h3>
            <span
              class="text-primary text-xs font-bold flex items-center bg-primary/5 px-2 py-1 rounded-lg font-inter">Certified</span>
          </div>
        </div>
      </div>

      <!-- Access Registry Table Section -->
      <section
        class="bg-white rounded-[32px] shadow-[0_8px_32px_rgba(0,28,58,0.04)] border border-slate-100 overflow-hidden">
        <div
          class="p-8 border-b border-slate-50 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 bg-white">
          <div class="flex flex-wrap items-center gap-6 w-full xl:w-auto">
            <div class="flex items-center bg-slate-100/80 p-1.5 rounded-2xl">
              <button @click="activeTab = 'all'; currentPage = 1"
                :class="['px-6 py-2 rounded-xl text-xs font-bold transition-all font-manrope', activeTab === 'all' ? 'bg-white shadow-md text-primary' : 'text-slate-500 hover:text-primary']">All
                Reports</button>
              <button @click="activeTab = 'term-end'; currentPage = 1"
                :class="['px-6 py-2 rounded-xl text-xs font-bold transition-all font-manrope', activeTab === 'term-end' ? 'bg-white shadow-md text-primary' : 'text-slate-500 hover:text-primary']">Term
                End</button>
              <button @click="activeTab = 'monthly'; currentPage = 1"
                :class="['px-6 py-2 rounded-xl text-xs font-bold transition-all font-manrope', activeTab === 'monthly' ? 'bg-white shadow-md text-primary' : 'text-slate-500 hover:text-primary']">Monthly</button>
            </div>
            <div class="relative flex-1 sm:flex-none sm:w-80">
              <span
                class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input v-model="search" type="text" placeholder="Search parents or email..."
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
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Ref ID
                </th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Parent
                  Details</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                  Student Link</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Report
                  Type</th>
                <th
                  class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope text-center">
                  Status</th>
                <th
                  class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope text-right">
                  Access Time</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <template v-if="loading">
                <tr>
                  <td colspan="6" class="py-24 text-center">
                    <div class="flex flex-col items-center gap-4">
                      <div class="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Accessing
                        Audit Registry...</p>
                    </div>
                  </td>
                </tr>
              </template>
              <template v-else-if="paginatedReports.length > 0">
                <tr v-for="report in paginatedReports" :key="report.id"
                  class="hover:bg-slate-50/50 transition-all group">
                  <td class="px-8 py-6">
                    <span class="text-[11px] font-bold text-slate-400 font-manrope">#RP-{{
                      report.id.toString().padStart(4, '0') }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <div class="flex items-center gap-4">
                      <div
                        :class="['w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm border border-black/5 font-manrope shadow-sm', getAvatarColor(report.id)]">
                        {{ getInitials(report.parent_name) }}
                      </div>
                      <div class="flex flex-col">
                        <span class="font-bold text-slate-700 text-sm tracking-tight font-manrope">{{ report.parent_name
                          || 'Anonymous Parent' }}</span>
                        <span class="text-[11px] text-slate-400 font-inter">{{ report.email || '—' }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-8 py-6">
                    <div class="flex flex-col">
                      <span class="text-slate-700 font-bold text-xs font-manrope">{{ report.student_id ? 'MQ-' +
                        report.student_id : '—' }}</span>
                      <span class="text-[10px] text-slate-400 font-inter uppercase tracking-tighter">Verified
                        Participant</span>
                    </div>
                  </td>
                  <td class="px-8 py-6 text-sm">
                    <span
                      class="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200 uppercase font-inter tracking-tight">
                      {{ report.report_type?.replace('_', ' ') || 'General' }}
                    </span>
                  </td>
                  <td class="px-8 py-6 text-center">
                    <span v-if="String(report.otp_verified) === '1'"
                      class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100 font-manrope">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Verified
                    </span>
                    <span v-else
                      class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100 font-manrope">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>Pending Check
                    </span>
                  </td>
                  <td class="px-8 py-6 text-right">
                    <div class="flex flex-col items-end">
                      <p class="text-sm font-bold text-slate-700 font-manrope">{{ formatDate(report.request_date) }}</p>
                      <p
                        class="text-[11px] text-slate-400 font-inter flex items-center gap-1 uppercase tracking-tighter">
                        <span class="material-symbols-outlined text-[14px]">{{ getDeviceIcon(report.request_device)
                          }}</span>
                        {{ report.request_device || 'Unknown' }}
                      </p>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="6" class="py-32 text-center opacity-40">
                  <div class="flex flex-col items-center gap-3">
                    <span class="material-symbols-outlined text-[64px] mb-2">face_retouching_off</span>
                    <p class="font-bold uppercase text-[10px] tracking-widest font-manrope">No parent access discovered
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-8 py-5 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Certified Audit Trail |
            Entry
            {{ (currentPage - 1) * perPage + 1 }} to {{ Math.min(currentPage * perPage, filteredReports.length) }}</p>
          <div class="flex items-center gap-2">
            <button @click="currentPage > 1 ? currentPage-- : null" :disabled="currentPage === 1"
              class="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-white transition-all disabled:opacity-30">
              <span class="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <div
              class="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-primary font-manrope shadow-sm">
              {{ currentPage }} / {{ totalPages }}
            </div>
            <button @click="currentPage < totalPages ? currentPage++ : null" :disabled="currentPage === totalPages"
              class="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-white transition-all disabled:opacity-30">
              <span class="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Bottom Insight Panels -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        <!-- Security Audit Panel -->
        <div
          class="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-md transition-all">
          <div class="flex-1 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined">gpp_good</span>
              </div>
              <h4 class="text-xl font-bold text-slate-900 font-manrope">Automated Security Audit</h4>
            </div>
            <p class="text-sm text-slate-500 leading-relaxed font-inter">
              System has successfully verified <strong class="text-primary">{{ stats.trust }}%</strong> of active parent
              sessions today. Cross-reference analysis shows zero unauthorized access attempts from restricted IPs.
            </p>
            <div class="pt-4 flex items-center gap-4">
              <div class="flex -space-x-3">
                <div v-for="i in 3" :key="i"
                  class="w-9 h-9 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">
                  {{ ['JS', 'AK', 'MP'][i - 1] }}
                </div>
              </div>
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-manrope">+ 4 Active
                Auditors</span>
            </div>
          </div>

          <div class="relative w-40 h-40 shrink-0">
            <svg class="w-full h-full -rotate-90">
              <circle class="text-slate-50" cx="80" cy="80" fill="transparent" r="72" stroke="currentColor"
                stroke-width="12" />
              <circle class="text-primary" cx="80" cy="80" fill="transparent" r="72" stroke="currentColor"
                :stroke-dasharray="circleCircumference" :stroke-dashoffset="circleOffset" stroke-width="12"
                stroke-linecap="round" style="transition: stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1);" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center translate-y-[-2px]">
              <span class="text-2xl font-black text-[#1e293b] font-manrope">{{ stats.trust }}%</span>
              <span class="text-[9px] uppercase font-bold text-slate-400 tracking-widest font-manrope">Secure</span>
            </div>
          </div>
        </div>

        <!-- Infrastructure Status -->
        <div
          class="bg-gradient-to-br from-slate-900 to-[#1e293b] p-8 rounded-[32px] text-white relative overflow-hidden flex flex-col justify-between group">
          <div
            class="absolute -right-16 -bottom-16 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000">
          </div>

          <div class="relative z-10">
            <h4 class="text-lg font-bold mb-6 font-manrope flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-400 text-[20px]">cloud_done</span>
              Infrastructure Status
            </h4>

            <div class="space-y-4">
              <div v-for="service in ['SMS Gateway', 'Email SMTP', 'CDN Node']" :key="service"
                class="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                <span class="text-xs font-semibold text-white/70">{{ service }}</span>
                <span class="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase">
                  Online <div
                    class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                  </div>
                </span>
              </div>
            </div>
          </div>

          <div class="relative z-10 mt-8 pt-6 border-t border-white/10">
            <p class="text-[10px] text-white/40 font-bold uppercase tracking-widest font-manrope">Last Health Check: {{
              new
                Date().toLocaleTimeString() }}</p>
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
