
import { auth, googleProvider, db } from "./firebase.js";

import {
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

let user = null;
let taxonIds = [];
let highScore = 0;
let hasScore = false;

const authListeners = [];

// Get the user's saved data from Firestore.
function playerDoc() {
    return doc(db, "scores", user.uid);
}

// Display the taxon IDs and high score.
function displayData() {
    const list = document.getElementById("taxonList");
    if (!list) return;

    list.replaceChildren();

    taxonIds.forEach(id => {
        const item = document.createElement("li");
        item.textContent = id + " ";

        const button = document.createElement("button");
        button.textContent = "Remove";

        button.onclick = async () => {
            const index = taxonIds.indexOf(id);
            if (index !== -1) taxonIds.splice(index, 1);

            await saveData();
            displayData();
        };

        item.append(button);
        list.append(item);
    });

    const scoreElement = document.getElementById("highScore");

    if (scoreElement) {
        scoreElement.textContent =
            hasScore ? highScore : "No score saved";
    }
}

// Load the user's saved data from Firestore.
async function loadData() {
    const snapshot = await getDoc(playerDoc());
    const data = snapshot.exists() ? snapshot.data() : {};

    taxonIds = data.taxonIds || [];
    hasScore = Number.isInteger(data.highScore);
    highScore = hasScore ? data.highScore : 0;

    displayData();
    authListeners.forEach(callback => callback());
}

// Save the user's data.
async function saveData() {
    if (!user) return;

    const data = {
        taxonIds: taxonIds,
        displayName: user.displayName || user.email || "Player",
        updatedAt: serverTimestamp()
    };

    if (hasScore) data.highScore = highScore;

    await setDoc(playerDoc(), data, { merge: true });
}

// Sign in with Google.
const loginButton = document.getElementById("login");

if (loginButton) {
    loginButton.onclick = () =>
        signInWithPopup(auth, googleProvider);
}

// Sign out.
const logoutButton = document.getElementById("logout");

if (logoutButton) {
    logoutButton.onclick = () => signOut(auth);
}

// Add a taxon ID.
const addTaxonButton = document.getElementById("addTaxon");

if (addTaxonButton) {
    addTaxonButton.onclick = async () => {
        const id = Number(document.getElementById("taxon").value);

        if (!user || !Number.isSafeInteger(id) || id <= 0) return;
        if (taxonIds.includes(id) || taxonIds.length >= 1000) return;

        taxonIds.push(id);
        await saveData();

        document.getElementById("taxon").value = "";
        displayData();
    };
}

// Save a high score without lowering the existing score.
const saveScoreButton = document.getElementById("saveScore");

if (saveScoreButton) {
    saveScoreButton.onclick = async () => {
        const value = document.getElementById("score").value;
        const score = Number(value);

        if (!user || value === "" || !Number.isSafeInteger(score) || score < 0)
            return;

        if (hasScore && score < highScore) return;

        highScore = score;
        hasScore = true;

        await saveData();
        displayData();
    };
}

// Update the page when the login state changes.
onAuthStateChanged(auth, async signedInUser => {
    user = signedInUser;

    if (loginButton) loginButton.hidden = !!user;
    if (logoutButton) logoutButton.hidden = !user;

    const userElement = document.getElementById("user");

    if (userElement) {
        userElement.textContent = user
            ? "Signed in as " + (user.displayName || user.email)
            : "Not signed in";
    }

    taxonIds = [];
    highScore = 0;
    hasScore = false;

    if (user) {
        await loadData();
    }
    else {
        displayData();
        authListeners.forEach(callback => callback());
    }
});

// Export Firebase data and functions for other pages.
export function getUser() {
    return user;
}

export function getTaxonIds() {
    return taxonIds;
}

export { saveData };

export function onUserDataChange(callback) {
    authListeners.push(callback);
}
