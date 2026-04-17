<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCustomizerStore } from '../../../stores/customizer';
import { useAuthStore } from '@/stores/auth';
import sidebarItems from './sidebarItem';

import NavGroup from './NavGroup/NavGroup.vue';
import NavItem from './NavItem/NavItem.vue';
import NavCollapse from './NavCollapse/NavCollapse.vue';
import Logo from '../logo/LogoDark.vue';

const customizer = useCustomizerStore();
const authStore = useAuthStore();
const sidebarMenu = ref(sidebarItems);

onMounted(async () => {
  const userId = sessionStorage.getItem('id');
  const roleId = sessionStorage.getItem('role_id');
  
  if (!userId) return;
  if (roleId === '1') return; // Admin bypass

  try {
    const res = await fetch(`/api/access/effective-permissions/${userId}`);
    const data = await res.json();
    if (data.success && data.permissions.length > 0) {
      const allowedPaths = data.permissions.filter((p: any) => p.is_granted).map((p: any) => p.route_path);
      
      // Filter sidebar
      const filtered = sidebarItems.map(item => {
        if (item.children) {
          const filteredChildren = item.children.filter(child => allowedPaths.includes(child.to));
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
          return null; // Entire category hidden if no children allowed
        }
        
        if (item.to && !allowedPaths.includes(item.to)) {
           return null;
        }
        
        return item;
      }).filter(Boolean); // Remove nulls
      
      // Double check to remove blank headers
      const finalFilter = [];
      for (let i = 0; i < filtered.length; i++) {
        const current = filtered[i];
        if (current?.header) {
           // If the next item is also a header, or we are at the end, this header is empty
           const next = filtered[i+1];
           if (!next || next.header) {
             continue; // Skip this barren header
           }
        }
        finalFilter.push(current);
      }
      
      sidebarMenu.value = finalFilter as any;
    } else {
      // If they have no explicit permissions in the DB, show all pages by default
      sidebarMenu.value = sidebarItems;
    }
  } catch (err) {
    console.error('Failed to load permissions', err);
    sidebarMenu.value = sidebarItems; // Error fallback to show all
  }
});
</script>

<template>
  <v-navigation-drawer
    left
    v-model="customizer.Sidebar_drawer"
    elevation="0"
    rail-width="60"
    mobile-breakpoint="lg"
    app
    class="leftSidebar"
    :rail="customizer.mini_sidebar"
    expand-on-hover
  >
    <div>
      <Logo />
    </div>
    <!-- ---------------------------------------------- -->
    <!---Navigation -->
    <!-- ---------------------------------------------- -->
    <perfect-scrollbar class="scrollnavbar">
      <v-list aria-busy="true" aria-label="menu list">
        <!---Menu Loop -->
        <template v-for="(item, i) in sidebarMenu" :key="i">
          <!---Item Sub Header -->
          <NavGroup :item="item" v-if="item.header" :key="item.title" />
          <!---Item Divider -->
          <v-divider class="my-3" v-else-if="item.divider" />
          <!---If Has Child -->
          <NavCollapse class="leftPadding" :item="item" :level="0" v-else-if="item.children" />
          <!---Single Item-->
          <NavItem :item="item" v-else />
          <!---End Single Item-->
        </template>
      </v-list>
      <div class="pa-4">
        <!-- <ExtraBox /> -->
      </div>
    </perfect-scrollbar>

    <!-- Fixed Logout Button -->
    <template v-slot:append>
      <div class="pa-4 border-t border-slate-100">
        <v-btn
          block
          variant="tonal"
          color="error"
          rounded="lg"
          class="text-none font-weight-bold"
          @click="authStore.logout()"
        >
          <template v-slot:prepend>
            <span class="material-symbols-outlined text-lg">logout</span>
          </template>
          Logout
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>
