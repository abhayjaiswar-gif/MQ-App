<script setup lang="ts">
import { ref } from 'vue';
import SupportDetailsModal from './SupportDetailsModal.vue';
const showModal = ref(false);
</script>
<template>
  <v-card variant="outlined" class="bg-surface rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-6"
    style="min-height: 260px;">
    <v-card-text class="pa-6 overflow-y-auto h-full flex flex-col justify-between">
      <!-- Header with Live Status and Avatars -->
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h5 class="text-h5 font-black text-slate-900 mb-0 leading-tight">Help & Support Chat</h5>
          </div>
        </div>
        <div class="d-flex align-center justify-center flex-wrap flex-row-reverse">
          <v-avatar size="36" variant="outlined" color="white" class="ml-n3 border-2 border-white shadow-sm">
            <img src="@/assets/images/users/avatar-4.png" width="36" alt="vector" />
          </v-avatar>
          <v-avatar size="36" variant="outlined" color="white" class="ml-n3 border-2 border-white shadow-sm">
            <img src="@/assets/images/users/avatar-3.png" width="36" alt="vector" />
          </v-avatar>
          <v-avatar size="36" variant="outlined" color="white" class="ml-n3 border-2 border-white shadow-sm">
            <img src="@/assets/images/users/avatar-2.png" width="36" alt="vector" />
          </v-avatar>
          <v-avatar size="36" variant="outlined" color="white" class="border-2 border-white shadow-sm">
            <img src="@/assets/images/users/avatar-1.png" width="36" alt="vector" />
          </v-avatar>
        </div>
      </div>
      <!-- Description -->
      <p class="text-xs text-slate-500 font-medium leading-relaxed mb-6">
        Connect with our success team for immediate assistance with curriculum, technical setups, or school
        coordination.
      </p>
      <!-- Action Buttons -->
      <div class="space-y-3">
        <v-btn color="primary" block variant="flat" size="large"
          class="rounded-xl font-black text-[12px] uppercase tracking-widest h-[52px]" @click="showModal = true">
          <span class="material-symbols-outlined mr-2">confirmation_number</span>
          Message Success Team
        </v-btn>
      </div>
    </v-card-text>
    <!-- Modal Integration -->
    <SupportDetailsModal v-model="showModal" />
  </v-card>
</template>
<style scoped>
.text-slate-900 {
  color: #0F172A !important;
}

.text-slate-400 {
  color: #94A3B8 !important;
}

.text-slate-500 {
  color: #64748B !important;
}

.tracking-wider {
  letter-spacing: 0.1em !important;
}

.tracking-widest {
  letter-spacing: 0.15em !important;
}

/* Custom Pulse Animation */
@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }

  50% {
    transform: scale(1);
    opacity: 1;
  }

  100% {
    transform: scale(0.95);
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
