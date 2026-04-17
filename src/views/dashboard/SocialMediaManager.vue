<template>
  <div class="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
    <!-- Header -->
    <header class="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Social Hub Manager</h1>
        <p class="text-slate-500 font-medium text-sm">Add and manage Instagram videos and school photos for the main dashboard</p>
      </div>
      <v-btn @click="showAddDialog = true" color="primary" size="large" class="rounded-xl px-8 shadow-lg font-black text-[11px] uppercase tracking-widest">
        <span class="material-symbols-outlined mr-2">add_circle</span>
        Add New Content
      </v-btn>
    </header>

    <!-- Stats Summary -->
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div v-for="stat in summaryStats" :key="stat.label" class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ stat.label }}</p>
          <h2 class="text-2xl font-black text-slate-900">{{ stat.value }}</h2>
        </div>
        <div :class="stat.bg" class="w-12 h-12 rounded-2xl flex items-center justify-center">
          <span class="material-symbols-outlined" :class="stat.color">{{ stat.icon }}</span>
        </div>
      </div>
    </div>

    <!-- Content Table -->
    <div class="max-w-7xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      <div v-if="loading" class="py-40 flex flex-col items-center gap-4">
        <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Syncing Media...</p>
      </div>
 
       <div v-else-if="items.length" class="overflow-x-auto">
         <table class="w-full text-left">
           <thead>
             <tr class="bg-slate-50">
               <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
               <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Preview & Title</th>
               <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned School</th>
               <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">URL / Source</th>
               <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Dashboard Status</th>
               <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
             </tr>
           </thead>
           <tbody class="divide-y divide-slate-50">
             <tr v-for="item in items" :key="item.id" class="hover:bg-slate-50/50 transition-all">
               <td class="px-8 py-6">
                 <span :class="item.content_type === 'video' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'" 
                       class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border">
                   {{ item.content_type }}
                 </span>
               </td>
               <td class="px-8 py-6">
                 <div class="flex items-center gap-4">
                   <div class="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 flex items-center justify-center relative">
                     <img v-if="item.thumbnail_url" :src="item.thumbnail_url?.startsWith('http') ? item.thumbnail_url : '/uploads/' + item.thumbnail_url" class="w-full h-full object-cover">
                     <div v-if="item.video_path" class="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span class="material-symbols-outlined text-white text-xs">videocam</span>
                     </div>
                   </div>
                   <span class="text-sm font-black text-slate-800">{{ item.title || 'Untitled' }}</span>
                 </div>
               </td>
               <td class="px-8 py-6">
                 <span v-if="item.school_name" class="text-[10px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                    {{ item.school_name }}
                 </span>
                 <span v-else class="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">
                    Global (All Schools)
                 </span>
               </td>
               <td class="px-8 py-6">
                 <p class="text-[10px] text-slate-500 italic max-w-xs truncate">{{ item.url }}</p>
               </td>
               <td class="px-8 py-6 text-center">
                 <v-switch v-model="item.is_active" :true-value="1" :false-value="0" @change="toggleStatus(item)" hide-details color="primary" density="compact" class="d-inline-flex"></v-switch>
               </td>
               <td class="px-8 py-6 text-right">
                 <v-btn icon variant="text" color="error" @click="deleteItem(item.id)">
                   <span class="material-symbols-outlined text-md">delete</span>
                 </v-btn>
               </td>
             </tr>
           </tbody>
         </table>
       </div>
 
       <!-- Empty State -->
       <div v-else class="py-40 text-center">
         <span class="material-symbols-outlined text-6xl text-slate-200 mb-4 block">movie_filter</span>
         <p class="text-slate-400 font-bold text-sm uppercase tracking-widest">No content managed yet</p>
       </div>
    </div>
 
    <!-- Add Dialog -->
    <v-dialog v-model="showAddDialog" max-width="600">
      <v-card class="rounded-[2.5rem] pa-8 bg-white border border-slate-100">
        <v-card-title class="px-0 pt-0 text-h5 font-black text-slate-900 pb-6 flex justify-between items-center">
          Add New Hub Content
          <v-btn icon variant="text" @click="showAddDialog = false" color="slate-400">
            <span class="material-symbols-outlined">close</span>
          </v-btn>
        </v-card-title>
        
        <v-form @submit.prevent="handleSubmit" class="space-y-6">
          <v-row>
            <v-col cols="12" md="6">
               <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Content Type</label>
                  <v-select v-model="form.content_type" :items="['video', 'photo']" variant="outlined" density="comfortable" class="rounded-xl"></v-select>
               </div>
            </v-col>
            <v-col cols="12" md="6">
               <div class="space-y-2">
                  <label class="text-[10px] font-black text-[#005faa] uppercase tracking-widest">Assign to School</label>
                  <v-select 
                    v-model="form.school_id" 
                    :items="[{ id: null, name: 'Global (All Schools)' }, ...schools]" 
                    item-title="name" 
                    item-value="id"
                    variant="outlined" 
                    density="comfortable" 
                    class="rounded-xl"
                  ></v-select>
               </div>
            </v-col>
          </v-row>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Title</label>
            <v-text-field v-model="form.title" placeholder="e.g. Academy Training Sessions" variant="outlined" density="comfortable" class="rounded-xl"></v-text-field>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {{ form.content_type === 'video' ? 'Instagram Redirect URL (Optional)' : 'Redirect URL (Optional)' }}
            </label>
            <v-text-field v-model="form.url" placeholder="Paste link here..." variant="outlined" density="comfortable" class="rounded-xl"></v-text-field>
          </div>

          <div class="space-y-2" v-if="form.content_type === 'photo'">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Photo File</label>
            <v-file-input
              v-model="photoFile"
              accept="image/*"
              placeholder="Choose Photo"
              prepend-icon=""
              variant="outlined"
              density="comfortable"
              class="rounded-xl"
              hide-details
              @change="handlePhotoChange"
            >
              <template v-slot:prepend-inner>
                <span class="material-symbols-outlined text-state-400 mr-2">image</span>
              </template>
            </v-file-input>
          </div>

          <div class="space-y-2" v-if="form.content_type === 'video'">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Video File</label>
            <v-file-input
              v-model="videoFile"
              accept="video/*"
              placeholder="Choose MP4 Video"
              prepend-icon=""
              variant="outlined"
              density="comfortable"
              class="rounded-xl"
              hide-details
            >
              <template v-slot:prepend-inner>
                <span class="material-symbols-outlined text-state-400 mr-2">videocam</span>
              </template>
            </v-file-input>
          </div>

          <div class="space-y-2" v-if="form.content_type === 'video'">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thumbnail (Choose File)</label>
            <v-file-input
              v-model="thumbnailFile"
              accept="image/*"
              placeholder="Select Thumbnail Photo"
              prepend-icon=""
              variant="outlined"
              density="comfortable"
              class="rounded-xl"
              @change="handleFileChange"
              hide-details
            >
              <template v-slot:prepend-inner>
                <span class="material-symbols-outlined text-slate-400 mr-2">image</span>
              </template>
            </v-file-input>
          </div>

          <div v-if="thumbnailPreview" class="w-full h-32 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
            <img :src="thumbnailPreview" class="w-full h-full object-cover">
          </div>

          <v-btn type="submit" color="primary" block size="large" class="rounded-xl h-[56px] font-black text-[12px] uppercase tracking-widest mt-8">
            Save to Hub
          </v-btn>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const loading = ref(true);
