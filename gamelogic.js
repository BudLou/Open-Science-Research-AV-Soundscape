
/*
 * BIRD GUESSING GAME
 * Uses iNaturalist to find real bird calls.
 */


/* ----------------------------------
   BIRD INFORMATION
---------------------------------- */

const birdData = [
    {
        name: "Harpy Eagle",
        id: "Harpy Eagle",
        image: "images/harpy-eagle.jpg"
    },
    {
        name: "Blue Jay",
        id: "Blue Jay",
        image: "images/blue-jay.jpg"
    },
    {
        name: "Steller's Jay",
        id: "Steller's Jay",
        image: "images/stellers-jay.jpg"
    },
    {
        name: "Eastern Loggerhead Shrike",
        id: "Eastern Loggerhead Shrike",
        image: "images/eastern-loggerhead-shrike.jpg"
    },
    {
        name: "Owl Finch",
        id: "Owl Finch",
        image: "images/owl-finch.jpg"
    },
    {
        name: "Eastern Wood Pewee",
        id: "Eastern Wood Pewee",
        image: "images/eastern-wood-pewee.jpg"
    },
    {
        name: "Baikal Teal",
        id: "Baikal Teal",
        image: "images/baikal-teal.jpg"
    },
    {
        name: "Black Skimmer",
        id: "Black Skimmer",
        image: "images/black-skimmer.jpg"
    }
];


/* ----------------------------------
   HTML ELEMENTS
---------------------------------- */

// Allows us to access HTML elements by their IDs.
const $ = document.getElementById.bind(document);


/* ----------------------------------
   GAME VARIABLES
---------------------------------- */

let round = 0;
let score = 0;
let correct = 0;
let incorrect = 0;

let deck = [];
let current = null;
let answered = false;

let best = Number(sessionStorage.getItem("bestScore") || 0);

// Keeps track of the current audio search.
let currentSoundRequest = 0;

// Creates an audio player for the bird recordings.
const birdAudio = new Audio();

// Display the saved best score.
$("best").textContent = best;


/* ----------------------------------
   SHUFFLE BIRDS
---------------------------------- */

function shuffle(array) {

    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}


/* ----------------------------------
   DIFFICULTY SETTINGS
---------------------------------- */

function countChoices() {

    return {
        easy: 3,
        medium: 4,
        hard: 6
    }[$("difficulty").value] || 3;
}


/* ----------------------------------
   AUDIO FUNCTIONS
---------------------------------- */

// Stop the previous bird recording.
function stopBirdAudio() {

    currentSoundRequest++;

    birdAudio.pause();

    // Only reset playback position when a recording exists.
    if (birdAudio.src) {
        birdAudio.currentTime = 0;
    }

    birdAudio.removeAttribute("src");
    birdAudio.load();

    $("listen").disabled = true;
    $("listen").textContent = "Loading Bird Call...";
}


// Find the iNaturalist taxon for a bird.
async function findBirdTaxon(birdName) {

    const url =
        "https://api.inaturalist.org/v1/taxa/autocomplete"
        + "?q=" + encodeURIComponent(birdName)
        + "&rank=species"
        + "&per_page=10";

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to find bird species.");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return null;
    }

    // Prefer a result with an exact common-name match.
    const exactMatch = data.results.find(taxon => {

        return (
            taxon.preferred_common_name?.toLowerCase()
            === birdName.toLowerCase()
        );

    });

    // Otherwise try an exact scientific-name match.
    const scientificMatch = data.results.find(taxon => {

        return (
            taxon.name?.toLowerCase()
            === birdName.toLowerCase()
        );

    });

    return exactMatch || scientificMatch || data.results[0];
}


// Search iNaturalist for actual bird recordings.

async function searchBirdSound(bird) {

    stopBirdAudio();

    const requestId = currentSoundRequest;

    try {

        // Find the bird's taxon ID.
        const taxon = await findBirdTaxon(bird.id);

        if (requestId !== currentSoundRequest) {
            return;
        }

        if (!taxon) {
            throw new Error("Bird species not found.");
        }

        console.log("Bird:", bird.name);
        console.log("Taxon ID:", taxon.id);

        // Search for observations containing audio.
        const url =
            "https://api.inaturalist.org/v1/observations"
            + "?taxon_id=" + encodeURIComponent(taxon.id)
            + "&sounds=true"
            + "&per_page=30";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to retrieve bird recordings.");
        }

        const data = await response.json();

        if (requestId !== currentSoundRequest) {
            return;
        }

        // Find an observation with a usable audio URL.
        let audioUrl = null;

        for (const observation of data.results) {

            if (!observation.sounds) {
                continue;
            }

            const sound = observation.sounds.find(item => {
                return item.file_url || item.url;
            });

            if (sound) {
                audioUrl = sound.file_url || sound.url;
                break;
            }
        }

        if (!audioUrl) {

            console.log("No recording found for:", bird.name);

            $("listen").disabled = true;
            $("listen").textContent = "No Bird Call Available";

            return;
        }

        console.log("Bird audio URL:", audioUrl);

        // Set up the audio player.
        birdAudio.oncanplay = function() {

            if (requestId !== currentSoundRequest) {
                return;
            }

            $("listen").disabled = false;
            $("listen").textContent = "▶ Play Bird Call";

            console.log("Bird recording is ready!");
        };

        birdAudio.onerror = function() {

            if (requestId !== currentSoundRequest) {
                return;
            }

            $("listen").disabled = true;
            $("listen").textContent = "Bird Call Unavailable";

            console.error("Audio loading failed:", birdAudio.error);
        };

        // Load the recording.
        birdAudio.src = audioUrl;
        birdAudio.load();

    } catch (error) {

        if (requestId !== currentSoundRequest) {
            return;
        }

        console.error("Bird audio error:", error);

        $("listen").disabled = true;
        $("listen").textContent = "Bird Call Unavailable";
    }
}



