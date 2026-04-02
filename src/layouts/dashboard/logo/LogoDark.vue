<template>
  <div class="logo flex justify-center items-center w-full">
    <RouterLink to="/dashboard" aria-label="logo" style="text-decoration: none; display: flex; align-items: center; justify-content: center; width: 100%;">
      <img :src="logoUrl" alt="Marcosquay Logo" style="height: 55px; max-width: 100%; object-fit: contain;" />
    </RouterLink>
  </div>
</template>
<script setup lang="ts">
import { RouterLink } from 'vue-router';
import logoUrl from '@/assets/new_logo.png';
</script>
