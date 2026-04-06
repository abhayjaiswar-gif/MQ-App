<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { 
  getSchools, 
  getAvailableMonths, 
  getAllEquipmentsForSchool, 
  searchEquipment, 
  autosaveStock 
} from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface School {
  id: number;
  name: string;
  school_code?: string;
}

interface Equipment {
  id: number;
  value: string; // equipment name
}

interface MonthData {
  [monthNo: string]: string; // monthNo -> monthName
}

interface StockEntry {
  size: string;
  qty: number;
  damage: number;
  warehouse_qty: number;
  warehouse_damage: number;
}

interface EquipmentRow {
  id: number;
  name: string;
  months: Record<string, StockEntry>; // monthNo -> StockEntry
  qty_changes: string;
  damage_changes: string;
}

// ─── Props / Context ──────────────────────────────────────────────────────────
// Toggle isAdmin based on your auth system; pass as prop or get from a store
const props = withDefaults(defineProps<{ isAdmin?: boolean }>(), { isAdmin: true });

// Local fetch logic removed in favor of @/services/api

// ─── State ────────────────────────────────────────────────────────────────────
const schools = ref<School[]>([]);
const selectedSchoolId = ref<string | number>('');
const selectedSchoolName = ref('');

const availableMonths = ref<MonthData>({});
const equipmentRows = ref<EquipmentRow[]>([]);

const searchQuery = ref('');
const searchResults = ref<Equipment[]>([]);
const showDropdown = ref(false);
const searchLoading = ref(false);

const autosaveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle');
const autosaveMessage = ref('');
let autosaveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

const router = useRouter();
const reportDate = ref(new Date().toISOString().split('T')[0]);
const currentYear = new Date().getFullYear();

