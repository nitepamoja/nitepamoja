// This script handles the user sign-up process

// --- 1. SELECT THE HTML ELEMENTS ---
// We need to get references to the form and its inputs
const signupForm = document.getElementById('signup-form');
const usernameInput = document.getElementById('signup-username');
const emailInput = document.getElementById('signup-email');
const passwordInput = document.getElementById('signup-password');
const errorMessage = document.getElementById('error-message');

// --- 2. ADD EVENT LISTENER TO THE FORM ---
// This function will run when the user clicks the "Create Account" button
signupForm.addEventListener('submit', (event) => {
    // Prevent the form from reloading the page
    event.preventDefault();

    // Get the values the user typed in
    const username = usernameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;

    // --- 3. CREATE THE USER IN FIREBASE AUTHENTICATION ---
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // This part runs if the user account is created successfully
            
            // Get the new user's unique ID (UID)
            const userId = userCredential.user.uid;

            // --- 4. SAVE THE USERNAME IN FIRESTORE DATABASE ---
            // Firebase Auth only stores email/password. We store extra info like the username in Firestore.
            return firebase.firestore().collection('users').doc(userId).set({
                username: username,
                createdAt: new Date()
            });
        })
        .then(() => {
            // This part runs after the username is saved successfully
            console.log('Account created and username saved!');
            errorMessage.textContent = ''; // Clear any old errors
            
            // --- 5. REDIRECT TO THE NEXT STEP ---
            // Send the user to the verification page (which we will build next)
            window.location.href = 'verify.html';
        })
        .catch((error) => {
            // This part runs if there was an error
            console.error("Error during sign up: ", error);
            
            // Show a user-friendly error message
            if (error.code === 'auth/email-already-in-use') {
                errorMessage.textContent = 'This email address is already in use.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage.textContent = 'Password should be at least 6 characters long.';
            } else {
                errorMessage.textContent = 'An error occurred. Please try again.';
            }
        });
});
