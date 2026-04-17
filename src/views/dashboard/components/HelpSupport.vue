<template>
  <v-card variant="flat" class="rounded-[2rem] shadow-sm overflow-hidden h-full relative" style="background: linear-gradient(135deg, #e8f4ff 0%, #d1e8ff 100%);">
    <!-- Decorative friendly background accents -->
    <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/40 rounded-full blur-2xl"></div>
    <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
    
    <v-card-text class="pa-7 relative z-10">
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h5 class="text-h6 font-black text-[#001c3a] mb-0 leading-tight d-flex align-center gap-2">
              <span class="material-symbols-outlined text-[#005daa] text-xl animate-bounce-slow">support_agent</span>
              We're Here to Help!
            </h5>
          </div>
          <div class="flex items-center gap-1.5 pl-8 mt-1">
             <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
             <span class="text-[10px] font-black text-[#005daa]/80 uppercase tracking-widest">Online • Reply ≈ 5 min</span>
          </div>
        </div>
        
        <!-- Friendly avatar group -->
        <div class="d-flex align-center justify-center flex-wrap flex-row-reverse">
          <v-avatar size="36" variant="flat" color="white" class="ml-n3 border-2 border-white shadow-sm ring-2 ring-[#005daa]/5">
            <img src="@/assets/images/users/avatar-4.png" width="36" alt="Support Agent 4" />
          </v-avatar>
          <v-avatar size="36" variant="flat" color="white" class="ml-n3 border-2 border-white shadow-sm ring-2 ring-[#005daa]/5">
            <img src="@/assets/images/users/avatar-3.png" width="36" alt="Support Agent 3" />
          </v-avatar>
          <v-avatar size="36" variant="flat" color="white" class="ml-n3 border-2 border-white shadow-sm ring-2 ring-[#005daa]/5">
            <img src="@/assets/images/users/avatar-2.png" width="36" alt="Support Agent 2" />
          </v-avatar>
          <v-avatar size="36" variant="flat" color="white" class="border-2 border-white shadow-sm ring-2 ring-[#005daa]/5">
            <img src="@/assets/images/users/avatar-1.png" width="36" alt="Support Agent 1" />
          </v-avatar>
        </div>
      </div>
      
      <p class="text-[13px] text-[#001c3a]/70 font-semibold leading-relaxed mb-6 pt-2">
        Whether you need a hand with curriculum mapping, resolving technical hiccups, or school coordination, our success team is ready to jump in and make your day better!
      </p>

      <v-btn color="#005daa" block variant="flat" size="large" class="rounded-[1rem] font-black text-[11px] uppercase tracking-widest h-[52px] shadow-[0_8px_20px_rgba(0,93,170,0.25)] hover:scale-[1.02] transition-transform chat-btn" href="https://codedthemes.support-hub.io/" target="_">
        <span class="material-symbols-outlined mr-2 text-[18px]">chat_bubble</span>
        Start a Friendly Chat
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<style scoped>
/* Custom Animations to make it feel alive and positive */
@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.7; }
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
.animate-bounce-slow {
  animation: bounce-slow 3s ease-in-out infinite;
}

.chat-btn {
  background: linear-gradient(135deg, #005daa 0%, #004580 100%) !important;
}
</style>