// ─── Computed ─────────────────────────────────────────────────────────────────
const sortedMonths = computed(() =>
  Object.keys(availableMonths.value).sort((a, b) => Number(a) - Number(b))
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function emptyEntry(): StockEntry {
  return { size: '', qty: 0, damage: 0, warehouse_qty: 0, warehouse_damage: 0 };
}

function calculateChanges(row: EquipmentRow) {
  const months = sortedMonths.value;
  if (months.length < 2) {
    row.qty_changes = '';
    row.damage_changes = '';
    return;
  }
  const qtyChanges: string[] = [];
  const damageChanges: string[] = [];
  for (let i = 1; i < months.length; i++) {
    const prev = months[i - 1];
    const curr = months[i];
    const prevName = availableMonths.value[prev].substring(0, 3);
    const currName = availableMonths.value[curr].substring(0, 3);

    const qtyDiff = (row.months[curr]?.qty ?? 0) - (row.months[prev]?.qty ?? 0);
    const dmgDiff  = (row.months[curr]?.damage ?? 0) - (row.months[prev]?.damage ?? 0);

    const qDir = qtyDiff > 0 ? '↑' : qtyDiff < 0 ? '↓' : '=';
    const dDir = dmgDiff > 0 ? '↑' : dmgDiff < 0 ? '↓' : '=';

    qtyChanges.push(`${prevName}-${currName}: ${qtyDiff > 0 ? '+' : ''}${qtyDiff} ${qDir}`);
    damageChanges.push(`${prevName}-${currName}: ${dmgDiff > 0 ? '+' : ''}${dmgDiff} ${dDir}`);
  }
  row.qty_changes = qtyChanges.join(', ');
  row.damage_changes = damageChanges.join(', ');
}

// ─── Load Schools ─────────────────────────────────────────────────────────────
async function loadSchools() {
  try {
    const data = await getSchools();
    schools.value = data || [];
  } catch {
    // keep empty
  }
}

// ─── School Change ────────────────────────────────────────────────────────────
async function onSchoolChange() {
  equipmentRows.value = [];
  availableMonths.value = {};
  selectedSchoolName.value =
    schools.value.find(s => s.id === Number(selectedSchoolId.value))?.name ?? '';

  if (!selectedSchoolId.value) return;

  try {
    const data = await getAvailableMonths(String(selectedSchoolId.value), String(currentYear));
    console.log('Months response:', data);
    
    if (data.success && data.months) {
      availableMonths.value = data.months;
      await loadAllEquipments();
    } else {
      // Fallback: Show only current month
      console.log('Using current month fallback');
      const currentMonth = new Date().getMonth() + 1; // 1-12
      const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const currentMonthName = monthNames[currentMonth - 1];
      availableMonths.value = {
        [currentMonth.toString()]: currentMonthName
      };
      await loadAllEquipments();
    }
  } catch (error) {
    console.error('Error loading months:', error);
    // Fallback: Show only current month
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const currentMonthName = monthNames[currentMonth - 1];
    availableMonths.value = {
      [currentMonth.toString()]: currentMonthName
    };
    await loadAllEquipments();
  }
}

// ─── Load All Equipments for School ──────────────────────────────────────────
async function loadAllEquipments() {
  if (!selectedSchoolId.value) return;
  try {
    console.log('Loading all equipment for school:', selectedSchoolId.value, 'year:', currentYear);

    const data = await getAllEquipmentsForSchool(String(selectedSchoolId.value), String(currentYear));
    console.log('Loading equipment data:', data);
    
    // Clear existing rows first
    equipmentRows.value = [];
    
    for (const item of data) {
      addEquipmentRow(item.id, item.value);
      if (item.stock && item.stock.length > 0) {
        populateStockData(item.id, item.stock);
      }
    }
    
    console.log('Loaded equipment rows:', equipmentRows.value.length);
  } catch (error) {
    console.error('Error loading equipment:', error);
    // Don't clear rows on error, just log it
  }
}

// ─── Add Equipment Row ────────────────────────────────────────────────────────
function addEquipmentRow(id: number, name: string) {
  const newRow: EquipmentRow = {
    id,
    name,
    months: {},
    qty_changes: '',
    damage_changes: ''
  };
  
  // Initialize months for the available months
  sortedMonths.value.forEach((monthNo) => {
    newRow.months[monthNo] = {
      size: '',
      qty: 0,
      damage: 0,
      warehouse_qty: 0,
      warehouse_damage: 0
    };
  });
  
  equipmentRows.value.push(newRow);
}

// ─── Populate Stock Data ───────────────────────────────────────────────────────
function populateStockData(equipmentId: number, stockData: Array<any>) {
  const row = equipmentRows.value.find(r => r.id === equipmentId);
  if (!row) return;
  
  stockData.forEach(item => {
    const monthNo = item.month_no.toString();
    if (row.months[monthNo]) {
      row.months[monthNo] = {
        size: item.size || '',
        qty: parseInt(item.qty) || 0,
        damage: parseInt(item.damage) || 0,
        warehouse_qty: parseInt(item.warehouse_qty) || 0,
        warehouse_damage: parseInt(item.warehouse_damage) || 0
      };
    }
  });
  
  calculateChanges(row);
}

// ─── Add Equipment (via search button or Enter) ─────────────────────────────────
function addEquipment() {
  if (!searchQuery.value.trim()) return;

  const name = searchQuery.value.trim();
  if (equipmentRows.value.some(r => r.name.toLowerCase() === name.toLowerCase())) {
    alert('Equipment already added');
    return;
  }

  addEquipmentRow(0, name);

  searchQuery.value = '';
  showDropdown.value = false;
}

// ─── Remove Row ─────────────────────────────────────────────────────────────────
function removeRow(index: number) {
  if (confirm('Remove this equipment?')) {
    equipmentRows.value.splice(index, 1);
  }
}

// ─── Hide Dropdown ─────────────────────────────────────────────────────────────
function hideDropdown() {
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
}

// Search
async function onSearchInput() {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    showDropdown.value = false;
    return;
  }

  try {
    const data = await searchEquipment(searchQuery.value);
    if (!data.some((d: Equipment) => d.value.toLowerCase() === searchQuery.value.toLowerCase())) {
      data.push({ id: 0, value: searchQuery.value });
    }
    searchResults.value = data;
    showDropdown.value = true;
  } catch (e) {
    console.error(e);
  }
}

