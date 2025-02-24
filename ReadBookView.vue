<template>
  <div>
    <h2>Read Book</h2>

    <div v-if="pdfPath">
      <!-- Iframe without scroll -->
      <iframe
        :key="currentPage"
        :src="pdfSrc"
        width="600"
        height="800"
        frameborder="0"
        scrolling="no"
        style="overflow: hidden;"
      ></iframe>
    </div>

    <p v-if="errorMessage" style="color:red">{{ errorMessage }}</p>

    <div v-if="pdfPath" style="margin-top: 1rem;">
      <button @click="prevPage">Previous Page</button>
      <button @click="nextPage">Next Page</button>
    </div>

    <div v-if="showFinishButton" style="margin-top: 1rem;">
      <button @click="finishBook">I have finished reading</button>
    </div>
  </div>
</template>

<script>
import axios from '@/axios';
import { ref, computed } from 'vue';

export default {
  name: 'ReadBookView',
  props: ['bookId'],
  setup(props) {
    const pdfPath = ref('');
    const totalPages = ref(1);
    const currentPage = ref(1);
    const errorMessage = ref('');
    const showFinishButton = ref(false);

    const serverUrl = 'http://localhost:5000/';

    // Use #page=N&zoom=page-fit to avoid scrolling
    const pdfSrc = computed(() => {
      if (!pdfPath.value) return '';
      return `${serverUrl}${pdfPath.value}#page=${currentPage.value}&zoom=page-fit`;
    });

    const fetchProgress = async () => {
      try {
        // 1) Get the PDF path + total pages
        const pdfRes = await axios.get(`/books/${props.bookId}/pdf`);
        pdfPath.value = pdfRes.data.pdfPath;
        totalPages.value = pdfRes.data.totalPages || 1;

        // 2) Get reading progress
        const progressRes = await axios.get(`/books/${props.bookId}/progress`);
        currentPage.value = progressRes.data.current_page || 1;
        const isCompleted = progressRes.data.completed || false;

        if (!isCompleted && currentPage.value === totalPages.value) {
          showFinishButton.value = true;
        } else {
          showFinishButton.value = false;
        }
      } catch (err) {
        errorMessage.value = err.response?.data?.error || 'Error loading the book.';
      }
    };

    const saveProgress = async () => {
      try {
        await axios.post(`/books/${props.bookId}/progress`, {
          current_page: currentPage.value
        });
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    };

    const nextPage = async () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
        await saveProgress();
      }
      if (currentPage.value === totalPages.value) {
        showFinishButton.value = true;
      }
    };

    const prevPage = async () => {
      if (currentPage.value > 1) {
        currentPage.value--;
        await saveProgress();
      }
      if (currentPage.value < totalPages.value) {
        showFinishButton.value = false;
      }
    };

    const finishBook = async () => {
      try {
        const res = await axios.post(`/books/${props.bookId}/finish`);
        alert(res.data.message);
        showFinishButton.value = false;
      } catch (error) {
        alert(error.response?.data?.error || 'Error finishing the book');
      }
    };

    // On mount
    fetchProgress();

    return {
      pdfPath,
      pdfSrc,
      totalPages,
      currentPage,
      errorMessage,
      showFinishButton,
      nextPage,
      prevPage,
      finishBook
    };
  }
};
</script>

<style>
iframe {
  -ms-overflow-style: none;  /* IE, Edge */
  scrollbar-width: none;     /* Firefox */
}
iframe::-webkit-scrollbar {
  display: none;            /* Chrome, Safari, Opera */
}
</style>
