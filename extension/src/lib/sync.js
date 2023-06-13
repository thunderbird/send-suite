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
