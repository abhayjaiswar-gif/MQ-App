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
  <div class="d-flex justify-space-between align-center">
    <h3 class="text-h3 text-center mb-0">Sign up</h3>
    <router-link to="/login1" class="text-primary text-decoration-none">Already have an account?</router-link>
  </div>
  <v-form ref="Regform" lazy-validation action="/dashboards/analytical" class="mt-7 loginForm">
    <v-row class="my-0">
      <v-col cols="12" sm="6" class="py-0">
        <div class="mb-6">
          <v-label>First Name*</v-label>
          <v-text-field
            v-model="firstname"
            :rules="firstRules"
            hide-details="auto"
            required
            variant="outlined"
            class="mt-2"
            color="primary"
            placeholder="John"
          ></v-text-field>
        </div>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <div class="mb-6">
          <v-label>Last Name*</v-label>
          <v-text-field
            v-model="lastname"
            :rules="lastRules"
            hide-details="auto"
            required
            variant="outlined"
            class="mt-2"
            color="primary"
            placeholder="Doe"
          ></v-text-field>
        </div>
      </v-col>
    </v-row>
    <div class="mb-6">
      <v-label>Company</v-label>
      <v-text-field hide-details="auto" variant="outlined" class="mt-2" color="primary" placeholder="Demo Inc."></v-text-field>
    </div>
    <div class="mb-6">
      <v-label>Email Address*</v-label>
      <v-text-field
        v-model="email"
        :rules="emailRules"
        placeholder="demo@company.com"
        class="mt-2"
        required
        hide-details="auto"
        variant="outlined"
        color="primary"
        @input="email"
      ></v-text-field>
    </div>
    <div class="mb-6">
      <v-label>Password</v-label>
      <v-text-field
        v-model="password"
        :rules="passwordRules"
        placeholder="*****"
        required
        variant="outlined"
        color="primary"
        hide-details="auto"
        :type="show1 ? 'text' : 'password'"
        class="mt-2"
        @input="password"
      >
        <template v-slot:append-inner>
          <v-btn color="secondary" icon rounded variant="text">
            <EyeInvisibleOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="show1 == false" @click="show1 = !show1" />
            <EyeOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="show1 == true" @click="show1 = !show1" />
          </v-btn>
        </template>
      </v-text-field>
    </div>

    <div class="d-sm-inline-flex align-center mt-2 mb-7 mb-sm-0 font-weight-bold">
      <h6 class="text-caption">
        By Signing up, you agree to our
        <router-link to="/register" class="text-primary link-hover font-weight-medium">Terms of Service </router-link>
        and
        <router-link to="/register" class="text-primary link-hover font-weight-medium">Privacy Policy</router-link>
      </h6>
    </div>
    <v-btn color="primary" block class="mt-4" variant="flat" size="large" @click="validate()" :loading="isSubmitting">Create Account</v-btn>

    <!-- SUCCESS / ERROR ALERTS -->
    <v-alert v-if="apiSuccess" type="success" variant="tonal" class="mt-4">
      {{ apiSuccess }}
    </v-alert>
    <v-alert v-if="apiError" type="error" variant="tonal" class="mt-4">
      {{ apiError }}
    </v-alert>
  </v-form>
</template>
