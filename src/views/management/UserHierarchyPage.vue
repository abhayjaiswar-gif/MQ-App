<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

// State
const users = ref<any[]>([]);
const assignments = ref<Record<string, number[]>>({});
const selectedManagerId = ref<number | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const searchQuery = ref('');

// Computed
const managersList = computed(() => {
  return users.value
    .filter(u => u.is_active === 1)
    .sort((a, b) => a.name.localeCompare(b.name));
});

const subordinateList = computed(() => {
  if (!selectedManagerId.value) return [];
  return users.value
    .filter(u => u.id !== selectedManagerId.value && u.is_active === 1)
    .filter(u => {
      if (!searchQuery.value) return true;
      const term = searchQuery.value.toLowerCase();
      return u.name.toLowerCase().includes(term) || 
             u.email.toLowerCase().includes(term) || 
             (u.role_name && u.role_name.toLowerCase().includes(term));
    })
    .sort((a, b) => a.name.localeCompare(b.name));
});

// The list of subordinates currently assigned to the selected manager
const currentAssignments = ref<number[]>([]);

// Fetch Data
const fetchData = async () => {
  isLoading.value = true;
  try {
    const [usersRes, hierarchyRes] = await Promise.all([
      fetch('/api/users-list'),
      fetch('/api/user-hierarchy')
    ]);

    const usersData = await usersRes.json();
    const hierarchyData = await hierarchyRes.json();

    if (usersData.success) {
      users.value = usersData.users;
    }
    if (hierarchyData.success) {
      assignments.value = hierarchyData.assignments;
    }
  } catch (err) {
    console.error('Error fetching data:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

// Handlers
const onManagerSelect = () => {
  if (selectedManagerId.value && assignments.value[selectedManagerId.value]) {
    currentAssignments.value = [...assignments.value[selectedManagerId.value]];
  } else {
    currentAssignments.value = [];
  }
  searchQuery.value = '';
};

const toggleAssignment = (userId: number) => {
  const index = currentAssignments.value.indexOf(userId);
  if (index > -1) {
    currentAssignments.value.splice(index, 1);
  } else {
    currentAssignments.value.push(userId);
  }
};

const saveAssignments = async () => {
  if (!selectedManagerId.value) return;

  isSaving.value = true;
  try {
    const response = await fetch('/api/user-hierarchy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        manager_id: selectedManagerId.value,
        subordinate_ids: currentAssignments.value
      })
    });

    const data = await response.json();
    if (data.success) {
      // Update local state
      assignments.value[selectedManagerId.value] = [...currentAssignments.value];
      alert('Assignments saved successfully!');
    } else {
      alert('Failed to save assignments.');
    }
  } catch (error) {
    console.error('Error saving assignments:', error);
    alert('An error occurred while saving.');
  } finally {
    isSaving.value = false;
  }
};

const selectAll = () => {
  currentAssignments.value = subordinateList.value.map(u => u.id);
};

const deselectAll = () => {
  currentAssignments.value = [];
};
</script>

