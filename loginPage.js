import { auth, googleProvider } from "./firebase.js";
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// Google login.
document.getElementById("googleLogin").onclick = async () => {
    await signInWithPopup(auth, googleProvider);

    window.location.href = "./Home_page.html";
};
