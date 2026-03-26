<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const schoolId = route.params.id;

const school = ref<any>(null);
const galleryItems = ref<any[]>([]);
const loading = ref(true);
const fileInput = ref<HTMLInputElement | null>(null);
const defaultImage = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIIwsL-pbkbiNEWxbRRwgfXGFp_KSROv6DrQ&s';

const handleImageError = (event: Event) => {
  (event.target as HTMLImageElement).src = defaultImage;
};

// Modal State
const showUploadModal = ref(false);
const selectedFiles = ref<File[]>([]);
const previews = ref<string[]>([]);
const uploadCategory = ref('Sports Day');
const uploadDescription = ref('');
const uploading = ref(false);

const fetchSchoolDetails = async () => {
  try {
    const response = await fetch(`http://localhost:3000/api/schools/${schoolId}`);
    const data = await response.json();
    if (data.success) {
      school.value = data.school;
    }
  } catch (error) {
    console.error('Error fetching school details:', error);
  }
};

const fetchGallery = async () => {
  try {
    const response = await fetch(`http://localhost:3000/api/school-gallery/${schoolId}`);
    const data = await response.json();
    if (data.success) {
      galleryItems.value = data.gallery;
    }
  } catch (error) {
    console.error('Error fetching gallery:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchSchoolDetails();
  fetchGallery();
});

const goBack = () => {
  router.push('/school/gallery');
};

// File Handling
const handleFileSelect = (event: any) => {
  const files = Array.from(event.target.files) as File[];
  addFiles(files);
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer?.files) {
    const files = Array.from(event.dataTransfer.files);
    addFiles(files);
  }
};

const addFiles = (files: File[]) => {
  files.forEach(file => {
    selectedFiles.value.push(file);
    previews.value.push(URL.createObjectURL(file));
  });
};

const removeFile = (index: number) => {
  URL.revokeObjectURL(previews.value[index]);
  selectedFiles.value.splice(index, 1);
  previews.value.splice(index, 1);
};

const clearAll = () => {
  previews.value.forEach(p => URL.revokeObjectURL(p));
  selectedFiles.value = [];
  previews.value = [];
};