<template>
  <v-container fluid class="pa-6 max-w-[1200px] mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-black text-slate-800 tracking-tight">User Assignments</h1>
      <p class="text-slate-500 font-medium mt-2">
        Assign subordinate users to a manager. When the manager logs in, they will only see the activity of their assigned users.
      </p>
    </div>

    <v-row v-if="isLoading">
      <v-col cols="12" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4 text-slate-500 font-bold">Loading users...</p>
      </v-col>
    </v-row>

    <v-row v-else>
      <!-- Left Column: Manager Selection -->
      <v-col cols="12" md="4">
        <v-card class="rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-6">
          <div class="bg-slate-50 p-6 border-b border-slate-100">
            <h3 class="text-lg font-bold text-slate-800">1. Select Manager</h3>
            <p class="text-xs text-slate-500 mt-1">Choose the user who will act as the manager.</p>
          </div>
          <v-card-text class="pa-6">
            <v-autocomplete
              v-model="selectedManagerId"
              :items="managersList"
              item-title="name"
              item-value="id"
              label="Search or select a manager"
              variant="outlined"
              color="primary"
              hide-details
              @update:modelValue="onManagerSelect"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :title="item.raw.name" :subtitle="item.raw.role_name + ' • ' + item.raw.email">
                </v-list-item>
              </template>
            </v-autocomplete>
            
            <div v-if="selectedManagerId" class="mt-8">
              <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <div class="flex items-center gap-3 mb-2">
                  <v-avatar color="indigo" size="36">
                    <span class="text-white font-bold text-xs">{{ managersList.find(m => m.id === selectedManagerId)?.name[0] }}</span>
                  </v-avatar>
                  <div>
                    <p class="font-bold text-indigo-900 text-sm leading-tight">{{ managersList.find(m => m.id === selectedManagerId)?.name }}</p>
                    <p class="text-xs text-indigo-600">{{ managersList.find(m => m.id === selectedManagerId)?.role_name }}</p>
                  </div>
                </div>
                <div class="mt-4 pt-4 border-t border-indigo-100 flex justify-between items-center">
                  <span class="text-xs font-bold text-indigo-800">Assigned Users:</span>
                  <v-chip color="indigo" size="small" class="font-black">{{ currentAssignments.length }}</v-chip>
                </div>
              </div>

              <v-btn
                block
                color="primary"
                class="mt-6 rounded-xl font-bold tracking-wide"
                height="48"
                :loading="isSaving"
                @click="saveAssignments"
              >
                Save Assignments
              </v-btn>
            </div>
            <div v-else class="mt-8 text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <v-icon color="slate-300" size="48" class="mb-2">mdi-account-search</v-icon>
              <p class="text-sm font-medium text-slate-500">Please select a manager first.</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Column: Subordinate Assignment -->
      <v-col cols="12" md="8">
        <v-card class="rounded-2xl border border-slate-100 shadow-sm overflow-hidden" :disabled="!selectedManagerId">
          <div class="bg-slate-50 p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 class="text-lg font-bold text-slate-800">2. Assign Subordinates</h3>
              <p class="text-xs text-slate-500 mt-1">Select users to assign to this manager.</p>
            </div>
            <div class="w-full sm:w-64">
              <v-text-field
                v-model="searchQuery"
                prepend-inner-icon="mdi-magnify"
                label="Search users..."
                variant="outlined"
                density="compact"
                hide-details
                bg-color="white"
                :disabled="!selectedManagerId"
              ></v-text-field>
            </div>
          </div>
          
          <v-card-text class="pa-0">
            <div v-if="!selectedManagerId" class="text-center py-20 bg-slate-50/50">
               <v-icon color="slate-200" size="64" class="mb-4">mdi-account-multiple-outline</v-icon>
               <h3 class="text-slate-500 font-bold text-lg">Waiting for manager selection</h3>
               <p class="text-slate-400 text-sm">Select a manager from the left panel to begin assigning users.</p>
            </div>
            <div v-else>
              <div class="bg-white p-4 border-b border-slate-100 flex justify-between items-center">
                <span class="text-sm font-bold text-slate-600">
                  Showing {{ subordinateList.length }} users
                </span>
                <div class="space-x-2">
                  <v-btn variant="text" size="small" color="primary" class="font-bold" @click="selectAll">Select All</v-btn>
                  <v-btn variant="text" size="small" color="error" class="font-bold" @click="deselectAll">Clear</v-btn>
                </div>
              </div>

              <div class="max-h-[600px] overflow-y-auto p-4 bg-slate-50">
                <div v-if="subordinateList.length === 0" class="text-center py-12">
                  <p class="text-slate-500 font-medium">No users found matching your search.</p>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div 
                    v-for="user in subordinateList" 
                    :key="user.id"
                    @click="toggleAssignment(user.id)"
                    class="bg-white rounded-xl p-3 border transition-all cursor-pointer flex items-center gap-3 shadow-sm hover:shadow-md"
                    :class="currentAssignments.includes(user.id) ? 'border-primary ring-1 ring-primary' : 'border-slate-200'"
                  >
                    <v-checkbox-btn
                      :model-value="currentAssignments.includes(user.id)"
                      color="primary"
                      class="pointer-events-none"
                    ></v-checkbox-btn>
                    
                    <div class="overflow-hidden flex-1">
                      <h4 class="font-bold text-slate-800 text-sm truncate leading-tight">{{ user.name }}</h4>
                      <p class="text-xs text-slate-500 truncate">{{ user.role_name || 'No Role' }}</p>
                      <p class="text-[10px] text-slate-400 truncate mt-1">{{ user.email }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Custom scrollbar for the user list */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}
</style>
