<template>
  <div>
    <h2>Approve Books (Admin)</h2>

    <div v-if="!isAdmin">
      <p style="color:red">You do not have permissions to view this page!</p>
    </div>

    <div v-else>
      <button @click="fetchAllBooks">Load all books</button>
      <ul>
        <li v-for="book in books" :key="book.id">
          "{{ book.title }}" (Difficulty: {{ book.difficulty_level }})
          <span v-if="!book.approved">
            <button @click="approveBook(book.id)">Approve</button>
          </span>
          <button @click="deleteBook(book.id)">Delete</button>
        </li>
      </ul>
      <p v-if="message" style="color:green">{{ message }}</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from '@/axios';

export default {
  name: 'ApproveBooksView',
  setup() {
    const books = ref([]);
    const message = ref('');

    const user = JSON.parse(localStorage.getItem('user')) || null;
    const isAdmin = user && user.role === 'admin';

    const fetchAllBooks = async () => {
      try {
        if (!isAdmin) {
          message.value = 'You do not have permission to see this page!';
          return;
        }
        const res = await axios.get('/books/all');
        books.value = res.data;
      } catch (error) {
        console.error('Error loading books:', error);
      }
    };

    const approveBook = async (bookId) => {
      if (!isAdmin) return;
      try {
        const res = await axios.post(`/books/${bookId}/approve`);
        message.value = res.data.message;
        fetchAllBooks();
      } catch (error) {
        console.error('Error approving:', error);
      }
    };

    const deleteBook = async (bookId) => {
      if (!isAdmin) return;
      try {
        const res = await axios.delete(`/books/${bookId}`);
        message.value = res.data.message;
        fetchAllBooks();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    };

    onMounted(() => {
      if (isAdmin) {
        fetchAllBooks();
      }
    });

    return {
      books,
      message,
      isAdmin,
      fetchAllBooks,
      approveBook,
      deleteBook
    };
  }
};
</script>