function selectEquipment(eq: Equipment) {
  if (equipmentRows.value.some(r => r.name.toLowerCase() === eq.value.toLowerCase())) return;
  addEquipmentRow(eq.id, eq.value);
  searchQuery.value = '';
  showDropdown.value = false;
}

// ─── Autosave Functions ──────────────────────────────────────────────────────
async function autosaveField(equipmentId: number, monthNo: string, field: string, value: string) {
  if (!selectedSchoolId.value) return;
  
  try {
    autosaveStatus.value = 'saving';
    autosaveMessage.value = 'Saving...';
    
    await autosaveStock({
      school_id: selectedSchoolId.value,
      equipment_id: equipmentId,
      month_no: monthNo,
      field: field,
      value: value
    });
    
    autosaveStatus.value = 'saved';
    autosaveMessage.value = 'Saved!';
    
    // Clear status after 2 seconds
    setTimeout(() => {
      autosaveStatus.value = 'idle';
      autosaveMessage.value = '';
    }, 2000);
    
  } catch (error) {
    console.error('Autosave failed:', error);
    autosaveStatus.value = 'error';
    autosaveMessage.value = 'Save failed';
    
    // Clear error after 3 seconds
    setTimeout(() => {
      autosaveStatus.value = 'idle';
      autosaveMessage.value = '';
    }, 3000);
  }
}

function triggerAutosave(equipmentId: number, monthNo: string, field: string, value: string) {
  const key = `${equipmentId}-${monthNo}-${field}`;
  
  // Clear existing timer
  if (autosaveTimers[key]) {
    clearTimeout(autosaveTimers[key]);
  }
  
  // Set new timer to save after 1.5 seconds
  autosaveTimers[key] = setTimeout(() => {
    autosaveField(equipmentId, monthNo, field, value);
  }, 1500);
}

async function saveStockData() {
  if (!selectedSchoolId.value) {
    alert('Please select a school');
    return;
  }
  
  try {
    // Save all equipment data for all months
    const savePromises: Promise<any>[] = [];
    
    for (const row of equipmentRows.value) {
      for (const monthNo of sortedMonths.value) {
        const entry = row.months[monthNo];
        if (entry) {
          // Save qty
          if (entry.qty !== undefined && entry.qty !== 0) {
            savePromises.push(autosaveStock({
              school_id: selectedSchoolId.value,
              equipment_id: row.id,
              month_no: monthNo,
              field: 'qty',
              value: entry.qty.toString()
            }));
          }
          
          // Save damage
          if (entry.damage !== undefined && entry.damage !== 0) {
            savePromises.push(autosaveStock({
              school_id: selectedSchoolId.value,
              equipment_id: row.id,
              month_no: monthNo,
              field: 'damage',
              value: entry.damage.toString()
            }));
          }
          
          // Save warehouse_qty
          if (entry.warehouse_qty !== undefined && entry.warehouse_qty !== 0) {
            savePromises.push(autosaveStock({
              school_id: selectedSchoolId.value,
              equipment_id: row.id,
              month_no: monthNo,
              field: 'warehouse_qty',
              value: entry.warehouse_qty.toString()
            }));
          }
          
          // Save warehouse_damage
          if (entry.warehouse_damage !== undefined && entry.warehouse_damage !== 0) {
            savePromises.push(autosaveStock({
              school_id: selectedSchoolId.value,
              equipment_id: row.id,
              month_no: monthNo,
              field: 'warehouse_damage_qty',
              value: entry.warehouse_damage.toString()
            }));
          }
          
          // Save size
          if (entry.size && entry.size.trim() !== '') {
            savePromises.push(autosaveStock({
              school_id: selectedSchoolId.value,
              equipment_id: row.id,
              month_no: monthNo,
              field: 'size',
              value: entry.size
            }));
          }
        }
      }
    }
    
    if (savePromises.length > 0) {
      await Promise.all(savePromises);
      alert('Stock Report Saved Successfully!');
    } else {
      alert('No data to save. Please add equipment and enter values.');
      return;
    }
    
    router.push('/stock');
  } catch (error) {
    console.error('Save failed:', error);
    alert('Failed to save stock report. Please try again.');
  }
}

