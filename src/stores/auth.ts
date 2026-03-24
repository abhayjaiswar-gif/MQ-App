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
        const response = await fetch('http://localhost:3000/api/login', {
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

        // ✅ Redirect
        router.push(this.returnUrl || '/dashboard');

      } catch (error: any) {
        console.error('LOGIN ERROR:', error);
        throw error.message || 'Login failed';
      }
    },
    async register(userData: any) {
      try {
        const response = await fetch('http://localhost:3000/api/register', {
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
      router.push('/login1');
    }
  }
});