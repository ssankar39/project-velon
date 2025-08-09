document.addEventListener("DOMContentLoaded", () => {
  // ==============================================
  // MODULE NAVIGATION SYSTEM
  // ==============================================
  
  const navTabs = document.querySelectorAll('.nav-tab');
  const modules = document.querySelectorAll('.module');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Skip disabled tabs
      if (tab.classList.contains('disabled')) {
        return;
      }
      
      // Remove active classes from all tabs and modules
      navTabs.forEach(t => t.classList.remove('active'));
      modules.forEach(m => m.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Show corresponding module
      const targetModule = document.getElementById(tab.dataset.module);
      if (targetModule) {
        targetModule.classList.add('active');
      }
    });
  });

  // ==============================================
  // BMR/TDEE CALCULATOR MODULE
  // ==============================================
  
  const bmrForm = document.getElementById('bmr-form');
  const tdeeForm = document.getElementById('tdee-form');
  const tdeeSection = document.getElementById('tdee-section');
  let storedBMR = null; // Store BMR for TDEE calculation

  // Input validation function
  function validateInputs(age, weight, height, heightUnit) {
    const errors = [];

    // Age validation
    if (age <= 0 || age > 150) {
      errors.push("Age must be between 1 and 150 years");
    }

    // Weight validation
    if (weight <= 0 || weight > 1000) {
      errors.push("Weight must be a positive number (max 1000)");
    }

    // Height validation
    if (height <= 0) {
      errors.push("Height must be greater than 0");
    } else {
      if (heightUnit === "in" && height > 105) {
        errors.push("Height in inches must not exceed 105");
      }
      if (heightUnit === "cm" && height > 267) {
        errors.push("Height in cm must not exceed 267");
      }
    }

    return errors;
  }

  // Display result function
  function showResult(elementId, message, isError = false) {
    const resultElement = document.getElementById(elementId);
    resultElement.innerHTML = message;
    resultElement.className = `result ${isError ? 'error' : 'success'}`;
    resultElement.style.display = 'block';
    
    // Scroll to result for better UX
    if (!isError) {
      resultElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }

  // BMR Form Handler
  if (bmrForm) {
    bmrForm.addEventListener('submit', function(e) {
      e.preventDefault();

      // Get form values
      const age = parseInt(document.getElementById('age').value);
      let weight = parseFloat(document.getElementById('weight').value);
      let height = parseFloat(document.getElementById('height').value);
      const weightUnit = document.getElementById('weight-unit').value;
      const heightUnit = document.getElementById('height-unit').value;
      const gender = document.getElementById('gender').value;

      // Validate inputs
      const errors = validateInputs(age, weight, height, heightUnit);

      if (errors.length > 0) {
        showResult('bmr-result', errors.map(error => `• ${error}`).join('<br>'), true);
        return;
      }

      // Convert units to metric (kg and cm)
      if (weightUnit === 'lbs') {
        weight = weight * 0.453592;
      }

      if (heightUnit === 'in') {
        height = height * 2.54;
      }

      // Calculate BMR using Mifflin-St Jeor Equation
      let bmr;
      if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }

      // Store BMR for TDEE calculation
      storedBMR = bmr;

      // Display BMR result
      showResult('bmr-result', 
        `Your BMR is <strong>${bmr.toFixed(0)} calories/day</strong><br>
        <small>This is the number of calories your body burns at rest</small>`
      );

      // Show TDEE section with smooth animation
      if (tdeeSection) {
        tdeeSection.style.display = 'block';
        setTimeout(() => {
          tdeeSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 300);
      }
    });
  }

  // TDEE Form Handler
  if (tdeeForm) {
    tdeeForm.addEventListener('submit', function(e) {
      e.preventDefault();

      // Check if BMR has been calculated
      if (!storedBMR) {
        showResult('tdee-result', 'Please calculate BMR first', true);
        return;
      }

      // Get activity level multiplier
      const activityMultiplier = parseFloat(document.getElementById('activity-level').value);
      const tdee = storedBMR * activityMultiplier;

      // Get activity description
      const activityText = document.getElementById('activity-level').selectedOptions[0].text;

      // Calculate weight goal recommendations
      const weightLoss = tdee - 500;
      const weightGain = tdee + 500;

      // Display TDEE result with recommendations
      showResult('tdee-result', 
        `Your TDEE is <strong>${tdee.toFixed(0)} calories/day</strong><br>
        <small>Based on ${activityText.toLowerCase()}</small><br><br>
        <div style="font-size: 14px; color: #666; text-align: left;">
          <strong>For weight goals:</strong><br>
          • <strong>Weight loss:</strong> ${weightLoss.toFixed(0)} calories/day (-1 lb/week)<br>
          • <strong>Maintain weight:</strong> ${tdee.toFixed(0)} calories/day<br>
          • <strong>Weight gain:</strong> ${weightGain.toFixed(0)} calories/day (+1 lb/week)
        </div>`
      );
    });
  }

  // ==============================================
  // INPUT ENHANCEMENT
  // ==============================================
  
  // Clear error styling when user starts typing
  const inputs = ['age', 'weight', 'height'];
  inputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('input', function() {
        // Reset border color to default
        this.style.borderColor = '#e0e0e0';
        
        // Hide error results when user starts correcting input
        const bmrResult = document.getElementById('bmr-result');
        if (bmrResult && bmrResult.classList.contains('error')) {
          bmrResult.style.display = 'none';
        }
      });
    }
  });

  // ==============================================
  // FUTURE MODULE PLACEHOLDERS
  // ==============================================
  
  // Calorie Tracker Module (Coming Soon)
  function initCalorieTracker() {
    // This will contain the calorie tracking functionality
    // - Food database integration
    // - Daily calorie logging
    // - Progress tracking
    // - Goal setting
    console.log('Calorie Tracker module ready for development');
  }

  // Fasting Tracker Module (Coming Soon)
  function initFastingTracker() {
    // This will contain the fasting tracking functionality
    // - Timer functionality
    // - Fasting protocols
    // - Streak tracking
    // - Analytics
    console.log('Fasting Tracker module ready for development');
  }

  // Workout Tracker Module (Coming Soon)
  function initWorkoutTracker() {
    // This will contain the workout tracking functionality
    // - Exercise database
    // - Workout logging
    // - Progress tracking
    // - Custom routines
    console.log('Workout Tracker module ready for development');
  }

  // Body Metrics Tracker Module (Coming Soon)
  function initBodyMetricsTracker() {
    // This will contain the body metrics functionality
    // - Weight tracking
    // - Body measurements
    // - Progress photos
    // - BMI calculation
    console.log('Body Metrics Tracker module ready for development');
  }

  // Initialize future modules when they're ready
  // Uncomment these when modules are developed
  // initCalorieTracker();
  // initFastingTracker();
  // initWorkoutTracker();
  // initBodyMetricsTracker();

  // ==============================================
  // UTILITY FUNCTIONS
  // ==============================================
  
  // Function to enable module tabs (for future development)
  function enableModuleTab(moduleId) {
    const tab = document.querySelector(`[data-module="${moduleId}"]`);
    if (tab) {
      tab.classList.remove('disabled');
    }
  }

  // Function to show notification (for future use)
  function showNotification(message, type = 'info') {
    // This can be enhanced with a proper notification system
    console.log(`${type.toUpperCase()}: ${message}`);
  }

  // Data persistence helper (for future local storage integration)
  function saveData(key, data) {
    // Note: localStorage is not available in Claude artifacts
    // This is a placeholder for when the app is deployed
    console.log(`Saving data: ${key}`, data);
  }

  function loadData(key) {
    // Note: localStorage is not available in Claude artifacts
    // This is a placeholder for when the app is deployed
    console.log(`Loading data: ${key}`);
    return null;
  }

  // Expose utility functions for module development
  window.HealthTracker = {
    enableModuleTab,
    showNotification,
    saveData,
    loadData,
    storedBMR: () => storedBMR
  };

  console.log('Health & Fitness Tracker initialized successfully!');
});