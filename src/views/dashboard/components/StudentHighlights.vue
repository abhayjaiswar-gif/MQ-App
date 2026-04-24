<template>
  <v-card class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden" variant="text">
    <v-card-item class="pa-10">
      <div class="d-flex justify-space-between align-center mb-10">
        <div>
          <v-card-title class="text-h4 font-black text-slate-900 mb-0">Students Highlight</v-card-title>
          <span class="text-caption text-slate-400 font-bold uppercase tracking-widest">Champions of Marcos Quay Academy</span>
        </div>
        <div class="flex gap-3">
           <v-btn icon variant="tonal" size="small" class="rounded-xl bg-slate-50 text-slate-400 border border-slate-100" @click="scroll('left')">
             <span class="material-symbols-outlined text-sm">arrow_back_ios</span>
           </v-btn>
           <v-btn icon variant="tonal" size="small" class="rounded-xl bg-slate-50 text-slate-400 border border-slate-100" @click="scroll('right')">
             <span class="material-symbols-outlined text-sm">arrow_forward_ios</span>
           </v-btn>
        </div>
      </div>

      <!-- 🏆 Jumbo Highlights Swiper -->
      <div v-if="loading" class="flex items-center justify-center h-64 bg-slate-50 rounded-[3rem]">
         <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>

      <div v-else-if="highlights.length === 0" class="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
         <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">imagesmode</span>
         <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">No Highlights Found</p>
      </div>

      <div v-else ref="scrollContainer" class="flex overflow-x-auto gap-8 no-scrollbar pb-10 scroll-smooth px-1">
        <div v-for="item in highlights" :key="item.id" 
             @click="openUrl(item.reel_url)"
             class="relative w-full min-w-full md:min-w-0 aspect-[16/9] rounded-[3rem] overflow-hidden group cursor-pointer shadow-2xl transition-all duration-700 hover:-translate-y-2 flex-shrink-0">
          
          <!-- Background Image -->
          <img v-if="item.image_path" :src="`http://localhost:3000/uploads/${item.image_path}`" class="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
          <div v-else class="absolute inset-0 w-full h-full bg-slate-200 flex items-center justify-center">
             <span class="material-symbols-outlined text-slate-400 text-6xl">play_circle</span>
          </div>

          <!-- Deep Cinematic Overlays -->
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
          
          <!-- Content Stuck to Bottom -->
          <div class="absolute inset-x-0 bottom-0 p-8 md:p-12">
            <div class="translate-y-6 group-hover:translate-y-0 transition-all duration-700">
              <v-chip size="small" class="mb-4 px-4 rounded-xl font-black bg-amber-400 text-white border-none uppercase tracking-widest text-[10px]">
                {{ item.category }}
              </v-chip>
              <h4 class="text-2xl md:text-4xl font-black text-white leading-tight mb-2 drop-shadow-2xl">
                {{ item.title }}
              </h4>
              <p class="text-white/80 text-sm md:text-lg font-medium leading-relaxed max-w-[90%] line-clamp-2 drop-shadow-xl">
                {{ item.tagline }} {{ item.subtitle ? '• ' + item.subtitle : '' }}
              </p>
            </div>

            <div class="mt-6 flex items-center justify-space-between pt-6 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200">
              <div class="flex items-center gap-3">
                <v-avatar size="28" class="border-2 border-white/20 bg-white/10">
                   <span class="material-symbols-outlined text-white text-xs">school</span>
                </v-avatar>
                <span class="text-[9px] font-black text-white/60 uppercase tracking-widest tracking-tighter">{{ item.school_name || 'Global Academy' }}</span>
              </div>
              <div class="flex items-center gap-2 text-white/50 group-hover:text-amber-400 transition-colors">
                 <span class="text-[9px] font-black uppercase tracking-widest">{{ item.reel_url ? 'Watch Reel' : 'View Detail' }}</span>
                 <span class="material-symbols-outlined text-lg">trending_flat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card-item>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const scrollContainer = ref<HTMLElement | null>(null);
const highlights = ref<any[]>([]);
const loading = ref(true);

const scroll = (direction: 'left' | 'right') => {
  if (!scrollContainer.value) return;
  const scrollAmount = scrollContainer.value.clientWidth;
  scrollContainer.value.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth'
  });
};

const openUrl = (url: string) => {
  if (url) window.open(url, '_blank');
};

const fetchData = async () => {
  loading.value = true;
  try {
    const schoolId = sessionStorage.getItem('school_id');
    const url = schoolId ? `/api/dashboard/highlights?school_id=${schoolId}` : '/api/dashboard/highlights';
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      highlights.value = data.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.text-slate-900 { color: #0F172A !important; }
.text-slate-400 { color: #94A3B8 !important; }

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.tracking-widest { letter-spacing: 0.15em !important; }

/* Custom Line Clamp for description */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
