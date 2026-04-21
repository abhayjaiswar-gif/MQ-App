import { defineStore } from 'pinia';

interface Coach {
  name: string;
  avatar: string;
}

interface Team {
  id: number;
  name: string;
  short: string;
  sport: string;
  school: string;
  coach: Coach;
  players: number;
  status: string;
  statusClass: string;
}

export const useTeamStore = defineStore('teams', {
  state: () => ({
    teams: [] as Team[],
    loading: false
  }),
  actions: {
    async fetchTeams() {
      this.loading = true;
      try {
        const response = await fetch('/api/teams');
        const data = await response.json();
        if (data.success) {
          this.teams = data.teams.map((t: any) => ({
            id: t.id,
            name: t.name,
            short: t.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
            sport: t.sport || 'General',
            school: t.school_name || 'Generic School',
            coach: { 
              name: t.coach_name || 'TBD', 
              avatar: t.coach_avatar ? `/uploads/${t.coach_avatar}` : 'https://lh3.googleusercontent.com/aida-public/AB6AXuDY3HqNbqHJh6Rh_9i-xoXXvCOVwEaBem7-kqLBwi9mFHB5rUT_9mWhq5XbYIqPnONaXz4F8mjN3K7S6ztTFAgqzaJHR_sSb4AbImxZ4t5AhTwoI9WD4EE-GbNTQOMmCrgYdPUzuQtFLn8uJKB532q4rLYbKbb9iYP8ANQBl0SHUCrd_YN8ETePNSwniDoXfdUsYeIReTqU112I-ymg3QwBKwjdv2QOGSRebCJEy_NvIqUDV0uauKenLlTorkW8gwswllbx14TnSc6q'
            },
            players: t.players_count || 0,
            status: t.status || 'Preparation',
            statusClass: this.getStatusClass(t.status || 'Preparation')
          }));
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
      } finally {
        this.loading = false;
      }
    },
    async addTeam(team: { name: string; sport: string; school_id: string; coach_id: string; description?: string; roster?: any[] }) {
      try {
        const response = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...team,
            status: 'Preparation'
          })
        });
        const data = await response.json();
        if (data.success) {
          await this.fetchTeams(); // Reload list to get fresh data with joins
          return true;
        }
        return false;
      } catch (err) {
        console.error('Error adding team:', err);
        return false;
      }
    },
    getStatusClass(status: string) {
      switch (status) {
        case 'In-Season': return 'bg-emerald-100 text-emerald-800';
        case 'Training': return 'bg-secondary-container text-on-secondary-container';
        case 'Off-Season': return 'bg-tertiary-container/20 text-on-tertiary-fixed-variant';
        case 'Preparation': return 'bg-surface-container text-on-surface-variant';
        default: return 'bg-surface-container text-on-surface-variant';
      }
    }
  },
  getters: {
    totalTeams: (state) => state.teams.length,
    activeAthletes: (state) => state.teams.reduce((acc, t) => acc + t.players, 0)
  }
});
