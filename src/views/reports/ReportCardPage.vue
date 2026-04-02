<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';

// ─────────────────────────────
// TYPES
// ─────────────────────────────
interface Student {
  id: string;
  mq_id?: string;
  name: string;
  std: string;
  division: string;
  status: 'Pending' | 'Processing' | 'Generated';
  avatar: string;
  grade?: string;
}

interface FilterItem {
  id: string | number;
  name: string;
}

// ─────────────────────────────
// STATE
// ─────────────────────────────
const schoolsList = ref<FilterItem[]>([]);
const standardsList = ref<FilterItem[]>([]);
const divisionsList = ref<string[]>([]);

const selectedSchoolId = ref<number | null>(null);
const selectedStandard = ref<number | null>(null);
const selectedDivision = ref<string | null>(null);

const students = ref<Student[]>([]);
const loading = ref(false);

const isGenerating = ref(false);
const progress = ref(0);
const generatedCount = ref(0);
const totalStudents = ref(0);
const isFetchingMore = ref(false);
const hasMore = computed(() => students.value.length < totalStudents.value);
const currentLimit = ref(15);
const currentOffset = ref(0);

const showZipButton = ref(false);
const generatedIds = ref<string[]>([]);

const showPreview = ref(false);
const previewLoading = ref(false);
const selectedReportData = ref<any>(null);

// ─────────────────────────────
// MODAL STATE & SETTINGS
// ─────────────────────────────
const showOptions = ref(false);
const includeScanner = ref(true); // Default to true
const selectedTerm = ref('both');

const fetchFilters = async (schoolId: number | null = null) => {
  try {
    const url = schoolId
      ? `http://localhost:3000/api/fill-marks/filters?school_id=${schoolId}`
      : 'http://localhost:3000/api/fill-marks/filters';

    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      schoolsList.value = data.filters.schools;
      standardsList.value = data.filters.standards;
      divisionsList.value = data.filters.divisions;
    }
  } catch (e) {
    console.error(e);
  }
};

// ─────────────────────────────
// FETCH STUDENTS (Infinite Scroll)
// ─────────────────────────────
const fetchStudents = async (isInitial = true) => {
  if (!selectedSchoolId.value) return;
  if (!isInitial && (isFetchingMore.value || !hasMore.value)) return;

  if (isInitial) {
    loading.value = true;
    students.value = [];
    currentOffset.value = 0;
    currentLimit.value = 15;
  } else {
    isFetchingMore.value = true;
  }

  try {
    const params = new URLSearchParams({
      school_id: selectedSchoolId.value.toString(),
      offset: currentOffset.value.toString(),
      limit: currentLimit.value.toString()
    });
    if (selectedStandard.value) {
      // Check if selectedStandard is an object (standard behavior or string ID)
      const stdVal = (typeof selectedStandard.value === 'object' && selectedStandard.value !== null)
        ? (selectedStandard.value as any).id
        : selectedStandard.value;
      params.append('std', stdVal.toString());
    }
    if (selectedDivision.value) params.append('division', selectedDivision.value);

    const res = await fetch(`http://localhost:3000/api/reports/students?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      const mappedStudents = data.students.map((s: any) => ({
        id: s.result_id || s.id,
        mq_id: s.mq_id,
        name: s.name,
        std: s.std,
        division: s.division,
        status: 'Pending',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`
      }));

      students.value = isInitial ? mappedStudents : [...students.value, ...mappedStudents];
      totalStudents.value = data.total;
      currentOffset.value = students.value.length;
      currentLimit.value = 25;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
    isFetchingMore.value = false;
  }
};

const handleIntersect = (isIntersecting: boolean) => {
  if (isIntersecting && !loading.value && !isFetchingMore.value && hasMore.value) {
    fetchStudents(false);
  }
};

