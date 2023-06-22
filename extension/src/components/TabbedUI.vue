<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { loadUser } from "../lib/sync";

import Compose from "./Compose.vue";
import MessageList from "./MessageList.vue";
import MessageViewer from "./MessageViewer.vue";
import SharedFiles from "./SharedFiles.vue";
import ManagementPage from "./ManagementPage.vue";

const user = ref(null);
const currentTab = ref("MessageList");

const tabs = {
  MessageList,
  SharedFiles,
  ManagementPage,
};

onMounted(() => {
  console.log("Checking storage for user.");
  try {
    user.value = loadUser();
    console.log(`Loaded user ${user.value.email} with id ${user.value.id}`);
  } catch (error) {
    console.log(error);
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
    <Compose :user="user" />
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
    <component
      :is="tabs[currentTab]"
      v-bind="{ user: user }"
      @choose-url="handleChoice"
    ></component>
    <MessageViewer v-if="currentUrl" :url="currentUrl" />
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
