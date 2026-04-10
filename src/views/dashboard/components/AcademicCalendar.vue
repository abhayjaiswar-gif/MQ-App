<template>
  <v-card variant="outlined" class="bg-surface rounded-xl border-slate-100 shadow-sm overflow-hidden mt-8">
    <v-card-text class="pa-6">
      <!-- 🚀 Redesigned Header (Matching Support Hub) -->
      <div class="d-flex align-center justify-space-between mb-8 pb-6 border-b border-slate-100">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h5 class="text-h5 font-black text-slate-900 mb-0 leading-tight">Academic Event Calendar</h5>
          </div>
          <div class="flex items-center gap-4 mt-1">
            <span class="text-caption font-bold text-slate-400 uppercase tracking-wider">Automated School & Public Feed</span>
            <v-tabs v-model="viewMode" color="primary" class="tab-modern" density="compact" hide-slider>
              <v-tab value="monthly" class="px-3 rounded-lg font-black text-[9px] uppercase tracking-widest mr-2" variant="tonal"> Monthly </v-tab>
              <v-tab value="yearly" class="px-3 rounded-lg font-black text-[9px] uppercase tracking-widest" variant="tonal"> Full Year </v-tab>
            </v-tabs>
          </div>
        </div>
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-6 hidden md:flex">
             <div v-for="cat in categories" :key="cat.label" class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" :class="cat.bg"></span>
                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ cat.label }}</span>
             </div>
          </div>
          <div class="d-flex align-center justify-center flex-row-reverse border-l border-slate-100 pl-6 ml-2">
            <v-avatar size="36" variant="outlined" color="white" class="ml-n3 border-2 border-white shadow-sm">
              <img src="@/assets/images/users/avatar-4.png" width="36" alt="vector" />
            </v-avatar>
            <v-avatar size="36" variant="outlined" color="white" class="ml-n3 border-2 border-white shadow-sm">
              <img src="@/assets/images/users/avatar-3.png" width="36" alt="vector" />
            </v-avatar>
            <v-avatar size="36" variant="outlined" color="white" class="ml-n3 border-2 border-white shadow-sm">
              <img src="@/assets/images/users/avatar-2.png" width="36" alt="vector" />
            </v-avatar>
            <v-avatar size="36" variant="outlined" color="white" class="border-2 border-white shadow-sm">
              <img src="@/assets/images/users/avatar-1.png" width="36" alt="vector" />
            </v-avatar>
            <v-btn icon size="small" color="primary" class="ml-4 rounded-xl shadow-md" @click="showAddModal = true">
              <span class="material-symbols-outlined text-sm font-black">add</span>
            </v-btn>
          </div>
        </div>
      </div>

      <v-row>
        <!-- 🗓️ Calendar View -->
        <v-col cols="12" :lg="viewMode === 'monthly' ? 8 : 12">
          <div v-if="viewMode === 'monthly'" class="bg-white rounded-[2rem] border border-slate-50 overflow-hidden shadow-sm">
             <!-- Monthly Grid Header -->
             <div class="flex items-center justify-between p-6 bg-slate-50/50">
                <div class="flex items-center gap-4">
                   <h2 class="text-xl font-black text-slate-900">{{ currentMonthName }} {{ currentYear }}</h2>
                   <div class="flex gap-2">
                      <v-btn icon density="compact" variant="text" class="text-slate-400" @click="prevMonth"><span class="material-symbols-outlined">chevron_left</span></v-btn>
                      <v-btn icon density="compact" variant="text" class="text-slate-400" @click="nextMonth"><span class="material-symbols-outlined">chevron_right</span></v-btn>
                   </div>
                </div>
                <span v-if="holidays.length" class="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full animate-pulse">
                   Holidays Synced 🌐
                </span>
             </div>
             
             <div class="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30">
                <div v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="day" 
                     class="py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ day }}</div>
             </div>
             <div class="grid grid-cols-7 auto-rows-[minmax(100px,auto)]">
                <div v-for="(day, idx) in calendarDays" :key="idx" 
                     class="p-3 border-l border-b border-slate-50 transition-all hover:bg-slate-50/80 relative cursor-pointer"
                     :class="{'bg-slate-50/20 text-slate-300': !day.currentMonth}">
                   <span class="text-xs font-black" :class="day.currentMonth ? 'text-slate-400' : 'text-slate-200'">{{ day.num }}</span>
                   <div class="mt-2 flex flex-col gap-1 overflow-hidden">
                      <v-chip v-for="e in day.events" :key="e.id" 
                              :color="getCategoryColor(e.category)" size="x-small" density="comfortable" 
                              class="rounded px-1.5 text-[7px] font-black uppercase truncate">
                        {{ e.title }}
                      </v-chip>
                   </div>
                </div>
             </div>
          </div>

          <!-- 🌍 Full Year View (High Density) -->
          <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div v-for="m in 12" :key="m" class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <h6 class="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3 border-b border-slate-50 pb-2">
                   {{ getMonthName(m-1) }}
                </h6>
                <div class="grid grid-cols-7 gap-1">
                   <div v-for="d in 31" :key="d" class="w-full aspect-square rounded-[4px] flex items-center justify-center text-[8px] font-bold"
                        :class="getDayStatusClass(m-1, d)">
                      {{ d }}
                   </div>
                </div>
             </div>
          </div>
        </v-col>

        <!-- 📊 Sidebar (Upcoming Highlights) -->
        <v-col v-if="viewMode === 'monthly'" cols="12" lg="4">
           <div class="space-y-6">
              <v-card class="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50" variant="text">
                 <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Coming Soon</h3>
                 <div class="space-y-4">
                    <div v-for="event in upcomingMergedEvents" :key="event.id" 
                         class="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:translate-x-1 transition-transform cursor-pointer">
                       <div class="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0" :class="getCategoryTag(event.category)">
                          <span class="text-[8px] font-black uppercase leading-none">{{ formatMonth(event.event_date) }}</span>
                          <span class="text-sm font-black">{{ formatDay(event.event_date) }}</span>
                       </div>
                       <div>
                          <h4 class="text-[11px] font-black text-slate-800 uppercase tracking-tight">{{ event.title }}</h4>
                          <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{{ event.category }}</p>
                       </div>
                    </div>
                 </div>
              </v-card>

              <!-- Featured Match Countdown -->
              <div v-if="featuredEvent" class="relative overflow-hidden rounded-[2rem] h-40 group shadow-lg">
                <img src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2090&auto=format&fit=crop" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex flex-col justify-end p-6">
                  <p class="text-[8px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Live Countdown</p>
                  <h4 class="text-sm font-black text-white mb-2 uppercase">{{ featuredEvent.title }}</h4>
                  <div class="flex items-center gap-1.5 text-white/90 text-[10px] font-black uppercase">
                    <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    {{ countdownDays }} Days Left
                  </div>
                </div>
              </div>
           </div>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- 🎫 Quick Add Modal -->
    <v-dialog v-model="showAddModal" max-width="500">
      <v-card class="rounded-[2.5rem] pa-8 bg-white border border-slate-100">
        <v-card-title class="px-0 pt-0 text-h5 font-black text-slate-900 pb-6 flex justify-between items-center">
          Schedule Event
          <v-btn icon variant="text" @click="showAddModal = false" color="slate-400">
            <span class="material-symbols-outlined">close</span>
          </v-btn>
        </v-card-title>
        <v-form @submit.prevent="saveEvent" class="space-y-6">
           <v-select v-model="form.category" :items="['Sports', 'Academic', 'Event']" label="Category" variant="outlined" density="comfortable" class="rounded-xl custom-field"></v-select>
           <v-text-field v-model="form.title" label="Title" variant="outlined" density="comfortable" class="rounded-xl custom-field"></v-text-field>
           <v-text-field v-model="form.event_date" type="date" label="Date" variant="outlined" density="comfortable" class="rounded-xl custom-field"></v-text-field>
           <v-textarea v-model="form.description" label="Description" variant="outlined" rows="2" density="comfortable" class="rounded-xl custom-field"></v-textarea>
           <v-btn type="submit" block color="primary" size="large" class="rounded-xl h-[56px] font-black text-[11px] uppercase tracking-widest mt-4 shadow-lg">Register Event</v-btn>
        </v-form>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const loading = ref(true);
