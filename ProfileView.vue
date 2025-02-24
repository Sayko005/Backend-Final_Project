<template>
  <div>
    <h2>User Profile</h2>
    <div v-if="userData">
      <p>Username: {{ userData.username }}</p>
      <p>Role: {{ userData.role }}</p>
      <p>XP: {{ userData.xp }}</p>
      <p>Level: {{ userData.level }}</p>

      <h3>Finished Books:</h3>
      <ul>
        <li v-for="book in userData.readBooks" :key="book.id">
          {{ book.title }} — {{ book.author }}
          (Difficulty: {{ book.difficulty_level }})
        </li>
      </ul>

      <h3>Books I Uploaded:</h3>
      <ul>
        <li v-for="book in userData.addedBooks" :key="book.id">
          {{ book.title }} — {{ book.author }}
          (Difficulty: {{ book.difficulty_level }} | Approved: {{ book.approved ? 'Yes' : 'No' }})
        </li>
      </ul>
    </div>
    <p v-else>Loading...</p>
    <p v-if="errorMessage" style="color:red">{{ errorMessage }}</p>
  </div>
</template>

<script>
import axios from '@/axios';
import { ref, onMounted } from 'vue';

export default {
  name: 'ProfileView',
  setup() {
    const userData = ref(null);
    const errorMessage = ref('');

    onMounted(async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        errorMessage.value = 'Please log in first.';
        return;
      }
      try {
        const res = await axios.get(`/users/${user.id}`);
        userData.value = res.data;
      } catch (err) {
        errorMessage.value = err.response?.data?.error || 'Error loading profile';
      }
    });

    return {
      userData,
      errorMessage
    };
  }
};
</script>
