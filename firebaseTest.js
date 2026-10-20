
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

// Get the user's saved data from Firestore.
function playerDoc() {
  return doc(db, "scores", user.uid);
}

// Display the taxon IDs and high score.
function displayData() {
  const list = document.getElementById("taxonList");
  list.replaceChildren();

  taxonIds.forEach(id => {
    const item = document.createElement("li");
    item.textContent = id + " ";

    const button = document.createElement("button");
    button.textContent = "Remove";

    button.onclick = async () => {
      taxonIds = taxonIds.filter(x => x !== id);
      await saveData();
      displayData();
    };

    item.append(button);
    list.append(item);
  });

  document.getElementById("highScore").textContent =
    hasScore ? highScore : "No score saved";
}

// Load the user's saved data.
async function loadData() {
  const snapshot = await getDoc(playerDoc());
  const data = snapshot.exists() ? snapshot.data() : {};

  taxonIds = data.taxonIds || [];
  hasScore = Number.isInteger(data.highScore);
  highScore = hasScore ? data.highScore : 0;

  displayData();
}

// Save the user's data.
async function saveData() {
  const data = {
    taxonIds: taxonIds,
    displayName: user.displayName || user.email || "Player",
    updatedAt: serverTimestamp()
  };

  if (hasScore) data.highScore = highScore;

  await setDoc(playerDoc(), data, { merge: true });
}

// Sign in with Google.
document.getElementById("login").onclick = () =>
  signInWithPopup(auth, googleProvider);

// Sign out.
document.getElementById("logout").onclick = () =>
  signOut(auth);

// Add a taxon ID.
document.getElementById("addTaxon").onclick = async () => {
  const id = Number(document.getElementById("taxon").value);

  if (!user || !Number.isSafeInteger(id) || id <= 0) return;
  if (taxonIds.includes(id) || taxonIds.length >= 1000) return;

  taxonIds.push(id);
  await saveData();

  document.getElementById("taxon").value = "";
  displayData();
};

// Save a high score without lowering the existing score.
document.getElementById("saveScore").onclick = async () => {
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

// Update the page when the login state changes.
onAuthStateChanged(auth, async signedInUser => {
  user = signedInUser;

  document.getElementById("login").hidden = !!user;
  document.getElementById("logout").hidden = !user;
  document.getElementById("user").textContent = user
    ? "Signed in as " + (user.displayName || user.email)
    : "Not signed in";

  taxonIds = [];
  highScore = 0;
  hasScore = false;

  if (user) await loadData();
  else displayData();
});
