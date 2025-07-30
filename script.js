document.getElementById("bmr-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const age = parseInt(document.getElementById("age").value);
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);
  const gender = document.getElementById("gender").value;

  let bmr = 0;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  document.getElementById("bmr-result").innerText = `Your BMR is ${bmr.toFixed(2)} calories/day.`;
});
