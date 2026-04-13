<template>
  <v-card class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden" variant="text">
    <v-card-text class="pa-6">
      <!-- 📅 Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
          <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest">Academy Timeline</h3>
        </div>
        <v-btn icon size="x-small" color="primary" variant="tonal" class="rounded-lg" @click="showAddModal = true">
          <span class="material-symbols-outlined text-xs">add</span>
        </v-btn>
      </div>

      <!-- 🗓️ Mini Grid -->
      <div class="bg-slate-50/50 rounded-3xl p-4 mb-6">
        <div class="flex items-center justify-between mb-4 px-2">
           <span class="text-[11px] font-black text-slate-900 uppercase tracking-tight">{{ currentMonthName }} {{ currentYear }}</span>
           <div class="flex gap-1">
              <v-btn icon density="compact" variant="text" size="x-small" @click="prevMonth"><span class="material-symbols-outlined text-xs">chevron_left</span></v-btn>
              <v-btn icon density="compact" variant="text" size="x-small" @click="nextMonth"><span class="material-symbols-outlined text-xs">chevron_right</span></v-btn>
           </div>
        </div>
        
        <div class="grid grid-cols-7 gap-1 mb-2 text-center">
           <div v-for="day in ['S','M','T','W','T','F','S']" :key="day" class="text-[8px] font-black text-slate-300">{{ day }}</div>
        </div>
        
        <div class="grid grid-cols-7 gap-1">
           <div v-for="(day, idx) in calendarDays" :key="idx" 
                class="aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all group relative"
                :class="getGridDayClass(day)">
              <span class="text-[10px] font-bold">{{ day.num }}</span>
              <!-- Event Dots -->
              <div v-if="day.events.length" class="flex gap-0.5 mt-0.5">
                 <div v-for="e in day.events.slice(0,2)" :key="e.id" 
                      class="w-1 h-1 rounded-full" :class="getDotColor(e.category)"></div>
              </div>
              
              <!-- Indicator for Today -->
              <div v-if="day.isToday" class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full border border-white"></div>
           </div>
        </div>
      </div>

      <!-- 📋 Upcoming Mini List (Timeline Countdown) -->
      <div class="space-y-4">
         <h4 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Highlights Timeline</h4>
         <div v-if="upcomingEvents.length" class="relative before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-slate-100 space-y-4 pl-1">
            <div v-for="(event, i) in upcomingEvents.slice(0,3)" :key="event.id" class="relative pl-12">
               <!-- Timeline Dot -->
               <div class="absolute left-[-2px] top-1/2 -translate-y-1/2 w-[42px] h-[42px] rounded-xl flex flex-col items-center justify-center shadow-sm border-[3px] border-white z-10" :class="getCategoryTag(event.category)">
                  <span class="text-[7px] font-black uppercase leading-none">{{ formatMonth(event.event_date) }}</span>
                  <span class="text-[12px] font-black leading-tight">{{ formatDay(event.event_date) }}</span>
               </div>
               
               <!-- Content Card -->
               <div class="p-3 bg-white border border-slate-50 rounded-2xl shadow-sm hover:-translate-y-1 transition-transform cursor-pointer">
                  <div class="flex items-center justify-between gap-2 mb-1">
                     <h5 class="text-[10px] font-black text-slate-800 truncate">{{ event.title }}</h5>
                     <div class="flex items-center gap-1 shrink-0 rounded-full bg-slate-50 px-2 py-0.5 border border-slate-100">
                        <span class="w-1.5 h-1.5 rounded-full" :class="getDotColor(event.category)"></span>
                        <span class="text-[8px] font-black text-slate-500 uppercase">{{ getCountdownFormat(event.event_date) }}</span>
                     </div>
                  </div>
                  <p class="text-[8px] text-slate-400 font-bold uppercase truncate">{{ event.category }} Event</p>
               </div>
            </div>
         </div>
         <div v-else class="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">No Events Found</span>
         </div>
      </div>
    </v-card-text>

    <!-- 🎫 Quick Add Modal -->
    <v-dialog v-model="showAddModal" max-width="400">
      <v-card class="rounded-[2.5rem] pa-8 bg-white border border-slate-100">
        <v-card-title class="px-0 pt-0 text-h5 font-black text-slate-900 pb-6 flex justify-between items-center">
          Add Milestone
          <v-btn icon variant="text" @click="showAddModal = false" color="slate-400">
            <span class="material-symbols-outlined">close</span>
          </v-btn>
        </v-card-title>
        <v-form @submit.prevent="saveEvent" class="space-y-4">
           <v-select v-model="form.category" :items="['Sports', 'Academic', 'National']" label="Type" variant="outlined" density="comfortable" class="rounded-xl custom-field"></v-select>
           <v-text-field v-model="form.title" label="What's happening?" variant="outlined" density="comfortable" class="rounded-xl custom-field"></v-text-field>
           <v-text-field v-model="form.event_date" type="date" label="When?" variant="outlined" density="comfortable" class="rounded-xl custom-field"></v-text-field>
           <v-btn type="submit" block color="primary" class="rounded-xl h-[48px] font-black text-[10px] uppercase tracking-widest mt-2 shadow-lg">Set Event</v-btn>
        </v-form>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const showAddModal = ref(false);
