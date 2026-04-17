<script setup lang="ts">
import Logo from '@/layouts/dashboard/logo/LogoDark.vue';
import AuthRegister from '../authForms/AuthRegister.vue';
</script>

<template>
  <div class="h-screen w-full flex bg-[#f8fafc] overflow-hidden font-inter">
    
    <!-- LEFT PANEL: Brand Visuals (Shown on desktop only) -->
    <div class="hidden lg:flex w-[55%] relative flex-col justify-between overflow-hidden">
      <!-- Background Image -->
      <img src="@/assets/images/auth-bg.png" alt="EduSport Gradient" class="absolute inset-0 w-full h-full object-cover z-0" />
      
      <!-- Gradient Overlay for Contrast -->
      <div class="absolute inset-0 bg-gradient-to-t from-[#001c3a]/100 via-[#001c3a]/60 to-transparent z-10 w-full h-full mix-blend-multiply"></div>
      
      <!-- Top Branding -->
      <div class="relative z-20 p-12">
        <!-- Modern pill badge -->
        <div class="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-lg">
          <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]"></div>
          <span class="text-white font-black uppercase tracking-[0.2em] text-[10px]">MarcosQuay Platform</span>
        </div>
      </div>

      <!-- Bottom Inspirational Content -->
      <div class="relative z-20 p-12 pb-16">
        <h1 class="text-white font-black text-5xl tracking-tight leading-[1.1] mb-6 drop-shadow-2xl">
          Empowering The Next<br />
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">Generation of Champions.</span>
        </h1>
        <p class="text-white/80 text-lg font-medium max-w-lg mb-8 leading-relaxed">
          The ultimate operating system for modern academies. Manage curriculum, students, and staff all from one powerful, unified platform.
        </p>

        <!-- Mini Stats -->
        <div class="flex gap-10 mt-12 pt-8 border-t border-white/10">
           <div>
              <p class="text-4xl font-black text-white">40k+</p>
              <p class="text-emerald-300 font-bold uppercase tracking-widest text-[10px] mt-1 shadow-sm">Students Tracking</p>
           </div>
           <div>
              <p class="text-4xl font-black text-white">100%</p>
              <p class="text-emerald-300 font-bold uppercase tracking-widest text-[10px] mt-1 shadow-sm">Cloud Synced</p>
           </div>
        </div>
      </div>
    </div>

    <!-- RIGHT PANEL: Authentication Form -->
    <div class="w-full lg:w-[45%] bg-white relative z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.05)] overflow-y-auto custom-scroll flex flex-col">
      
      <!-- Mobile Background Fallback Blobs -->
      <div class="lg:hidden absolute -top-32 -left-32 w-96 h-96 bg-[#005daa]/10 rounded-full blur-3xl"></div>
      <div class="lg:hidden absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

      <!-- Spacer for safe vertical centering -->
      <div class="flex-grow min-h-[40px]"></div>

      <div class="w-full max-w-[420px] px-8 relative mx-auto z-20 shrink-0">
        <!-- Form Header -->
        <div class="mb-10 text-left">
          <Logo class="mb-8 scale-110 origin-left" />
          <h2 class="text-3xl font-black text-slate-900 mt-6 tracking-tight">Create Account</h2>
          <p class="text-slate-500 font-medium text-sm mt-2">Sign up for a MarcosQuay account to get started.</p>
        </div>

        <v-card elevation="0" class="bg-transparent mb-12">
          <AuthRegister />
        </v-card>
        
        <div class="mt-8 mb-4 text-center w-full pb-8">
           <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by MarcosQuay © 2026</p>
        </div>
      </div>

      <!-- Spacer for safe vertical centering -->
      <div class="flex-grow min-h-[40px]"></div>
    </div>
  </div>
</template>

<style scoped>
.font-inter { font-family: 'Inter', sans-serif; }
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>
