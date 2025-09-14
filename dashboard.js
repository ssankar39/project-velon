document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // ==============================================
  // GLOBAL STATE MANAGEMENT
  // ==============================================
  
  const appState = {
    userStats: {
      caloriesConsumed: 1847,
      caloriesGoal: 2000,
      fastingProgress: 14.38, // hours
      fastingGoal: 16,
      workoutsThisWeek: 4,
      workoutGoal: 5,
      currentWeight: 165,
      weightChange: -2.3
    },
    calculations: {
      bmr: null,
      tdee: null
    },
    fasting: {
      isActive: false,
      startTime: null,
      endTime: null,
      protocol: '16',
      customHours: null,
      timer: null
    }
  };

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
  // DASHBOARD UPDATES
  // ==============================================
  
  function updateDashboardStats() {
    const stats = appState.userStats;
    
    // Update stat cards
    const caloriesProgress = (stats.caloriesConsumed / stats.caloriesGoal) * 100;
    const fastingProgressPercent = (stats.fastingProgress / stats.fastingGoal) * 100;
    const workoutsProgress = (stats.workoutsThisWeek / stats.workoutGoal) * 100;

    // Update circular progress rings
    updateCircularProgress('calories-progress-ring', caloriesProgress);
    updateCircularProgress('fasting-progress-ring', fastingProgressPercent);
    updateCircularProgress('workouts-progress-ring', workoutsProgress);

    // Update percentages
    document.getElementById('calories-percentage').textContent = Math.round(caloriesProgress) + '%';
    document.getElementById('fasting-percentage').textContent = Math.round(fastingProgressPercent) + '%';
    document.getElementById('workouts-percentage').textContent = Math.round(workoutsProgress) + '%';

    // Update fasting display
    const hours = Math.floor(stats.fastingProgress);
    const minutes = Math.floor((stats.fastingProgress % 1) * 60);
    document.getElementById('fast-progress').textContent = `${hours}h ${minutes}m`;
    document.getElementById('fasting-current').textContent = hours;
  }

  function updateCircularProgress(ringId, percentage) {
    const ring = document.getElementById(ringId);
    if (!ring) return;
    
    const circumference = 2 * Math.PI * 45; // radius is 45
    const offset = circumference - (percentage / 100) * circumference;
    ring.style.strokeDashoffset = offset;
  }

  // ==============================================
  // BMR/TDEE CALCULATOR MODULE
  // ==============================================
  
  const bmrForm = document.getElementById('bmr-form');
  let storedBMR = null;

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
    if (!resultElement) return;
    
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
      const activityLevel = parseFloat(document.getElementById('activity-level').value);

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

      // Calculate TDEE
      const tdee = bmr * activityLevel;

      // Store results
      appState.calculations.bmr = Math.round(bmr);
      appState.calculations.tdee = Math.round(tdee);
      storedBMR = bmr;

      // Calculate weight goal recommendations
      const weightLoss = tdee - 500;
      const weightGain = tdee + 500;

      // Display results
      showResult('bmr-result', 
        `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
          <div>
            <h4 style="font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">BMR (Basal Metabolic Rate)</h4>
            <p style="font-size: 1.5rem; font-weight: bold; color: #3b82f6;">${appState.calculations.bmr} cal/day</p>
            <p style="font-size: 0.875rem; color: #6b7280;">Calories burned at rest</p>
          </div>
          <div>
            <h4 style="font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">TDEE (Total Daily Energy Expenditure)</h4>
            <p style="font-size: 1.5rem; font-weight: bold; color: #3b82f6;">${appState.calculations.tdee} cal/day</p>
            <p style="font-size: 0.875rem; color: #6b7280;">Total daily calorie needs</p>
          </div>
        </div>
        <div style="font-size: 0.875rem; color: #374151; background: #f3f4f6; padding: 1rem; border-radius: 0.5rem;">
          <strong>Weight Goals:</strong><br>
          • <strong>Weight loss:</strong> ${Math.round(weightLoss)} cal/day (-1 lb/week)<br>
          • <strong>Maintain weight:</strong> ${appState.calculations.tdee} cal/day<br>
          • <strong>Weight gain:</strong> ${Math.round(weightGain)} cal/day (+1 lb/week)
        </div>`
      );
    });
  }

  // ==============================================
  // FASTING TRACKER MODULE
  // ==============================================
  
  function initFastingTracker() {
    // Elements
    const fastingForm = document.getElementById("fasting-form");
    const fastingProtocol = document.getElementById("fasting-protocol");
    const customHoursGroup = document.getElementById("custom-hours-group");
    const customHours = document.getElementById("custom-hours");
    const fastingStart = document.getElementById("fasting-start");
    const fastingStatus = document.getElementById("fasting-status");
    const statusText = document.getElementById("status-text");
    const progressBar = document.getElementById("fasting-progress-bar");
    const timeRemaining = document.getElementById("time-remaining");
    const endFastBtn = document.getElementById("end-fast-btn");

    // Show/hide custom hours input
    if (fastingProtocol) {
      fastingProtocol.addEventListener("change", () => {
        if (customHoursGroup) {
          customHoursGroup.style.display = fastingProtocol.value === "custom" ? "block" : "none";
        }
        appState.fasting.protocol = fastingProtocol.value;
      });
    }

    // Handle form submission
    if (fastingForm) {
      fastingForm.addEventListener("submit", (e) => {
        e.preventDefault();

        // Determine fasting duration
        let fastingHours = parseInt(fastingProtocol.value);
        if (fastingProtocol.value === "custom") {
          fastingHours = parseInt(customHours.value);
          if (isNaN(fastingHours) || fastingHours < 1 || fastingHours > 72) {
            alert("Please enter a valid fasting duration between 1 and 72 hours.");
            return;
          }
          appState.fasting.customHours = fastingHours;
        }

        // Validate start time
        const startTime = new Date(fastingStart.value);
        if (isNaN(startTime.getTime())) {
          alert("Please enter a valid start time.");
          return;
        }

        // Calculate end time
        const endTime = new Date(startTime.getTime() + fastingHours * 60 * 60 * 1000);

        // Update state
        appState.fasting = {
          ...appState.fasting,
          isActive: true,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          protocol: fastingProtocol.value
        };

        // Update UI
        if (statusText) {
          statusText.innerHTML = `✅ Fasting started! Ends at <strong>${endTime.toLocaleString()}</strong>`;
        }
        
        if (fastingStatus) {
          fastingStatus.style.display = "block";
        }

        // Hide form after starting fast
        if (fastingForm) {
          fastingForm.style.display = "none";
        }

        // Start timer
        startFastingTimer();
      });
    }

    // End fast button
    if (endFastBtn) {
      endFastBtn.addEventListener('click', () => {
        endFast();
      });
    }

    function startFastingTimer() {
      if (appState.fasting.timer) {
        clearInterval(appState.fasting.timer);
      }

      appState.fasting.timer = setInterval(() => {
        updateFastingProgress();
      }, 1000);
      
      updateFastingProgress();
    }

    function updateFastingProgress() {
      if (!appState.fasting.isActive || !appState.fasting.endTime || !appState.fasting.startTime) {
        return;
      }

      const now = new Date();
      const startTime = new Date(appState.fasting.startTime);
      const endTime = new Date(appState.fasting.endTime);
      
      const totalDuration = endTime - startTime;
      const elapsed = now - startTime;
      const remaining = endTime - now;

      if (remaining <= 0) {
        // Fast completed
        endFast(true);
        return;
      }

      // Update progress bar
      const progressPercent = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
      if (progressBar) {
        progressBar.style.width = progressPercent + "%";
      }

      // Update dashboard stats
      const hoursElapsed = elapsed / (1000 * 60 * 60);
      appState.userStats.fastingProgress = Math.max(0, hoursElapsed);
      updateDashboardStats();

      // Format remaining time
      const hrs = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remaining % (1000 * 60)) / 1000);

      if (timeRemaining) {
        timeRemaining.textContent = `⏳ Time remaining: ${hrs}h ${mins}m ${secs}s`;
      }
    }

    function endFast(completed = false) {
      // Clear timer
      if (appState.fasting.timer) {
        clearInterval(appState.fasting.timer);
        appState.fasting.timer = null;
      }

      // Reset state
      appState.fasting = {
        ...appState.fasting,
        isActive: false,
        startTime: null,
        endTime: null
      };

      // Update UI
      if (completed) {
        if (timeRemaining) {
          timeRemaining.textContent = "🎉 Fasting complete!";
        }
        if (progressBar) {
          progressBar.style.width = "100%";
        }
        // Set progress to goal completion
        appState.userStats.fastingProgress = appState.userStats.fastingGoal;
      }

      // Show form again after a delay
      setTimeout(() => {
        if (fastingStatus) {
          fastingStatus.style.display = "none";
        }
        if (fastingForm) {
          fastingForm.style.display = "block";
        }
        
        // Reset form
        if (fastingStart) {
          fastingStart.value = "";
        }
        if (customHours) {
          customHours.value = "";
        }
        
        updateDashboardStats();
      }, completed ? 3000 : 0);
    }

    console.log("Fasting Tracker module initialized");
  }

  // ==============================================
  // INPUT ENHANCEMENT
  // ==============================================
  
  // Clear error styling when user starts typing
  const inputs = ['age', 'weight', 'height', 'bmi-weight', 'bmi-height', 'bf-height', 'bf-waist', 'bf-neck', 'bf-hip'];
  inputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('input', function() {
        // Reset border color to default
        this.style.borderColor = '#e5e7eb';
        
        // Hide error results when user starts correcting input
        const results = ['bmr-result', 'bmi-result', 'bodyfat-result'];
        results.forEach(resultId => {
          const result = document.getElementById(resultId);
          if (result && result.classList.contains('error')) {
            result.style.display = 'none';
          }
        });
      });
    }
  });

  // ==============================================
  // INITIALIZATION
  // ==============================================
  
  // Initialize dashboard
  updateDashboardStats();
  
  // Initialize fasting tracker
  initFastingTracker();

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


  window.FitnessTracker = {
    appState,
    enableModuleTab,
    showNotification,
    saveData,
    loadData,
    updateDashboardStats,
    storedBMR: () => storedBMR
  };

  console.log('Fitness Dashboard initialized successfully!');
});