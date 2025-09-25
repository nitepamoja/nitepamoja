// This script handles the live verification process

// --- 1. SELECT THE HTML ELEMENTS ---
const webcamVideo = document.getElementById('webcam');
const verifyButton = document.getElementById('verify-button');
const verificationStatus = document.getElementById('verification-status');

// --- 2. ACCESS THE USER'S WEBCAM ---
// We use the navigator.mediaDevices.getUserMedia API to request camera access
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, // We only need video, not audio
            audio: false 
        });
        webcamVideo.srcObject = stream;
    } catch (err) {
        console.error("Error accessing webcam: ", err);
        verificationStatus.textContent = "Camera access denied. Please enable camera access in your browser settings.";
        verificationStatus.style.color = "#e74c3c"; // Red color for error
    }
}

// --- 3. ADD EVENT LISTENER TO THE BUTTON ---
verifyButton.addEventListener('click', () => {
    // For this prototype, we will simulate the verification process.
    // In a real app, you would capture an image and send it to an AI service.

    // Show a loading message
    verificationStatus.textContent = "Verifying, please hold still...";
    verificationStatus.style.color = "var(--secondary-accent)"; // Blue color for status

    // Simulate a 3-second verification check
    setTimeout(() => {
        // Show a success message
        verificationStatus.textContent = "Verification Successful! Redirecting...";
        verificationStatus.style.color = "#2ecc71"; // Green color for success

        // --- 4. REDIRECT TO THE NEXT STEP ---
        // After another second, redirect to the profile setup page
        setTimeout(() => {
            window.location.href = 'profile-setup.html';
        }, 1000);

    }, 3000);
});

// Run the camera setup function when the page loads
setupCamera();