const viewMode = ref('monthly');
const showAddModal = ref(false);
const events = ref<any[]>([]);
const holidays = ref<any[]>([]);

const categories = [
  { label: 'Sports', bg: 'bg-primary' },
  { label: 'Academic', bg: 'bg-emerald-500' },
  { label: 'National', bg: 'bg-blue-500' }
];

const form = ref({ category: 'Sports', title: '', event_date: '', description: '', is_featured: 0 });

const fetchAll = async () => {
  loading.value = true;
  try {
    const [resEv, resHol] = await Promise.all([
      fetch('/api/dashboard/events'),
      fetch('/api/external/holidays')
    ]);
    const [evData, holData] = await Promise.all([resEv.json(), resHol.json()]);
    if (evData.success) events.value = evData.data;
    if (holData.success) holidays.value = holData.data.map((h: any) => ({
      id: h.name, title: h.name, event_date: h.date, category: 'National'
    }));
  } finally { loading.value = false; }
};

const saveEvent = async () => {
  try {
    const res = await fetch('/api/dashboard/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });
    const data = await res.json();
    if (data.success) { showAddModal.value = false; fetchAll(); }
  } catch (err) { console.error(err); }
};

const mergedEvents = computed(() => [...events.value, ...holidays.value]);

const upcomingMergedEvents = computed(() => {
  return mergedEvents.value
    .filter(e => new Date(e.event_date) >= new Date())
    .sort((a,b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 5);
});

const featuredEvent = computed(() => events.value.find(e => e.is_featured === 1) || upcomingMergedEvents.value[0]);
const countdownDays = computed(() => {
  if (!featuredEvent.value) return 0;
  const target = new Date(featuredEvent.value.event_date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Mocking Calendar for Current Month (Oct 2024 as in mockup)
const currentYear = 2026;
const currentMonth = 9; // Oct

const calendarDays = computed(() => {
  const days = [];
  // Dummy logic for prototype demo mapping to Oct 2024 grid style
  for (let i = 1; i <= 35; i++) {
    const num = i < 3 ? 28+i : (i > 33 ? i-33 : i-2);
    const dayDate = `2026-10-${num.toString().padStart(2, '0')}`;
    days.push({
      num,
      currentMonth: i >= 3 && i <= 33,
      events: mergedEvents.value.filter(e => e.event_date === dayDate)
    });
  }
  return days;
});

const getDayStatusClass = (m: number, d: number) => {
  const dateStr = `2026-${(m+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
  const ev = mergedEvents.value.find(e => e.event_date === dateStr);
  if (!ev) return 'bg-slate-50 text-slate-300';
  if (ev.category === 'National') return 'bg-blue-500 text-white';
  if (ev.category === 'Sports') return 'bg-primary text-white';
  return 'bg-emerald-500 text-white';
};

const getMonthName = (m: number) => new Date(2026, m).toLocaleString('default', { month: 'short' });
const formatMonth = (d: string) => new Date(d).toLocaleString('default', { month: 'short' });
const formatDay = (d: string) => new Date(d).getDate();
const getCategoryColor = (cat: string) => { if (cat==='Sports') return 'primary'; if (cat==='Academic') return 'success'; return 'info'; };
const getCategoryTag = (cat: string) => { if (cat==='Sports') return 'bg-primary text-white'; if (cat==='Academic') return 'bg-emerald-500 text-white'; return 'bg-blue-500 text-white'; };

onMounted(fetchAll);
</script>

<style scoped>
.tab-modern .v-tab--selected { background-color: #1890FF !important; color: white !important; }
.tab-modern .v-tab { border: 1px solid #f1f5f9; min-width: 70px; height: 28px; }
.tracking-widest { letter-spacing: 0.15em !important; }
.custom-field :deep(.v-field__outline) { border-radius: 12px !important; border-color: #f1f5f9 !important; }
.custom-field :deep(.v-field__input) { color: #1e293b !important; font-weight: 600 !important; font-size: 13px !important; }
@keyframes pulse { 0% { transform: scale(0.95); opacity: 0.7; } 50% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.7; } }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
</style>
