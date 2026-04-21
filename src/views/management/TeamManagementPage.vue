<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useTeamStore } from '@/stores/teams';
import { storeToRefs } from 'pinia';

const teamStore = useTeamStore();
const { teams, loading } = storeToRefs(teamStore);

onMounted(() => {
  teamStore.fetchTeams();
});

const metrics = computed(() => {
  const uniqueSports = new Set(teams.value.map(t => t.sport)).size;
  return [
    { title: 'Total Teams', value: teamStore.totalTeams.toString(), change: '+4 this month', icon: 'groups', color: 'bg-primary/10', textColor: 'text-primary' },
    { title: 'Total Sports', value: uniqueSports.toString(), icon: 'sports_kabaddi', color: 'bg-secondary-container/30', textColor: 'text-secondary' },
    { title: 'Total Student-Athletes', value: teamStore.activeAthletes.toLocaleString(), icon: 'school', color: 'bg-tertiary-container/10', textColor: 'text-tertiary' }
  ];
});
</script>

<template>
  <div class="p-8 min-h-screen bg-surface">
    <!-- Dashboard Header -->
    <div class="flex justify-between items-end mb-10">
      <div>
        <h2 class="text-3xl font-extrabold text-on-surface tracking-tight mb-2 font-headline">Team Management</h2>
        <p class="text-on-surface-variant font-body">Overview and administration of all active athletic programs across institutions.</p>
      </div>
      <router-link to="/management/teams/add" class="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary-container transition-all shadow-xl shadow-primary/20 no-underline">
        <span class="material-symbols-outlined text-lg">add</span>
        <span>Create New Team</span>
      </router-link>
    </div>

    <!-- Bento Metric Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div v-for="metric in metrics" :key="metric.title" 
           class="bg-surface-container-lowest p-6 rounded-2xl flex flex-col justify-between h-40 shadow-sm border border-outline-variant/10">
        <div class="flex justify-between items-start">
          <div :class="['p-2 rounded-lg', metric.color]">
            <span class="material-symbols-outlined" :class="metric.textColor">{{ metric.icon }}</span>
          </div>
          <span v-if="metric.change" class="text-xs font-bold text-on-tertiary-fixed-variant bg-tertiary-fixed px-2 py-1 rounded-md">
            {{ metric.change }}
          </span>
        </div>
        <div>
          <p class="text-sm font-medium text-on-surface-variant mb-1 font-body">{{ metric.title }}</p>
          <h3 class="text-4xl font-extrabold text-on-surface font-headline">{{ metric.value }}</h3>
        </div>
      </div>
    </div>

    <!-- Data Table Container -->
    <div class="bg-surface-container-lowest rounded-[1.5rem] overflow-hidden shadow-sm border border-outline-variant/10">
      <div class="px-8 py-6 flex items-center justify-between border-b border-outline-variant/10">
        <h3 class="text-lg font-bold font-headline">Active Athletic Teams</h3>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse font-body">
          <thead>
            <tr class="bg-surface-container-low">
              <th class="px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Team Name</th>
              <th class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Sport</th>
              <th class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">School</th>
              <th class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Coach</th>
              <th class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Players</th>
              <th class="px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/10">
            <tr v-for="team in teams" :key="team.id" class="hover:bg-surface-bright transition-colors group">
              <td class="px-8 py-5">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center font-bold text-primary font-headline">
                    {{ team.short }}
                  </div>
                  <span class="font-bold text-on-surface">{{ team.name }}</span>
                </div>
              </td>
              <td class="px-6 py-5 text-on-surface-variant font-medium">{{ team.sport }}</td>
              <td class="px-6 py-5 text-on-surface-variant">{{ team.school }}</td>
              <td class="px-6 py-5">
                <div class="flex items-center gap-2">
                  <img :src="team.coach.avatar" class="w-6 h-6 rounded-full object-cover shadow-sm" alt="Coach Avatar">
                  <span class="text-sm font-medium">{{ team.coach.name }}</span>
                </div>
              </td>
              <td class="px-6 py-5 text-center font-bold">{{ team.players }}</td>
              <td class="px-8 py-5 text-right">
                <button class="p-1 hover:bg-surface-container rounded transition-colors opacity-0 group-hover:opacity-100">
                  <span class="material-symbols-outlined text-outline">more_vert</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="px-8 py-4 bg-surface-container-low flex justify-between items-center text-xs font-bold text-on-surface-variant border-t border-outline-variant/10">
        <span>Showing {{ teams.length }} of {{ teams.length }} teams</span>
        <div class="flex gap-4">
          <button class="hover:text-primary transition-colors disabled:opacity-30" disabled>Previous</button>
          <button class="hover:text-primary transition-colors disabled:opacity-30" disabled>Next</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-headline { font-family: 'Manrope', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
</style>
