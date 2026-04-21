<template>
  <div class="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
    <div class="mb-10">
      <nav class="flex items-center space-x-2 text-on-surface-variant text-sm font-medium mb-2">
        <a class="hover:text-primary transition-colors" href="#">Curriculum</a>
        <span class="material-symbols-outlined text-xs">chevron_right</span>
        <a class="hover:text-primary transition-colors" href="#">Football</a>
        <span class="material-symbols-outlined text-xs">chevron_right</span>
        <a class="hover:text-primary transition-colors" href="#">Grade 8</a>
        <span class="material-symbols-outlined text-xs">chevron_right</span>
        <span class="text-on-surface font-semibold">Schedule</span>
      </nav>
      <h1 class="text-4xl font-extrabold text-on-surface tracking-tight" style="font-family: 'Manrope', sans-serif;">
        Schedule Lesson Plans
      </h1>
    </div>
    <div class="grid grid-cols-12 gap-8 items-start">
      <!-- Left: Configuration Form -->
      <div class="col-span-12 lg:col-span-8 space-y-8">
        <section class="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-slate-100">
          <div class="flex items-center space-x-3 mb-8">
            <span class="material-symbols-outlined text-primary"
              style="font-variation-settings: 'FILL' 1;">event_note</span>
            <h2 class="text-xl font-bold">Scheduling Configuration</h2>
          </div>
          <div class="space-y-10">
            <div>
              <label class="block text-sm font-semibold text-on-surface-variant mb-4 font-body">Number of
                Chapters/Sessions</label>
              <div class="flex items-center max-w-xs bg-surface-container rounded-xl p-1 overflow-hidden">
                <button @click="form.chapters > 1 ? form.chapters-- : null"
                  class="p-3 hover:bg-white rounded-lg transition-colors text-primary flex items-center justify-center">
                  <span class="material-symbols-outlined">remove</span>
                </button>
                <input v-model="form.chapters"
                  class="flex-1 bg-transparent border-none text-center font-bold text-lg focus:ring-0 outline-none w-16"
                  type="number" />
                <button @click="form.chapters++"
                  class="p-3 hover:bg-white rounded-lg transition-colors text-primary flex items-center justify-center">
                  <span class="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>

            <!-- Weekly Recurrence -->
            <div>
              <label class="block text-sm font-semibold text-on-surface-variant mb-4 font-body">Weekly
                Recurrence</label>
              <div class="flex flex-wrap gap-3">
                <button v-for="day in days" :key="day" @click="toggleDay(day)" :class="[
                  'px-5 py-3 rounded-xl font-semibold text-sm border-2 transition-all active:scale-95',
                  form.recurrence.includes(day)
                    ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                    : 'border-outline-variant text-on-surface-variant hover:border-primary/50'
                ]">
                  {{ day }}
                </button>
              </div>
            </div>

            <!-- Time Slot & Duration -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label class="block text-sm font-semibold text-on-surface-variant mb-4 font-body">Start Time</label>
                <div class="relative">
                  <span
                    class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">schedule</span>
                  <input v-model="form.startTime"
                    class="w-full pl-12 pr-4 py-3 bg-surface-container border-none rounded-xl font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    type="time" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-semibold text-on-surface-variant mb-4 font-body">End Time</label>
                <div class="relative">
                  <span
                    class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">schedule</span>
                  <input v-model="form.endTime"
                    class="w-full pl-12 pr-4 py-3 bg-surface-container border-none rounded-xl font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    type="time" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end space-x-4 pt-4">
          <button
            class="px-8 py-4 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-colors font-body">Cancel</button>
          <button @click="handleSubmit" :disabled="submitting"
            class="px-8 py-4 rounded-xl font-bold bg-gradient-to-b from-primary to-primary-container text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 font-body disabled:opacity-50">
            <span v-if="submitting"
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Generate Schedule
          </button>
        </div>

        <!-- Success/Error Alerts Integrated into layout -->
        <Transition name="fade">
          <div v-if="successMsg"
            class="bg-green-100 border border-green-200 text-green-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-green-600">check_circle</span>
              <p class="text-sm font-bold">{{ successMsg }}</p>
            </div>
            <button @click="successMsg = ''" class="material-symbols-outlined text-sm">close</button>
          </div>
        </Transition>

        <!-- Table of Scheduled Lessons (Preserved from previous request) -->
        <section class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mt-12">
          <div class="p-6 border-b border-slate-50 flex items-center justify-between bg-[#f9f9f9]/50">
            <h3 class="text-sm font-black uppercase text-[#1a1c1c] tracking-widest flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">list_alt</span>
              Active Assignments
            </h3>
            <button @click="fetchSchedules"
              class="text-primary hover:bg-primary/5 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
              <span class="material-symbols-outlined text-sm">sync</span>
              Refresh
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="bg-slate-50">
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">ID</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Lesson</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled For
                  </th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                    Status</th>
                  <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="fetching">
                  <td colspan="5" class="py-12 text-center">
                    <div class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto">
                    </div>
                  </td>
                </tr>
                <tr v-else-if="schedules.length === 0">
                  <td colspan="5" class="py-12 text-center text-slate-400 italic text-sm">No assignments scheduled yet.
                  </td>
                </tr>
                <tr v-for="item in schedules" :key="item.id" class="hover:bg-slate-50/50 transition-colors group">
                  <td class="px-6 py-4">
                    <span class="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500">#{{ item.id
                    }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <p class="text-sm font-bold text-slate-900 leading-none">Lesson #{{ item.lesson_id }}</p>
                    <p class="text-[10px] text-slate-400 uppercase mt-1">Football Core</p>
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-slate-600">{{ formatDate(item.assign_date) }}</td>
                  <td class="px-6 py-4 text-center">
                    <span :class="[
                      'px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider',
                      item.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'
                    ]">
                      {{ item.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button @click="handleDelete(item.id)" class="text-slate-300 hover:text-error transition-colors">
                      <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- Right: Summary Sidebar -->
      <div class="col-span-12 lg:col-span-4">
        <div class="bg-secondary-container/30 border border-secondary-container/50 p-8 rounded-3xl sticky top-28">
          <h3 class="text-lg font-bold text-on-secondary-container mb-6 flex items-center font-headline">
            <span class="material-symbols-outlined mr-2" style="font-variation-settings: 'FILL' 1;">summarize</span>
            Schedule Preview
          </h3>
          <div class="space-y-6">
            <div class="flex items-start space-x-4">
              <div
                class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
                <span class="material-symbols-outlined">menu_book</span>
              </div>
              <div>
                <p class="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Total Lessons</p>
                <p class="text-2xl font-black text-on-surface tracking-tight">{{ form.chapters }} Chapters</p>
                <p class="text-sm text-on-secondary-container/70">Covers entire Football Grade 8 curriculum</p>
              </div>
            </div>
            <div class="h-px bg-on-secondary-container/10"></div>
            <div class="flex items-start space-x-4">
              <div
                class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
                <span class="material-symbols-outlined">update</span>
              </div>
              <div>
                <p class="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Timeline</p>
                <p class="text-2xl font-black text-on-surface tracking-tight">{{ estimateWeeks }} Weeks</p>
                <p class="text-sm text-on-secondary-container/70">Schedule duration based on sessions</p>
              </div>
            </div>
            <div class="h-px bg-on-secondary-container/10"></div>
            <div class="flex items-start space-x-4">
              <div
                class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
                <span class="material-symbols-outlined">calendar_month</span>
              </div>
              <div>
                <p class="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Frequency</p>
                <p class="text-lg font-bold text-on-surface leading-snug">
                  {{ form.recurrence.length > 0 ? form.recurrence.join(' & ') : 'Please select days' }}, {{
                    formatTime(form.startTime) }} - {{ formatTime(form.endTime) }}
                </p>
              </div>
            </div>
          </div>
          <!-- Info Card -->
          <div class="mt-10 p-5 bg-white/60 rounded-2xl border border-white/40 shadow-sm backdrop-blur-sm">
            <div class="flex items-center space-x-2 text-primary mb-2">
              <span class="material-symbols-outlined text-lg">info</span>
              <span class="text-xs font-bold uppercase tracking-widest">Automation Note</span>
            </div>
            <p class="text-[11px] text-on-surface-variant leading-relaxed">
              Generating the schedule will automatically allocate training pitches and assign the primary instructor for
              Grade 8. You can manually override specific dates after generation.
            </p>
          </div>
          <div class="mt-8 overflow-hidden rounded-2xl shadow-lg shadow-black/5 ring-1 ring-white/20">
            <img alt="Football training pitch"
              class="w-full h-32 object-cover hover:scale-105 transition-transform duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAIozymi0KfM4Q7kskP15rbc7TawU7JjxD3FWUu4PW8YgPmnlhKAjpCcKVE29GcfR_VMHbMM6d1e-sStwcNm_34sdxy0ueFm8nSRAobgI-t0CfIV2cwNuTbjvIXSUrqvYQAIAXLaPvsc5QVK0vAQt4auQrOnSwphnrPy544BwIET-wGIQw-bdRLwFp9XBhXNOdtvs6Q0zVsswFgEngxlxCqp33NZFyV-9rx5x-EmKXDqziR_WdxlbEkZqenGfu1B0aEs6f3RZvuzpv" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import axios from 'axios';

// State
const fetching = ref(false);
const submitting = ref(false);
const schedules = ref<any[]>([]);
const successMsg = ref('');
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const form = reactive({
  chapters: 24,
  recurrence: ['Mon', 'Thu'] as string[],
  startTime: '16:00',
  endTime: '17:00'
});

// Computed
const estimateWeeks = computed(() => {
  if (form.recurrence.length === 0) return 0;
  return Math.ceil(form.chapters / form.recurrence.length);
});

// Methods
const toggleDay = (day: string) => {
  const idx = form.recurrence.indexOf(day);
  if (idx > -1) {
    form.recurrence.splice(idx, 1);
  } else {
    form.recurrence.push(day);
  }
};

const fetchSchedules = async () => {
  fetching.value = true;
  try {
    const res = await axios.get('/api/schedule');
    if (res.data.success) {
      schedules.value = res.data.schedule || res.data.schedules || [];
    } else {
      schedules.value = Array.isArray(res.data) ? res.data : [];
    }
  } catch (err) {
    console.error(err);
  } finally {
    fetching.value = false;
  }
};

const handleSubmit = async () => {
  submitting.value = true;
  successMsg.value = '';
  try {
    // For now, we simulate the recurrence logic by just sending one "start" date if bulk isn't supported,
    // or we assume backend handles this recurring form.
    // Based on requirements, I'll send a post with the rules.
    const res = await axios.post('/api/schedule', {
      lesson_id: 8, // Fixed for Grade 8 as per design header
      chapters: form.chapters,
      recurrence: form.recurrence,
      start_time: form.startTime,
      end_time: form.endTime
    });

    if (res.data.success) {
      successMsg.value = 'Schedule generation successful!';
      await fetchSchedules();
    }
  } catch (err) {
    console.error(err);
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (id: number) => {
  if (!confirm('Are you sure?')) return;
  try {
    const res = await axios.delete(`/api/schedule/${id}`);
    if (res.data.success) {
      await fetchSchedules();
    }
  } catch (err) {
    console.error(err);
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const formatTime = (time: string) => {
  if (!time) return '';
  const [h, m] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(h), parseInt(m));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

onMounted(fetchSchedules);
</script>

<style scoped>
.font-headline {
  font-family: 'Manrope', sans-serif;
}

.font-body {
  font-family: 'Inter', sans-serif;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