const uploadPhotos = async () => {
  if (selectedFiles.value.length === 0) return;
  
  uploading.value = true;
  const formData = new FormData();
  selectedFiles.value.forEach(file => {
    formData.append('photos', file);
  });
  formData.append('category', uploadCategory.value);
  formData.append('description', uploadDescription.value);

  try {
    const response = await fetch(`http://localhost:3000/api/school-gallery/${schoolId}`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (data.success) {
      showUploadModal.value = false;
      clearAll();
      fetchGallery(); // Refresh gallery
    } else {
      alert('Upload failed: ' + data.message);
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('An error occurred during upload.');
  } finally {
    uploading.value = false;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const downloadMedia = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download error:', error);
    // Fallback to simple window.open if fetch fails (CORS etc)
    window.open(url, '_blank');
  }
};
</script>

<template>
  <div class="gallery-detail-root bg-surface text-on-surface min-h-screen relative overflow-x-hidden">
    
    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="fixed inset-0 z-[9999] modal-overlay flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
        <!-- Modal Header -->
        <div class="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 class="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">Upload Images</h3>
            <p class="text-sm text-on-surface-variant mt-1">Add new photos to {{ school?.name ||'School' }} Gallery</p>
          </div>
          <button @click="showUploadModal = false" class="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <!-- Modal Body -->
        <div class="p-8 overflow-y-auto custom-scrollbar space-y-8">
          <!-- Drag & Drop Area -->
          <div 
            @dragover.prevent 
            @drop.prevent="handleDrop"
            @click="fileInput?.click()"
            class="border-2 border-dashed border-primary/30 bg-primary/5 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/[0.08] transition-all group"
          >
            <div class="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">cloud_upload</span>
            </div>
            <div class="text-center">
              <p class="text-base font-bold text-slate-900 dark:text-white">Click to upload or drag and drop</p>
              <p class="text-sm text-on-surface-variant mt-1">PNG, JPG or JPEG (max. 10MB each)</p>
            </div>
            <input ref="fileInput" class="hidden" multiple type="file" @change="handleFileSelect" accept="image/*"/>
          </div>

          <!-- Category & Description Section -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Category</label>
              <div class="relative">
                <select v-model="uploadCategory" class="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all">
                  <option>Sports Day</option>
                  <option>Classroom</option>
                  <option>Annual Function</option>
                  <option>Campus Life</option>
                  <option>Academic Ceremonies</option>
                </select>
                <!-- <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span> -->
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Optional Description</label>
              <textarea v-model="uploadDescription" class="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all h-[46px] resize-none" placeholder="Brief details about the event..."></textarea>
            </div>
          </div>

          <!-- Selected Images Preview -->
          <div v-if="previews.length > 0" class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Selected Images ({{ previews.length }})</h4>
              <button @click="clearAll" class="text-xs font-bold text-primary hover:underline">Clear all</button>
            </div>
            <div class="grid grid-cols-4 gap-4">
              <div v-for="(src, idx) in previews" :key="idx" class="relative aspect-square rounded-xl overflow-hidden border border-slate-100 group">
                <img :src="src" class="w-full h-full object-cover" />
                <button @click="removeFile(idx)" class="absolute top-1.5 right-1.5 bg-black/50 hover:bg-error text-white p-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                  <span class="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-4">
          <button @click="showUploadModal = false" class="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
            Cancel
          </button>
          <button 
            @click="uploadPhotos" 
            :disabled="uploading || selectedFiles.length === 0"
            class="bg-primary text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {{ uploading ? 'Uploading...' : 'Upload All' }}
          </button>
        </div>
      </div>
    </div>

    <main class="gallery-content">
      <!-- Top Header -->
      <header class="bg-white sticky top-0 z-40 flex items-center justify-between px-8 py-4 w-full border-b border-slate-100">
        <div class="flex items-center gap-4">
          <button @click="goBack" class="p-2 hover:bg-slate-50 rounded-full transition-colors flex items-center gap-2 text-slate-500 group">
            <span class="material-symbols-outlined group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            <span class="text-sm font-medium">All Schools</span>
          </button>
        </div>
      </header>

      <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-on-surface-variant">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p class="font-bold tracking-widest uppercase text-xs">Loading Gallery...</p>
      </div>

      <template v-else-if="school">
        <section class="p-0">
          <!-- School Banner Section -->
          <div class="relative h-[300px] w-full mb-10 overflow-hidden group">
            <!-- Background Banner Image -->
            <img 
              v-if="school.school_image" 
              :src="`http://localhost:3000/uploads/${school.school_image}`" 
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              @error="handleImageError"
            />
            <div v-else class="w-full h-full bg-gradient-to-br from-primary/20 to-primary-container/20 flex items-center justify-center">
               <span class="material-symbols-outlined text-primary/10 text-[120px]">domain</span>
            </div>
            
            <!-- Gradient Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent"></div>

            <!-- School Info Floating on Banner -->
            <div class="absolute bottom-0 left-0 right-0 px-10 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div class="flex items-end gap-6">
                <!-- Logo / Initial Avatar -->
                <div class="hidden md:flex w-32 h-32 rounded-3xl bg-white shadow-2xl p-2 items-center justify-center border border-slate-50 relative -mb-6 z-10">
                  <img v-if="school.school_logo" :src="`http://localhost:3000/uploads/${school.school_logo}`" class="w-full h-full object-contain" @error="handleImageError" />
                  <span v-else class="text-4xl font-black text-primary">{{ school.name?.charAt(0) }}</span>
                </div>

                <div>
                  <nav class="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-widest">
                    <span>Schools</span>
                    <span class="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span class="text-primary">{{ school.name }}</span>
                  </nav>
                  <h2 class="text-4xl font-extrabold text-on-surface tracking-tight">{{ school.name }} Gallery</h2>
                  <p class="text-on-surface-variant mt-2 max-w-2xl font-medium">Visual archive of athletic events and campus life.</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="flex -space-x-2 mr-4">
                  <div class="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+{{ galleryItems.length }}</div>
                </div>
                <button @click="showUploadModal = true" class="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                  <span class="material-symbols-outlined text-[20px]">add_a_photo</span>
                  <span>Add Photos</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="px-10 py-0 pb-12">
            <!-- Action Bar -->
            <div class="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white shadow-sm">
              <div class="flex items-center gap-6">
                <div class="flex items-center gap-2 text-sm font-semibold text-primary">
                  <span class="material-symbols-outlined">filter_list</span>
                  <span>Filter By:</span>
                </div>
                <div class="flex items-center gap-2">
                  <select class="bg-transparent border-none text-sm font-medium focus:ring-0 text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
                    <option>All Categories</option>
                    <option>Athletics</option>
                    <option>Classroom</option>
                    <option>Events</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Photo Grid -->
            <div v-if="galleryItems.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <div v-for="item in galleryItems" :key="item.id" class="group relative aspect-square bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-0.5">
                <div class="w-full h-full rounded-[10px] overflow-hidden">
                  <img class="w-full h-full object-cover" :src="`http://localhost:3000/uploads/${item.file_path}`" :alt="item.caption" @error="handleImageError" />
                </div>
                <div class="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 m-0.5 rounded-[10px]">
                  <p class="text-slate-900 text-xs font-bold">{{ item.caption || 'Untitled' }}</p>
                  <p class="text-slate-500 text-[10px] font-medium">{{ formatDate(item.uploaded_at) }}</p>
                </div>
                <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <button 
                    @click="downloadMedia(`http://localhost:3000/uploads/${item.file_path}`, item.file_path)"
                    class="bg-white/90 backdrop-blur p-1.5 rounded-lg text-slate-700 hover:text-primary transition-colors shadow-sm"
                    title="Download Media"
                  >
                    <span class="material-symbols-outlined text-[18px]">download</span>
                  </button>
                  <button class="bg-white/90 backdrop-blur p-1.5 rounded-lg text-slate-700 hover:text-primary transition-colors shadow-sm">
                    <span class="material-symbols-outlined text-[18px]">more_vert</span>
                  </button>
                </div>
              </div>
              
              <div @click="showUploadModal = true" class="group relative aspect-square bg-white/50 rounded-xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center text-on-surface-variant hover:bg-white hover:border-primary transition-all cursor-pointer">
                <span class="material-symbols-outlined text-4xl mb-2">add</span>
                <span class="text-xs font-bold">Upload More</span>
              </div>
            </div>

            <div v-else class="text-center py-20 bg-white/50 rounded-2xl border-2 border-dashed border-slate-200">
              <span class="material-symbols-outlined text-4xl text-slate-300 mb-4">no_photography</span>
              <p class="text-on-surface-variant font-medium">No photos found for this school.</p>
              <button @click="showUploadModal = true" class="mt-4 text-primary font-bold hover:underline">Upload the first photo</button>
            </div>
        </section>
      </template>
      <div v-else class="text-center py-20 text-error font-bold">
        School not found.
      </div>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

.gallery-detail-root {
  --surface-variant: #e2e2e2;
  --error: #ba1a1a;
  --primary-container: #0075d5;
  --on-surface: #1a1c1c;
  --on-surface-variant: #404753;
  --surface: #f9f9f9;
  --surface-container-lowest: #ffffff;
  --surface-container-low: #f3f3f3;
  --primary: #005daa;
  --outline: #707785;
  --outline-variant: #c0c7d6;

  font-family: 'Inter', sans-serif;
}

.modal-overlay { background-color: rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px); }

.bg-surface { background-color: var(--surface); }
.text-on-surface { color: var(--on-surface); }
.text-on-surface-variant { color: var(--on-surface-variant); }
.text-primary { color: var(--primary); }
.bg-primary { background-color: var(--primary); }
.bg-primary\/5 { background-color: rgba(0, 93, 170, 0.05); }
.border-primary\/30 { border-color: rgba(0, 93, 170, 0.3); }
.hover\:bg-primary\/\[0\.08\]:hover { background-color: rgba(0, 93, 170, 0.08); }
.text-outline { color: var(--outline); }

h2, h3, .font-headline {
  font-family: 'Manrope', sans-serif;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.bg-gradient-to-t {
  background-image: linear-gradient(to top, rgba(0,0,0,0.6), transparent, transparent);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
