// This is a temporary script to simulate verification and keep the project moving forward.

// --- 1. SELECT THE HTML ELEMENTS ---
const webcamVideo = document.getElementById('webcam');
const verifyButton = document.getElementById('verify-button');
const verificationStatus = document.getElementById('verification-status');

// --- 2. START THE WEBCAM ---
async function startWebcam() {
    // We only need to start the camera, no AI models needed.
    verifyButton.disabled = true;
    verificationStatus.textContent = "Requesting camera access...";
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        webcamVideo.srcObject = stream;
        verificationStatus.textContent = "Camera started. Please look at the camera.";
        verifyButton.disabled = false;
        verifyButton.textContent = "Verify Me";
    } catch (err) {
        console.error("Error accessing webcam: ", err);
        verificationStatus.textContent = "Camera access denied. Please enable it in your browser settings.";
        verificationStatus.style.color = "#e74c3c";
    }
}

// --- 3. HANDLE THE VERIFICATION CLICK ---
verifyButton.addEventListener('click', () => {
    // Show a loading message
    verificationStatus.textContent = "Verifying, please hold still...";
    verificationStatus.style.color = "var(--secondary-accent)";

    // Simulate a 3-second verification check
    setTimeout(() => {
        // Show a success message
        verificationStatus.textContent = "Verification Successful! Redirecting...";
        verificationStatus.style.color = "#2ecc71";

        // In a real app we would update Firestore here. We can add that back later.
        // For now, we just redirect.

        setTimeout(() => {
            window.location.href = 'profile-setup.html';
        }, 1500);

    }, 3000);
});

// Run the camera setup function when the page loads
startWebcam();
