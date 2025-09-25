// This script now waits for Firebase to confirm the user is logged in.

const profileSetupForm = document.getElementById('profile-setup-form');
const photoInputs = document.querySelectorAll('.photo-input');
const photoLabels = document.querySelectorAll('.photo-label');
const bioTextarea = document.getElementById('profile-bio');
const statusMessage = document.getElementById('status-message');

// We wrap our main logic in the auth listener
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        // If a user IS logged in, we can set up the form.
        console.log("User is authenticated on profile-setup page.");
        setupFormListener(user); // Pass the user object to our function
    } else {
        // If NO user is logged in, send them to the login page.
        console.log("No user found on profile-setup page. Redirecting to login.");
        window.location.href = 'login.html';
    }
});


// This part handles the image previews and is the same as before
photoInputs.forEach((input, index) => {
    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const label = photoLabels[index];
                label.style.backgroundImage = `url(${e.target.result})`;
                label.classList.add('preview');
                label.textContent = '';
            };
            reader.readAsDataURL(file);
        }
    });
});

// We put the form submission logic inside a function
function setupFormListener(user) {
    profileSetupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        statusMessage.textContent = 'Saving your profile...';
        
        try {
            // The rest of this function is the same as before
            const filesToUpload = [];
            photoInputs.forEach(input => {
                if (input.files[0]) {
                    filesToUpload.push(input.files[0]);
                }
            });

            const uploadPromises = filesToUpload.map(file => {
                const filePath = `profile_photos/${user.uid}/${file.name}`;
                const storageRef = firebase.storage().ref(filePath);
                return storageRef.put(file);
            });
            const uploadSnapshots = await Promise.all(uploadPromises);

            const urlPromises = uploadSnapshots.map(snapshot => snapshot.ref.getDownloadURL());
            const photoURLs = await Promise.all(urlPromises);

            const userProfileRef = firebase.firestore().collection('users').doc(user.uid);
            await userProfileRef.update({
                bio: bioTextarea.value,
                photoURLs: photoURLs,
                profileComplete: true
            });

            statusMessage.textContent = 'Profile complete! Welcome.';
            statusMessage.style.color = '#2ecc71';

            setTimeout(() => {
                window.location.href = 'app.html';
            }, 1500);

        } catch (error) {
            console.error('Error setting up profile:', error);
            statusMessage.textContent = 'An error occurred. Please try again.';
            statusMessage.style.color = '#e74c3c';
        }
    });
}
