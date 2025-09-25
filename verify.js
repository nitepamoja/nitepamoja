console.log("verify.js script has started."); // Checkpoint 1

const webcamVideo = document.getElementById('webcam');
const verifyButton = document.getElementById('verify-button');
const verificationStatus = document.getElementById('verification-status');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');

let modelsLoaded = false;

console.log("Setting up Firebase auth listener..."); // Checkpoint 2

firebase.auth().onAuthStateChanged(user => {
    console.log("Auth state has changed. User object:", user); // Checkpoint 3

    if (user) {
        console.log("User is authenticated. Calling loadModels()..."); // Checkpoint 4
        if (!modelsLoaded) {
            loadModels();
        }
    } else {
        console.log("No user found. Redirecting to login page..."); // Checkpoint 5
        window.location.href = 'login.html';
    }
});

async function loadModels() {
    console.log("Attempting to load AI models..."); // Checkpoint 6
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        modelsLoaded = true;
        console.log("AI Models Loaded Successfully!"); // Checkpoint 7
        verifyButton.disabled = false;
        verifyButton.textContent = 'Verify Me';
        startWebcam();
    } catch (error) {
        console.error("Error loading AI models:", error);
        verificationStatus.textContent = "Could not load AI models. Please refresh.";
    }
}

// The rest of the functions (startWebcam, event listeners) are the same
// ... (The rest of your verify.js file is correct)
async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        webcamVideo.srcObject = stream;
    } catch (err) {
        verificationStatus.textContent = "Camera access denied.";
    }
}

webcamVideo.addEventListener('play', () => {
    const displaySize = { width: webcamVideo.width, height: webcamVideo.height };
    faceapi.matchDimensions(overlay, displaySize);
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(webcamVideo, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        if (resizedDetections && resizedDetections[0]) {
            faceapi.draw.drawDetections(overlay, resizedDetections);
        }
    }, 100);
});

verifyButton.addEventListener('click', async () => {
    verificationStatus.textContent = 'Analyzing...';
    try {
        const user = firebase.auth().currentUser;
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        if (!userData || !userData.photoURLs || userData.photoURLs.length === 0) { throw new Error("No profile photos found to compare against."); }
        const liveDetection = await faceapi.detectSingleFace(webcamVideo).withFaceLandmarks().withFaceDescriptor();
        if (!liveDetection) { throw new Error("No face detected in the live feed."); }
        const profileImage = await faceapi.fetchImage(userData.photoURLs[0]);
        const profileDetection = await faceapi.detectSingleFace(profileImage).withFaceLandmarks().withFaceDescriptor();
        if (!profileDetection) { throw new Error("Could not detect a face in the profile photo."); }
        const faceMatcher = new faceapi.FaceMatcher([profileDetection.descriptor]);
        const bestMatch = faceMatcher.findBestMatch(liveDetection.descriptor);
        if (bestMatch.label !== 'unknown' && bestMatch.distance < 0.5) {
            verificationStatus.textContent = "Verification Successful!";
            verificationStatus.style.color = "#2ecc71";
            await firebase.firestore().collection('users').doc(user.uid).update({ verified: true });
            setTimeout(() => { window.location.href = 'app.html'; }, 1500);
        } else {
            throw new Error("Faces do not match. Please try again.");
        }
    } catch (error) {
        console.error("Verification failed:", error);
        verificationStatus.textContent = error.message;
        verificationStatus.style.color = "#e74c3c";
    }
});
