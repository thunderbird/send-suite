<script setup>
import { ref, onMounted } from "vue";
import Wrapper from "./Wrapper.vue";
import MessageViewer from "./MessageViewer.vue";
// get querystring value
// we'll redirect here on the backend if it's *not* an AJAX request
const currentFileUrl = ref(null);

function getQueryStringParams() {
  const queryString = window.location.search;
  const queryParams = new URLSearchParams(queryString);

  let { hash } = window.location;
  let id;
  if (queryParams.has("id")) {
    id = queryParams.get("id");
  }

  if (id && hash) {
    const u = new URL(location.href);
    currentFileUrl.value = `${u.origin}/download/${id}/${hash}`;
  }
};

function getServerURL() {
  const u = new URL(window.location);
  return u.origin;
}

onMounted(() => {
  getQueryStringParams();
});
</script>

<template>
  <Wrapper :serverUrl="getServerURL()">
    <MessageViewer :url="currentFileUrl" />
  </Wrapper>
</template>
