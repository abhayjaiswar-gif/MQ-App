<script setup lang="ts">
import { ref, onMounted } from 'vue';

// icons
import { 
  RiseOutlined, 
  UserOutlined, 
  BankOutlined, 
  TeamOutlined, 
  DashboardOutlined 
} from '@ant-design/icons-vue';

const stats = ref({
  students: 0,
  schools: 0,
  staff: 0
});

const loading = ref(true);

const fetchStats = async () => {
  try {
    const userId = sessionStorage.getItem('id') || '';
    const res = await fetch(`/api/dashboard/stats?user_id=${userId}`);
    const data = await res.json();
    if (data.success) {
      stats.value = data.data;
    }
  } catch (err) {
    console.error('Stats fetch error:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStats();
});

const fivecards = ref([
  {
    name: 'Total Students',
    earn: '0',
    key: 'students',
    percent: 'Live',
    color: 'primary',
    icon: UserOutlined,
    text: 'Active Students'
  },
  {
    name: 'Total Schools',
    earn: '0',
    key: 'schools',
    percent: 'Active',
    color: 'success',
    icon: BankOutlined,
    text: 'Partner Schools'
  },
  {
    name: 'Total Staff',
    earn: '0',
    key: 'staff',
    percent: 'Team',
    color: 'warning',
    icon: TeamOutlined,
    text: 'Active Coaches & Admin'
  },
  {
    name: 'System Activity',
    earn: '98%',
    key: 'uptime',
    percent: 'Optimal',
    color: 'error',
    icon: DashboardOutlined,
    text: 'System Health'
  }
]);
</script>

<template>
  <v-row class="my-0">
    <v-col cols="12" sm="6" md="3" v-for="(card5, i) in fivecards" :key="i" :value="card5">
      <v-card elevation="0" class="overflow-hidden">
        <v-card variant="outlined" class="rounded-xl border-slate-100 shadow-sm bg-white">
          <v-card-text class="pa-5">
            <div class="d-flex align-items-center justify-space-between">
              <div>
                <h6 class="text-caption font-weight-bold text-slate-400 text-uppercase tracking-wider mb-2">{{ card5.name }}</h6>
                <h4 class="text-h4 d-flex align-center mb-1 font-weight-black text-slate-900">
                  {{ loading && card5.key !== 'uptime' ? '...' : (card5.key === 'uptime' ? card5.earn : stats[card5.key as keyof typeof stats]) }}
                  <v-chip :color="card5.color" :border="`${card5.color} solid thin opacity-50`" class="ml-3" size="x-small" label variant="flat">
                    {{ card5.percent }}
                  </v-chip>
                </h4>
                <span class="text-slate-400 text-caption d-block mt-2 font-weight-medium">
                  {{ card5.text }}
                </span>
              </div>
              <div class="bg-slate-50 pa-3 rounded-lg">
                <component :is="card5.icon" :style="{ fontSize: '20px', color: '#1890FF' }" />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.text-slate-400 { color: #94A3B8 !important; }
.text-slate-900 { color: #0F172A !important; }
.bg-slate-50 { background-color: #F8FAFC !important; }
.tracking-wider { letter-spacing: 0.05em !important; }
</style>
