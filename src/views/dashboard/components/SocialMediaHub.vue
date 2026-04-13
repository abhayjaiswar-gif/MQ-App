<template>
  <v-card class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col mb-6" variant="text" style="min-height: 500px;">
    <v-card-item class="pb-2 px-6 pt-6">
      <div class="d-flex justify-space-between align-center">
        <div>
          <v-card-title class="text-h5 font-weight-black text-slate-900 mb-0">Social Media & Activity Hub</v-card-title>
          <span class="text-caption text-slate-400 font-weight-bold uppercase tracking-wider">Latest Instagram Reels & School Moments</span>
        </div>
        <div class="flex gap-2">
          <v-btn icon variant="tonal" density="comfortable" class="rounded-lg text-slate-400 bg-slate-50 border border-slate-100">
            <span class="material-symbols-outlined text-sm">more_horiz</span>
          </v-btn>
        </div>
      </div>
    </v-card-item>

    <v-card-text class="pa-6">
      <!-- 🎬 Instagram Videos Grid -->
      <div class="mb-8">
        <div class="flex items-center gap-2 mb-4">
          <span class="material-symbols-outlined text-[#E1306C] text-lg font-bold">video_library</span>
          <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Reels</h3>
        </div>
        
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <template v-if="content.videos && content.videos.length">
            <div v-for="video in content.videos" :key="video.id" 
                 @click="openUrl(video.url)"
                 class="relative aspect-[9/16] bg-slate-100 rounded-2xl overflow-hidden group cursor-pointer border border-slate-50">
              
              <!-- Native Video Player (Autoplay) -->
              <template v-if="video.video_path">
                <video 
                  :src="'/uploads/' + video.video_path"
                  autoplay
                  muted
                  loop
                  playsinline
                  class="absolute inset-0 w-full h-full object-cover"
                ></video>
              </template>

              <!-- Thumbnail Fallback -->
              <template v-else>
                <img :src="video.thumbnail_url?.startsWith('http') ? video.thumbnail_url : '/uploads/' + video.thumbnail_url" 
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </template>
              
              <div class="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-all flex flex-col justify-end p-4">
                <div class="flex items-center gap-2 mb-1">
                  <span class="material-symbols-outlined text-white text-md">play_circle</span>
                  <span class="text-white text-[10px] font-bold truncate">{{ video.title }}</span>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <!-- Premium Placeholders -->
            <div v-for="i in 4" :key="i" class="relative aspect-[9/16] bg-slate-100 rounded-2xl overflow-hidden group cursor-pointer border border-slate-50 shadow-inner animate-pulse">
               <div class="absolute inset-0 flex items-center justify-center">
                  <span class="material-symbols-outlined text-slate-300 text-3xl">play_arrow</span>
               </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 🖼️ School Activity Photos -->
      <div>
        <div class="flex items-center gap-2 mb-4">
          <span class="material-symbols-outlined text-[#1890FF] text-lg font-bold">photo_camera</span>
          <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">School Snapshots</h3>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <template v-if="content.photos && content.photos.length">
            <div v-for="photo in content.photos" :key="photo.id" 
                 @click="openUrl(photo.url)"
                 class="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden group cursor-pointer border border-slate-50">
              <img :src="photo.thumbnail_url?.startsWith('http') ? photo.thumbnail_url : '/uploads/' + photo.thumbnail_url" 
                   class="w-full h-full object-cover transition-all duration-300 group-hover:scale-105" />
              <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p class="text-[9px] text-white font-black uppercase tracking-widest">{{ photo.title || 'Academy' }}</p>
              </div>
            </div>
          </template>
          <template v-else>
            <div v-for="i in 8" :key="i" class="aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
               <span class="material-symbols-outlined text-slate-200">image</span>
            </div>
          </template>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const loading = ref(true);
const content = ref<any>({
  videos: [],
  photos: []
});

const fetchContent = async () => {
  loading.value = true;
  try {
    const userId = sessionStorage.getItem('id') || '';
    const res = await fetch(`/api/dashboard/content-feed?user_id=${userId}`);
    const data = await res.json();
    if (data.success) {
      content.value = data.data;
    }
  } catch (err) {
    console.error('Gallery fetch error:', err);
  } finally {
    loading.value = false;
  }
};

const openUrl = (url: string) => {
  if (url) window.open(url, '_blank');
};

onMounted(() => {
  fetchContent();
});
</script>

<style scoped>
.text-slate-900 { color: #0F172A !important; }
.text-slate-400 { color: #94A3B8 !important; }
.tracking-wider { letter-spacing: 0.1em !important; }
</style>
