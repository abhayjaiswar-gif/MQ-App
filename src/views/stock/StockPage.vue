<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';

// --- AUTH & CONFIG ---
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role_id === 1);
const currentYear = new Date().getFullYear();

// --- STATE ---
const activeTab = ref('report'); // Default to stock report as per user request
const schools = ref<any[]>([]);
const selectedSchoolId = ref<number | null>(null);
const availableMonths = ref<Record<number, string>>({});
const inventoryRows = ref<any[]>([]);
const autosaveStatus = ref<{ message: string; type: 'success' | 'error' | 'info' | null }>({ message: '', type: null });

// Autocomplete
const equipmentSearch = ref('');
const searchResults = ref<any[]>([]);
const showResults = ref(false);

const isModalOpen = ref(false);
const isReportModalOpen = ref(false);

// --- METHODS ---

const fetchSchools = async () => {
  try {
    const resp = await fetch('http://localhost:3000/api/schools');
    const data = await resp.json();
    if (data.success) schools.value = data.schools;
  } catch (err) {
    console.error('Fetch schools error:', err);
  }
};

const fetchAvailableMonths = async (schoolId: number) => {
  try {
    const resp = await fetch('http://localhost:3000/api/available-months', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: schoolId, year: currentYear })
    });
    const data = await resp.json();
    if (data.success) availableMonths.value = data.months;
  } catch (err) {
    console.error('Fetch months error:', err);
  }
};

const fetchSchoolEquipments = async (schoolId: number) => {
  try {
    const resp = await fetch('http://localhost:3000/api/school-equipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: schoolId, year: currentYear })
    });
    const data = await resp.json();
    inventoryRows.value = data.map((item: any) => {
      const stockMap: any = {};
      item.stock?.forEach((s: any) => {
        stockMap[s.month_no] = {
          size: s.size || '',
          qty: s.qty || 0,
          damage: s.damage || 0,
          warehouse_qty: s.warehouse_qty || 0,
          warehouse_damage: s.warehouse_damage || 0
        };
      });
      return { id: item.id, name: item.value, months: stockMap };
    });
  } catch (err) {
    console.error('Fetch equipments error:', err);
  }
};

const handleSearch = async () => {
  if (equipmentSearch.value.length < 1) {
    searchResults.value = [];
    return;
  }
  try {
    const resp = await fetch(`http://localhost:3000/api/equipment?term=${equipmentSearch.value}`);
    const data = await resp.json();
    searchResults.value = data;
    showResults.value = true;
  } catch (err) {
    console.error('Search error:', err);
  }
};

const addEquipment = (item: any) => {
  if (inventoryRows.value.some(r => r.id === item.id)) return;
  const stockMap: any = {};
  Object.keys(availableMonths.value).forEach(m => {
    stockMap[m] = { size: '', qty: 0, damage: 0, warehouse_qty: 0, warehouse_damage: 0 };
  });
  inventoryRows.value.push({ id: item.id, name: item.value || item.name, months: stockMap });
  equipmentSearch.value = '';
  showResults.value = false;
};

const autosaveTimers: Record<string, any> = {};
const handleAutosave = (itemId: number, monthNo: string, field: string, value: any) => {
  const key = `${itemId}_${monthNo}_${field}`;
  if (autosaveTimers[key]) clearTimeout(autosaveTimers[key]);
  autosaveTimers[key] = setTimeout(async () => {
    autosaveStatus.value = { message: 'Saving...', type: 'info' };
    try {
      const resp = await fetch('http://localhost:3000/api/autosave-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_id: selectedSchoolId.value, equipment_id: itemId, month_no: monthNo, field, value })
      });
      const data = await resp.json();
      if (data.success) {
        autosaveStatus.value = { message: 'Autosaved!', type: 'success' };
        setTimeout(() => { if (autosaveStatus.value.message === 'Autosaved!') autosaveStatus.value.type = null; }, 2000);
      } else {
        autosaveStatus.value = { message: 'Save failed', type: 'error' };
      }
    } catch (err) {
      autosaveStatus.value = { message: 'Connection error', type: 'error' };
    }
  }, 700);
};

