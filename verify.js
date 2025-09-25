// This script uses Google's TensorFlow.js and MobileNet model for face comparison.

// --- 1. SELECT THE HTML ELEMENTS ---
const webcamVideo = document.getElementById('webcam');
const verifyButton = document.getElementById('verify-button');
const verificationStatus = document.getElementById('verification-status');
const canvas = document.getElementById('canvas');

let model; // Variable to hold our AI model

// --- 2. LOAD THE AI MODEL & START WEBCAM ---
async function setup() {
    try {
        // Load the MobileNet model from Google's servers
        model = await mobilenet.load();
        console.log("AI Model Loaded Successfully");

        // Start the webcam feed
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        webcamVideo.srcObject = stream;

        verifyButton.disabled = false;
        verifyButton.textContent = 'Verify Me';
    } catch (err) {
        console.error("Setup failed:", err);
        verificationStatus.textContent = "Could not start verification. Please allow camera access and refresh.";
        verificationStatus.style.color = "#e74c3c";
    }
}

// --- 3. HELPER FUNCTION TO CALCULATE SIMILARITY ---
// This function compares the "fingerprints" of two images.
function cosineSimilarity(embeddingA, embeddingB) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < embeddingA.length; i++) {
        dotProduct += embeddingA[i] * embeddingB[i];
        magnitudeA += embeddingA[i] * embeddingA[i];
        magnitudeB += embeddingB[i] * embeddingB[i];
    }
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    if (magnitudeA && magnitudeB) {
        return dotProduct / (magnitudeA * magnitudeB);
    } else {
        return 0;
    }
}

// --- 4. HANDLE THE VERIFICATION CLICK ---
verifyButton.addEventListener('click', async () => {
    verificationStatus.textContent = 'Analyzing...';
    verificationStatus.style.color = 'var(--secondary-accent)';

    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error("User not authenticated.");

        // Get user's uploaded photos from Firestore
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        if (!userData || !userData.photoURLs || userData.photoURLs.length === 0) {
            throw new Error("No profile photos found to compare against.");
        }

        // --- A. Get the "fingerprint" from the user's profile photo ---
        const profileImage = new Image();
        profileImage.crossOrigin = "anonymous"; // Important for loading images from Firebase Storage
        profileImage.src = userData.photoURLs[0];
        await profileImage.decode(); // Wait for image to load
        const profileEmbedding = await model.infer(profileImage, true);

        // --- B. Get the "fingerprint" from the live webcam feed ---
        // Draw the current video frame to our hidden canvas
        canvas.width = webcamVideo.videoWidth;
        canvas.height = webcamVideo.videoHeight;
        canvas.getContext('2d').drawImage(webcamVideo, 0, 0);
        const selfieEmbedding = await model.infer(canvas, true);
        
        // --- C. Compare the two fingerprints ---
        const similarity = cosineSimilarity(profileEmbedding.arraySync()[0], selfieEmbedding.arraySync()[0]);
        console.log("Face similarity score:", similarity);

        // We'll set a threshold, e.g., 0.8 (80% similar)
        if (similarity > 0.8) {
            verificationStatus.textContent = "Verification Successful!";
            verificationStatus.style.color = "#2ecc71";
            await firebase.firestore().collection('users').doc(user.uid).update({ verified: true });
            setTimeout(() => { window.location.href = 'app.html'; }, 1500);
        } else {
            throw new Error("Faces do not appear to match. Please try again.");
        }

    } catch (error) {
        console.error("Verification failed:", error);
        verificationStatus.textContent = error.message;
        verificationStatus.style.color = "#e74c3c";
    }
});

// --- 5. START EVERYTHING ---
setup();
