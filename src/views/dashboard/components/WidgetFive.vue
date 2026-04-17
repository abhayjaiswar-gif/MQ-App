<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

// icons
import { 
  RiseOutlined, 
  UserOutlined, 
  BankOutlined, 
  TeamOutlined, 
  DashboardOutlined,
  SolutionOutlined
} from '@ant-design/icons-vue';

const router = useRouter();

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

const fivecards = computed(() => [
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
    name: 'Team Staff',
    earn: '0',
    key: 'staff',
    percent: 'Team',
    color: 'warning',
    icon: TeamOutlined,
    text: 'Ground & HQ Support',
    link: '/staff/hierarchy'
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

const navigateTo = (link?: string) => {
  if (link) router.push(link);
};
</script>

<template>
  <v-row class="my-0">
    <v-col cols="12" sm="6" md="3" v-for="(card5, i) in fivecards" :key="i" class="d-flex">
      <v-card 
        elevation="0" 
        class="overflow-hidden transition-all duration-300 transform w-100 h-100"
        :class="card5.link ? 'cursor-pointer hover:scale-[1.02]' : ''"
        @click="navigateTo(card5.link)"
      >
        <v-card variant="outlined" class="rounded-xl border-slate-100 shadow-sm bg-white h-100 d-flex flex-column">
          <v-card-text class="pa-5 flex-grow-1 d-flex flex-column">
            <div class="d-flex align-items-center justify-space-between flex-grow-1">
              <div class="flex-grow-1">
                <h6 class="text-caption font-weight-bold text-slate-400 text-uppercase tracking-wider mb-1">{{ card5.name }}</h6>
                <h4 class="text-h4 d-flex align-center mb-0 font-weight-black text-slate-900">
                  {{ loading && card5.key !== 'uptime' ? '...' : (card5.key === 'uptime' ? card5.earn : (stats[card5.key as keyof typeof stats] || 0)) }}
                  <v-chip :color="card5.color" :border="`${card5.color} solid thin opacity-50`" class="ml-2" size="x-small" label variant="flat">
                    {{ card5.percent }}
                  </v-chip>
                </h4>
                <span class="text-slate-400 text-[10px] d-block mt-2 font-weight-bold uppercase tracking-widest opacity-80">
                  {{ card5.text }}
                </span>
              </div>
              <div class="bg-slate-50 pa-3 rounded-lg border border-slate-100 ml-4 align-self-start">
                <component :is="card5.icon" :style="{ fontSize: '18px', color: '#005daa' }" />
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
