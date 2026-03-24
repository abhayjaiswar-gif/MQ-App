<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const school = ref({
  school_code: '',
  name: '',
  mq_om_id: '',
  city: '',
  address_line1: '',
  principal_name: '',
  principal_designation: 'Principal',
  email: '',
  phone: '',
  show_principal_signature: false,
  head_coach_name: '',
  head_coach_designation: 'Head Coach',
  show_head_coach_signature: true
});

const files = ref({
  logo: null as File | null,
  timetable: null as File | null,
  principal_sig: null as File | null,
  head_coach_sig: null as File | null
});

const previews = ref({
  logo: '',
  timetable: '',
  principal_sig: '',
  head_coach_sig: ''
});

const saving = ref(false);

const handleFileChange = (event: Event, type: keyof typeof files.value) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    files.value[type] = file;
    previews.value[type] = URL.createObjectURL(file);
  }
};

const triggerFileInput = (id: string) => {
  document.getElementById(id)?.click();
};

const saveSchool = async () => {
  saving.value = true;
  try {
    const formData = new FormData();
    // Append school data
    Object.entries(school.value).forEach(([key, value]) => {
      formData.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value);
    });

    // Append files
    if (files.value.logo) formData.append('school_logo', files.value.logo);
    if (files.value.timetable) formData.append('time_table_image', files.value.timetable);
    if (files.value.principal_sig) formData.append('principal_signature_image', files.value.principal_sig);
    if (files.value.head_coach_sig) formData.append('head_coach_signature_image', files.value.head_coach_sig);

    const response = await fetch('http://localhost:3000/api/schools', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (data.success) {
      router.push('/school');
    } else {
      alert('Error saving school: ' + data.message);
    }
  } catch (error) {
    console.error('Error saving school:', error);
  } finally {
    saving.value = false;
  }
};

const goToSchoolList = () => {
  router.push('/school');
};
</script>

