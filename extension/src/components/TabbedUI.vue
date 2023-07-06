<script setup>
import { ref, onMounted, inject } from "vue";

import Compose from "./Compose.vue";
import MessageList from "./MessageList.vue";
import MessageViewer from "./MessageViewer.vue";
import SharedFiles from "./SharedFiles.vue";
import ManagementPage from "./ManagementPage.vue";

const { user } = inject("user");
const { api } = inject("api");

const currentTab = ref("MessageList");
const tabs = {
  MessageList,
  SharedFiles,
  ManagementPage,
};

onMounted(() => {
  if (!api.value || !user.value) {
    console.log(`either api or user is undefined, going to ManagementPage`);
    currentTab.value = "ManagementPage";
  }
});

const currentUrl = ref(null);
function handleChoice(url, type) {
  console.log(`do I even need the type?`, type);
  currentUrl.value = url;
}
</script>

<template>
  <div v-if="user">
    <h3>Logged in as {{ user.email }}</h3>
    <Compose />
    <br />
    <br />
    <button
      v-for="(_, tab) in tabs"
      :key="tab"
      :class="['tab-button', { active: currentTab === tab }]"
      @click="currentTab = tab"
    >
      {{ tab }}
    </button>
    <component :is="tabs[currentTab]" @choose-url="handleChoice"></component>
    <MessageViewer :url="currentUrl" />
  </div>
</template>

<style scoped>
button {
  font-weight: bold;
}
.tab-button {
  padding: 6px 10px;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  border: 1px solid #ccc;
  cursor: pointer;
  background: #f0f0f0;
  margin-bottom: -1px;
  margin-right: -1px;
}
.tab-button:hover {
  background: #e0e0e0;
}
.tab-button.active {
  background: #e0e0e0;
}
.tab {
  border: 1px solid #ccc;
  padding: 10px;
}
</style>
