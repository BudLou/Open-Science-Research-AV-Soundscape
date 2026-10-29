import { auth } from "./firebase.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const loginStatus = document.getElementById("login-status");
const signInOutButton = document.getElementById("sign-in-out-button");

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginStatus.textContent = "Logged In";
        signInOutButton.textContent = "Sign Out";
    } else {
        loginStatus.textContent = "Logged Out";
        signInOutButton.textContent = "Sign In";
    }
});

signInOutButton.onclick = async () => {
    if (auth.currentUser) {
        await signOut(auth);
    } else {
        window.location.href = "./loginPage.html";
    }
};