// Play or pause the actual bird recording.
function playCall() {

    if (!birdAudio.src) {
        return;
    }

    if (birdAudio.paused) {

        birdAudio.play().then(() => {

            $("listen").textContent = "⏸ Pause Bird Call";

        }).catch(error => {

            console.error("Audio playback error:", error);

            $("listen").textContent = "▶ Play Bird Call";
        });

    } else {

        birdAudio.pause();

        $("listen").textContent = "▶ Play Bird Call";
    }
}


// Change the button when the recording finishes.
birdAudio.addEventListener("ended", function() {

    $("listen").textContent = "▶ Play Bird Call";

});


// Update the button if the recording is paused.
birdAudio.addEventListener("pause", function() {

    if (birdAudio.currentTime > 0 && !birdAudio.ended) {
        $("listen").textContent = "▶ Play Bird Call";
    }

});


/* ----------------------------------
   START OR RESTART GAME
---------------------------------- */

function resetGame() {

    round = 0;
    score = 0;
    correct = 0;
    incorrect = 0;

    // Stop the previous bird recording.
    stopBirdAudio();

    // Randomly choose six different birds.
    deck = shuffle(birdData).slice(0, 6);

    // Reset the counters.
    $("score").textContent = score;
    $("correct").textContent = correct;
    $("incorrect").textContent = incorrect;

    // Display the game.
    $("end").style.display = "none";
    $("game").style.display = "grid";

    // Display the first bird.
    showRound();
}


/* ----------------------------------
   DISPLAY CURRENT ROUND
---------------------------------- */

function showRound() {

    // Check whether all six rounds are finished.
    if (round >= deck.length) {

        finish();
        return;
    }

    // Get the bird for this round.
    current = deck[round];

    answered = false;

    // Update round counter.
    $("progress").textContent =
        `${round + 1} / ${deck.length}`;

    // Display bird image.
    $("specimen").textContent = "Mystery Bird";

    $("birdImage").src = current.image;
    $("birdImage").alt = "Bird to identify";

    // Clear previous feedback.
    $("feedback").textContent = "";
    $("feedback").className = "feedback";

    // Disable next button until the player answers.
    $("next").disabled = true;

    $("next").textContent =
        round === deck.length - 1
            ? "See results →"
            : "Next bird →";

    // Search for the actual bird recording.
    searchBirdSound(current);

    // Create answer choices.
    const options = shuffle([
        current,
        ...shuffle(
            birdData.filter(
                bird => bird.name !== current.name
            )
        ).slice(0, countChoices() - 1)
    ]);

    // Remove previous answer buttons.
    $("answers").innerHTML = "";

    // Create a button for each answer.
    options.forEach(bird => {

        const button = document.createElement("button");

        button.className = "answer";
        button.textContent = bird.name;

        // Check the answer when clicked.
        button.onclick = () => guess(bird, button);

        $("answers").appendChild(button);
    });
}


/* ----------------------------------
   CHECK PLAYER ANSWER
---------------------------------- */

function guess(bird, button) {

    if (answered) {
        return;
    }

    answered = true;

    // Disable all answer buttons.
    const answerButtons =
        $("answers").querySelectorAll("button");

    answerButtons.forEach(answerButton => {

        answerButton.disabled = true;

        // Highlight the correct answer.
        if (answerButton.textContent === current.name) {

            answerButton.classList.add("correct-answer");
        }
    });

    // Check whether the answer is correct.
    if (bird.name === current.name) {

        correct++;
        score += 1;

        $("feedback").textContent = "Correct!";
        $("feedback").className = "feedback correct";

    } else {

        incorrect++;

        $("feedback").textContent =
            `Incorrect. The correct answer is ${current.name}.`;

        $("feedback").className = "feedback incorrect";

        button.classList.add("wrong-answer");
    }

    // Update the score.
    $("score").textContent = score;
    $("correct").textContent = correct;
    $("incorrect").textContent = incorrect;

    // Allow the player to continue.
    $("next").disabled = false;
}


/* ----------------------------------
   FINISH GAME
---------------------------------- */

function finish() {

    stopBirdAudio();

    $("game").style.display = "none";
    $("end").style.display = "block";

    // Save the best score.
    if (score > best) {

        best = score;

        sessionStorage.setItem(
            "bestScore",
            String(best)
        );

        $("best").textContent = best;
    }

    // Display final results.
    $("summary").textContent =
        `Final score: ${score} points. `
        + `Correct: ${correct}. `
        + `Incorrect: ${incorrect}. `
        + `Best score: ${best}.`;
}


/* ----------------------------------
   BUTTON EVENT LISTENERS
---------------------------------- */

// Move to the next bird.
$("next").addEventListener("click", function() {

    if (answered) {

        round++;

        showRound();
    }

});

// Play or pause the actual bird call.
$("listen").addEventListener("click", playCall);

// Return to the bird summary page.
$("back").addEventListener("click", function() {
    window.location.href = "birdSummary.html";
});

// Restart the game.
$("restart").addEventListener("click", resetGame);

$("playAgain").addEventListener("click", resetGame);

// Restart when difficulty changes.
$("difficulty").addEventListener("change", resetGame);


/* ----------------------------------
   START GAME
---------------------------------- */

resetGame();
