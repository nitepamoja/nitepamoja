// This script handles the user sign-up process
const signupForm = document.getElementById('signup-form');
const usernameInput = document.getElementById('signup-username');
const emailInput = document.getElementById('signup-email');
const passwordInput = document.getElementById('signup-password');
const errorMessage = document.getElementById('error-message');

signupForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = usernameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const userId = userCredential.user.uid;
            return firebase.firestore().collection('users').doc(userId).set({
                username: username,
                createdAt: new Date()
            });
        })
        .then(() => {
            console.log('Account created and username saved!');
            errorMessage.textContent = '';
            
            // THE CHANGE IS HERE: We add ?signup_success=true to the URL
            window.location.href = 'verify.html?signup_success=true';
        })
        .catch((error) => {
            console.error("Error during sign up: ", error);
            if (error.code === 'auth/email-already-in-use') {
                errorMessage.textContent = 'This email address is already in use.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage.textContent = 'Password should be at least 6 characters long.';
            } else {
                errorMessage.textContent = 'An error occurred. Please try again.';
            }
        });
});
