// This script handles the user login process

// --- 1. SELECT THE HTML ELEMENTS ---
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const errorMessage = document.getElementById('error-message');

// --- 2. ADD EVENT LISTENER TO THE FORM ---
loginForm.addEventListener('submit', (event) => {
    // Prevent the form from reloading the page
    event.preventDefault();

    // Get the values the user typed in
    const email = emailInput.value;
    const password = passwordInput.value;

    // --- 3. SIGN IN THE USER WITH FIREBASE ---
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // This part runs if the login is successful
            console.log('User logged in successfully:', userCredential.user.uid);
            errorMessage.textContent = ''; // Clear any old errors
            
            // --- 4. REDIRECT TO THE MAIN APP ---
            window.location.href = 'app.html';
        })
        .catch((error) => {
            // This part runs if there was an error
            console.error("Error during login: ", error);
            
            // Show a user-friendly error message
            errorMessage.textContent = 'Invalid email or password. Please try again.';
        });
});
