// This script handles the AI-powered live verification process.

// --- 1. SELECT THE HTML ELEMENTS ---
const webcamVideo = document.getElementById('webcam');
const verifyButton = document.getElementById('verify-button');
const verificationStatus = document.getElementById('verification-status');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');

// --- 2. LOAD THE AI MODELS ---
async function loadModels() {
    const MODEL_URL = '/models'; // The folder where you placed the model files
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        console.log("AI Models Loaded");
        verifyButton.disabled = false;
        verifyButton.textContent = 'Verify Me';
        startWebcam();
    } catch (error) {
        console.error("Error loading AI models:", error);
        verificationStatus.textContent = "Could not load AI models. Please refresh.";
    }
}

// --- 3. START THE WEBCAM & FACE DETECTION ---
async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        webcamVideo.srcObject = stream;
    } catch (err) {
        console.error("Error accessing webcam: ", err);
        verificationStatus.textContent = "Camera access denied.";
    }
}

webcamVideo.addEventListener('play', () => {
    // Match overlay canvas size to video feed size
    const displaySize = { width: webcamVideo.width, height: webcamVideo.height };
    faceapi.matchDimensions(overlay, displaySize);

    // Continuously detect faces
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(webcamVideo, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        // Draw a box around the detected face
        if (resizedDetections && resizedDetections[0]) {
            faceapi.draw.drawDetections(overlay, resizedDetections);
        }
    }, 100);
});

// --- 4. HANDLE THE VERIFICATION CLICK ---
verifyButton.addEventListener('click', async () => {
    verificationStatus.textContent = 'Analyzing...';
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error("User not authenticated.");

        // Get user's uploaded photos from Firestore
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        if (!userData || !userData.photoURLs || userData.photoURLs.length === 0) {
            throw new Error("No profile photos found to compare against.");
        }

        // Get the face descriptor from the live webcam feed
        const liveDetection = await faceapi.detectSingleFace(webcamVideo).withFaceLandmarks().withFaceDescriptor();
        if (!liveDetection) throw new Error("No face detected in the live feed.");

        // Get face descriptors from the user's uploaded photos
        const profileImage = await faceapi.fetchImage(userData.photoURLs[0]);
        const profileDetection = await faceapi.detectSingleFace(profileImage).withFaceLandmarks().withFaceDescriptor();
        if (!profileDetection) throw new Error("Could not detect a face in the profile photo.");

        // Compare the faces
        const faceMatcher = new faceapi.FaceMatcher([profileDetection.descriptor]);
        const bestMatch = faceMatcher.findBestMatch(liveDetection.descriptor);

        if (bestMatch.label !== 'unknown' && bestMatch.distance < 0.5) {
            // SUCCESS: Faces match!
            verificationStatus.textContent = "Verification Successful!";
            verificationStatus.style.color = "#2ecc71";
            
            // Update the user's profile in Firestore
            await firebase.firestore().collection('users').doc(user.uid).update({
                verified: true
            });

            // Redirect to the main app
            setTimeout(() => { window.location.href = 'app.html'; }, 1500);
        } else {
            // FAILURE: Faces do not match
            throw new Error("Faces do not match. Please try again.");
        }

    } catch (error) {
        console.error("Verification failed:", error);
        verificationStatus.textContent = error.message;
        verificationStatus.style.color = "#e74c3c";
    }
});

// --- 5. START EVERYTHING ---
loadModels();

