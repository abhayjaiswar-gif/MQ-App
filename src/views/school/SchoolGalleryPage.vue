<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const defaultImage = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIIwsL-pbkbiNEWxbRRwgfXGFp_KSROv6DrQ&s';

const handleImageError = (event: Event) => {
  (event.target as HTMLImageElement).src = defaultImage;
};

const schools = ref<any[]>([]);
const availableSchools = ref<any[]>([]);
const loading = ref(true);
const showAddModal = ref(false);
const selectedSchoolId = ref<number | null>(null);

const fetchSchools = async () => {
  try {
    const response = await fetch(`/api/schools?hasGallery=true&user_id=${sessionStorage.getItem('id') || ''}`);
    const data = await response.json();
    if (data.success) {
      schools.value = data.schools.map((school: any) => ({
        ...school,
        type: Math.random() > 0.5 ? 'SECONDARY' : 'PRIMARY', // Mocked for design
        isPremium: Math.random() > 0.8, // Mocked for design
        needsReshoot: Math.random() > 0.9, // Mocked for design
        thumbnail: school.school_image
          ? `/uploads/${school.school_image}`
          : (school.logo_image ? `/uploads/${school.logo_image}` : getRandomPlaceholder(school.id))
      }));
    }
  } catch (error) {
    console.error('Error fetching schools for gallery:', error);
  } finally {
    loading.value = false;
  }
};

const fetchAvailableSchools = async () => {
  try {
    const response = await fetch(`/api/schools?hasGallery=false&user_id=${sessionStorage.getItem('id') || ''}`);
    const data = await response.json();
    if (data.success) {
      availableSchools.value = data.schools;
    }
  } catch (error) {
    console.error('Error fetching available schools:', error);
  }
};

const getRandomPlaceholder = (id: number) => {
  const placeholders = [
    'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1523050853023-8c2d2909f4f3?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1509062522246-3755997927d7?auto=format&fit=crop&q=80&w=800'
  ];
  return placeholders[id % placeholders.length];
};

const goToGallery = (id: number) => {
  router.push(`/school/gallery/${id}`);
};

const openAddModal = () => {
  fetchAvailableSchools();
  showAddModal.value = true;
};

const initializeGallery = () => {
  if (selectedSchoolId.value) {
    goToGallery(selectedSchoolId.value);
    showAddModal.value = false;
  }
};

onMounted(fetchSchools);

const stats = computed(() => {
  const total = schools.value.length;
  const totalMedia = schools.value.reduce((sum, s) => sum + (s.gallery_count || 0), 0);
  const totalMediaDisplay = totalMedia > 1000 ? (totalMedia / 1000).toFixed(1) + 'k' : totalMedia;

  return {
    total,
    totalMediaDisplay,
    activeShoots: Math.floor(total * 0.2) // Mocked
  };
});
</script>