const calculateDiff = (row: any, monthNo: string, field: 'qty' | 'damage') => {
  const monthKeys = Object.keys(availableMonths.value).sort((a: any, b: any) => parseInt(a) - parseInt(b));
  const currentIndex = monthKeys.indexOf(monthNo);
  if (currentIndex <= 0) return null;
  const prevMonthNo = monthKeys[currentIndex - 1];
  const currVal = parseInt(row.months[monthNo]?.[field]) || 0;
  const prevVal = parseInt(row.months[prevMonthNo]?.[field]) || 0;
  const diff = currVal - prevVal;
  if (diff === 0) return { text: '=', class: 'text-slate-400' };
  return { text: diff > 0 ? `+${diff} ↑` : `${diff} ↓`, class: diff > 0 ? 'text-green-600' : 'text-red-500' };
};

const removeRow = (id: number) => {
  inventoryRows.value = inventoryRows.value.filter(r => r.id !== id);
};

watch(selectedSchoolId, (newId) => {
  if (newId) {
    fetchAvailableMonths(newId);
    fetchSchoolEquipments(newId);
  }
});

onMounted(() => {
  fetchSchools();
});

const expandedRequestId = ref<string | null>(null);
const toggleTracker = (id: string) => {
  expandedRequestId.value = expandedRequestId.value === id ? null : id;
};

