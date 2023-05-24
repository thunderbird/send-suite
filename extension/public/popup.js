const optionsForm = document.getElementById("options-form");
const passwordField = document.getElementById("password");
const submitBtn = document.getElementById("submit");

optionsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const password = passwordField.value;
  const message = {
    type: "options",
    // downloads: downloads.valueAsNumber,
    // time: days.valueAsNumber * 1440 + hours.valueAsNumber * 60 + minutes.valueAsNumber,
    password,
  };

  browser.runtime.sendMessage(message).then((response) => {
    window.close();
  });
});
