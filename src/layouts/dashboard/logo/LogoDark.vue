<template>
  <div class="logo">
    <RouterLink to="/dashboard" aria-label="logo" style="text-decoration: none; display: flex; align-items: center;">
      <span style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px; font-family: 'Inter', system-ui, sans-serif;">
        <span :style="{ color: darkprimary }">Marcos</span><span :style="{ color: primary }">quay</span>
      </span>
    </RouterLink>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
const primary = ref('rgb(var(--v-theme-primary))');
const darkprimary = ref('rgb(var(--v-theme-darkprimary))');
</script>