const showAddDialog = ref(false);
const items = ref<any[]>([]);
const schools = ref<any[]>([]);

const form = ref({
  content_type: 'video',
  title: '',
  url: '',
  thumbnail_url: '',
  school_id: null as number | null
});

const thumbnailFile = ref<File | null>(null);
const thumbnailPreview = ref<string | null>(null);
const videoFile = ref<File | null>(null);
const photoFile = ref<File | null>(null);

const handleFileChange = (e: any) => {
  const file = e.target.files[0];
  if (file) {
    thumbnailFile.value = file;
    const reader = new FileReader();
    reader.onload = (res) => {
      thumbnailPreview.value = res.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const handlePhotoChange = (e: any) => {
  const file = e.target.files[0];
  if (file) {
    photoFile.value = file;
    // You can also add a preview for the photo if desired
  }
};

const summaryStats = computed(() => [
  { label: 'Total Managed', value: items.value.length, icon: 'media_output', bg: 'bg-slate-50', color: 'text-slate-400' },
  { label: 'Active Videos', value: items.value.filter(i => i.content_type === 'video' && i.is_active).length, icon: 'play_circle', bg: 'bg-purple-50', color: 'text-purple-600' },
  { label: 'Active Photos', value: items.value.filter(i => i.content_type === 'photo' && i.is_active).length, icon: 'image', bg: 'bg-blue-50', color: 'text-blue-600' }
]);

const fetchSchools = async () => {
  try {
    const res = await fetch('/api/schools');
    const data = await res.json();
    if (data.success) {
      schools.value = data.schools;
    }
  } catch (err) {
    console.error('Fetch schools error:', err);
  }
};

const fetchItems = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/dashboard/manage-content');
    const data = await res.json();
    if (data.success) {
      items.value = data.data;
    }
  } catch (err) {
    console.error('Fetch error:', err);
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  try {
    const formData = new FormData();
    formData.append('content_type', form.value.content_type);
    formData.append('title', form.value.title);
    formData.append('url', form.value.url);
    if (form.value.school_id) formData.append('school_id', form.value.school_id.toString());
    
    if (thumbnailFile.value) {
      formData.append('thumbnail', thumbnailFile.value);
    } else {
      formData.append('thumbnail_url', form.value.thumbnail_url);
    }

    if (videoFile.value) {
      formData.append('video', videoFile.value);
    }

    if (photoFile.value) {
      formData.append('thumbnail', photoFile.value); // Use thumbnail col for simplicity or URL col
    }

    const res = await fetch('/api/dashboard/manage-content', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      showAddDialog.value = false;
      form.value = { content_type: 'video', title: '', url: '', thumbnail_url: '', school_id: null };
      thumbnailFile.value = null;
      thumbnailPreview.value = null;
      videoFile.value = null;
      photoFile.value = null;
      fetchItems();
    }
  } catch (err) {
    console.error('Post error:', err);
  }
};

const toggleStatus = async (item: any) => {
  try {
    await fetch(`/api/dashboard/toggle-content/${item.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: item.is_active })
    });
  } catch (err) {
    console.error('Toggle error:', err);
  }
};

const deleteItem = async (id: number) => {
  if (!confirm('Are you sure you want to delete this content?')) return;
  try {
    const res = await fetch(`/api/dashboard/manage-content/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) fetchItems();
  } catch (err) {
    console.error('Delete error:', err);
  }
};

onMounted(() => {
  fetchItems();
  fetchSchools();
});
</script>

<style scoped>
.rounded-xl :deep(.v-field__outline) { border-radius: 12px !important; border-color: #f1f5f9 !important; }
.rounded-xl :deep(.v-field__input) { color: #1e293b !important; font-weight: 600 !important; font-size: 13px !important; }
</style>
