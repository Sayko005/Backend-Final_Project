<template>
  <div>
    <h2>Log In</h2>
    <form @submit.prevent="handleLogin">
      <div>
        <label>Username:</label>
        <input v-model="username" />
      </div>
      <div>
        <label>Password:</label>
        <input type="password" v-model="password" />
      </div>
      <button type="submit">Log In</button>
    </form>
    <p v-if="errorMessage" style="color:red">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from '@/axios';
import { setAuthData } from '@/store';

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const router = useRouter();

const handleLogin = async () => {
  try {
    const response = await axios.post('/auth/login', {
      username: username.value,
      password: password.value
    });
    // We get: { message, user, token }
    setAuthData(response.data.token, response.data.user);
    router.push('/');
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Login error';
  }
};
</script>