<template>
  <div class="px-0 py-0 school-page-wrapper">
    <!-- Hidden File Inputs -->
    <input type="file" id="logo-input" class="hidden" accept="image/*" @change="handleFileChange($event, 'logo')" />
    <input type="file" id="timetable-input" class="hidden" accept="image/*,.pdf" @change="handleFileChange($event, 'timetable')" />
    <input type="file" id="principal-sig-input" class="hidden" accept="image/*" @change="handleFileChange($event, 'principal_sig')" />
    <input type="file" id="head-coach-sig-input" class="hidden" accept="image/*" @change="handleFileChange($event, 'head_coach_sig')" />

    <!-- Breadcrumbs -->
    <nav class="flex items-center gap-2 mb-6 text-xs font-medium text-on-surface-variant px-4">
      <a class="hover:text-primary transition-colors cursor-pointer" @click="goToSchoolList">Schools</a>
      <span class="material-symbols-outlined text-[14px]">chevron_right</span>
      <span class="text-on-surface">Add New School</span>
    </nav>

    <!-- Page Title -->
    <div class="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-4">
      <div>
        <h1 class="text-3xl font-extrabold text-on-surface tracking-tight leading-none mb-2">Add New School</h1>
        <p class="text-on-surface-variant text-sm font-medium">Register a new educational institution into the MQ portal.</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          @click="goToSchoolList"
          class="px-5 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-all active:scale-95"
        >
          Cancel
        </button>
        <button 
          @click="saveSchool"
          :disabled="saving"
          class="px-6 py-2 text-sm font-bold text-white bg-primary bg-gradient-to-b from-primary to-primary-container rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
        >
          <span v-if="saving" class="animate-spin material-symbols-outlined text-[20px]">sync</span>
          <span v-else class="material-symbols-outlined text-[20px]">save</span>
          {{ saving ? 'Saving...' : 'Save School' }}
        </button>
      </div>
    </div>

    <!-- Form Container -->
    <div class="space-y-10 pb-12">
      <!-- Section 1: Basic Information -->
      <section class="bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_32px_rgba(0,28,58,0.04)] mx-4">
        <div class="flex items-center gap-3 mb-8">
          <span class="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-[20px]">info</span>
          </span>
          <h2 class="text-lg font-bold text-on-surface">Basic Information</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">School Code*</label>
            <input v-model="school.school_code" class="w-full border-outline-variant/30 rounded-lg text-sm bg-surface-container-low focus:ring-primary/20 focus:border-primary transition-all p-2" placeholder="e.g. MQ-MUM-01" type="text"/>
          </div>
          <div class="space-y-1.5 lg:col-span-2">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">School Name*</label>
            <input v-model="school.name" class="w-full border-outline-variant/30 rounded-lg text-sm bg-surface-container-low focus:ring-primary/20 focus:border-primary transition-all p-2" placeholder="Enter school's official name" type="text"/>
          </div>
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">Operation Manager*</label>
            <select v-model="school.mq_om_id" class="w-full border-outline-variant/30 rounded-lg text-sm bg-surface-container-low focus:ring-primary/20 focus:border-primary transition-all p-2">
              <option value="">Select Manager</option>
              <option value="1">RAJ SHEKHAR</option>
              <option value="2">Manav Ghosh</option>
              <option value="3">Amitabh Verma</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">City*</label>
            <input v-model="school.city" class="w-full border-outline-variant/30 rounded-lg text-sm bg-surface-container-low focus:ring-primary/20 focus:border-primary transition-all p-2" placeholder="e.g. Mumbai" type="text"/>
          </div>
          <div class="space-y-1.5 lg:col-span-3">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">School Address*</label>
            <textarea v-model="school.address_line1" class="w-full border-outline-variant/30 rounded-lg text-sm bg-surface-container-low focus:ring-primary/20 focus:border-primary transition-all p-2" placeholder="Enter complete postal address" rows="3"></textarea>
          </div>
        </div>
      </section>

      <!-- Section 2: Visual Assets -->
      <section class="bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_32px_rgba(0,28,58,0.04)] mx-4">
        <div class="flex items-center gap-3 mb-8">
          <span class="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-[20px]">image</span>
          </span>
          <h2 class="text-lg font-bold text-on-surface">Visual Assets</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-3">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">School Logo</label>
            <div 
              @click="triggerFileInput('logo-input')"
              class="border-2 border-dashed border-outline-variant/40 rounded-xl p-8 flex flex-col items-center justify-center bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer group min-h-[160px]"
            >
              <img v-if="previews.logo" :src="previews.logo" class="max-h-24 object-contain mb-2" />
              <template v-else>
                <span class="material-symbols-outlined text-outline group-hover:text-primary text-4xl mb-2">add_photo_alternate</span>
                <p class="text-xs font-semibold text-on-surface-variant">Click to upload logo</p>
                <p class="text-[10px] text-outline mt-1">PNG, JPG up to 5MB</p>
              </template>
            </div>
          </div>
          <div class="space-y-3">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">School Timetable</label>
            <div 
              @click="triggerFileInput('timetable-input')"
              class="border-2 border-dashed border-outline-variant/40 rounded-xl p-8 flex flex-col items-center justify-center bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer group min-h-[160px]"
            >
              <div v-if="files.timetable" class="flex flex-col items-center">
                <span class="material-symbols-outlined text-primary text-4xl">description</span>
                <p class="text-xs font-bold mt-2">{{ files.timetable.name }}</p>
              </div>
              <template v-else>
                <span class="material-symbols-outlined text-outline group-hover:text-primary text-4xl mb-2">upload_file</span>
                <p class="text-xs font-semibold text-on-surface-variant">Upload timetable</p>
                <p class="text-[10px] text-outline mt-1">PDF, Excel, Images up to 10MB</p>
              </template>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 3: Principal Details -->
      <section class="bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_32px_rgba(0,28,58,0.04)] mx-4">
        <div class="flex items-center gap-3 mb-8">
          <span class="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-[20px]">person</span>
          </span>
          <h2 class="text-lg font-bold text-on-surface">Principal Details</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">Principal Name*</label>
            <input v-model="school.principal_name" class="w-full border-outline-variant/30 rounded-lg text-sm bg-surface-container-low p-2" type="text"/>
          </div>
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">Designation*</label>
            <input v-model="school.principal_designation" class="w-full border-outline-variant/30 rounded-lg text-sm bg-surface-container-low p-2" type="text"/>
          </div>
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">Email ID*</label>
            <input v-model="school.email" class="w-full border-outline-variant/30 rounded-lg text-sm bg-surface-container-low p-2" type="email"/>
          </div>
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">Phone Number*</label>
            <input v-model="school.phone" class="w-full border-outline-variant/30 rounded-lg text-sm bg-surface-container-low p-2" type="tel"/>
          </div>
          <div class="space-y-4 pt-2">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">Principal Signature</label>
            <div class="flex items-center gap-4">
              <button 
                @click="triggerFileInput('principal-sig-input')"
                class="px-4 py-2 border border-outline-variant text-xs font-bold rounded-lg hover:bg-surface-container transition-colors"
              >
                Choose File
              </button>
              <img v-if="previews.principal_sig" :src="previews.principal_sig" class="h-10 object-contain border rounded" />
              <span v-else class="text-[10px] text-outline font-medium">No file selected</span>
            </div>
          </div>
          <div class="space-y-4 pt-2">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">Show Signature</label>
            <div class="flex items-center gap-4">
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="school.show_principal_signature" class="sr-only peer" type="checkbox" />
                <div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span class="ms-3 text-xs font-semibold text-on-surface-variant">{{ school.show_principal_signature ? 'Yes' : 'No' }}</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 4: Head Coach Details -->
      <section class="bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_32px_rgba(0,28,58,0.04)] mx-4">
        <div class="flex items-center gap-3 mb-8">
          <span class="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-[20px]">sports</span>
          </span>
          <h2 class="text-lg font-bold text-on-surface">Head Coach Details</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">Head Coach Name*</label>
            <input v-model="school.head_coach_name" class="w-full border-outline-variant/30 rounded-lg text-sm bg-surface-container-low p-2" type="text"/>
          </div>
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">Designation*</label>
            <input v-model="school.head_coach_designation" class="w-full border-outline-variant/30 rounded-lg text-sm bg-surface-container-low p-2" type="text"/>
          </div>
          <div class="space-y-4 pt-2">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">Head Coach Signature</label>
            <div class="flex items-center gap-4">
              <button 
                @click="triggerFileInput('head-coach-sig-input')"
                class="px-4 py-2 border border-outline-variant text-xs font-bold rounded-lg hover:bg-surface-container transition-colors"
              >
                Choose File
              </button>
              <img v-if="previews.head_coach_sig" :src="previews.head_coach_sig" class="h-10 object-contain border rounded" />
              <span v-else class="text-[10px] text-outline font-medium">No file selected</span>
            </div>
          </div>
          <div class="space-y-4 pt-2">
            <label class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">Show Signature</label>
            <div class="flex items-center gap-4">
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="school.show_head_coach_signature" class="sr-only peer" type="checkbox" />
                <div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span class="ms-3 text-xs font-semibold text-on-surface-variant">{{ school.show_head_coach_signature ? 'Yes' : 'No' }}</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Sticky Footer Actions -->
      <div class="bg-surface border-t border-outline-variant/20 pt-8 flex items-center justify-end gap-4 px-4">
        <button 
          @click="goToSchoolList"
          class="px-8 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-all active:scale-95"
        >
          Cancel
        </button>
        <button 
          @click="saveSchool"
          :disabled="saving"
          class="px-10 py-3 text-sm font-bold text-white bg-primary bg-gradient-to-b from-primary to-primary-container rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
        >
          <span v-if="saving" class="animate-spin material-symbols-outlined text-[20px]">sync</span>
          <span v-else class="material-symbols-outlined text-[20px]">save</span>
          {{ saving ? 'Saving...' : 'Save School' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.school-page-wrapper {
  font-family: 'Inter', sans-serif;
  background-color: #f9f9f9;
  min-height: 100vh;
}

h1, h2, h3 {
  font-family: 'Manrope', sans-serif;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

input:focus, select:focus, textarea:focus {
  outline: none;
}
</style>
