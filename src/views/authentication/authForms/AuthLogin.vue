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
  <div class="d-flex justify-space-between align-center">
    <h3 class="text-h3 text-center mb-0">Login</h3>
    <router-link to="/register" class="text-primary text-decoration-none">
      Don't Have an account?
    </router-link>
  </div>

  <Form @submit="validate" class="mt-7 loginForm" v-slot="{ errors, isSubmitting }">

    <!-- EMAIL -->
    <div class="mb-6">
      <v-label>Email Address</v-label>
      <v-text-field
        v-model="username"
        :rules="emailRules"
        class="mt-2"
        variant="outlined"
        color="primary"
        hide-details="auto"
      />
    </div>

    <!-- PASSWORD -->
    <div>
      <v-label>Password</v-label>
      <v-text-field
        v-model="password"
        :rules="passwordRules"
        :type="show1 ? 'text' : 'password'"
        class="mt-2"
        variant="outlined"
        color="primary"
        hide-details="auto"
      >
        <template #append-inner>
          <v-btn icon variant="text">
            <EyeInvisibleOutlined
              v-if="!show1"
              @click="show1 = true"
            />
            <EyeOutlined
              v-else
              @click="show1 = false"
            />
          </v-btn>
        </template>
      </v-text-field>
    </div>

    <!-- REMEMBER -->
    <div class="d-flex align-center mt-4 mb-7">
      <v-checkbox
        v-model="checkbox"
        label="Keep me signed in"
        color="primary"
        hide-details
      />
      <div class="ml-auto">
        <router-link to="/login1" class="text-darkText">
          Forgot Password?
        </router-link>
      </div>
    </div>

    <!-- BUTTON -->
    <v-btn
      color="primary"
      :loading="isSubmitting"
      block
      class="mt-5"
      size="large"
      type="submit"
    >
      Login
    </v-btn>

    <!-- ERROR -->
    <div v-if="errors.apiError" class="mt-2">
      <v-alert color="error">{{ errors.apiError }}</v-alert>
    </div>

  </Form>
</template>

<style scoped>
.loginForm .v-text-field input {
  font-weight: 500;
}
</style>
