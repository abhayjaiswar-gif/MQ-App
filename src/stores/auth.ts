import { defineStore } from 'pinia';
import { router } from '@/router';

export const useAuthStore = defineStore({
  id: 'auth',

  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    returnUrl: null as string | null
  }),

  actions: {
    async login(username: string, password: string) {
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: username,
            password
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Login failed');
        }

        // ✅ Save user + token
        this.user = {
          ...data.user,
          token: data.token
        };

        localStorage.setItem('user', JSON.stringify(this.user));
        localStorage.setItem('token', data.token);
        sessionStorage.setItem('id', data.user.id);
        sessionStorage.setItem('name', data.user.name || '');
        sessionStorage.setItem('role_id', data.user.role_id || '');

        // ✅ Redirect
        router.push(this.returnUrl || '/dashboard');

      } catch (error: any) {
        console.error('LOGIN ERROR:', error);
        throw error.message || 'Login failed';
      }
    },
    async register(userData: any) {
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Registration failed');
        }

        return data;
      } catch (error: any) {
        throw error.message || error || 'Registration failed';
      }
    },

    logout() {
      this.user = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('id');
      sessionStorage.removeItem('name');
      sessionStorage.removeItem('role_id');
      router.push('/login1');
    }
  }
});