// ─────────────────────────────
// GENERATION LOGIC
// ─────────────────────────────
const startBulkGeneration = async () => {
  if (!selectedSchoolId.value || isGenerating.value) return;

  isGenerating.value = true;
  progress.value = 0;
  generatedCount.value = 0;
  showZipButton.value = false;
  generatedIds.value = [];

  let targetIds: string[] = [];

  try {
    // 1. Fetch ALL student IDs for these filters to bypass infinite scroll limit
    const params = new URLSearchParams({
      school_id: selectedSchoolId.value.toString(),
      limit: '10000', // Fetch up to 10k for bulk
      offset: '0'
    });
    if (selectedStandard.value) {
      const stdVal = (typeof selectedStandard.value === 'object' && selectedStandard.value !== null)
        ? (selectedStandard.value as any).id
        : selectedStandard.value;
      params.append('std', stdVal.toString());
    }
    if (selectedDivision.value) params.append('division', selectedDivision.value);

    const listRes = await fetch(`http://localhost:3000/api/reports/students?${params.toString()}`);
    const listData = await listRes.json();

    if (!listData.success || !listData.students.length) {
      isGenerating.value = false;
      return;
    }

    targetIds = listData.students.map((s: any) => String(s.result_id || s.id));
    const totalToProcess = targetIds.length;

    // 2. Loop through ALL fetched IDs
    for (let i = 0; i < totalToProcess; i++) {
      const currentId = targetIds[i];

      // Update local table status if visible
      const localStudent = students.value.find(s => s.id === currentId);
      if (localStudent) localStudent.status = 'Processing';

      const genRes = await fetch('http://localhost:3000/api/reports/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result_id: currentId,
          options: {
            selectedTerm: selectedTerm.value,
            showScanner: includeScanner.value
          }
        })
      });
      const data = await genRes.json();

      if (data.success) {
        if (localStudent) localStudent.status = 'Generated';
        generatedIds.value.push(currentId);
      } else {
        if (localStudent) localStudent.status = 'Pending';
      }

      generatedCount.value = generatedIds.value.length;
      progress.value = Math.round(((i + 1) / totalToProcess) * 100);
    }

  } catch (e) {
    console.error("Bulk Generation Error:", e);
  } finally {
    isGenerating.value = false;
    showZipButton.value = generatedIds.value.length > 0;
  }
};

const downloadZip = () => {
  if (generatedIds.value.length === 0) return;
  const ids = generatedIds.value.join(',');
  window.open(`http://localhost:3000/api/reports/download-zip?ids=${encodeURIComponent(ids)}`, '_blank');
};

const downloadSinglePdf = (resultId: string | number) => {
  const options = JSON.stringify({
    selectedTerm: selectedTerm.value,
    showScanner: includeScanner.value
  });
  window.open(`http://localhost:3000/api/reports/download-single/${resultId}?overrides=${encodeURIComponent(options)}`, '_blank');
};

const openPreview = async (resultId: string | number) => {
  previewLoading.value = true;
  showPreview.value = true;
  try {
    const res = await fetch(`http://localhost:3000/api/reports/data/${resultId}`);
    const data = await res.json();
    if (data.success) selectedReportData.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    previewLoading.value = false;
  }
};

// ─────────────────────────────
// WATCHERS
// ─────────────────────────────
watch(selectedSchoolId, async (val) => {
  selectedStandard.value = null;
  selectedDivision.value = null;
  await fetchFilters(val);
  await fetchStudents(true);
});

watch([selectedStandard, selectedDivision], () => fetchStudents(true));

onMounted(fetchFilters);
</script>

