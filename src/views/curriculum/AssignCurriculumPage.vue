<template>
  <div class="p-4 md:p-2">
    <!-- Header Section -->
    <div class="flex justify-between items-end mb-10">
      <div>
        <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight" style="font-family: 'Manrope', sans-serif;">
          Curriculum Assignment (SSGM)</h1>
        <p class="text-gray-500 mt-1" style="font-family: 'Inter', sans-serif;">Manage and distribute specialized sports
          curriculums across registered schools.</p>
      </div>
      <div class="flex gap-3">
        <button
          class="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-800 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
          <span class="material-symbols-outlined text-lg">download</span>
          Export List
        </button>
      </div>
    </div>

    <!-- Bento Layout Content -->
    <div class="grid grid-cols-12 gap-8">
      <!-- Assignment Form Card -->
      <div class="col-span-12 lg:col-span-5 bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <div class="flex items-center gap-3 mb-6">
          <div class="p-2 bg-blue-50 rounded-lg">
            <span class="material-symbols-outlined text-blue-600">add_task</span>
          </div>
          <h2 class="text-xl font-bold text-gray-900" style="font-family: 'Manrope', sans-serif;">New Assignment</h2>
        </div>

        <div class="space-y-6">
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Head Coach</label>
            <div class="relative">
              <select v-model="selectedTeacherId"
                class="w-full bg-gray-50 border-none rounded-xl py-3 pl-4 pr-10 appearance-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 font-medium">
                <option v-if="coaches.length === 0" :value="null">Loading coaches...</option>
                <option v-for="coach in coaches" :key="coach.id" :value="coach.id">{{ coach.name }}</option>
              </select>
              <span
                class="material-symbols-outlined absolute right-3 top-3 text-gray-400 pointer-events-none">person_search</span>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Year Plans /
              Curriculums</label>
            <div class="bg-gray-50 rounded-xl p-4 space-y-3 max-h-48 overflow-y-auto">
              <div v-if="yearPlans.length === 0" class="text-xs text-gray-500 italic">No year plans available. Import
                one first.</div>
              <label v-for="plan in yearPlans" :key="plan.id_indicate_curriculum"
                class="flex items-center gap-3 cursor-pointer group">
                <input v-model="selectedCurriculums" :value="plan.id_indicate_curriculum"
                  class="rounded text-blue-600 focus:ring-blue-500 bg-white border-gray-300 w-5 h-5" type="checkbox" />
                <span class="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">{{
                  plan.sport }} (ID: {{ plan.id_indicate_curriculum }}) - {{ plan.module_count }} Modules</span>
              </label>
            </div>
          </div>

          <button @click="submitAssignment" :disabled="isAssigning"
            class="w-full bg-gradient-to-b from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-75 disabled:cursor-not-allowed">
            <span v-if="!isAssigning" class="material-symbols-outlined">auto_awesome</span>
            <span v-else class="material-symbols-outlined animate-spin">autorenew</span>
            {{ isAssigning ? 'Assigning...' : 'Assign Curriculum' }}
          </button>
        </div>
      </div>

      <!-- Active Assignments Section -->
      <div class="col-span-12 lg:col-span-7 flex flex-col gap-8">
        <!-- Stats Overview (Small Bento Cells) -->
        <div class="grid grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
            <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Active Curriculums</p>
            <h3 class="text-3xl font-extrabold text-blue-600">{{ yearPlans.length }}</h3>
            <div class="mt-2 text-[10px] text-green-600 font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-xs" data-icon="trending_up">trending_up</span>
              Programs Available
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
            <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assigned Staff</p>
            <h3 class="text-3xl font-extrabold text-gray-900">{{ assignedStaffCount }}</h3>
            <div class="mt-2 text-[10px] text-blue-600 font-bold flex items-center gap-1">
               <span class="material-symbols-outlined text-xs" data-icon="groups">groups</span>
               Active Coaches
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
            <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Assignments</p>
            <h3 class="text-3xl font-extrabold text-gray-900">{{ assignments.length }}</h3>
            <div class="mt-2 text-[10px] text-gray-500 font-bold">In across regions</div>
          </div>
        </div>

        <!-- Table Container -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1">
          <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 class="text-lg font-bold text-gray-900" style="font-family: 'Manrope', sans-serif;">Active Assignments
            </h2>
            <button @click="fetchAssignments" class="text-blue-600 text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">refresh</span>
              Refresh
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Sport</th>
                  <th class="px-6 py-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Head Coach
                  </th>
                  <th class="px-6 py-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Modules</th>
                  <th class="px-6 py-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest text-right">
                    Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-if="assignments.length === 0">
                  <td colspan="4" class="px-6 py-10 text-center text-gray-400 italic">No assignments found.</td>
                </tr>
                <tr v-for="assign in assignments" :key="assign.id" class="hover:bg-gray-50/50 transition-colors group">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <span class="material-symbols-outlined text-blue-600 text-lg">{{ getSportIcon(assign.sport) }}</span>
                      </div>
                      <span class="text-sm font-bold text-gray-900">{{ assign.sport }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-800 font-medium">{{ assign.coach_name }}</td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">{{ assign.module_count }} Modules</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button @click="removeAssignment(assign.id)" class="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 p-1">
                      <span class="material-symbols-outlined text-lg">delete_sweep</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const yearPlans = ref<any[]>([]);
const coaches = ref<any[]>([]);
const assignments = ref<any[]>([]);
const selectedTeacherId = ref<number | null>(null);
const selectedCurriculums = ref<number[]>([]);
const isAssigning = ref(false);

const assignedStaffCount = computed(() => {
  return new Set(assignments.value.map(a => a.user_id)).size;
});

const fetchCoaches = async () => {
  try {
    const res = await fetch('/api/users/coaches');
    const data = await res.json();
    if (data.success) {
      coaches.value = data.coaches;
      if (coaches.value.length > 0) {
        selectedTeacherId.value = coaches.value[0].id;
      }
    }
  } catch (err) {
    console.error('Fetch coaches error:', err);
  }
};

const fetchYearPlans = async () => {
  try {
    const res = await fetch('/api/curriculums');
    const data = await res.json();
    if (data.success) {
      yearPlans.value = data.curriculums;
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
};

const fetchAssignments = async () => {
  try {
    const res = await fetch('/api/curriculum/assignments');
    const data = await res.json();
    if (data.success) {
      assignments.value = data.assignments;
    }
  } catch (err) {
    console.error('Fetch assignments error:', err);
  }
};

onMounted(() => {
  fetchCoaches();
  fetchYearPlans();
  fetchAssignments();
});

const submitAssignment = async () => {
  if (!selectedTeacherId.value) {
    alert('Please select a coach.');
    return;
  }
  if (selectedCurriculums.value.length === 0) {
    alert('Please select at least one curriculum to assign.');
    return;
  }

  const payload = selectedCurriculums.value.map(id => {
    const plan = yearPlans.value.find(p => p.id_indicate_curriculum === id);
    return { sport: plan?.sport || 'Unknown', curriculum_id: id };
  });

  isAssigning.value = true;
  try {
    const res = await fetch('/api/curriculum/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacher_id: selectedTeacherId.value,
        assignments: JSON.stringify(payload)
      })
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      selectedCurriculums.value = [];
      fetchAssignments(); // Refresh table
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('An error occurred while assigning.');
  } finally {
    isAssigning.value = false;
  }
};

const removeAssignment = async (id: number) => {
  if (!confirm('Are you sure you want to remove this assignment?')) return;
  
  try {
    const res = await fetch(`/api/curriculum/assignments/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      fetchAssignments();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('Failed to remove assignment.');
  }
};

const getSportIcon = (sport: string) => {
  const s = sport.toLowerCase();
  if (s.includes('basket')) return 'sports_basketball';
  if (s.includes('football') || s.includes('soccer')) return 'sports_soccer';
  if (s.includes('tennis')) return 'sports_tennis';
  if (s.includes('swim')) return 'pool';
  if (s.includes('cricket')) return 'sports_cricket';
  if (s.includes('volney')) return 'sports_volleyball';
  return 'sports';
};
</script>

<style scoped>
/* Scoped css if necessary */
</style>
