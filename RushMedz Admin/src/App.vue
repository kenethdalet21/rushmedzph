<template>
  <router-view />
</template>

<script setup lang="ts">
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  margin: 0;
  padding: 0;
  background: #f5f7fa;
  color: #2c3e50;
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* Typography Scale */
h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; margin-bottom: 1rem; color: #2c3e50; }
h2 { font-size: 1.75rem; font-weight: 600; line-height: 1.3; margin-bottom: 0.875rem; color: #2c3e50; }
h3 { font-size: 1.25rem; font-weight: 600; line-height: 1.4; margin-bottom: 0.75rem; color: #2c3e50; }
h4 { font-size: 1.125rem; font-weight: 600; line-height: 1.4; color: #2c3e50; }
p { margin-bottom: 1rem; color: #4a5568; }

/* Button Base Styles */
button {
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Input Base Styles */
input, select, textarea {
  font-family: inherit;
  font-size: 14px;
}

input:focus, select:focus, textarea:focus {
  outline: none;
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}
</style>
