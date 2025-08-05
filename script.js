document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bmr-form");
  const heightUnitSelect = document.getElementById("height-unit");
  const tdeeSection = document.getElementById("tdee-calculator");
  const tdeeForm = document.getElementById("tdee-form");
  let storedBMR = null; //For TDEE calculation

  // Validation function
  function validateInputs(age, weight, height, heightUnit, heightIn) {
    const errors = [];

    if (age <= 0 || age > 150) {
      errors.push("Age must be between 1 and 100 years");
    }

    if (weight <= 0 || weight > 1000) {
      errors.push("Weight must be a positive number (max 1000)");
    }

    if (height <= 0) 
      {
      errors.push("Height must be greater than 0");
      } else 
      {
        if (heightUnit === "in" && height > 105) {
          errors.push("Height in inches must not exceed 105");
        }
        if (heightUnit === "cm" && height > 267) {
          errors.push("Height in cm must not exceed 267");
        }
      }

    return errors;
  }

  function showErrors(errors) {
    const resultElement = document.getElementById("bmr-result");
    resultElement.innerHTML = errors.map(error => `<span style="color: red;">• ${error}</span>`).join('<br>');
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const age = parseInt(document.getElementById("age").value);
    let weight = parseFloat(document.getElementById("weight").value);
    let height = parseFloat(document.getElementById("height").value);
    const weightUnit = document.getElementById("weight-unit").value;
    const heightUnitValue = document.getElementById("height-unit").value;
    const gender = document.getElementById("gender").value;

    // Validate inputs
    const errors = validateInputs(age, weight, height, heightUnitValue);

    if (errors.length > 0) {
      showErrors(errors);
      return;
    }

    // Convert units
    if (weightUnit === "lbs") {
      weight = weight * 0.453592;
    }

    if (heightUnitValue === "in") {
      height = height * 2.54;
    }

    // Calculate BMR
    let bmr = 0;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    storedBMR = bmr;

    document.getElementById("bmr-result").innerHTML =
      `<span style="color: green;">Your BMR is ${bmr.toFixed(2)} calories/day.</span>`;

    // Show TDEE section
    if (tdeeSection) tdeeSection.style.display = "block";
  });

  // TDEE form handling
  if (tdeeForm) {
    tdeeForm.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!storedBMR) {
        document.getElementById("tdee-result").innerHTML =
          `<span style="color:red;">Please calculate BMR first.</span>`;
        return;
      }

      const activityMultiplier = parseFloat(document.getElementById("activity-level").value);
      const tdee = storedBMR * activityMultiplier;

      document.getElementById("tdee-result").innerHTML =
        `<span style="color: green;">Your TDEE is ${tdee.toFixed(2)} calories/day.</span>`;
    });
  }

  // Optional: clear red borders on input
  const inputs = ['age', 'weight', 'height', 'height-in'];
  inputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('input', function () {
        this.style.borderColor = '#ccc';
      });
    }
  });
});