<template>
  <div class="report-card-page bg-[#f9f9f9] min-h-screen font-body text-on-surface">
    <!-- Main Content Area -->
    <div class="pt-3 pb-4 px-1">
      <!-- Page Header & Action -->
      <div class="flex justify-between items-start mb-8">
        <div>
          <h2 class="text-3xl font-extrabold font-headline text-on-surface tracking-tight">Report Card Generation</h2>
          <p class="text-on-surface-variant mt-1 text-sm">Manage and generate academic performance reports for the
            current semester.</p>
        </div>
        <div class="flex items-center space-x-3">
          <button v-if="showZipButton" @click="downloadZip"
            class="bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-green-600/25 hover:bg-green-700 transition-all flex items-center space-x-2">
            <span class="material-symbols-outlined text-lg">folder_zip</span>
            <span>ZIP Download</span>
          </button>
          <button @click="showOptions = true" :disabled="!students.length || isGenerating"
            class="bg-primary text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2 disabled:opacity-50">
            <span class="material-symbols-outlined text-lg">auto_awesome</span>
            <span>Bulk Generate</span>
          </button>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div class="bg-white border border-outline-variant/10 rounded-xl p-6 shadow-sm">
          <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">School Selection</p>
          <select v-model="selectedSchoolId"
            class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-primary">
            <option :value="null">Select School</option>
            <option v-for="s in schoolsList" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="bg-white border border-outline-variant/10 rounded-xl p-6 shadow-sm">
          <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Target Grade</p>
          <select v-model="selectedStandard"
            class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-primary">
            <option :value="null">Select Standard</option>
            <option v-for="std in standardsList" :key="typeof std === 'object' ? std.id : std"
              :value="typeof std === 'object' ? std.id : std">
              {{ typeof std === 'object' ? std.name : std }}
            </option>
          </select>
        </div>
        <div class="bg-white border border-outline-variant/10 rounded-xl p-6 shadow-sm">
          <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Division Block</p>
          <select v-model="selectedDivision"
            class="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-primary">
            <option :value="null">Select Division</option>
            <option v-for="d in divisionsList" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
      </div>

      <!-- Generation Tracker -->
      <div v-if="isGenerating || progress > 0"
        class="grid grid-cols-12 gap-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
        <div
          class="col-span-8 bg-white border border-outline-variant/10 p-8 rounded-2xl flex items-center justify-between group overflow-hidden relative shadow-sm">
          <div class="relative z-10 w-full">
            <div class="flex items-center space-x-2 mb-4">
              <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-primary text-xl"
                  :class="{ 'animate-spin': isGenerating }">hourglass_empty</span>
              </div>
              <span class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Active Generation
                Status</span>
            </div>
            <h3 class="text-2xl font-extrabold font-headline text-on-surface mb-6">
              {{ isGenerating ? 'Generating' : 'Processed' }} {{ generatedCount }}/{{ totalStudents || students.length
              }} Report Cards...
            </h3>
            <div class="space-y-3">
              <div class="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                <div class="bg-primary h-full rounded-full transition-all duration-1000"
                  :style="{ width: progress + '%' }"></div>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center space-x-4">
                  <span class="text-sm font-bold text-primary">{{ progress }}% Complete</span>
                  <span class="text-xs font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">{{
                    (totalStudents || students.length) - generatedCount }} Pending</span>
                  <span class="text-xs font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded"
                    v-if="isGenerating">Est. Live Sync...</span>
                </div>
              </div>
            </div>
          </div>
          <div
            class="text-9xl font-black font-headline text-surface-container absolute right-0 bottom-0 -mb-6 -mr-4 pointer-events-none opacity-20 group-hover:scale-110 transition-transform duration-700">
            {{ progress }}
          </div>
        </div>
        <div
          class="col-span-4 bg-[#001c3a] text-white p-8 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <p class="text-primary-fixed-dim font-bold text-[10px] uppercase tracking-[0.2em]">Queue Status</p>
              <div
                class="flex items-center space-x-1.5 bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full border border-green-500/30">
                <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                <span class="text-[10px] font-bold uppercase">Optimal</span>
              </div>
            </div>
            <p class="text-xl font-bold leading-snug font-headline">System bandwidth is optimal for rapid generation.
            </p>
          </div>
          <div
            class="flex items-center space-x-2 relative z-10 mt-6 bg-white/10 w-fit px-4 py-2 rounded-xl border border-white/5">
            <span class="material-symbols-outlined text-primary-fixed">bolt</span>
            <span class="font-bold text-sm tracking-wide">Turbo-Mode Enabled</span>
          </div>
          <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
          <div class="absolute top-0 right-0 p-4 opacity-10">
            <span class="material-symbols-outlined text-6xl">dynamic_feed</span>
          </div>
        </div>
      </div>

      <!-- Student Table Section -->
      <div
        class="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/10 overflow-hidden">
        <div class="px-8 py-6 flex justify-between items-center border-b border-outline-variant/10">
          <div class="flex items-center space-x-4">
            <h4 class="font-headline font-bold text-xl text-on-surface">Student Records</h4>
            <span class="px-3 py-1 bg-primary/5 text-primary rounded-full text-xs font-bold border border-primary/10">
              {{ totalStudents.toLocaleString() }} Total Students
            </span>
          </div>
          <div class="flex items-center space-x-3">
            <div class="relative">
              <button
                class="flex items-center space-x-2 px-4 py-2 bg-surface-container-low hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors text-sm font-semibold">
                <span class="material-symbols-outlined text-lg">filter_alt</span>
                <span>Filter</span>
              </button>
            </div>
            <button
              class="p-2.5 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors border border-outline-variant/20">
              <span class="material-symbols-outlined text-xl">file_download</span>
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-surface-container-lowest border-b border-outline-variant/10">
              <tr>
                <th
                  class="px-8 py-5 w-12 text-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                  SR NO</th>
                <th class="px-4 py-5 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Student ID
                </th>
                <th class="px-4 py-5 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Name</th>
                <th class="px-4 py-5 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Grade</th>
                <th class="px-4 py-5 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Division
                </th>
                <th
                  class="px-4 py-5 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-center">
                  Status</th>
                <th
                  class="px-8 py-5 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right">
                  Actions</th>
              </tr>
            </thead>
            <tbody v-if="loading && students.length === 0">
              <tr>
                <td colspan="7" class="py-24 text-center">
                  <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
                  <p class="mt-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest animate-pulse">
                    Streaming Registry...</p>
                </td>
              </tr>
            </tbody>
            <tbody v-else-if="students.length === 0">
              <tr>
                <td colspan="7" class="py-32 text-center text-[#c0c7d6]">
                  <span class="material-symbols-outlined text-6xl opacity-30 mb-4">person_search</span>
                  <p class="text-[10px] font-bold uppercase tracking-widest">No student records found</p>
                </td>
              </tr>
            </tbody>
            <tbody v-else class="divide-y divide-outline-variant/10">
              <tr v-for="(student, idx) in students" :key="student.id"
                class="hover:bg-primary/5 transition-colors group">
                <td class="px-8 py-5 text-center text-sm font-semibold text-on-surface/70">{{ String(idx +
                  1).padStart(2, '0') }}</td>
                <td class="px-4 py-5 text-xs font-mono font-medium text-on-surface-variant">{{ student.mq_id ||
                  student.id }}</td>
                <td class="px-4 py-5 flex items-center space-x-3">
                  <div
                    class="w-9 h-9 rounded-full bg-secondary-container overflow-hidden ring-2 ring-white shadow-sm transition-transform group-hover:scale-110">
                    <img :src="student.avatar" alt="Student" class="w-full h-full object-cover" />
                  </div>
                  <span class="text-sm font-bold text-on-surface">{{ student.name }}</span>
                </td>
                <td class="px-4 py-5 text-sm font-medium text-on-surface/80">Grade {{ student.std }}</td>
                <td class="px-4 py-5 text-sm font-medium text-on-surface/80">Div {{ student.division }}</td>
                <td class="px-4 py-5 text-center">
                  <span v-if="student.status === 'Generated'"
                    class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                    GENERATED
                  </span>
                  <span v-else-if="student.status === 'Processing'"
                    class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 animate-pulse">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
                    PROCESSING
                  </span>
                  <span v-else
                    class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                    PENDING
                  </span>
                </td>
                <td class="px-8 py-5 text-right">
                  <div v-if="student.status === 'Generated'" class="flex items-center justify-end gap-3">
                    <button @click="openPreview(student.id)"
                      class="bg-white text-primary font-bold text-[10px] px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm uppercase tracking-widest">
                      Preview
                    </button>
                    <button @click="downloadSinglePdf(student.id)"
                      class="bg-primary text-white font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1 uppercase tracking-widest">
                      <span class="material-symbols-outlined text-[14px]">download</span> PDF
                    </button>
                  </div>
                  <button v-else-if="student.status === 'Pending'" @click="startBulkGeneration"
                    class="bg-surface-container-high text-on-surface font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm uppercase tracking-widest">
                    Generate
                  </button>
                  <span v-else
                    class="text-[10px] font-bold text-on-surface-variant uppercase italic animate-pulse">Syncing...</span>
                </td>
              </tr>
              <tr v-if="hasMore" v-intersect="handleIntersect">
                <td colspan="7" class="py-12 text-center bg-white">
                  <div class="flex items-center justify-center space-x-3">
                    <div class="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div class="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    <span class="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-2">Loading
                      more...</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination Placeholder -->
        <div
          class="px-8 py-5 bg-surface-container-lowest flex justify-between items-center border-t border-outline-variant/10">
          <p class="text-xs font-bold text-on-surface-variant">Displaying {{ students.length }} of {{ totalStudents }}
            records</p>
          <div class="flex items-center space-x-1.5">
            <button
              class="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant disabled:opacity-30 transition-all">
              <span class="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <div class="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg shadow-md">{{
              Math.floor(currentOffset / 25) + 1 }}</div>
            <button class="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-all">
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Metric Footer -->
      <div class="grid grid-cols-4 gap-6 mt-10 pb-12">
        <div
          class="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 group hover:shadow-md transition-all">
          <div class="flex items-start justify-between mb-4">
            <p class="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Approved Reports</p>
            <div class="p-2 bg-green-50 rounded-lg">
              <span class="material-symbols-outlined text-green-600 text-lg">verified</span>
            </div>
          </div>
          <div class="flex items-end justify-between">
            <p class="text-3xl font-extrabold font-headline text-on-surface">842</p>
            <div class="text-[10px] text-green-600 font-bold flex items-center bg-green-50 px-2 py-1 rounded-full">
              <span class="material-symbols-outlined text-[12px] mr-1">trending_up</span>
              12%
            </div>
          </div>
          <div class="mt-3 w-full bg-surface-container h-1 rounded-full overflow-hidden">
            <div class="bg-green-500 h-full w-[85%]"></div>
          </div>
        </div>
        <div
          class="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 group hover:shadow-md transition-all">
          <div class="flex items-start justify-between mb-4">
            <p class="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Awaiting Signature</p>
            <div class="p-2 bg-amber-50 rounded-lg">
              <span class="material-symbols-outlined text-amber-600 text-lg">signature</span>
            </div>
          </div>
          <p class="text-3xl font-extrabold font-headline text-on-surface">156</p>
          <div class="mt-2 text-[10px] text-on-surface-variant font-bold flex items-center">
            <span class="material-symbols-outlined text-[12px] mr-1">history</span>
            In Principal's Queue
          </div>
        </div>
        <div
          class="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 group hover:shadow-md transition-all text-error">
          <div class="flex items-start justify-between mb-4">
            <p class="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Failed Generations</p>
            <div class="p-2 bg-red-50 rounded-lg">
              <span class="material-symbols-outlined text-red-600 text-lg">warning</span>
            </div>
          </div>
          <p class="text-3xl font-extrabold font-headline">3</p>
          <div class="mt-2 text-[10px] font-bold flex items-center">
            <span class="material-symbols-outlined text-[12px] mr-1">report_problem</span>
            Requires re-entry
          </div>
        </div>
        <div
          class="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 group hover:shadow-md transition-all">
          <div class="flex items-start justify-between mb-4">
            <p class="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Generation Speed</p>
            <div class="p-2 bg-primary/5 rounded-lg">
              <span class="material-symbols-outlined text-primary text-lg">speed</span>
            </div>
          </div>
          <div class="flex items-end space-x-1">
            <p class="text-3xl font-extrabold font-headline text-on-surface">1.2s</p>
            <span class="text-xs font-bold text-on-surface-variant pb-1">/report</span>
          </div>
          <div class="mt-2 text-[10px] text-on-surface-variant font-bold flex items-center">
            <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
            Server Status: Healthy
          </div>
        </div>
      </div>
    </div>

    <!-- OPTIONS MODAL (White & Simple) -->
    <v-dialog v-model="showOptions" max-width="480" persistent>
      <div
        class="bg-white rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/10 animate-in zoom-in-95 duration-200">
        <div class="px-8 py-8 border-b border-surface-container-low bg-white flex justify-between items-start">
          <div>
            <h3 class="text-2xl font-extrabold font-headline text-on-surface tracking-tight">Report Options</h3>
            <p class="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mt-1">Configure Parameters
            </p>
          </div>
          <button @click="showOptions = false"
            class="p-2 hover:bg-surface-container-low rounded-full transition-colors">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="p-8 space-y-8">
          <div class="space-y-4">
            <label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Assessment
              Period</label>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="t in [{ id: 'term1', l: 'Term 1' }, { id: 'term2', l: 'Term 2' }, { id: 'both', l: 'Both' }]"
                :key="t.id" @click="selectedTerm = t.id"
                :class="selectedTerm === t.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-container-low text-on-surface-variant'"
                class="py-4 text-xs font-bold rounded-xl transition-all uppercase tracking-widest">
                {{ t.l }}
              </button>
            </div>
          </div>
          <div
            :class="includeScanner ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-surface-container-low border-outline-variant/5'"
            class="flex items-center justify-between p-5 rounded-xl border group transition-all duration-300">
            <div class="flex items-center gap-4">
              <div :class="includeScanner ? 'bg-white/20 text-white' : 'bg-white text-primary'"
                class="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center shadow-sm transition-colors duration-300">
                <span class="material-symbols-outlined">qr_code_2</span>
              </div>
              <div>
                <h4 :class="includeScanner ? 'text-white' : 'text-on-surface'"
                  class="text-[13px] font-extrabold transition-colors">Online Validation</h4>
                <p :class="includeScanner ? 'text-white/70' : 'text-on-surface-variant'"
                  class="text-[10px] mt-0.5 uppercase font-bold tracking-tight transition-colors">Include Scannable Code
                </p>
              </div>
            </div>
            <v-switch v-model="includeScanner" color="white" hide-details inset></v-switch>
          </div>
          <div class="flex items-center gap-4 pt-6 mt-4 border-t border-surface-container-low">
            <button @click="showOptions = false"
              class="flex-1 py-4 text-on-surface-variant font-bold uppercase tracking-widest text-[11px]">Cancel</button>
            <button @click="startBulkGeneration(); showOptions = false"
              class="flex-1 bg-on-surface text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-on-surface/10 active:scale-95 transition-all">
              Execute Batch
            </button>
          </div>
        </div>
      </div>
    </v-dialog>

    <!-- PREVIEW MODAL (White & Simple) -->
    <v-dialog v-model="showPreview" max-width="840">
      <div
        class="bg-white rounded-2xl overflow-hidden shadow-2xl min-h-[560px] border border-outline-variant/10 animate-in slide-in-from-bottom-4 duration-300">
        <div
          class="px-10 py-6 border-b border-surface-container-low flex items-center justify-between bg-white sticky top-0 z-10">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-primary">analytics</span>
            <h3 class="text-xl font-bold font-headline text-on-surface">Academic Performance Preview</h3>
          </div>
          <button @click="showPreview = false"
            class="w-10 h-10 flex items-center justify-center bg-surface-container-low rounded-full transition-all">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="p-10">
          <div v-if="previewLoading" class="py-24 text-center">
            <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
            <p class="mt-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.3em] animate-pulse">
              Rendering Certified Analytics...</p>
          </div>
          <div v-else-if="selectedReportData" class="space-y-8">
            <div
              class="flex items-center gap-8 p-8 bg-surface-container-low rounded-2xl border border-outline-variant/5 group transition-all">
              <div
                class="w-24 h-24 rounded-2xl bg-white shadow-md overflow-hidden p-1 border border-outline-variant/10 group-hover:scale-105 transition-transform duration-500">
                <img
                  :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedReportData.student.name)}&background=random`"
                  alt="" class="w-full h-full object-cover rounded-xl">
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-4 mb-2">
                  <h4
                    class="text-2xl font-black text-on-surface tracking-tight group-hover:text-primary transition-colors">
                    {{ selectedReportData.student.name }}</h4>
                  <span
                    class="px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-black uppercase shadow-sm">Verified</span>
                </div>
                <div class="flex items-center gap-6">
                  <div class="flex flex-col">
                    <span class="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Academic
                      Grade</span>
                    <span class="text-sm font-bold text-on-surface">Standard {{ selectedReportData.student.std }}</span>
                  </div>
                  <div class="flex flex-col border-l border-outline-variant/30 pl-6">
                    <span class="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Unique
                      ID</span>
                    <span class="text-sm font-bold text-on-surface font-mono">{{ selectedReportData.student.mq_id
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm">
              <div
                class="bg-surface-container-low px-8 py-4 border-b border-outline-variant/10 flex justify-between items-center">
                <span class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Performance
                  Metrics</span>
                <span class="text-[10px] font-bold text-primary flex items-center gap-1.5 uppercase">
                  <span
                    class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(0,93,170,0.4)]"></span>
                  Real-time Sync Active
                </span>
              </div>
              <div class="divide-y divide-surface-container-low">
                <div v-for="res in selectedReportData.results" :key="res.id"
                  class="flex items-center justify-between px-8 py-5 hover:bg-primary/5 transition-colors">
                  <div class="flex items-center gap-4">
                    <div class="w-1.5 h-1.5 rounded-full bg-secondary-container"></div>
                    <span class="text-[13px] font-extrabold text-on-surface">{{ res.title }}</span>
                  </div>
                  <div class="flex items-center gap-12">
                    <div class="text-right">
                      <p class="text-sm font-black text-on-surface">{{ res.parameter_value }} <span
                          class="text-[10px] text-on-surface-variant font-medium">{{ res.ctype }}</span></p>
                    </div>
                    <div
                      class="w-12 h-12 flex items-center justify-center bg-surface-container-low border border-outline-variant/10 rounded-xl">
                      <span class="text-sm font-black text-primary">{{ res.grade }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

.font-headline {
  font-family: 'Manrope', sans-serif;
}

.font-body {
  font-family: 'Inter', sans-serif;
}

.report-card-page {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.text-on-surface {
  color: #1a1c1c;
}

.text-on-surface-variant {
  color: #404753;
}

.bg-surface-container {
  background-color: #eeeeee;
}

.bg-surface-container-low {
  background-color: #f3f3f3;
}

.bg-surface-container-lowest {
  background-color: #ffffff;
}

.bg-primary {
  background-color: #005daa;
}

.border-outline-variant {
  border-color: #c0c7d6;
}

.text-primary {
  color: #005daa;
}

.text-error {
  color: #ba1a1a;
}

.bg-secondary-container {
  background-color: #afceff;
}

.text-primary-fixed-dim {
  color: #a5c8ff;
}

/* Custom Switch Styling */
:deep(.v-switch__track) {
  opacity: 0.2 !important;
  background-color: #707785 !important;
}

:deep(.v-selection-control--active .v-switch__track) {
  opacity: 1 !important;
  background-color: #005daa !important;
}

/* Animations */
.animate-in {
  animation: animate-in 0.5s ease-out forwards;
}

@keyframes animate-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
