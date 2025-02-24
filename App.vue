<template>
  <div class="app-container">
    <header>
      <h1>Gamified Library (Vue 3)</h1>
      <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/books">Books</router-link>
        <router-link to="/upload">Upload</router-link>
        <router-link to="/approve">Admin</router-link>

        <span v-if="token">
          <router-link to="/profile">Profile</router-link>
          <a href="#" @click.prevent="logout">Log Out</a>
        </span>
        <span v-else>
          <router-link to="/login">Log In</router-link>
          <router-link to="/signup">Sign Up</router-link>
        </span>
      </nav>
    </header>

    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { token, clearAuthData } from '@/store';

export default {
  name: 'App',
  setup() {
    const router = useRouter();
    const hasToken = computed(() => token.value);

    const logout = () => {
      clearAuthData();
      router.push('/login');
    };

    return {
      token: hasToken,
      logout
    };
  },
};
</script>

<style>
/* Blue-ish gradient background */
html, body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #4fc3f7 0%, #81d4fa 100%);
  height: 100%;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

/* Header */
header {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 0 0 10px 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

header h1 {
  margin: 0;
  color: #333;
}

/* Navigation */
nav {
  margin-top: 0.5rem;
}

nav a {
  margin-right: 1rem;
  text-decoration: none;
  color: #666;
  font-weight: 500;
  transition: color 0.2s ease;
}

nav a:hover {
  color: #333;
  text-decoration: underline;
}

/* Main content */
main {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  padding: 1rem;
  margin: 0 1rem 2rem 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* Headings */
h2, h3 {
  color: #333;
}

/* Forms */
label {
  display: inline-block;
  width: 130px;
  font-weight: 600;
  margin-bottom: 0.3rem;
}

input[type="text"],
input[type="password"],
input[type="number"],
input[type="file"] {
  padding: 0.3rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* Buttons */
button {
  padding: 0.4rem 0.8rem;
  background: #42a5f5; 
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
  font-weight: 600;
  transition: background 0.3s ease;
}
button:hover {
  background: #1e88e5;
}

/* Link-like */
a {
  cursor: pointer;
}
</style>