const requests = ref([]); 
const trackerSteps = ['Requested', 'SSGM Verified', 'Admin Approved', 'Processing', 'Delivered'];
</script>
<template>
  <div class="px-2 py-8 tailwind-wrapper min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <div class="max-w-7xl mx-auto p-4 sm:p-8">
      <div class="mb-8 flex gap-4">
        <button @click="activeTab = 'order'" :class="activeTab === 'order' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 ring-2 ring-offset-2 ring-blue-500 transform scale-105' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'" class="px-8 py-3 rounded-xl text-sm font-extrabold tracking-wide transition-all duration-300 ease-out flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          Order Stock
        </button>
        <button @click="activeTab = 'report'" :class="activeTab === 'report' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 ring-2 ring-offset-2 ring-blue-500 transform scale-105' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'" class="px-8 py-3 rounded-xl text-sm font-extrabold tracking-wide transition-all duration-300 ease-out flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Stock Report Update
        </button>
      </div>
      <div v-if="activeTab === 'order'" class="bg-white rounded-xl tracker-card p-6">
        <h2 class="text-lg font-semibold text-slate-8000 mb-6">Active and Past Requests</h2>
        <!-- BEGIN: RequestTable -->
        <div class="table-container overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[800px]" id="requests-table">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Request ID</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Name</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Requested Date</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 table-body">
              <template v-for="req in requests" :key="req.id">
                <tr class="transition-colors" :class="expandedRequestId === req.id ? 'bg-blue-50/50 hover:bg-slate-50' : 'hover:bg-slate-50'">
                  <td class="px-6 py-4 text-sm text-slate-700">{{ req.id }}</td>
                  <td class="px-6 py-4 text-sm text-slate-700">{{ req.itemName }}</td>
                  <td class="px-6 py-4 text-sm text-slate-700">{{ req.quantity }}</td>
                  <td class="px-6 py-4 text-sm text-slate-700">{{ req.date }}</td>
                  <td class="px-6 py-4">
                    <span class="status-badge" :class="req.statusClass">{{ req.status }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <button @click="toggleTracker(req.id)" class="border border-blue-600 text-blue-600 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-50">
                      {{ expandedRequestId === req.id ? 'Hide Tracker' : 'Track Status' }}
                    </button>
                  </td>
                </tr>
                <tr v-if="expandedRequestId === req.id" class="bg-blue-50/30">
                  <td class="px-6 py-8" colspan="6">
                    <div class="bg-white border border-blue-100 rounded-lg p-4 sm:p-8 shadow-sm overflow-x-auto" data-purpose="track-status-detail">
                      <h3 class="text-sm font-bold text-slate-800 mb-8">Track Status: {{ req.id }}</h3>
                      <div class="flex items-center justify-between min-w-[600px] max-w-5xl mx-auto pb-4">
                        <template v-for="(stepStr, index) in trackerSteps" :key="stepStr">
                          <div class="flex flex-col items-center gap-3 relative">
                            <!-- Completed Step -->
                            <div v-if="req.step > index + 1 || (req.step === 5 && index === 4)" class="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
                              <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                              </svg>
                            </div>
                            <!-- Active Step -->
                            <div v-else-if="req.step === index + 1" class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white ring-4 ring-blue-50">
                              <svg v-if="stepStr === 'Processing'" class="h-6 w-6 animate-spin" fill="none" stroke="currentColor" style="animation-duration: 3s;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                              </svg>
                              <div v-else class="w-3 h-3 rounded-full bg-white"></div>
                            </div>
                            <!-- Pending Step -->
                            <div v-else class="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-white">
                            </div>
                            <span class="text-xs font-medium whitespace-nowrap" :class="req.step >= index + 1 ? 'text-slate-800' : 'text-slate-400'">{{ stepStr }}</span>
                          </div>

                          <!-- Line connecting steps -->
                          <div v-if="index < 4" class="flex-grow h-[2px] mx-4 self-center -mt-6" :class="req.step > index + 1 ? (req.step === index + 2 ? 'bg-blue-600' : 'bg-green-600') : 'bg-slate-200'">
                            <div v-if="req.step > index + 1" class="flex justify-end -mt-1.5">
                              <svg fill="none" height="12" viewBox="0 0 12 12" width="12" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 2L8 6L4 10" :stroke="req.step === index + 2 ? '#2563eb' : '#16a34a'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                              </svg>
                            </div>
                          </div>
                        </template>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <!-- END: RequestTable -->
      </div>
      
      <!-- Stock Report Update Tab Content -->
      <div v-else-if="activeTab === 'report'" class="bg-white rounded-xl tracker-card p-6 animate-fade-in">
        
        <!-- TOP CONTROLS -->
        <div class="flex flex-wrap items-end gap-6 mb-8">
          <!-- SCHOOL SELECT -->
          <div class="w-full sm:w-auto min-w-[300px]">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select School</label>
            <select v-model="selectedSchoolId" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold outline-none shadow-sm">
              <option :value="null">-- Select School --</option>
              <option v-for="s in schools" :key="s.id" :value="s.id">
                {{ s.name }} ({{ s.school_code }})
              </option>
            </select>
          </div>

          <!-- EQUIPMENT SEARCH -->
          <div class="w-full sm:w-auto flex-grow relative" v-if="selectedSchoolId">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Add Equipment</label>
            <div class="relative">
              <input 
                v-model="equipmentSearch" 
                @input="handleSearch"
                @focus="showResults = true"
                type="text" 
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-semibold outline-none shadow-sm"
                placeholder="Search to add item..."
              />
              <!-- Autocomplete Dropdown -->
              <div v-if="showResults && searchResults.length" class="absolute z-[100] w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                <div 
                  v-for="res in searchResults" 
                  :key="res.id"
                  @click="addEquipment(res)"
                  class="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm font-medium text-slate-700 border-b border-slate-50 last:border-0 transition-colors"
                >
                  {{ res.value }}
                </div>
              </div>
            </div>
          </div>

          <!-- AUTOSAVE STATUS -->
          <div v-if="autosaveStatus.type" class="ml-auto mb-2 pr-2">
            <span :class="{
              'bg-blue-100 text-blue-700': autosaveStatus.type === 'info',
              'bg-green-100 text-green-700': autosaveStatus.type === 'success',
              'bg-red-100 text-red-700': autosaveStatus.type === 'error'
            }" class="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm border border-current transition-all">
              <div v-if="autosaveStatus.type === 'info'" class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              {{ autosaveStatus.message }}
            </span>
          </div>
        </div>

        <!-- DYNAMIC STOCK TABLE -->
        <div v-if="selectedSchoolId" class="table-container shadow-sm border-slate-100">
          <table class="w-full text-left border-collapse min-w-max">
            <thead>
              <tr class="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-20">
                <th rowspan="2" class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-r border-slate-200 text-center w-16">Sr</th>
                <th rowspan="2" class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 min-w-[200px]">Item Details</th>
                <template v-for="(name, id) in availableMonths" :key="id">
                  <th :colspan="isAdmin ? 5 : 3" class="px-6 py-3 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] text-center border-b border-l border-slate-200 bg-blue-50/30">
                    {{ name }}
                  </th>
                </template>
                <th rowspan="2" class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-l border-slate-200 text-center">Trends</th>
                <th rowspan="2" class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-l border-slate-200 text-center w-20">Action</th>
              </tr>
              <tr class="bg-slate-50/50 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <template v-for="(name, id) in availableMonths" :key="id">
                  <th class="px-3 py-2 border-b border-l border-slate-200 text-center">Size</th>
                  <th class="px-3 py-2 border-b border-slate-100 text-center">Sch Qty</th>
                  <th class="px-3 py-2 border-b border-slate-100 text-center">Sch Dmg</th>
                  <th v-if="isAdmin" class="px-3 py-2 border-b border-slate-100 text-center bg-orange-50/30">WH Qty</th>
                  <th v-if="isAdmin" class="px-3 py-2 border-b border-slate-100 text-center bg-orange-50/30 font-black">WH Dmg</th>
                </template>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 cursor-default">
              <tr v-for="(row, idx) in inventoryRows" :key="row.id" class="hover:bg-blue-50/30 transition-colors group">
                <td class="px-6 py-4 text-xs font-bold text-slate-400 text-center border-r border-slate-50 group-hover:text-blue-500">{{ idx + 1 }}</td>
                <td class="px-6 py-4 border-slate-50">
                  <div class="text-sm font-bold text-slate-800">{{ row.name }}</div>
                  <div class="text-[10px] text-slate-400 font-medium">ID: {{ row.id }}</div>
                </td>
                
                <template v-for="(name, mId) in availableMonths" :key="mId">
                  <!-- SIZE -->
                  <td class="px-2 py-3 border-l border-slate-50">
                    <input v-model="row.months[mId].size" @input="handleAutosave(row.id, mId, 'size', row.months[mId].size)" type="text" class="w-full px-2 py-1.5 bg-transparent group-hover:bg-white border-transparent border focus:border-blue-300 rounded text-center text-xs font-semibold focus:outline-none transition-all" placeholder="-">
                  </td>
                  <!-- SCH QTY -->
                  <td class="px-2 py-3">
                    <input v-model.number="row.months[mId].qty" @input="handleAutosave(row.id, mId, 'qty', row.months[mId].qty)" type="number" class="w-full px-2 py-1.5 bg-transparent group-hover:bg-white border-transparent border focus:border-blue-300 rounded text-center text-xs font-bold text-blue-700 focus:outline-none transition-all" min="0">
                  </td>
                  <!-- SCH DMG -->
                  <td class="px-2 py-3">
                    <input v-model.number="row.months[mId].damage" @input="handleAutosave(row.id, mId, 'damage', row.months[mId].damage)" type="number" class="w-full px-2 py-1.5 bg-transparent group-hover:bg-white border-transparent border focus:border-red-300 rounded text-center text-xs font-bold text-red-600 focus:outline-none transition-all" min="0">
                  </td>
                  <!-- ADMIN FIELDS -->
                  <td v-if="isAdmin" class="px-2 py-3 bg-orange-50/10">
                    <input v-model.number="row.months[mId].warehouse_qty" @input="handleAutosave(row.id, mId, 'warehouse_qty', row.months[mId].warehouse_qty)" type="number" class="w-full px-2 py-1.5 bg-transparent group-hover:bg-white border-transparent border focus:border-orange-300 rounded text-center text-xs font-bold text-indigo-700 focus:outline-none transition-all" min="0">
                  </td>
                  <td v-if="isAdmin" class="px-2 py-3 bg-orange-50/10">
                    <input v-model.number="row.months[mId].warehouse_damage" @input="handleAutosave(row.id, mId, 'warehouse_damage', row.months[mId].warehouse_damage)" type="number" class="w-full px-2 py-1.5 bg-transparent group-hover:bg-white border-transparent border focus:border-orange-300 rounded text-center text-xs font-bold text-red-800 focus:outline-none transition-all" min="0">
                  </td>
                </template>

                <!-- TRENDS -->
                <td class="px-6 py-4 border-l border-slate-50 text-center">
                  <div class="flex flex-col gap-1">
                    <template v-for="(name, mId) in availableMonths" :key="mId">
                      <div v-if="calculateDiff(row, mId, 'qty')" class="text-[9px] font-black whitespace-nowrap bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100 flex items-center justify-between gap-3">
                        <span class="text-slate-400">{{ availableMonths[mId].substring(0,3) }}:</span>
                        <span :class="calculateDiff(row, mId, 'qty')?.class">{{ calculateDiff(row, mId, 'qty')?.text }}</span>
                      </div>
                    </template>
                  </div>
                </td>

                <!-- REMOVE -->
                <td class="px-6 py-4 border-l border-slate-50 text-center">
                  <button @click="removeRow(row.id)" class="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all transform hover:scale-110 active:scale-90 opacity-0 group-hover:opacity-100">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </td>
              </tr>

              <!-- EMPTY STATE -->
              <tr v-if="inventoryRows.length === 0">
                <td :colspan="10" class="px-6 py-20 text-center">
                   <div class="flex flex-col items-center gap-4 text-slate-300">
                    <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                    <span class="text-sm font-extrabold uppercase tracking-widest">{{ selectedSchoolId ? 'No equipments added yet. Search to start.' : 'Please select a school to begin.' }}</span>
                   </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
    
    <!-- Floating Action Button -->
    <button v-if="activeTab === 'order'" @click="isModalOpen = true" class="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105 z-50 flex items-center justify-center" aria-label="Add Request">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
      </svg>
    </button>

    <!-- Modal Overlay -->
    <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 class="text-lg font-semibold text-slate-800">New Stock Request</h3>
          <button @click="isModalOpen = false" class="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <!-- Modal Body -->
        <div class="p-6 max-h-[75vh] overflow-y-auto">
          <p class="text-sm text-slate-600 mb-5">Please provide the details for the new stock request.</p>
          <div class="space-y-5">
            <!-- School Name -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">School Name</label>
              <select class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm bg-white">
                <option value="" disabled selected>Select School</option>
                <option value="school1">School 1</option>
                <option value="school2">School 2</option>
                <option value="school3">School 3</option>
              </select>
            </div>
            
            <!-- Equipment Items -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-slate-700">Equipment Items</label>
              </div>
              <div class="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
                <div class="grid grid-cols-12 gap-3">
                  <div class="col-span-12 sm:col-span-6">
                    <label class="block text-xs font-medium text-slate-600 mb-1">SKU Name</label>
                    <input type="text" class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm bg-white" placeholder="Item SKU" />
                  </div>
                  <div class="col-span-6 sm:col-span-3">
                    <label class="block text-xs font-medium text-slate-600 mb-1">Qty</label>
                    <input type="number" min="1" class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm bg-white" placeholder="1" />
                  </div>
                  <div class="col-span-6 sm:col-span-3">
                    <label class="block text-xs font-medium text-slate-600 mb-1">Size</label>
                    <input type="text" class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm bg-white" placeholder="e.g. M, L" />
                  </div>
                </div>
                <button type="button" class="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center mt-2">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  Add another item
                </button>
              </div>
            </div>

            <!-- Upload Equipment List -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Upload Equipment List (Optional)</label>
              <input type="file" class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-300 rounded-md bg-white cursor-pointer" />
              <p class="mt-1.5 text-xs text-slate-500">You can upload a photo of the equipment list if it’s long.</p>
            </div>
          </div>
        </div>
        
        <!-- Modal Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button @click="isModalOpen = false" class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 text-sm font-medium transition-colors">Cancel</button>
          <button @click="isModalOpen = false" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors">Submit Request</button>
        </div>
      </div>
    </div>
    
    <!-- Report Modal Overlay -->
    <div v-if="isReportModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 transition-all duration-300">
      <div class="bg-white rounded-2xl shadow-2xl shadow-blue-900/20 w-full max-w-lg overflow-hidden transform transition-all ring-1 ring-slate-100">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 class="text-lg font-semibold text-slate-800">Add Stock Report</h3>
          <button @click="isReportModalOpen = false" class="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <!-- Modal Body -->
        <div class="p-6 max-h-[75vh] overflow-y-auto">
          <div class="space-y-5">
            <!-- School Name -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">School Name</label>
              <select class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm bg-white">
                <option value="" disabled selected>Select School</option>
                <option value="school1">School 1</option>
                <option value="school2">School 2</option>
                <option value="school3">School 3</option>
              </select>
            </div>
            
            <!-- Upload Image -->
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Add Report Image</label>
              <div class="relative group cursor-pointer mt-1">
                <div class="absolute inset-0 bg-blue-50/50 border-2 border-dashed border-blue-300 rounded-xl group-hover:bg-blue-100 group-hover:border-blue-500 transition-colors duration-300 pointer-events-none"></div>
                <input type="file" accept="image/*" class="relative z-10 block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer bg-transparent focus:outline-none" />
              </div>
            </div>

            <!-- Upload PDF -->
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Upload PDF Document</label>
              <div class="relative group cursor-pointer mt-1">
                <div class="absolute inset-0 bg-red-50/50 border-2 border-dashed border-red-300 rounded-xl group-hover:bg-red-100 group-hover:border-red-500 transition-colors duration-300 pointer-events-none"></div>
                <input type="file" accept=".pdf" class="relative z-10 block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-bold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer bg-transparent focus:outline-none" />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Modal Footer -->
        <div class="px-6 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button @click="isReportModalOpen = false" class="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-200 text-sm font-bold transition-colors">Cancel</button>
          <button @click="isReportModalOpen = false" class="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105 active:scale-95">Submit Report</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.tailwind-wrapper {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #0f172a;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-flex;
  letter-spacing: 0.025em;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
}
.status-pending { background-color: #fef3c7; color: #b45309; border-color: #fde68a; }
.status-processing { background-color: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.status-delivered { background-color: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.status-rejected { background-color: #fef2f2; color: #b91c1c; border-color: #fecaca; }

.tracker-card {
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)!important;
  border: 1px solid #f1f5f9!important;
  transition: all 0.3s ease;
}

.tracker-card:hover {
  box-shadow: 0 25px 35px -5px rgb(0 0 0 / 0.07), 0 10px 15px -6px rgb(0 0 0 / 0.05)!important;
}

.table-container {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  max-width: 100%;
}

table {
  width: max-content !important;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.table-body tr {
  border-bottom: 1px solid #f1f5f9;
}
.table-body tr:last-child {
  border-bottom: none;
}

/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}
</style>
