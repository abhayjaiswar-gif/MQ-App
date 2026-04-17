<script setup lang="ts">
import { ref } from 'vue';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { Form } from 'vee-validate';
const checkbox = ref(false);
const show1 = ref(false);
const password = ref('');
const username = ref('');
const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v === v.trim() || 'No spaces at start/end',
  (v: string) => v.length >= 6 || 'Minimum 6 characters required'
];
const emailRules = [
  (v: string) => !!v?.trim() || 'E-mail is required',
  (v: string) => !/\s/.test(v) || 'No spaces allowed',
  (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid'
];
async function validate(values: any, { setErrors }: any) {
  const authStore = useAuthStore();
  try {
    const email = username.value.trim();
    const pass = password.value;

    console.log('EMAIL:', email);
    console.log('PASSWORD:', pass);

    await authStore.login(email, pass);
  } catch (error: any) {
    setErrors({
      apiError: error?.response?.data?.message || 'Login failed'
    });
  }
}
</script>

<template>
  <div>
    <Form @submit="validate" class="mt-4 loginForm" v-slot="{ errors, isSubmitting }">

      <!-- EMAIL -->
      <div class="mb-6">
        <p class="text-[11px] font-black uppercase tracking-widest text-[#001c3a] mb-2 pl-1">Business Email</p>
        <v-text-field
          v-model="username"
          :rules="emailRules"
          placeholder="name@academy.edu"
          variant="outlined"
          color="#005daa"
          hide-details="auto"
          class="modern-input shadow-sm hover:shadow-md transition-shadow"
          base-color="#e2e8f0"
          bg-color="white"
        />
      </div>

      <!-- PASSWORD -->
      <div class="mb-2">
        <div class="flex justify-between items-end mb-2 pl-1">
           <p class="text-[11px] font-black uppercase tracking-widest text-[#001c3a]">Password</p>
           <router-link to="/login1" class="text-[11px] font-bold text-[#005daa] hover:underline pr-1">
             Forgot Password?
           </router-link>
        </div>
        <v-text-field
          v-model="password"
          :rules="passwordRules"
          placeholder="••••••••••••"
          :type="show1 ? 'text' : 'password'"
          variant="outlined"
          color="#005daa"
          hide-details="auto"
          class="modern-input shadow-sm hover:shadow-md transition-shadow"
          base-color="#e2e8f0"
          bg-color="white"
        >
          <template #append-inner>
            <v-btn icon variant="text" size="small" class="opacity-60 hover:opacity-100">
              <EyeInvisibleOutlined v-if="!show1" @click="show1 = true" />
              <EyeOutlined v-else @click="show1 = false" />
            </v-btn>
          </template>
        </v-text-field>
      </div>

      <!-- REMEMBER -->
      <div class="flex items-center mb-8 ml-n2">
        <v-checkbox
          v-model="checkbox"
          color="#005daa"
          hide-details
          density="compact"
        >
           <template #label>
              <span class="text-xs font-semibold text-slate-500">Keep me signed in for 30 days</span>
           </template>
        </v-checkbox>
      </div>

      <!-- BUTTON -->
      <v-btn
        color="#005daa"
        :loading="isSubmitting"
        block
        class="login-btn rounded-xl shadow-[0_8px_20px_rgba(0,93,170,0.25)] hover:scale-[1.02] transition-transform font-black uppercase tracking-widest text-[12px]"
        size="x-large"
        height="56"
        type="submit"
      >
        Access Dashboard
      </v-btn>

      <!-- ERROR -->
      <div v-if="errors.apiError" class="mt-4">
        <v-alert color="error" variant="tonal" class="rounded-xl border border-red-200">
           <span class="text-xs font-black">{{ errors.apiError }}</span>
        </v-alert>
      </div>

    </Form>
  </div>
</template>

<style scoped>
.modern-input :deep(.v-field__outline) { 
   border-radius: 16px !important; 
}
.modern-input :deep(.v-field__input) { 
   font-weight: 600 !important; 
   color: #0f172a !important;
}
.login-btn {
  background: linear-gradient(135deg, #005daa 0%, #004580 100%) !important;
}
</style>
