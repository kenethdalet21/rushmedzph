<template>
  <div class="simple-tab">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <div class="content-placeholder">
      <p>This tab is under development. More features coming soon!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
}>();
</script>

<style scoped>
.simple-tab {
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.simple-tab h2 {
  margin: 0 0 16px 0;
  color: #333;
}

.simple-tab p {
  margin: 0 0 32px 0;
  color: #666;
}

.content-placeholder {
  padding: 60px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  color: #999;
}
</style>
