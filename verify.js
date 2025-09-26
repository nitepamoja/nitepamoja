// This script now waits for the page to be fully loaded before running.

document.addEventListener('DOMContentLoaded', () => {
    // This code will only run after the entire page is ready.
    
    const webcamVideo = document.getElementById('webcam');
    const verifyButton = document.getElementById('verify-button');
    const verificationStatus = document.getElementById('verification-status');
    const overlay = document.getElementById('overlay');
    const ctx = overlay.getContext('2d');

    function updateStatus(message, isError = false) {
        if (verificationStatus) {
            verificationStatus.textContent = message;
            verificationStatus.style.color = isError ? '#e74c3c' : 'var(--secondary-accent)';
        }
        console.log(message);
    }

    async function loadModels() {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
        try {
            updateStatus("Loading AI Model: Face Detector...");
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            
            updateStatus("Loading AI Model: Face Landmarks...");
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            
            updateStatus("Loading AI Model: Face Recognition...");
            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
            
            updateStatus("Loading AI Model: SSD Mobilenet...");
            await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
            
            updateStatus("AI Models loaded successfully.");
            verifyButton.disabled = false;
            verifyButton.textContent = 'Verify Me';
            
            await startWebcam();

        } catch (error) {
            console.error("Error loading AI models:", error);
            updateStatus("Error: Could not load AI models.", true);
        }
    }

    async function startWebcam() {
        updateStatus("Requesting camera access...");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            webcamVideo.srcObject = stream;
            updateStatus("Camera started. Please look at the camera.");
        } catch (err) {
            updateStatus("Error: Camera access was denied.", true);
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
        updateStatus('Analyzing...');
        try {
            const user = firebase.auth().currentUser;
            if (!user) { throw new Error("Authentication failed. Please log in again."); }
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
                updateStatus("Verification Successful!", false);
                verificationStatus.style.color = "#2ecc71";
                await firebase.firestore().collection('users').doc(user.uid).update({ verified: true });
                setTimeout(() => { window.location.href = 'app.html'; }, 1500);
            } else {
                throw new Error("Faces do not match. Please try again.");
            }
        } catch (error) {
            console.error("Verification failed:", error);
            updateStatus(error.message, true);
        }
    });

    // Start the main function
    loadModels();
});