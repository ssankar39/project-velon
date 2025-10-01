// Firebase SDK imports - CORRECTED
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Firebase config
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
const auth = getAuth(app); // ✅ Now properly initialized
const analytics = getAnalytics(app);

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  // Handle login
  const loginForm = document.getElementById("login-form");
  
  if (!loginForm) {
    console.error("Login form not found!");
    return;
  }

  loginForm.addEventListener("submit", async function(e) {
    // Prevent form refresh
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Login form submitted - refresh prevented");

    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const messageElement = document.getElementById("login-message");
    const submitButton = document.querySelector('#login-form button[type="submit"]');

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

    // Disable submit button during login attempt
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerText = "Signing In...";
    }

    try {
      console.log("Attempting to sign in with email:", email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in successfully:", userCredential.user);
      
      // Clear form
      emailInput.value = "";
      passwordInput.value = "";
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
      
    } catch (error) {
      console.error("Incorrect Email/Password!", error);

      // Map common Firebase auth error codes to friendly messages
      const code = error.code || "";
      let friendly = "An error occurred during sign in.";

      if (code.includes('auth/wrong-password')) {
        friendly = '❌ Wrong password. Please try again.';
      } else if (code.includes('auth/user-not-found')) {
        friendly = '❌ No account found for that email.';
      } else if (code.includes('auth/invalid-email')) {
        friendly = '❌ The email address is not valid.';
      } else if (code.includes('auth/network-request-failed')) {
        friendly = '❌ Network error. Check your connection and try again.';
      } else if (code.includes('auth/too-many-requests')) {
        friendly = '❌ Too many failed attempts. Please try again later.';
      } else if (error.message) {
        // Fallback to the message if available
        friendly = 'Invalid Email/Password. Please try again.';
      }

      messageElement.innerText = friendly;
      messageElement.style.color = "red";
    } finally {
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerText = "Login";
      }
    }
  });
});

console.log("Login script loaded successfully");