// Firebase SDK imports (make sure these are correct)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDS5mns-yT4hRJ1Jmr9c0AeBb_QMw4zAbI",
  authDomain: "fitness-website-login.firebaseapp.com",
  projectId: "fitness-website-login",
  storageBucket: "fitness-website-login.firebasestorage.app",
  messagingSenderId: "692761075191",
  appId: "1:692761075191:web:f417d01fc1a286f173a2f2",
  measurementId: "G-9YRVE0Z6RX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Handle signup
  const signupForm = document.getElementById("signup-form");
  
  if (!signupForm) {
    console.error("Signup form not found!");
    return;
  }

  signupForm.addEventListener("submit", async function(e) {
    // Prevent form submission FIRST
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Form submitted - refresh prevented");

    const emailInput = document.getElementById("signup-email");
    const passwordInput = document.getElementById("signup-password");
    const messageElement = document.getElementById("signup-message");
    const submitButton = document.querySelector('#signup-form button[type="submit"]');

    if (!emailInput || !passwordInput || !messageElement) {
      console.error("Required form elements not found!");
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Basic validation
    if (!email || !password) {
      messageElement.innerText = "❌ Please fill in all fields";
      return;
    }

    if (password.length < 6) {
      messageElement.innerText = "❌ Password must be at least 6 characters";
      return;
    }

    // Disable submit button to prevent double submission
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerText = "Creating Account...";
    }

    try {
      console.log("Attempting to create user with email:", email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User created successfully:", userCredential.user);
      
      messageElement.innerText = "✅ Account created successfully!";
      messageElement.style.color = "green";
      
      // Clear form
      emailInput.value = "";
      passwordInput.value = "";
      
      // Redirect after success
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
      
    } catch (error) {
      console.error("Firebase error:", error);
      messageElement.innerText = "❌ " + error.message;
      messageElement.style.color = "red";
    } finally {
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerText = "Sign Up";
      }
    }
  });
});

// Log when script loads
console.log("Signup script loaded successfully");