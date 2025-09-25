// This script handles the profile setup process: image previews, uploads, and data saving.

// --- 1. SELECT THE HTML ELEMENTS ---
const profileSetupForm = document.getElementById('profile-setup-form');
const photoInputs = document.querySelectorAll('.photo-input');
const photoLabels = document.querySelectorAll('.photo-label');
const bioTextarea = document.getElementById('profile-bio');
const statusMessage = document.getElementById('status-message');

// --- 2. HANDLE IMAGE PREVIEWS ---
// This part shows a preview of the image right after the user selects it.
photoInputs.forEach((input, index) => {
    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const label = photoLabels[index];
                label.style.backgroundImage = `url(${e.target.result})`;
                label.classList.add('preview');
                label.textContent = ''; // Remove the '+' icon
            };
            reader.readAsDataURL(file);
        }
    });
});

// --- 3. HANDLE FORM SUBMISSION ---
profileSetupForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Stop the page from reloading
    statusMessage.textContent = 'Saving your profile...';
    statusMessage.style.color = 'var(--secondary-accent)';

    try {
        // --- 4. GET THE CURRENT LOGGED-IN USER ---
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('No user is signed in.');
        }

        const filesToUpload = [];
        photoInputs.forEach(input => {
            if (input.files[0]) {
                filesToUpload.push(input.files[0]);
            }
        });

        // --- 5. UPLOAD IMAGES TO FIREBASE STORAGE ---
        // We create a unique path for each user's photos
        const uploadPromises = filesToUpload.map(file => {
            const filePath = `profile_photos/${user.uid}/${file.name}`;
            const storageRef = firebase.storage().ref(filePath);
            return storageRef.put(file);
        });

        const uploadSnapshots = await Promise.all(uploadPromises);

        // --- 6. GET THE DOWNLOAD URLS OF THE UPLOADED IMAGES ---
        const urlPromises = uploadSnapshots.map(snapshot => snapshot.ref.getDownloadURL());
        const photoURLs = await Promise.all(urlPromises);

        // --- 7. SAVE THE PROFILE DATA TO FIRESTORE ---
        const userProfileRef = firebase.firestore().collection('users').doc(user.uid);
        await userProfileRef.update({
            bio: bioTextarea.value,
            photoURLs: photoURLs,
            profileComplete: true // A flag to show the user has completed setup
        });

        // --- 8. SUCCESS AND REDIRECT ---
        statusMessage.textContent = 'Profile complete! Welcome.';
        statusMessage.style.color = '#2ecc71'; // Green for success

        setTimeout(() => {
            // Redirect to the main app page (which we will build next)
            window.location.href = 'app.html';
        }, 1500);

    } catch (error) {
        console.error('Error setting up profile:', error);
        statusMessage.textContent = 'An error occurred. Please try again.';
        statusMessage.style.color = '#e74c3c'; // Red for error
    }
});
