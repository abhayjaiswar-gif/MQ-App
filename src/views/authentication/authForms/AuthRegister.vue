<script setup lang="ts">
import { ref } from 'vue';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const show1 = ref(false);
const password = ref('');
const email = ref('');
const Regform = ref();
const firstname = ref('');
const lastname = ref('');
const apiError = ref('');
const apiSuccess = ref('');
const isSubmitting = ref(false);
const authStore = useAuthStore();
const router = useRouter();

// Password validation rules
const passwordRules = ref([
  (v: string) => !!v || 'Password is required',
  (v: string) => v === v.trim() || 'Password cannot start or end with spaces',
  (v: string) => (v && v.length >= 6) || 'Password must be at least 6 characters'
]);
const firstRules = ref([(v: string) => !!v || 'First Name is required']);
const lastRules = ref([(v: string) => !!v || 'Last Name is required']);
// Email validation rules
const emailRules = ref([
  (v: string) => !!v.trim() || 'E-mail is required',
  (v: string) => {
    const trimmedEmail = v.trim();
    return !/\s/.test(trimmedEmail) || 'E-mail must not contain spaces';
  },
  (v: string) => /.+@.+\..+/.test(v.trim()) || 'E-mail must be valid'
]);

async function validate() {
  const { valid } = await Regform.value.validate();
  if (!valid) return;

  isSubmitting.value = true;
  apiError.value = '';
  apiSuccess.value = '';

  try {
    await authStore.register({
      firstname: firstname.value,
      lastname: lastname.value,
      email: email.value,
      password: password.value
    });

    apiSuccess.value = 'Registration successful! Redirecting to login...';
    setTimeout(() => {
      router.push('/login1');
    }, 2000);
  } catch (error: any) {
    apiError.value = error || 'Registration failed';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div>
    <v-form ref="Regform" lazy-validation class="mt-4 loginForm">

      <!-- NAME GRID -->
      <v-row class="my-0">
        <v-col cols="12" sm="6" class="py-0">
          <div class="mb-6">
            <p class="text-[11px] font-black uppercase tracking-widest text-[#001c3a] mb-2 pl-1">First Name</p>
            <v-text-field
              v-model="firstname"
              :rules="firstRules"
              hide-details="auto"
              required
              variant="outlined"
              class="modern-input shadow-sm hover:shadow-md transition-shadow"
              color="#005daa"
              base-color="#e2e8f0"
              bg-color="white"
              placeholder="John"
            ></v-text-field>
          </div>
        </v-col>
        <v-col cols="12" sm="6" class="py-0">
          <div class="mb-6">
            <p class="text-[11px] font-black uppercase tracking-widest text-[#001c3a] mb-2 pl-1">Last Name</p>
            <v-text-field
              v-model="lastname"
              :rules="lastRules"
              hide-details="auto"
              required
              variant="outlined"
              class="modern-input shadow-sm hover:shadow-md transition-shadow"
              color="#005daa"
              base-color="#e2e8f0"
              bg-color="white"
              placeholder="Doe"
            ></v-text-field>
          </div>
        </v-col>
      </v-row>

      <!-- COMPANY -->
      <div class="mb-6">
        <p class="text-[11px] font-black uppercase tracking-widest text-[#001c3a] mb-2 pl-1">Academy / School</p>
        <v-text-field 
          hide-details="auto" 
          variant="outlined" 
          class="modern-input shadow-sm hover:shadow-md transition-shadow" 
          color="#005daa"
          base-color="#e2e8f0"
          bg-color="white"
          placeholder="EduSport Academy High"
        ></v-text-field>
      </div>

      <!-- EMAIL -->
      <div class="mb-6">
        <p class="text-[11px] font-black uppercase tracking-widest text-[#001c3a] mb-2 pl-1">Business Email Address</p>
        <v-text-field
          v-model="email"
          :rules="emailRules"
          placeholder="admin@academy.edu"
          required
          hide-details="auto"
          variant="outlined"
          class="modern-input shadow-sm hover:shadow-md transition-shadow"
          color="#005daa"
          base-color="#e2e8f0"
          bg-color="white"
          @input="email"
        ></v-text-field>
      </div>

      <!-- PASSWORD -->
      <div class="mb-2">
        <p class="text-[11px] font-black uppercase tracking-widest text-[#001c3a] mb-2 pl-1">Secure Password</p>
        <v-text-field
          v-model="password"
          :rules="passwordRules"
          placeholder="••••••••••••"
          required
          variant="outlined"
          class="modern-input shadow-sm hover:shadow-md transition-shadow"
          color="#005daa"
          base-color="#e2e8f0"
          bg-color="white"
          hide-details="auto"
          :type="show1 ? 'text' : 'password'"
          @input="password"
        >
          <template #append-inner>
            <v-btn icon variant="text" size="small" class="opacity-60 hover:opacity-100">
              <EyeInvisibleOutlined v-if="!show1" @click="show1 = true" />
              <EyeOutlined v-else @click="show1 = false" />
            </v-btn>
          </template>
        </v-text-field>
      </div>

      <!-- TERMS -->
      <div class="mt-4 mb-8 pl-1">
        <p class="text-xs font-semibold text-slate-500">
          By signing up, you agree to our
          <a href="#" class="text-[#005daa] hover:underline font-bold">Terms of Service</a>
          and
          <a href="#" class="text-[#005daa] hover:underline font-bold">Privacy Policy</a>.
        </p>
      </div>

      <!-- BUTTON -->
      <v-btn 
        color="#005daa" 
        block 
        class="login-btn rounded-xl shadow-[0_8px_20px_rgba(0,93,170,0.25)] hover:scale-[1.02] transition-transform font-black uppercase tracking-widest text-[12px]" 
        size="x-large" 
        height="56"
        @click="validate()" 
        :loading="isSubmitting"
      >
        Sign Up Now
      </v-btn>

      <!-- ALERTS -->
      <div v-if="apiSuccess" class="mt-4">
        <v-alert type="success" variant="tonal" class="rounded-xl border border-emerald-200">
           <span class="text-xs font-black">{{ apiSuccess }}</span>
        </v-alert>
      </div>
      <div v-if="apiError" class="mt-4">
        <v-alert type="error" variant="tonal" class="rounded-xl border border-red-200">
           <span class="text-xs font-black">{{ apiError }}</span>
        </v-alert>
      </div>

      <div class="mt-6 text-center">
         <p class="text-xs font-semibold text-slate-500">
            Already have an account? 
            <router-link to="/login1" class="text-[#005daa] font-bold ml-1 hover:underline">Log in</router-link>
         </p>
      </div>

    </v-form>
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
