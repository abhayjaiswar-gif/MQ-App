<template>
  <v-card class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden" height="100%" variant="text">
    <v-card-text class="pa-6 pb-0 flex flex-col h-full relative">
      <!-- 🎬 Header & Admin Link -->
      <div class="flex items-center justify-between mb-4 shrink-0">
        <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <span class="material-symbols-outlined text-[16px] text-primary">campaign</span>
          Live Highlights
        </h3>
        <v-btn icon size="x-small" color="primary" variant="tonal" class="rounded-lg" to="/manage-highlights">
          <span class="material-symbols-outlined text-xs">edit</span>
        </v-btn>
      </div>

      <!-- 🖼️ Swiper Carousel -->
      <div class="flex-grow flex flex-col">
        <div v-if="loading" class="flex items-center justify-center h-48 bg-slate-50 rounded-xl animate-pulse">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        
        <div v-else-if="highlights.length === 0" class="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-xl border border-dashed border-slate-200">
           <span class="material-symbols-outlined text-3xl text-slate-300 mb-2">image_not_supported</span>
           <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Highlights Found</span>
        </div>

        <v-carousel v-else 
          cycle 
          hide-delimiters 
          :show-arrows="false" 
          height="28rem" 
          class="rounded-xl overflow-hidden shadow-sm"
        >
          <v-carousel-item v-for="(item, i) in highlights" :key="i">
            <div class="relative w-full h-full group cursor-pointer" @click="openUrl(item.reel_url)">
              <!-- Background Image / Thumbnail -->
              <img :src="`http://localhost:3000/uploads/${item.image_path}`"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                :alt="item.title" />

              <!-- Content Gradient Overlay -->
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent flex flex-col justify-end p-5 transition-opacity duration-300 pointer-events-none">
                <!-- Play Icon for Reels -->
                <div v-if="item.reel_url" class="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30 flex items-center justify-center animate-pulse">
                   <span class="material-symbols-outlined text-white text-lg">play_arrow</span>
                </div>

                <div v-if="item.category === 'Coach Achievement'" class="absolute top-4 right-4 bg-amber-500/90 text-white px-2 py-1 rounded border border-amber-400/50 flex items-center gap-1 shadow-lg backdrop-blur-sm">
                   <span class="material-symbols-outlined text-[10px]">workspace_premium</span>
                   <span class="text-[8px] font-black uppercase tracking-widest">Achievement</span>
                </div>
                <p class="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em] mb-0.5">{{ item.tagline }}</p>
                <h4 class="text-white font-black text-xl leading-tight mb-1">{{ item.title }}</h4>
                <p class="text-white/80 text-xs font-medium flex items-center gap-1">
                   <span v-if="item.category !== 'Coach Achievement'" class="material-symbols-outlined text-[12px]">calendar_month</span>
                   {{ item.subtitle }}
                </p>
              </div>
            </div>
          </v-carousel-item>
         </v-carousel>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const highlights = ref<any[]>([]);
const loading = ref(true);

const fetchHighlights = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/dashboard/highlights');
    const data = await res.json();
    if (data.success) {
      highlights.value = data.data;
    }
  } catch (err) {
    console.error('Error fetching highlights:', err);
  } finally {
    loading.value = false;
  }
};

const openUrl = (url: string) => {
  if (url) window.open(url, '_blank');
};

onMounted(() => {
  fetchHighlights();
});
</script>

<style scoped>
.tracking-widest { letter-spacing: 0.2em !important; }
</style>
