// This script handles the main application logic: auth checks, data fetching, and rendering profiles.

// --- 1. SELECT THE HTML ELEMENTS ---
const profileGrid = document.getElementById('profile-grid');
const logoutButton = document.getElementById('logout-button');

// --- 2. AUTHENTICATION GUARD ---
// This is the most important part. It checks if a user is logged in.
// onAuthStateChanged is a listener that runs whenever the user's login state changes.
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        // If a user is logged in, we can fetch the profiles.
        console.log('User is logged in:', user.uid);
        fetchAndDisplayProfiles(user.uid);
    } else {
        // If no user is logged in, redirect them to the sign-up page.
        console.log('No user logged in, redirecting...');
        window.location.href = 'signup.html';
    }
});

// --- 3. FETCH AND DISPLAY PROFILES ---
async function fetchAndDisplayProfiles(currentUserId) {
    try {
        // Query the 'users' collection in Firestore
        const snapshot = await firebase.firestore().collection('users')
            .where('profileComplete', '==', true) // Only get users who have finished setup
            .get();

        let profilesHTML = ''; // Start with an empty string to build our HTML

        snapshot.forEach(doc => {
            const userData = doc.data();
            const userId = doc.id;

            // Don't show the current user their own profile in the grid
            if (userId !== currentUserId) {
                // Use a template literal to build the HTML for each card
                profilesHTML += `
                    <div class="profile-card">
                        <div class="profile-card-image" style="background-image: url('${userData.photoURLs ? userData.photoURLs[0] : 'https://via.placeholder.com/300'}')"></div>
                        <div class="profile-card-info">
                            <h3>${userData.username}</h3>
                            <p>${userData.bio || 'No bio provided.'}</p>
                        </div>
                    </div>
                `;
            }
        });

        // Inject the generated HTML into the grid
        profileGrid.innerHTML = profilesHTML;

    } catch (error) {
        console.error("Error fetching profiles: ", error);
    }
}

// --- 4. LOGOUT FUNCTIONALITY ---
logoutButton.addEventListener('click', () => {
    firebase.auth().signOut().then(() => {
        // Sign-out successful. The onAuthStateChanged listener above will automatically
        // detect the change and redirect the user to the signup page.
        console.log('User logged out');
    }).catch((error) => {
        console.error('Logout error:', error);
    });
});
