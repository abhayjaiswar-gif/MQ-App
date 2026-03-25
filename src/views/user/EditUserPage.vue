<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const fetching = ref(true);
const userId = route.params.id;

const form = ref({
  mq_id: '',
  name: '',
  email: '',
  mobile: '',
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

const fetchUserData = async () => {
  try {
    const response = await fetch(`http://localhost:3000/api/users/${userId}`);
    const data = await response.json();
    if (data.success) {
      const u = data.user;
      form.value = {
        mq_id: u.mq_id || '',
        name: u.name || '',
        email: u.email || '',
        mobile: u.mobile || '',
        address_line1: u.address_line1 || '',
        address_line2: u.address_line2 || '',
        city: u.city || '',
        state: u.state || '',
        pincode: u.pincode || '',
        role_id: String(u.role_id),
        app_access: u.app_access === 1,
        web_access: u.web_access === 1,
        remarks: u.remarks || ''
      };
    } else {
      alert('User not found');
      router.push('/management/users');
    }
  } catch (error) {
    console.error('Fetch error:', error);
    alert('Error loading user data');
  } finally {
    fetching.value = false;
  }
};

onMounted(fetchUserData);

const handleSubmit = async () => {
  if (!form.value.name || !form.value.email || !form.value.role_id) {
    alert('Please fill in all required fields (*)');
    return;
  }

  loading.value = true;
  try {
    const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });
    
    const data = await response.json();
    if (data.success) {
      alert('User updated successfully!');
      router.push('/management/users');
    } else {
      alert(data.message || 'Error updating user');
    }
  } catch (error) {
    console.error('Update error:', error);
    alert('An unexpected error occurred.');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="pb-12 px-10 min-h-screen bg-surface font-body text-on-surface">
    <div v-if="fetching" class="flex items-center justify-center min-h-[400px]">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    <div v-else class="max-w-5xl mx-auto pt-8">
      <!-- Breadcrumbs -->
      <nav aria-label="Breadcrumb" class="flex mb-6 text-xs font-medium text-outline uppercase tracking-wider">
        <ol class="flex items-center space-x-2">
          <li><router-link to="/dashboard" class="hover:text-primary transition-colors">Dashboard</router-link></li>
          <li><span class="material-symbols-outlined text-[14px]">chevron_right</span></li>
          <li><router-link to="/management/users" class="hover:text-primary transition-colors">User Management</router-link></li>
          <li><span class="material-symbols-outlined text-[14px]">chevron_right</span></li>
          <li class="text-primary font-bold">Edit User Profile</li>
        </ol>
      </nav>

      <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 class="text-3xl font-extrabold tracking-tight text-slate-900 mb-2 font-headline">Edit User Profile</h2>
          <p class="text-on-surface-variant text-sm">Update the professional details and access permissions for this system user.</p>
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
            {{ loading ? 'Saving...' : 'Update User' }}
          </button>
        </div>
      </div>

      <!-- Main Form Card -->
      <div class="bg-surface-container-lowest rounded-xl shadow-[0_8px_32px_rgba(0,28,58,0.06)] overflow-hidden border border-slate-100">
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
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wide text-slate-400">Password</label>
                <input 
                  disabled
                  class="w-full bg-slate-50 border-none rounded-lg text-sm px-4 py-3 opacity-60 cursor-not-allowed font-medium" 
                  placeholder="••••••••" type="password"
                />
                <p class="text-[10px] text-outline mt-1 italic font-medium">Password changes are restricted for security.</p>
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
                <div class="relative">
                  <select 
                    v-model="form.role_id"
                    class="w-full bg-surface-container-low border-none rounded-lg text-sm px-4 py-3 focus:ring-2 focus:ring-primary-container focus:bg-white transition-all appearance-none cursor-pointer font-bold text-slate-700" 
                    required
                  >
                    <option disabled value="">Select assigned role</option>
                    <option value="1">Administrator</option>
                    <option value="4">Operations Head</option>
                    <option value="3">SSGM</option>
                    <option value="5">Head Coach</option>
                    <option value="2">Coach</option>
                    <option value="6">HR Admin</option>
                  </select>
                  <span class="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-slate-400">expand_more</span>
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
                    <p class="text-xs text-outline uppercase tracking-wider font-semibold">PNG, JPG, up to 10MB</p>
                  </div>
                  <input class="hidden" type="file" />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>

<style scoped>
.font-headline { font-family: 'Manrope', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }
</style>
