import { keyFor } from "./const";
console.log(`THIS IS FAKE STORAGE FOR NOW`);

// TODO: change this to TB sync storage
const storage = localStorage;

export const get = (key) => {
  const json = storage.getItem(key);
  return json ? JSON.parse(json) : null;
};

export const set = (key, val) => {
  storage.setItem(key, JSON.stringify(val));
};

export function loadUser() {
  const obj = get(keyFor("user"));
  if (obj) {
    const { email, id } = obj;
    // log(`Loaded user ${email} with id ${id}`);
    return { email, id };
  }
  return null;
}

export function storeUser(email, id) {
  set(keyFor("user"), { email, id });
  // log(`Storing user ${email} with id ${id}`);
}

// TODO: create a more generic "loadSettings"
export function loadServerUrl() {
  let url = null;
  try {
    url = get(keyFor("server"));
    console.log(`Loaded url: ${url}`);
  } catch {
    console.log(`No stored server url`);
    alert(`No server url configured. Please enter one on the management page`);
  }
  return url;
}

export function storeServerUrl(url) {
  set(keyFor("server"), url);
}
