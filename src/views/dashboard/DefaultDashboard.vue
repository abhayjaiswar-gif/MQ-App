<script setup lang="ts">
import WidgetFive from './components/WidgetFive.vue';
import SocialMediaHub from './components/SocialMediaHub.vue';
import RaiseTicketCard from './components/RaiseTicketCard.vue';
import StudentHighlights from './components/StudentHighlights.vue';
import MiniCalendar from './components/MiniCalendar.vue';
import HighlightSwiper from './components/HighlightSwiper.vue';
</script>
<template>
  <v-row class="mb-0">
    <v-col cols="12">
      <WidgetFive />
    </v-col>
  </v-row>

  <v-row>
    <!-- 🚀 MAIN CONTENT STREAM (Left Column) -->
    <v-col cols="12" md="8" class="space-y-6">
      <!-- Social Media & Activity Hub -->
      <SocialMediaHub />
      
      <!-- Students Highlight Swiper -->
      <StudentHighlights />
    </v-col>

    <!-- 📊 SIDEBAR CONTENT (Right Column) -->
    <v-col cols="12" md="4" class="space-y-6">
      <!-- Support & Ticketing -->
      <RaiseTicketCard />

      <!-- Miniature Academy Calendar -->
      <MiniCalendar />

      <!-- Highights Swiper -->
      <HighlightSwiper />
    </v-col>
  </v-row>
</template>
