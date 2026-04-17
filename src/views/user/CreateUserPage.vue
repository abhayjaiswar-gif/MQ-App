<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const rolesList = ref<{id: number, name: string}[]>([]);

const form = ref({
  mq_id: '',
  name: '',
  email: '',
  mobile: '',
  password: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  pincode: '',
  role_id: '',
  app_access: false,
  web_access: false,
  remarks: ''
});

const fetchRoles = async () => {
  try {
    const res = await fetch('/api/roles');
    const data = await res.json();
    if (data.success) {
      rolesList.value = data.roles;
    }
  } catch (err) {
    console.error('Failed to fetch roles:', err);
  }
};

onMounted(fetchRoles);

const handleSubmit = async () => {
  if (!form.value.name || !form.value.email || !form.value.password || !form.value.role_id) {
    alert('Please fill in all required fields (*)');
    return;
  }

  loading.value = true;
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });
    
    const data = await response.json();
    if (data.success) {
      alert('User created successfully!');
      router.push('/management/users');
    } else {
      alert(data.message || 'Error creating user');
    }
  } catch (error) {
    console.error('Submission error:', error);
    alert('An unexpected error occurred.');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="pb-12 px-10 min-h-screen bg-surface font-body text-on-surface">
    <div class="max-w-5xl mx-auto pt-8">
      <!-- Breadcrumbs -->
      <nav aria-label="Breadcrumb" class="flex mb-6 text-xs font-medium text-outline uppercase tracking-wider">
        <ol class="flex items-center space-x-2">
          <li><router-link to="/dashboard" class="hover:text-primary transition-colors">Dashboard</router-link></li>
          <li><span class="material-symbols-outlined text-[14px]">chevron_right</span></li>
          <li><router-link to="/management/users" class="hover:text-primary transition-colors">User Management</router-link></li>
          <li><span class="material-symbols-outlined text-[14px]">chevron_right</span></li>
          <li class="text-primary font-bold">Create New User</li>
        </ol>
      </nav>

      <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 class="text-3xl font-extrabold tracking-tight text-slate-900 mb-2 font-headline">Create New User Profile</h2>
          <p class="text-on-surface-variant text-sm">Fill in the professional details and access permissions for the new system user.</p>
        </div>
        <div class="flex gap-3">
          <button 
            @click="router.back()"
            class="px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="handleSubmit"
            :disabled="loading"
            class="px-6 py-2.5 rounded-lg bg-gradient-to-b from-primary to-primary-container text-white text-sm font-bold shadow-[0_4px_12px_rgba(0,93,170,0.25)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {{ loading ? 'Processing...' : 'Create User' }}
          </button>
        </div>
      </div>

      <!-- Main Form Card -->
      <div class="bg-surface-container-lowest rounded-xl shadow-[0_8px_32px_rgba(0,28,58,0.06)] overflow-hidden">
        <form @submit.prevent="handleSubmit" class="divide-y divide-slate-100">
          <!-- Section 1: Account Credentials -->
          <div class="p-8">
            <div class="flex items-center gap-2 mb-6">
              <span class="material-symbols-outlined text-primary text-xl">key</span>
              <h3 class="text-lg font-bold text-slate-900 font-headline">Account Credentials</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">MQ ID*</label>
                <input 
                  v-model="form.mq_id"
                  class="w-full bg-surface-container-low border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary-container focus:bg-white transition-all font-medium" 
                  placeholder="e.g. MQ-2024-001" required type="text"
                />
              </div>
              <div class="space-y-1.5 lg:col-span-2">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Full Name*</label>
                <input 
                  v-model="form.name"
                  class="w-full bg-surface-container-low border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary-container focus:bg-white transition-all font-medium" 
                  placeholder="Enter user's full name" required type="text"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Email ID*</label>
                <input 
                  v-model="form.email"
                  class="w-full bg-surface-container-low border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary-container focus:bg-white transition-all font-medium" 
                  placeholder="official@quayprofessional.com" required type="email"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Mobile Number*</label>
                <input 
                  v-model="form.mobile"
                  class="w-full bg-surface-container-low border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary-container focus:bg-white transition-all font-medium" 
                  placeholder="+91 00000 00000" required type="tel"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Password*</label>
                <input 
                  v-model="form.password"
                  class="w-full bg-surface-container-low border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary-container focus:bg-white transition-all font-medium" 
                  placeholder="••••••••" required type="password"
                />
                <p class="text-[10px] text-outline mt-1 italic font-medium">Alphanumeric with at least one special character. Minimum 8 characters required.</p>
              </div>
            </div>
          </div>

          <!-- Section 2: Address Details -->
          <div class="p-8 bg-slate-50/30">
            <div class="flex items-center gap-2 mb-6">
              <span class="material-symbols-outlined text-primary text-xl">location_on</span>
              <h3 class="text-lg font-bold text-slate-900 font-headline">Address Details</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="md:col-span-3 space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Address (Line 1)</label>
                <input 
                  v-model="form.address_line1"
                  class="w-full bg-white border border-slate-200 rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all font-medium" 
                  placeholder="House No, Building Name, Street" type="text"
                />
              </div>
              <div class="md:col-span-3 space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Address (Line 2)</label>
                <input 
                  v-model="form.address_line2"
                  class="w-full bg-white border border-slate-200 rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all font-medium" 
                  placeholder="Locality, Landmark" type="text"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">City</label>
                <input 
                  v-model="form.city"
                  class="w-full bg-white border border-slate-200 rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary-container transition-all font-medium" 
                  placeholder="Enter City" type="text"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">State</label>
                <input 
                  v-model="form.state"
                  class="w-full bg-white border border-slate-200 rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary-container transition-all font-medium" 
                  placeholder="Enter State" type="text"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Pincode</label>
                <input 
                  v-model="form.pincode"
                  class="w-full bg-white border border-slate-200 rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary-container transition-all font-medium" 
                  placeholder="000 000" type="text"
                />
              </div>
            </div>
          </div>

          <!-- Section 3: Role & Permissions -->
          <div class="p-8">
            <div class="flex items-center gap-2 mb-6">
              <span class="material-symbols-outlined text-primary text-xl">admin_panel_settings</span>
              <h3 class="text-lg font-bold text-slate-900 font-headline">Role & Permissions</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Role*</label>
                <select 
                  v-model="form.role_id"
                  class="w-full bg-surface-container-low border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary-container focus:bg-white transition-all appearance-none cursor-pointer font-bold text-slate-700" 
                  required
                >
                  <option disabled value="">Select assigned role</option>
                  <option v-for="role in rolesList" :key="role.id" :value="String(role.id)">
                    {{ role.name }}
                  </option>
                </select>
                
                <!-- Dynamic Permissions Preview -->
                <div v-if="form.role_id" class="mt-3 p-3 bg-secondary-container/20 border border-secondary-container/40 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <div class="flex items-start gap-2">
                    <span class="material-symbols-outlined text-primary text-sm mt-0.5">verified_user</span>
                    <div>
                      <p class="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Default Profile Provisioned</p>
                      <p class="text-[11px] text-slate-600 font-medium">This user will automatically receive access to:</p>
                      <ul class="flex flex-wrap gap-1.5 mt-2">
                        <li v-if="form.role_id === '1'" class="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-primary/20">Full System Access</li>
                        <template v-else-if="['5','2','4'].includes(form.role_id)">
                          <li class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-slate-200" v-for="mod in ['Dashboard', 'Assign Curriculum', 'My Curriculums', 'LP Master Data']" :key="mod">{{ mod }}</li>
                        </template>
                        <template v-else-if="form.role_id === '3'">
                          <li class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-slate-200" v-for="mod in ['Dashboard', 'Student', 'Exams', 'Fill Marks', 'School Gallery', 'Reports']" :key="mod">{{ mod }}</li>
                        </template>
                        <template v-else>
                          <li class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-slate-200">Dashboard Only</li>
                        </template>
                      </ul>
                      <p class="text-[9px] text-slate-400 mt-2 italic">You can modify these per-user later in User Permissions.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="space-y-4">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide block mb-3 font-semibold">Portal Access Permissions</label>
                <div class="flex flex-col gap-3">
                  <label class="relative flex items-center group cursor-pointer">
                    <input 
                      v-model="form.web_access"
                      class="peer h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary transition-all" 
                      type="checkbox"
                    />
                    <span class="ml-3 text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">Allow Login on Web Portal</span>
                  </label>
                  <label class="relative flex items-center group cursor-pointer">
                    <input 
                      v-model="form.app_access"
                      class="peer h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary transition-all" 
                      type="checkbox"
                    />
                    <span class="ml-3 text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">Allow Login on Mobile App</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 4: Additional Information -->
          <div class="p-8 bg-slate-50/30">
            <div class="flex items-center gap-2 mb-6">
              <span class="material-symbols-outlined text-primary text-xl">add_circle</span>
              <h3 class="text-lg font-bold text-slate-900 font-headline">Additional Information</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide font-semibold">Admin Remarks</label>
                <textarea 
                  v-model="form.remarks"
                  class="w-full bg-white border border-slate-200 rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary-container transition-all resize-none font-medium" 
                  placeholder="Add any specific notes about this user profile..." rows="4"
                ></textarea>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide font-semibold">Profile Pic</label>
                <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-lg bg-white hover:border-primary-container transition-all group cursor-pointer">
                  <div class="space-y-1 text-center">
                    <span class="material-symbols-outlined text-slate-400 text-3xl mb-2 group-hover:text-primary transition-colors">cloud_upload</span>
                    <div class="flex text-sm text-slate-600 font-bold justify-center">
                      <span class="relative cursor-pointer rounded-md font-bold text-primary hover:underline">Upload a file</span>
                      <p class="pl-1 font-medium text-slate-400">or drag and drop</p>
                    </div>
                    <p class="text-[10px] text-outline uppercase tracking-wider font-semibold">PNG, JPG, GIF up to 10MB</p>
                  </div>
                  <input class="hidden" type="file" />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Contextual Information Card -->
      <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-primary-fixed/30 p-5 rounded-xl border border-primary-fixed">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-on-primary-fixed-variant" style="font-variation-settings: 'FILL' 1;">info</span>
            <div>
              <h4 class="text-xs font-bold text-on-primary-fixed-variant uppercase tracking-wider mb-1">Onboarding Tip</h4>
              <p class="text-[11px] text-on-primary-fixed-variant leading-relaxed">Ensure the Email ID matches the official school domain for automated security verification.</p>
            </div>
          </div>
        </div>
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <span class="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <div>
              <p class="text-[10px] text-outline font-bold uppercase tracking-wider">Security Protocol</p>
              <p class="text-xs font-semibold text-slate-900">2FA Enabled by Default</p>
            </div>
          </div>
        </div>
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed-variant">
              <span class="material-symbols-outlined text-[18px]">history</span>
            </div>
            <div>
              <p class="text-[10px] text-outline font-bold uppercase tracking-wider">Activity Log</p>
              <p class="text-xs font-semibold text-slate-900">Action tracked in audit trail</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.font-headline { font-family: 'Manrope', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }
</style>
