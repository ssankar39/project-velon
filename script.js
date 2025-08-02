document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bmr-form");
  const heightUnitSelect = document.getElementById("height-unit");
  const heightFtInFields = document.getElementById("height-ftin-fields");

  // Show/hide ft/in fields based on height unit selection
  heightUnitSelect.addEventListener("change", function() {
    if (this.value === "ftin") {
      heightFtInFields.style.display = "flex";
      heightFtInFields.style.gap = "10px";
    } else {
      heightFtInFields.style.display = "none";
    }
  });

  // Validation function
  function validateInputs(age, weight, height, heightUnit, heightFt, heightIn) {
    const errors = [];

    // Age validation
    if (age <= 0 || age > 150) {
      errors.push("Age must be between 1 and 100 years");
    }

    // Weight validation
    if (weight <= 0 || weight > 1000) {
      errors.push("Weight must be a positive number (max 1000)");
    }

    // Height validation
    if (heightUnit === "ftin") {
      if (heightFt <= 0 || heightFt > 8) {
        errors.push("Height (feet) must be between 1 and 8 feet");
      }
      if (heightIn < 0 || heightIn >= 12) {
        errors.push("Height (inches) must be between 0 and 11 inches");
      }
    } else {
      if (height <= 0 || height > 300) {
        errors.push("Height must be a positive number (max 300)");
      }
    }

    return errors;
  }

  // Display error messages
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
    
    let heightFt = 0;
    let heightIn = 0;
    
    if (heightUnitValue === "ftin") {
      heightFt = parseInt(document.getElementById("height-ft").value) || 0;
      heightIn = parseInt(document.getElementById("height-in").value) || 0;
    }

    // Validate inputs
    const errors = validateInputs(age, weight, height, heightUnitValue, heightFt, heightIn);
    
    if (errors.length > 0) {
      showErrors(errors);
      return;
    }

    // Convert weight to kg
    if (weightUnit === "lbs") {
      weight = weight * 0.453592;
    }

    // Convert height to cm
    if (heightUnitValue === "in") {
      height = height * 2.54;
    } else if (heightUnitValue === "ftin") {
      height = (heightFt * 12 + heightIn) * 2.54;
    }

    // Calculate BMR
    let bmr = 0;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    document.getElementById("bmr-result").innerHTML =
      `<span style="color: green;">Your BMR is ${bmr.toFixed(2)} calories/day.</span>`;
  });

  // Real-time validation (optional) - removes error styling when user starts typing
  const inputs = ['age', 'weight', 'height', 'height-ft', 'height-in'];
  inputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('input', function() {
        // Remove red border when user starts typing
        this.style.borderColor = '#ccc';
      });
    }
  });
});