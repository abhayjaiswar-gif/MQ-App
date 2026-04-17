<template>
  <v-row>
    <v-col cols="12">
      <!-- Content Area -->
      <div class="px-2 lg:px-8 max-w-7xl mx-auto w-full mb-10">
        <div class="mb-10">
          <h2 class="text-3xl font-extrabold text-[#1a1c1c] tracking-tight mb-2 font-headline">User Permissions</h2>
          <p class="text-slate-500 font-medium">Manage sidebar module visibility and system access levels for staff.</p>
        </div>

        <!-- Mode Tabs -->
        <div class="flex gap-2 mb-8">
          <button @click="mode = 'user'" :class="mode === 'user' ? 'bg-[#005daa] text-white shadow-lg shadow-[#005daa]/20' : 'bg-white text-slate-600 border border-slate-200'" class="px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">person</span>
            Per User
          </button>
          <button @click="mode = 'role'" :class="mode === 'role' ? 'bg-[#005daa] text-white shadow-lg shadow-[#005daa]/20' : 'bg-white text-slate-600 border border-slate-200'" class="px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">badge</span>
            Per Role
          </button>
        </div>

        <!-- Bento Layout Container -->
        <div class="grid grid-cols-12 gap-8">
          
          <!-- Left Sidebar: Selection -->
          <section class="col-span-12 lg:col-span-4 space-y-8">
            <div class="bg-white rounded-xl p-8 shadow-sm border border-slate-100 relative">
              
              <!-- Loading Overlay -->
              <div v-if="loadingUsers" class="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl">
                 <div class="w-8 h-8 border-4 border-[#005daa] border-t-transparent rounded-full animate-spin"></div>
              </div>

              <!-- USER MODE -->
              <template v-if="mode === 'user'">
                <h3 class="text-lg font-bold mb-6 flex items-center gap-2 text-[#1a1c1c]">
                  <span class="material-symbols-outlined text-[#005daa]">person_search</span>
                  Select Staff Member
                </h3>
                <div class="space-y-4">
                  <div>
                    <label class="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 block">Personnel</label>
                    <div class="relative">
                      <select v-model="selectedUserId" @change="handleUserSelection" class="w-full bg-slate-50 border-none rounded-lg py-3 px-4 text-sm font-bold text-[#1a1c1c] focus:ring-2 focus:ring-[#005daa]/20 appearance-none">
                        <option value="" disabled>-- Select a user --</option>
                        <option v-for="user in users" :key="user.id" :value="user.id">
                          {{ user.name }} {{ user.role_name ? `- ${user.role_name}` : '' }}
                        </option>
                      </select>
                      <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
                    </div>
                  </div>
                </div>
              </template>

              <!-- ROLE MODE -->
              <template v-else>
                <h3 class="text-lg font-bold mb-6 flex items-center gap-2 text-[#1a1c1c]">
                  <span class="material-symbols-outlined text-[#005daa]">badge</span>
                  Select Role
                </h3>
                <div class="space-y-4">
                  <div>
                    <label class="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 block">System Role</label>
                    <div class="relative">
                      <select v-model="selectedRoleId" @change="handleRoleSelection" class="w-full bg-slate-50 border-none rounded-lg py-3 px-4 text-sm font-bold text-[#1a1c1c] focus:ring-2 focus:ring-[#005daa]/20 appearance-none">
                        <option value="" disabled>-- Select a role --</option>
                        <option v-for="role in rolesList" :key="role.id" :value="role.id">
                          {{ role.name }}
                        </option>
                      </select>
                      <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
                    </div>
                  </div>

                  <div v-if="selectedRoleId" class="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p class="text-[11px] text-[#005daa] font-semibold leading-relaxed">
                      <span class="material-symbols-outlined text-sm align-middle mr-1">info</span>
                      Pages assigned here will apply to <strong>all users</strong> with this role automatically.
                    </p>
                  </div>
                </div>
              </template>
            </div>

            <!-- Selected Info Card (User Mode) -->
            <div v-if="mode === 'user' && selectedUser" class="bg-[#005daa] rounded-xl p-8 text-white shadow-lg overflow-hidden relative">
              <div class="relative z-10">
                <div class="flex items-center gap-4 mb-6">
                  <div class="w-16 h-16 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center font-black text-2xl uppercase">
                     {{ selectedUser.name.substring(0, 2) }}
                  </div>
                  <div>
                    <h4 class="font-bold text-xl">{{ selectedUser.name }}</h4>
                    <p class="text-xs text-[#a5c8ff] opacity-90">{{ selectedUser.email }}</p>
                  </div>
                </div>
                <div class="space-y-3">
                  <div class="flex justify-between text-sm">
                    <span class="opacity-70">Role Group</span>
                    <span class="font-medium bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase">{{ selectedUser.role_name || 'Standard' }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="opacity-70">Granted Modules</span>
                    <span class="font-medium">{{ grantedCount }} Active</span>
                  </div>
                </div>
              </div>
              <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            <!-- Selected Info Card (Role Mode) -->
            <div v-if="mode === 'role' && selectedRoleObj" class="bg-gradient-to-br from-[#005daa] to-[#003d7a] rounded-xl p-8 text-white shadow-lg overflow-hidden relative">
              <div class="relative z-10">
                <div class="flex items-center gap-4 mb-6">
                  <div class="w-16 h-16 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center font-black text-2xl">
                     <span class="material-symbols-outlined text-3xl">badge</span>
                  </div>
                  <div>
                    <h4 class="font-bold text-xl">{{ selectedRoleObj.name }}</h4>
                    <p class="text-xs text-[#a5c8ff] opacity-90">Role-level permissions</p>
                  </div>
                </div>
                <div class="space-y-3">
                  <div class="flex justify-between text-sm">
                    <span class="opacity-70">Granted Modules</span>
                    <span class="font-medium">{{ grantedCount }} Active</span>
                  </div>
                </div>
              </div>
              <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            <div v-if="(mode === 'user' && !selectedUser) || (mode === 'role' && !selectedRoleObj)" class="bg-slate-100 rounded-xl p-8 text-center border border-dashed border-slate-300">
               <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">how_to_reg</span>
               <p class="text-sm font-bold text-slate-400">{{ mode === 'user' ? 'Select a staff member above to view and edit their access.' : 'Select a role above to configure its page permissions.' }}</p>
            </div>
          </section>

          <!-- Sidebar Access Control -->
          <section class="col-span-12 lg:col-span-8">
            <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
              
              <div v-if="loadingPermissions" class="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                 <div class="w-8 h-8 border-4 border-[#005daa] border-t-transparent rounded-full animate-spin"></div>
              </div>

              <div class="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 class="text-lg font-bold text-[#1a1c1c]">Sidebar Access Control</h3>
                  <p class="text-xs text-slate-400 font-medium tracking-wide">
                    {{ mode === 'user' ? 'Toggle individual dashboard visibility mapping.' : 'Configure which pages this role can access.' }}
                  </p>
                </div>
                <div class="flex gap-3">
                  <button @click="discardChanges" :disabled="!isAnythingSelected || isSaving" class="px-4 py-2 rounded-lg text-sm font-semibold text-[#005daa] bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50">Discard</button>
                  <button @click="savePermissions" :disabled="!isAnythingSelected || isSaving" class="px-6 py-2 rounded-lg text-sm font-bold bg-[#005daa] text-white hover:bg-[#004785] transition-transform active:scale-95 shadow-md shadow-[#005daa]/20 disabled:opacity-50 flex items-center gap-2">
                    <span v-if="isSaving" class="material-symbols-outlined animate-spin text-sm">sync</span>
                    Save Changes
                  </button>
                </div>
              </div>
              
              <div class="max-h-[600px] overflow-y-auto scrollbar-hide">
                <table class="w-full text-left border-collapse">
                  <thead class="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th class="px-8 py-4 text-[10px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-200">Module Name</th>
                      <th class="px-8 py-4 text-[10px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-200">Visibility Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    
                    <template v-for="(group, gIndex) in moduleGroups" :key="gIndex">
                      <tr class="bg-slate-50/50">
                        <td colspan="2" class="px-8 py-3 text-[10px] uppercase tracking-widest font-black text-slate-500 bg-slate-100/50">
                          {{ group.header }}
                        </td>
                      </tr>
                      
                      <tr v-for="module in group.items" :key="module.to" class="hover:bg-slate-50 transition-colors group/row">
                        <td class="px-8 py-5">
                          <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-[#005daa] group-hover/row:bg-white border border-slate-50 transition-colors">
                              <span class="material-symbols-outlined">{{ getIconString(module.icon) || 'api' }}</span>
                            </div>
                            <div>
                              <p class="font-bold text-sm text-[#1a1c1c]">{{ module.title }}</p>
                              <p class="text-[11px] text-slate-400 font-medium font-mono">{{ module.to }}</p>
                            </div>
                          </div>
                        </td>
                        <td class="px-8 py-5 text-right flex justify-start pl-8 items-center h-[80px]">
                          <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" :value="module.to" v-model="grantedRoutes" :disabled="!isAnythingSelected" class="sr-only peer"/>
                            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005daa] peer-disabled:opacity-50"></div>
                            <span class="ml-3 text-xs font-bold text-slate-500 uppercase tracking-widest w-16 text-left">
                               {{ grantedRoutes.includes(module.to) ? 'Granted' : 'Hidden' }}
                            </span>
                          </label>
                        </td>
                      </tr>
                    </template>
                    
                    <tr v-if="moduleGroups.length === 0">
                       <td colspan="2" class="p-8 text-center text-slate-400">Loading modules...</td>
                    </tr>
                    
                  </tbody>
                </table>
              </div>
              
              <div class="p-6 bg-slate-50/50 flex justify-end items-center gap-6 border-t border-slate-100">
                <span class="text-xs text-slate-500 font-medium">
                  <span class="font-bold text-[#005daa]">{{ grantedCount }} of {{ totalModules }}</span> modules currently enabled
                </span>
              </div>
            </div>
          </section>
          
        </div>
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import sidebarItem from '@/layouts/dashboard/vertical-sidebar/sidebarItem';

interface User {
  id: number;
  name: string;
  email: string;
  role_name: string | null;
  role_id: number;
}

interface RoleItem {
  id: number;
  name: string;
}

interface ModuleItem {
  title: string;
  to: string;
  icon: any;
}

interface ModuleGroup {
  header: string;
  items: ModuleItem[];
}

const mode = ref<'user' | 'role'>('role');
const users = ref<User[]>([]);
const rolesList = ref<RoleItem[]>([]);

const selectedUserId = ref<number | string>('');
const selectedRoleId = ref<number | string>('');

const grantedRoutes = ref<string[]>([]);
const originalGrantedRoutes = ref<string[]>([]);

const loadingUsers = ref(false);
const loadingPermissions = ref(false);
const isSaving = ref(false);

const moduleGroups = ref<ModuleGroup[]>([]);

const selectedUser = computed(() => {
  return users.value.find(u => u.id === selectedUserId.value) || null;
});

const selectedRoleObj = computed(() => {
  return rolesList.value.find(r => r.id === selectedRoleId.value) || null;
});

const isAnythingSelected = computed(() => {
  return mode.value === 'user' ? !!selectedUserId.value : !!selectedRoleId.value;
});

const totalModules = computed(() => {
  let count = 0;
  moduleGroups.value.forEach(g => count += g.items.length);
  return count;
});

const grantedCount = computed(() => {
  return grantedRoutes.value.length;
});

onMounted(async () => {
  parseSidebarItems();
  await fetchRoles();
  await fetchUsers();
});

const parseSidebarItems = () => {
  let currentHeader = 'General Modules';
  const groups: ModuleGroup[] = [];
  let currentGroupItems: ModuleItem[] = [];

  sidebarItem.forEach(item => {
    if (item.header) {
      if (currentGroupItems.length > 0) {
        groups.push({ header: currentHeader, items: currentGroupItems });
        currentGroupItems = [];
      }
      currentHeader = item.header;
    } else {
      if (item.to) {
        currentGroupItems.push({
           title: item.title || 'Unknown',
           to: item.to,
           icon: item.icon
        });
      }
      if (item.children) {
        item.children.forEach(child => {
           currentGroupItems.push({
             title: `${item.title} - ${child.title}`,
             to: child.to || '',
             icon: item.icon
           });
        });
      }
    }
  });
  
  if (currentGroupItems.length > 0) {
    groups.push({ header: currentHeader, items: currentGroupItems });
  }
  
  moduleGroups.value = groups;
};

const getIconString = (iconRef: any) => {
  if (!iconRef) return 'folder';
  const name = iconRef.name || iconRef.displayName || 'folder';
  
  const iconMap: Record<string, string> = {
    DashboardOutlined: 'dashboard',
    BankOutlined: 'account_balance',
    PictureOutlined: 'collections',
    FilePdfOutlined: 'description',
    TeamOutlined: 'group',
    UserOutlined: 'person',
    IdcardOutlined: 'badge',
    ShopOutlined: 'inventory_2',
    CheckCircleOutlined: 'check_circle',
    BookOutlined: 'menu_book'
  };
  
  return iconMap[name] || 'label';
};

const fetchRoles = async () => {
  try {
    const res = await fetch('/api/roles');
    const data = await res.json();
    if (data.success) {
      rolesList.value = data.roles;
    }
  } catch (err) {
    console.error('Fetch roles error:', err);
  }
};

const fetchUsers = async () => {
  loadingUsers.value = true;
  try {
    const res = await fetch('/api/access/users');
    const data = await res.json();
    if (data.success) {
      users.value = data.users;
    }
  } catch (err) {
    console.error('Fetch users error:', err);
  } finally {
    loadingUsers.value = false;
  }
};

const handleUserSelection = async () => {
  if (!selectedUserId.value) return;
  
  loadingPermissions.value = true;
  try {
    const res = await fetch(`/api/access/permissions/${selectedUserId.value}`);
    const data = await res.json();
    if (data.success) {
      const activeRoutes = data.permissions.filter((p: any) => p.is_granted).map((p: any) => p.route_path);
      grantedRoutes.value = [...activeRoutes];
      originalGrantedRoutes.value = [...activeRoutes];
    }
  } catch (err) {
    console.error('Fetch permissions error:', err);
    grantedRoutes.value = [];
  } finally {
    loadingPermissions.value = false;
  }
};

const handleRoleSelection = async () => {
  if (!selectedRoleId.value) return;

  loadingPermissions.value = true;
  try {
    const res = await fetch(`/api/access/role-permissions/${selectedRoleId.value}`);
    const data = await res.json();
    if (data.success) {
      const activeRoutes = data.permissions.filter((p: any) => p.is_granted).map((p: any) => p.route_path);
      grantedRoutes.value = [...activeRoutes];
      originalGrantedRoutes.value = [...activeRoutes];
    }
  } catch (err) {
    console.error('Fetch role permissions error:', err);
    grantedRoutes.value = [];
  } finally {
    loadingPermissions.value = false;
  }
};

const savePermissions = async () => {
   if (!isAnythingSelected.value) return;
   
   isSaving.value = true;
   try {
     const url = mode.value === 'user' ? '/api/access/permissions/save' : '/api/access/role-permissions/save';
     const body = mode.value === 'user' 
       ? { user_id: selectedUserId.value, permissions: grantedRoutes.value }
       : { role_id: selectedRoleId.value, permissions: grantedRoutes.value };

     const res = await fetch(url, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(body)
     });
     
     const data = await res.json();
     if (data.success) {
       alert(mode.value === 'user' ? 'User permissions updated successfully.' : 'Role permissions updated successfully. All users with this role will see these pages.');
       originalGrantedRoutes.value = [...grantedRoutes.value];
     } else {
       alert('Error saving permissions.');
     }
   } catch (err) {
     console.error('Save permissions error:', err);
     alert('Network error while saving.');
   } finally {
     isSaving.value = false;
   }
};

const discardChanges = () => {
  grantedRoutes.value = [...originalGrantedRoutes.value];
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap');

.font-headline {
  font-family: 'Manrope', sans-serif;
}

.scrollbar-hide::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-hide::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-hide::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 10px;
}
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
</style>
