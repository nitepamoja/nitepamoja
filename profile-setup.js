// This script now displays its progress on the screen for easier debugging.

const profileSetupForm = document.getElementById('profile-setup-form');
const photoInputs = document.querySelectorAll('.photo-input');
const photoLabels = document.querySelectorAll('.photo-label');
const bioTextarea = document.getElementById('profile-bio');
const statusMessage = document.getElementById('status-message');

// Helper function to show status messages on the screen
function updateStatus(message, isError = false) {
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.style.color = isError ? '#e74c3c' : 'var(--secondary-accent)';
    }
    console.log(message);
}

// Image preview logic (no changes here)
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

// Form submission logic with live progress updates
profileSetupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    updateStatus('Saving your profile...');

    try {
        updateStatus('Checking authentication...');
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

        if (filesToUpload.length === 0) {
            throw new Error('Please upload at least one photo.');
        }
        
        updateStatus(`Preparing to upload ${filesToUpload.length} photo(s)...`);

        const uploadPromises = filesToUpload.map((file, index) => {
            updateStatus(`Uploading photo ${index + 1} of ${filesToUpload.length}...`);
            const filePath = `profile_photos/${user.uid}/${file.name}`;
            const storageRef = firebase.storage().ref(filePath);
            return storageRef.put(file);
        });

        const uploadSnapshots = await Promise.all(uploadPromises);
        updateStatus('All photos uploaded. Getting links...');

        const urlPromises = uploadSnapshots.map(snapshot => snapshot.ref.getDownloadURL());
        const photoURLs = await Promise.all(urlPromises);
        updateStatus('Links retrieved. Saving profile to database...');

        const userProfileRef = firebase.firestore().collection('users').doc(user.uid);
        await userProfileRef.update({
            bio: bioTextarea.value,
            photoURLs: photoURLs,
            profileComplete: true
        });
        updateStatus('Profile complete! Welcome.', false);
        statusMessage.style.color = '#2ecc71';

        setTimeout(() => {
            window.location.href = 'app.html';
        }, 1500);

    } catch (error) {
        console.error('Error setting up profile:', error);
        updateStatus(error.message, true);
    }
});