function cancelAndGoBack() {
  router.push('/stock');
}

onMounted(loadSchools);
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="max-w-3xl mx-auto px-1">
      <!-- Main Card -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden">

        <!-- Blue Header -->
        <div class="bg-blue-600 text-white px-8 py-5">
          <h1 class="text-2xl font-semibold">Update School Stock Report</h1>
        </div>

        <div class="p-8 space-y-8">

          <!-- School & Date Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-black mb-1.5">
                Select School <span class="text-red-500">*</span>
              </label>
              <select
                v-model="selectedSchoolId"
                @change="onSchoolChange"
                class="w-full px-4 py-3 border-1 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value=""> Select School </option>
                <option v-for="s in schools" :key="s.id" :value="s.id">
                  {{ s.name }} {{ s.school_code ? `(${s.school_code})` : '' }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-bold text-black mb-1.5">Report Date</label>
              <input
                type="date"
                v-model="reportDate"
                class="w-full px-4 py-3 border-1 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Search & Add Equipment -->
          <div>
            <label class="block text-sm font-bold text-black mb-1.5">Search & Add Equipment</label>
            <div class="flex gap-3">
              <div class="relative flex-1">
                <input
                  v-model="searchQuery"
                  @input="onSearchInput"
                  @keydown.enter="addEquipment"
                  @blur="hideDropdown"
                  type="text"
                  placeholder="Type equipment name (e.g. Football, Cricket Bat...)"
                  class="w-full px-5 py-3 border-1 border-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
                <!-- Blue Search Button -->
                <button
                  @click="addEquipment"
                  class="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl transition-colors"
                >
                  🔍
                </button>
              </div>
            </div>

            <!-- Search Dropdown -->
            <div
              v-if="showDropdown && searchResults.length"
              class="absolute z-50 mt-2 w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-auto"
            >
              <div
                v-for="eq in searchResults"
                :key="eq.id"
                @mousedown.prevent="selectEquipment(eq)"
                class="px-5 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 text-base"
              >
                {{ eq.value }}
                <span v-if="eq.id === 0" class="text-blue-600 text-sm ml-2">(new)</span>
              </div>
            </div>
          </div>

          <!-- Monthly Stock Details -->
          <div>
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-bold text-black">Monthly Stock Details</h2>
              <div v-if="autosaveStatus !== 'idle'" class="flex items-center gap-2 text-sm">
                <div v-if="autosaveStatus === 'saving'" class="flex items-center gap-1 text-blue-600">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>{{ autosaveMessage }}</span>
                </div>
                <div v-else-if="autosaveStatus === 'saved'" class="flex items-center gap-1 text-green-600">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ autosaveMessage }}</span>
                </div>
                <div v-else-if="autosaveStatus === 'error'" class="flex items-center gap-1 text-red-600">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ autosaveMessage }}</span>
                </div>
              </div>
            </div>

            <div class="border border-gray-200 rounded-2xl overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full min-w-[800px]">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                      <th class="px-6 py-4 text-left text-sm font-bold text-black w-12">Sr No</th>
                      <th class="px-6 py-4 text-left text-sm font-bold text-black min-w-40">Equipment Name</th>
                      <th class="px-6 py-4 text-center text-sm font-bold text-black w-28">Size</th>
                      <th class="px-6 py-4 text-center text-sm font-bold text-black w-32">School Qty</th>
                      <th class="px-6 py-4 text-center text-sm font-bold text-black w-32">School Damage</th>
                      <th class="px-6 py-4 text-center text-sm font-bold text-black w-40">Qty Changes</th>
                      <th class="px-6 py-4 text-center text-sm font-bold text-black w-40">Damage Changes</th>
                      <th class="px-6 py-4 text-center text-sm font-bold text-black w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-for="(row, i) in equipmentRows" :key="i" class="hover:bg-gray-50">
                      <td class="px-6 py-5 text-center text-gray-500 font-medium">{{ i + 1 }}</td>
                      <td class="px-6 py-5 font-medium text-gray-800">{{ row.name }}</td>
                      <td class="px-6 py-5">
                        <input 
                          v-model="row.months[sortedMonths[0]].size" 
                          @input="triggerAutosave(row.id, sortedMonths[0], 'size', ($event.target as HTMLInputElement).value)"
                          type="text" 
                          class="w-full px-2 py-1 text-center border-1 border-black rounded focus:outline-none focus:border-blue-500" 
                          placeholder="—" 
                        />
                      </td>
                      <td class="px-6 py-5">
                        <input 
                          v-model.number="row.months[sortedMonths[0]].qty" 
                          @input="triggerAutosave(row.id, sortedMonths[0], 'qty', ($event.target as HTMLInputElement).value)"
                          type="number" 
                          min="0" 
                          class="w-full px-2 py-1 text-center border-1 border-black rounded focus:outline-none focus:border-blue-500" 
                        />
                      </td>
                      <td class="px-6 py-5">
                        <input 
                          v-model.number="row.months[sortedMonths[0]].damage" 
                          @input="triggerAutosave(row.id, sortedMonths[0], 'damage', ($event.target as HTMLInputElement).value)"
                          type="number" 
                          min="0" 
                          class="w-full px-2 py-1 text-center border-1 border-black rounded focus:outline-none focus:border-blue-500" 
                        />
                      </td>
                      <td class="px-6 py-5 text-center text-sm text-gray-500">{{ row.qty_changes || '—' }}</td>
                      <td class="px-6 py-5 text-center text-sm text-gray-500">{{ row.damage_changes || '—' }}</td>
                      <td class="px-6 py-5 text-center">
                        <button @click="removeRow(i)" class="text-red-500 hover:text-red-600 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold transition-colors shadow-sm">×</button>
                      </td>
                    </tr>

                    <!-- Empty State -->
                    <tr v-if="equipmentRows.length === 0">
                      <td colspan="8" class="py-20 text-center text-gray-400">
                        <p class="text-lg">No equipment added yet</p>
                        <p class="mt-1 text-sm">Search and add equipment using the field above</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Footer Buttons -->
          <div class="border-t border-gray-200 bg-gray-50 px-8 py-6 flex justify-end gap-4">
            <button
              @click="cancelAndGoBack"
              class="px-5 py-3 bg-gray-400 text-black font-medium border border-gray-300 rounded-2xl hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="saveStockData"
              class="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl flex items-center gap-2 transition-colors"
            >
              <span>Save Stock</span>
            </button>
          </div>
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

