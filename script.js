document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bmr-form");

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // 🚨 This stops the reload

    const age = parseInt(document.getElementById("age").value);
    let weight = parseFloat(document.getElementById("weight").value);
    let height = parseFloat(document.getElementById("height").value);
    const weightUnit = document.getElementById("weight-unit").value;
    const heightUnitValue = document.getElementById("height-unit").value;
    const gender = document.getElementById("gender").value;

    // Convert weight to kg
    if (weightUnit === "lbs") {
      weight = weight * 0.453592;
    }

    // Convert height to cm
    if (heightUnitValue === "in") {
      height = height * 2.54;
    } else if (heightUnitValue === "ftin") {
      const ft = parseInt(document.getElementById("height-ft").value) || 0;
      const inch = parseInt(document.getElementById("height-in").value) || 0;
      height = (ft * 12 + inch) * 2.54;
    }

    // Calculate BMR
    let bmr = 0;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    document.getElementById("bmr-result").innerText =
      `Your BMR is ${bmr.toFixed(2)} calories/day.`;
  });
});
