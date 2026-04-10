<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useTheme } from 'vuetify';

const theme = useTheme();
const primaryColor = theme.current.value.colors.primary;
const successColor = theme.current.value.colors.success;

const loading = ref(true);
const tab = ref('yearly');
const growthData = ref<any>(null);

const fetchGrowthData = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/dashboard/growth-stats');
    const data = await res.json();
    if (data.success) {
      growthData.value = data.data;
    }
  } catch (err) {
    console.error('Growth fetch error:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchGrowthData();
});

const chartOptions = computed(() => {
  const labels = tab.value === 'yearly' ? growthData.value?.yearly?.labels : growthData.value?.monthly?.labels;
  
  return {
    chart: {
      type: 'area',
      height: 450,
      fontFamily: `inherit`,
      foreColor: '#94A3B8',
      toolbar: { show: false }
    },
    colors: [primaryColor, successColor],
    labels: labels || [],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4
    },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontWeight: 600,
      markers: { radius: 12 }
    },
    tooltip: { theme: 'light', x: { show: true } }
  };
});

const currentSeries = computed(() => {
  if (tab.value === 'yearly') {
    return growthData.value?.yearly?.series || [];
  }
  return growthData.value?.monthly?.series || [];
});

</script>

<template>
  <v-card class="title-card rounded-xl border-slate-100 shadow-sm bg-white" variant="text" :loading="loading">
    <v-card-item class="pb-2 px-6 pt-6">
      <div class="d-flex justify-space-between align-center">
        <div>
          <v-card-title class="text-h5 font-weight-black text-slate-900 mb-0">Student Enrollment Growth</v-card-title>
          <span class="text-caption text-slate-400 font-weight-bold uppercase tracking-wider">Year-on-Year Expansion Ratio</span>
        </div>
        <div class="d-flex flex-wrap">
          <v-tabs v-model="tab" color="primary" class="tab-modern" density="compact" hide-slider>
            <v-tab value="yearly" class="mr-2 px-4 rounded-lg font-weight-bold text-caption uppercase" variant="tonal"> Yearly </v-tab>
            <v-tab value="monthly" class="px-4 rounded-lg font-weight-bold text-caption uppercase" variant="tonal"> Monthly </v-tab>
          </v-tabs>
        </div>
      </div>
    </v-card-item>
    <v-card-text class="pa-6">
      <div v-if="loading" class="flex items-center justify-center h-[450px]">
        <div class="w-10 h-10 border-4 border-[#1890FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div v-else>
        <apexchart type="area" height="450" :options="chartOptions" :series="currentSeries"> </apexchart>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.text-slate-900 { color: #0F172A !important; }
.text-slate-400 { color: #94A3B8 !important; }
.tracking-wider { letter-spacing: 0.1em !important; }

.tab-modern .v-tab--selected {
  background-color: #1890FF !important;
  color: white !important;
}

.tab-modern .v-tab {
  border: 1px solid #f1f5f9;
  min-width: 80px;
  height: 32px;
}
</style>