<template>
  <div class="gallery-root text-on-surface min-h-screen relative overflow-x-hidden">

    <!-- Add School to Gallery Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-[9999] modal-overlay flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
        <div class="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
          <h3 class="text-xl font-extrabold text-slate-900 leading-tight">Start New Gallery</h3>
          <button @click="showAddModal = false" class="p-1 hover:bg-slate-50 rounded-full text-slate-400">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-8 space-y-6">
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-700 ml-1">Select School</label>
            <div class="relative">
              <select v-model="selectedSchoolId"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all">
                <option :value="null" disabled>Choose a school...</option>
                <option v-for="s in availableSchools" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
              <!-- <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span> -->
            </div>
          </div>
          <p class="text-xs text-on-surface-variant leading-relaxed">
            Select a school to initialize its photo archive. You'll be redirected to the gallery detail page to upload
            the first set of photos.
          </p>
        </div>
        <div class="px-8 py-6 bg-slate-50/50 flex items-center justify-end gap-3">
          <button @click="showAddModal = false"
            class="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
          <button @click="initializeGallery" :disabled="!selectedSchoolId"
            class="bg-primary text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
            Create Gallery
          </button>
        </div>
      </div>
    </div>

    <main class="gallery-content">
      <div class="p-2 max-w-[1400px] mx-auto">
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <nav class="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-2">
              <span>Dashboard</span>
              <span class="material-symbols-outlined text-[14px]">chevron_right</span>
              <span class="text-primary">Gallery</span>
            </nav>
            <h1 class="text-3xl font-extrabold text-on-surface tracking-tight">Active Galleries</h1>
            <p class="text-on-surface-variant mt-1">Institutions with photographic records in the system.</p>
          </div>
          <button @click="openAddModal"
            class="flex items-center gap-2 bg-gradient-to-v from-primary to-primary-container text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            <span class="material-symbols-outlined text-lg">add_circle</span>
            Add School to Gallery
          </button>
        </div>

        <!-- Dashboard Stats Tonal Layering -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">

          <!-- Active Galleries -->
          <div class="relative bg-white p-6 rounded-2xl flex flex-col shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div class="absolute bottom-0 left-0 w-full h-1.5 bg-primary rounded-b-2xl"></div>
            <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 font-headline">
              Active Galleries
            </span>
            <span class="text-3xl font-black text-primary font-headline">
              {{ stats.total }}
            </span>
          </div>

          <!-- Stored Photos -->
          <div class="relative bg-white p-6 rounded-2xl flex flex-col shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div class="absolute bottom-0 left-0 w-full h-1.5 bg-emerald-500 rounded-b-2xl"></div>
            <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 font-headline">
              Stored Photos
            </span>
            <span class="text-3xl font-black text-primary font-headline">
              {{ stats.totalMediaDisplay }}
            </span>
          </div>

        </div>

        <!-- Gallery Grid -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-on-surface-variant">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p class="font-bold tracking-widest uppercase text-xs">Loading Galleries...</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Dynamic School Card -->
          <div v-for="school in schools" :key="school.id"
            class="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-50 flex flex-col relative">
            <div class="absolute bottom-0 left-0 w-full h-1.5 bg-primary/20 group-hover:bg-primary transition-colors z-10"></div>
            
            <div class="h-52 overflow-hidden relative">
              <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                :src="school.thumbnail" :alt="school.name" @error="handleImageError" />
              <div v-if="school.isPremium"
                class="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-primary flex items-center gap-1 shadow-sm">
                <span class="material-symbols-outlined text-[12px]"
                  style="font-variation-settings: 'FILL' 1;">star</span>
                PREMIUM
              </div>
            </div>

            <div class="p-6 flex-1 flex flex-col pb-8">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h3 class="text-lg font-extrabold text-[#111827] font-headline group-hover:text-primary transition-colors">
                    {{ school.name }}
                  </h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="material-symbols-outlined text-sm text-on-surface-variant">photo_library</span>
                    <span class="text-sm font-medium text-on-surface-variant font-body">{{ (school.gallery_count ||
                      0).toLocaleString() }} Photos</span>
                  </div>
                </div>
                <span
                  class="bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider font-body border border-slate-100">
                  {{ school.type }}
                </span>
              </div>
              <div class="flex items-center gap-2 mt-auto">
                <button @click="goToGallery(school.id)"
                  class="flex-1 bg-slate-50 text-slate-600 font-bold text-xs py-3 rounded-xl hover:bg-primary hover:text-white transition-all font-body border border-slate-100">
                  Open Archive
                </button>
                <button
                  class="w-11 h-11 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100">
                  <span class="material-symbols-outlined text-xl">more_vert</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Add New School Initializer -->
          <button @click="openAddModal"
            class="group relative bg-white border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-primary/20 hover:bg-slate-50/30 transition-all duration-300 min-h-[400px]">
            <div
              class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-primary/5 transition-colors">
              <span
                class="material-symbols-outlined text-3xl text-slate-300 group-hover:text-primary">add_photo_alternate</span>
            </div>
            <h3 class="text-lg font-bold text-slate-900">Initialize New Gallery</h3>
            <p class="text-sm text-slate-400 text-center mt-2 max-w-[200px]">Create an archive for another partner
              institution.</p>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');

.gallery-root {
  --primary: #005daa;
  --primary-container: #0075d5;
  --on-surface: #1a1c1c;
  --on-surface-variant: #404753;
  --surface: #ffffff;

  font-family: 'Inter', sans-serif;
}

.modal-overlay {
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
}

.text-primary {
  color: var(--primary);
}

.bg-primary {
  background-color: var(--primary);
}

.text-on-surface-variant {
  color: var(--on-surface-variant);
}

h1,
h2,
h3,
.font-headline {
  font-family: 'Manrope', sans-serif;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.bg-gradient-to-v {
  background-image: linear-gradient(to bottom, var(--primary), var(--primary-container));
}
</style>
