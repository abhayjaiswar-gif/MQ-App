<template>
  <v-container fluid class="pa-6">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">Manage Highlights</h1>
        <p class="text-slate-500 text-sm mt-1">Upload and toggle the image cards displayed in the dashboard Swiper.</p>
      </div>
      <v-btn color="primary" class="rounded-xl px-6 h-12 shadow-md shadow-primary/20" @click="showModal = true">
        <span class="material-symbols-outlined mr-2">add_photo_alternate</span>
        New Highlight
      </v-btn>
    </div>

    <!-- Data Table -->
    <v-card class="rounded-[2rem] border border-slate-100 shadow-sm" variant="text">
      <v-table>
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left text-xs font-bold text-slate-400 uppercase tracking-widest pl-6">Preview</th>
              <th class="text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Details</th>
              <th class="text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
              <th class="text-right text-xs font-bold text-slate-400 uppercase tracking-widest pr-6">Actions</th>
            </tr>
          </thead>
          <tbody v-if="loading">
             <tr>
                <td colspan="4" class="text-center py-10">
                   <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </td>
             </tr>
          </tbody>
          <tbody v-else-if="highlights.length === 0">
             <tr>
                <td colspan="4" class="text-center py-16">
                   <div class="flex flex-col items-center">
                      <span class="material-symbols-outlined text-4xl text-slate-200 mb-3">imagesmode</span>
                      <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">No highlights available</p>
                   </div>
                </td>
             </tr>
          </tbody>
          <tbody v-else>
            <tr v-for="item in highlights" :key="item.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="pl-6 py-4 w-32">
                 <div class="w-24 h-16 rounded-xl overflow-hidden border border-slate-200">
                    <img :src="`http://localhost:3000/uploads/${item.image_path}`" class="w-full h-full object-cover" />
                 </div>
              </td>
              <td class="py-4">
                 <h4 class="font-bold text-slate-800">{{ item.title }}</h4>
                 <p class="text-xs text-slate-500">{{ item.tagline }} <span v-if="item.subtitle">• {{ item.subtitle }}</span></p>
              </td>
              <td class="py-4">
                 <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                      :class="item.category === 'Coach Achievement' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'">
                    <span class="material-symbols-outlined text-[14px]">
                       {{ item.category === 'Coach Achievement' ? 'workspace_premium' : 'event' }}
                    </span>
                    {{ item.category }}
                 </div>
              </td>
              <td class="text-right pr-6 py-4">
                <v-btn icon variant="text" color="error" size="small" @click="deleteItem(item.id)">
                  <span class="material-symbols-outlined">delete</span>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </v-table>
    </v-card>

    <!-- Create Modal -->
    <v-dialog v-model="showModal" max-width="500">
      <v-card class="rounded-[2.5rem] pa-8">
        <v-card-title class="px-0 pt-0 text-xl font-black text-slate-800 pb-6 flex justify-between items-center">
          Publish New Highlight
          <v-btn icon variant="text" size="small" @click="showModal = false">
             <span class="material-symbols-outlined text-slate-400">close</span>
          </v-btn>
        </v-card-title>
        <v-form @submit.prevent="saveItem" class="space-y-4">
          <v-select v-model="form.category" :items="['Event', 'Coach Achievement']" label="Category" variant="outlined" density="comfortable" class="rounded-xl custom-field"></v-select>
          <v-text-field v-model="form.tagline" label="Tagline (e.g. Next Major Match)" variant="outlined" density="comfortable" class="rounded-xl custom-field"></v-text-field>
          <v-text-field v-model="form.title" label="Main Title" variant="outlined" density="comfortable" required class="rounded-xl custom-field"></v-text-field>
          <v-text-field v-model="form.subtitle" label="Subtitle (e.g. Location • Date)" variant="outlined" density="comfortable" class="rounded-xl custom-field"></v-text-field>
          
          <v-text-field v-model="form.reel_url" label="OR Paste Reel / Video URL (YouTube, Instagram)" variant="outlined" density="comfortable" class="rounded-xl custom-field" placeholder="https://www.youtube.com/shorts/..."></v-text-field>

          <v-file-input v-model="fileInput" label="Upload Background Image (optional if reel URL given)" variant="outlined" density="comfortable" accept="image/*" prepend-icon="" prepend-inner-icon="add_photo_alternate" class="rounded-xl custom-field"></v-file-input>

          <v-btn type="submit" block color="primary" :loading="isSaving" class="h-12 rounded-xl mt-4 text-xs font-bold uppercase tracking-widest shadow-md">Publish Highlight</v-btn>
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const highlights = ref<any[]>([]);
const showModal = ref(false);
const loading = ref(true);
const isSaving = ref(false);

const form = ref({
  category: 'Event',
  tagline: '',
  title: '',
  subtitle: '',
  reel_url: ''
});
const fileInput = ref<File | null>(null);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/dashboard/highlights');
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

const saveItem = async () => {
  if (!fileInput.value && !form.value.reel_url) return alert('Either an image or a reel URL is required');
  isSaving.value = true;
  try {
    const formData = new FormData();
    if (fileInput.value) formData.append('image', fileInput.value);
    formData.append('category', form.value.category);
    formData.append('tagline', form.value.tagline);
    formData.append('title', form.value.title);
    formData.append('subtitle', form.value.subtitle);
    if (form.value.reel_url) formData.append('reel_url', form.value.reel_url);

    const res = await fetch('/api/dashboard/highlights', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      showModal.value = false;
      
      // reset form
      form.value = { category: 'Event', tagline: '', title: '', subtitle: '', reel_url: '' };
      fileInput.value = null;
      
      fetchData();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    console.error(err);
  } finally {
    isSaving.value = false;
  }
};

const deleteItem = async (id: number) => {
  if (!confirm('Are you sure you want to delete this highlight?')) return;
  try {
    await fetch(`/api/dashboard/highlights/${id}`, { method: 'DELETE' });
    fetchData();
  } catch (err) {
    console.error(err);
  }
};

onMounted(fetchData);
</script>

<style scoped>
.custom-field :deep(.v-field__outline) { border-radius: 12px !important; border-color: #f1f5f9 !important; }
.custom-field :deep(.v-field__input) { color: #1e293b !important; font-weight: 600 !important; font-size: 14px !important; }
</style>
