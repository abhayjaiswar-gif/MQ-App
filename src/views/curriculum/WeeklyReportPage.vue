<template>
  <div class="min-h-screen bg-surface py-10 px-4 font-body print:p-0 print:bg-white">
    <div class="max-w-4xl mx-auto mb-10 flex justify-between items-center print:hidden">
      <h1 class="text-2xl font-bold">Performance Summary</h1>
      <button @click="printReport" class="px-4 py-2 bg-blue-500 text-white rounded">
        Print / Export
      </button>
    </div>
    <main v-if="reportData" class="max-w-4xl mx-auto bg-white p-8 rounded shadow">
      <div class="flex justify-between mb-10">
        <div>
          <h1 class="text-3xl font-bold">
            {{ reportData.is_individual ? 'Coach Progress' : 'Academic Summary' }}
          </h1>
          <p class="text-sm text-blue-500 font-bold mt-2">
            {{ reportData.coach_name }}
          </p>
        </div>
        <div class="text-right">
          <div class="font-bold">{{ reportData.school_name }}</div>
          <div class="text-xs mt-1">
            {{ reportData.month_year }} — {{ reportData.week_no }}
          </div>
        </div>
      </div>
      <div v-if="reportData.assignments.length">
        <section v-for="(group, sportName) in groupedAssignments" :key="sportName" class="mb-10">
          <h2 class="text-xl font-bold mb-4">{{ sportName }}</h2>
          <div v-for="item in group" :key="item.lp_no"
            class="border p-4 rounded mb-3 flex justify-between items-center">
            <div>
              <div class="flex items-center gap-2">
                <strong>{{ item.skill }}</strong>
                <span :class="getStatusClass(item.lp_status)">
                  {{ item.lp_status }}
                </span>
              </div>
              <p class="text-sm text-gray-500 italic">
                "{{ item.lp_remark }}"
              </p>
            </div>
            <div>
              ⭐
              <span v-for="i in 5" :key="i">
                {{ i <= (item.lp_status === 'Done' ? 5 : 2) ? '★' : '☆' }} </span>
            </div>
          </div>
        </section>
      </div>
      <div v-else class="text-center text-gray-400">
        No data available
      </div>
    </main>

    <!-- Loading -->
    <div v-else class="text-center mt-20">
      Loading...
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const reportData = ref<any>(null);
const loading = ref(true);

/* ✅ Dummy Data Injection */
onMounted(() => {
  reportData.value = {
    is_individual: true,
    coach_name: "Rahul Sharma",
    school_name: "Elite Sports Academy",
    month_year: "March 2026",
    week_no: "Week 2",
    assignments: [
      {
        lp_no: 1,
        sport: "Football",
        coach_name: "Rahul Sharma",
        skill: "Dribbling Control",
        lp_status: "Done",
        lp_remark: "Excellent ball control under pressure",
        objective: "Improve close control"
      },
      {
        lp_no: 2,
        sport: "Football",
        coach_name: "Rahul Sharma",
        skill: "Passing Accuracy",
        lp_status: "Pending",
        lp_remark: "Needs improvement in long passes",
        objective: "Develop passing precision"
      },
      {
        lp_no: 3,
        sport: "Football",
        coach_name: "Rahul Sharma",
        skill: "Shooting Technique",
        lp_status: "Partially Complete",
        lp_remark: "Good power but lacks direction",
        objective: "Improve shot accuracy"
      },
      {
        lp_no: 4,
        sport: "Basketball",
        coach_name: "Michael",
        skill: "Free Throw",
        lp_status: "Done",
        lp_remark: "Consistent scoring",
        objective: "Maintain consistency"
      },
      {
        lp_no: 5,
        sport: "Basketball",
        coach_name: "Michael",
        skill: "Defense Positioning",
        lp_status: "Pending",
        lp_remark: "Late reactions observed",
        objective: "Improve defensive awareness"
      },
      {
        lp_no: 6,
        sport: "Swimming",
        coach_name: "Anita",
        skill: "Freestyle Stroke",
        lp_status: "Done",
        lp_remark: "Smooth and efficient strokes",
        objective: "Increase endurance"
      },
      {
        lp_no: 7,
        sport: "Swimming",
        coach_name: "Anita",
        skill: "Breathing Technique",
        lp_status: "Partially Complete",
        lp_remark: "Irregular breathing pattern",
        objective: "Improve rhythm"
      }
    ]
  };

  loading.value = false;
});

/* Grouping Logic */
const groupedAssignments = computed(() => {
  if (!reportData.value?.assignments) return {};
  return reportData.value.assignments.reduce((acc: any, item: any) => {
    const sport = item.sport || 'General';
    if (!acc[sport]) acc[sport] = [];
    acc[sport].push(item);
    return acc;
  }, {});
});

/* Status Styling */
const getStatusClass = (status: string) => {
  if (status === 'Done') return 'text-green-600 font-bold ml-2';
  if (status === 'Pending') return 'text-yellow-600 font-bold ml-2';
  return 'text-gray-400 font-bold ml-2';
};

/* Print */
const printReport = () => {
  window.print();
};
</script>

<style scoped>
body {
  font-family: Arial, sans-serif;
}
</style>