.tracker-card {
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05);
  border: 1px solid #f1f5f9;
}

/* Scrollable table wrapper */
.table-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 12px;
  border: 1px solid #94a3b8;
}

.table-scroll-wrapper::-webkit-scrollbar { height: 8px; }
.table-scroll-wrapper::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 6px; }
.table-scroll-wrapper::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }
.table-scroll-wrapper::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

.stock-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
}

.th-cell {
  padding: 10px 12px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  white-space: nowrap;
  border-bottom: 2px solid #94a3b8;
}

.th-cell-sm {
  padding: 6px 10px;
  font-size: 0.68rem;
  font-weight: 600;
  color: #94a3b8;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid #94a3b8;
}

.td-cell {
  padding: 8px 10px;
  font-size: 0.8rem;
  vertical-align: middle;
}

.cell-input {
  padding: 4px 8px;
  border: 1px solid #94a3b8;
  border-radius: 6px;
  font-size: 0.8rem;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5) !important;
}

.cell-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

input[type="text"], 
input[type="number"], 
input[type="date"], 
select {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5) !important;
}

input[type="text"]:focus, 
input[type="number"]:focus, 
input[type="date"]:focus, 
select:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15) !important;
}

.admin-col {
  background-color: #fefce8;
}

/* Toast transition */
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateX(20px); }
.toast-leave-to { opacity: 0; transform: translateX(20px); }
</style>
