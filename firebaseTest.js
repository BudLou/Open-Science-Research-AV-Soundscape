
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

const $ = id => document.getElementById(id);

let currentUser = null;
let taxonIds = [];
let highScore = 0;
let hasScore = false;

function playerDoc() {
  return doc(db, "scores", currentUser.uid);
}

function render() {
  $("taxonList").replaceChildren();

  taxonIds.forEach(id => {
    const li = document.createElement("li");
    li.append(document.createTextNode(id + " "));

    const button = document.createElement("button");
    button.textContent = "Remove";

    button.onclick = async () => {
      const previous = [...taxonIds];
      taxonIds = taxonIds.filter(x => x !== id);

      try {
        await saveData();
        render();
        $("status").textContent = "Taxon ID removed.";
      } catch (e) {
        taxonIds = previous;
        render();
        $("status").textContent = e.message;
      }
    };

    li.append(button);
    $("taxonList").append(li);
  });

  $("highScore").textContent =
    hasScore ? highScore : "No score saved";
}

async function loadData() {
  const snap = await getDoc(playerDoc());
  const data = snap.exists() ? snap.data() : {};

  taxonIds = data.taxonIds || [];
  hasScore = Number.isInteger(data.highScore);
  highScore = hasScore ? data.highScore : 0;

  render();
}

async function saveData() {
  const data = {
    taxonIds,
    displayName: currentUser.displayName || currentUser.email || "Player",
    updatedAt: serverTimestamp()
  };

  if (hasScore) data.highScore = highScore;

  await setDoc(playerDoc(), data, { merge: true });
}

$("login").onclick = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    $("status").textContent = e.message;
  }
};

$("logout").onclick = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    $("status").textContent = e.message;
  }
};

$("addTaxon").onclick = async () => {
  if (!currentUser)
    return $("status").textContent = "Sign in first.";

  const value = $("taxon").value;
  const id = Number(value);

  if (!value || !Number.isSafeInteger(id) || id <= 0)
    return $("status").textContent = "Enter a valid taxon ID.";

  if (taxonIds.includes(id))
    return $("status").textContent = "ID already exists.";

  if (taxonIds.length >= 1000)
    return $("status").textContent = "Maximum 1,000 IDs.";

  taxonIds.push(id);

  try {
    await saveData();
    $("taxon").value = "";
    render();
    $("status").textContent = "Taxon ID saved.";
  } catch (e) {
    taxonIds = taxonIds.filter(x => x !== id);
    render();
    $("status").textContent = e.message;
  }
};

$("saveScore").onclick = async () => {
  if (!currentUser)
    return $("status").textContent = "Sign in first.";

  const value = $("score").value;
  const score = Number(value);

  if (value === "" || !Number.isSafeInteger(score) || score < 0)
    return $("status").textContent = "Enter a valid score.";

  if (hasScore && score < highScore)
    return $("status").textContent = "You cannot lower your high score.";

  const oldScore = highScore;
  const oldHasScore = hasScore;

  highScore = score;
  hasScore = true;

  try {
    await saveData();
    render();
    $("status").textContent = "High score saved.";
  } catch (e) {
    highScore = oldScore;
    hasScore = oldHasScore;
    render();
    $("status").textContent = e.message;
  }
};

onAuthStateChanged(auth, async user => {
  currentUser = user;
  $("login").hidden = !!user;
  $("logout").hidden = !user;
  $("user").textContent = user
    ? "Signed in as " + (user.displayName || user.email)
    : "Not signed in";

  if (user) {
    try {
      await loadData();
      $("status").textContent = "Data loaded.";
    } catch (e) {
      $("status").textContent = e.message;
    }
  } else {
    taxonIds = [];
    highScore = 0;
    hasScore = false;
    render();
  }
});