const events = ref<any[]>([]);
const holidays = ref<any[]>([]);
const date = ref(new Date());

const currentYear = computed(() => date.value.getFullYear());
const currentMonth = computed(() => date.value.getMonth());
const currentMonthName = computed(() => date.value.toLocaleString('default', { month: 'long' }));

const form = ref({ category: 'Sports', title: '', event_date: '', is_featured: 0 });

const fetchAll = async () => {
  try {
    const [resEv, resHol] = await Promise.all([
      fetch(`/api/dashboard/events?user_id=${sessionStorage.getItem('id') || ''}`),
      fetch('/api/external/holidays')
    ]);
    const [evData, holData] = await Promise.all([resEv.json(), resHol.json()]);
    if (evData.success) events.value = evData.data;
    if (holData.success) holidays.value = holData.data.map((h: any) => ({
      id: h.name, title: h.name, event_date: h.date, category: 'National'
    }));
  } catch (err) { console.error(err); }
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

const upcomingEvents = computed(() => {
  return mergedEvents.value
    .filter(e => new Date(e.event_date) >= new Date())
    .sort((a,b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
});

const calendarDays = computed(() => {
  const days = [];
  const start = new Date(currentYear.value, currentMonth.value, 1);
  const end = new Date(currentYear.value, currentMonth.value + 1, 0);
  
  // Fill leading empty days
  const leading = start.getDay();
  for (let i = leading - 1; i >= 0; i--) {
    days.push({ num: new Date(currentYear.value, currentMonth.value, -i).getDate(), currentMonth: false, events: [] });
  }
  
  // Actual days
  const today = new Date();
  for (let i = 1; i <= end.getDate(); i++) {
    const dStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
    days.push({
      num: i,
      currentMonth: true,
      isToday: today.getFullYear() === currentYear.value && today.getMonth() === currentMonth.value && today.getDate() === i,
      events: mergedEvents.value.filter(e => {
        const eDate = String(e.event_date).split('T')[0];
        return eDate === dStr;
      })
    });
  }
  return days;
});

const prevMonth = () => date.value = new Date(currentYear.value, currentMonth.value - 1, 1);
const nextMonth = () => date.value = new Date(currentYear.value, currentMonth.value + 1, 1);

const getDotColor = (cat: string) => { if (cat==='Sports') return 'bg-primary'; if (cat==='Academic') return 'bg-emerald-500'; return 'bg-blue-500'; };
const getCategoryTag = (cat: string) => { if (cat==='Sports') return 'bg-primary/10 text-primary'; if (cat==='Academic') return 'bg-emerald-50/50 text-emerald-500'; return 'bg-blue-50/50 text-blue-500'; };

const getGridDayClass = (day: any) => {
  if (!day.currentMonth) return 'text-slate-200 pointer-events-none';
  if (day.events.length > 0) {
     const cat = day.events[0].category;
     if (cat === 'Sports') return 'bg-blue-600 text-white font-black shadow-lg scale-105 z-10';
     if (cat === 'Academic') return 'bg-emerald-500 text-white font-black shadow-lg scale-105 z-10';
     return 'bg-purple-500 text-white font-black shadow-lg scale-105 z-10'; // National
  }
  return 'text-slate-600 hover:bg-white hover:shadow-sm';
};

const formatMonth = (d: string) => new Date(d).toLocaleString('default', { month: 'short' });
const formatDay = (d: string) => new Date(d).getDate();

const nowTime = ref(new Date());

const getCountdownFormat = (dateStr: string) => {
  // Assume events are at 9:00 AM if no time is provided
  const target = new Date(dateStr);
  target.setHours(9, 0, 0, 0); 

  const diffMs = target.getTime() - nowTime.value.getTime();
  
  if (diffMs <= 0) return 'Live / Past';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h ${mins}m ${secs}s`;
  return `${hours}h ${mins}m ${secs}s`;
};

onMounted(() => {
  fetchAll();
  setInterval(() => {
    nowTime.value = new Date();
  }, 1000);
});
</script>

<style scoped>
.tracking-widest { letter-spacing: 0.2em !important; }
.custom-field :deep(.v-field__outline) { border-radius: 12px !important; border-color: #f1f5f9 !important; }
.custom-field :deep(.v-field__input) { color: #1e293b !important; font-weight: 600 !important; font-size: 13px !important; }
@keyframes pulse { 0% { opacity: 0.5; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.5; transform: scale(0.8); } }
.animate-pulse { animation: pulse 2s ease-in-out infinite; }
</style>
