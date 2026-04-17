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
      <div ref="scrollContainer" class="flex overflow-x-auto gap-8 no-scrollbar pb-10 scroll-smooth px-1">
        <div v-for="item in highlights" :key="item.id" 
             @click="openUrl(item.url)"
             class="relative w-full min-w-full md:min-w-0 aspect-[16/9] rounded-[3rem] overflow-hidden group cursor-pointer shadow-2xl transition-all duration-700 hover:-translate-y-2 flex-shrink-0">
          
          <!-- Background Image (Base Path Fix) -->
          <v-img :src="'/Mantis-Vue' + item.image" cover class="absolute inset-0 w-full h-full transition-transform duration-1000 group-hover:scale-105">
            <template v-slot:placeholder>
              <div class="flex items-center justify-center h-full bg-slate-100 animate-pulse">
                <span class="material-symbols-outlined text-slate-200 text-6xl">image</span>
              </div>
            </template>
          </v-img>

          <!-- Deep Cinematic Overlays -->
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
          
          <!-- Content Stuck to Bottom -->
          <div class="absolute inset-x-0 bottom-0 p-8 md:p-12">
            <div class="translate-y-6 group-hover:translate-y-0 transition-all duration-700">
              <v-chip size="small" class="mb-4 px-4 rounded-xl font-black bg-amber-400 text-white border-none uppercase tracking-widest text-[10px]">
                {{ item.badge }}
              </v-chip>
              <h4 class="text-2xl md:text-4xl font-black text-white leading-tight mb-2 drop-shadow-2xl">
                {{ item.name }}
              </h4>
              <p class="text-white/80 text-sm md:text-lg font-medium leading-relaxed max-w-[90%] line-clamp-2 drop-shadow-xl">
                {{ item.achievement }}
              </p>
            </div>

            <div class="mt-6 flex items-center justify-space-between pt-6 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200">
              <div class="flex items-center gap-3">
                <v-avatar size="28" class="border-2 border-white/20">
                   <v-img :src="item.avatar"></v-img>
                </v-avatar>
                <span class="text-[9px] font-black text-white/60 uppercase tracking-widest tracking-tighter">{{ item.school }}</span>
              </div>
              <div class="flex items-center gap-2 text-white/50 group-hover:text-amber-400 transition-colors">
                 <span class="text-[9px] font-black uppercase tracking-widest">Detail View</span>
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
import { ref } from 'vue';

const scrollContainer = ref<HTMLElement | null>(null);

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

const highlights = ref([
  {
    id: 1,
    name: 'Aaryan Sharma',
    image: '/student_h1.png',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aaryan',
    badge: 'Regional Champion',
    achievement: 'Represented state in U-14 National Basketball championship, scoring 22 points in final.',
    school: 'Greenwood International',
    url: '#'
  },
  {
    id: 2,
    name: 'Sarah Joseph',
    image: '/student_h2.png',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    badge: 'Rising Star',
    achievement: 'Achieved first place in Inter-School 100m sprint with a record time of 12.8 seconds.',
    school: 'Mount St. Mary',
    url: '#'
  },
  {
    id: 3,
    name: 'Kabir Verma',
    image: '/student_h3.png',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kabir',
    badge: 'Versatile Athlete',
    achievement: 'Won the "Best All-Rounder" award across Football and Cricket during the annual sports meet.',
    school: 'Oakridge Academy',
    url: '#'
  }
]);
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
