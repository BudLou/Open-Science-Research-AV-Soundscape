
/*
 * BIRD GUESSING GAME
 */


const birdData = [
    {
        name: "Harpy Eagle",
        id: "Harpy Eagle",
        image: "images/harpy-eagle.jpg",
        call: [880]
    },
    {
        name: "Blue Jay",
        id: "Blue Jay",
        image: "images/blue-jay.jpg",
        call: [660]
    },
    {
        name: "Steller's Jay",
        id: "Steller's Jay",
        image: "images/stellers-jay.jpg",
        call: [740]
    },
    {
        name: "Eastern Loggerhead Shrike",
        id: "Eastern Loggerhead Shrike",
        image: "images/eastern-loggerhead-shrike.jpg",
        call: [800]
    },
    {
        name: "Owl Finch",
        id: "Owl Finch",
        image: "images/owl-finch.jpg",
        call: [550]
    },
    {
        name: "Eastern Wood Pewee",
        id: "Eastern Wood Pewee",
        image: "images/eastern-wood-pewee.jpg",
        call: [500]
    },
    {
        name: "Baikal Teal",
        id: "Baikal Teal",
        image: "images/baikal-teal.jpg",
        call: [400]
    },
    {
        name: "Black Skimmer",
        id: "Black Skimmer",
        image: "images/black-skimmer.jpg",
        call: [300]
    }
];

// Allows us to access HTML elements by their IDs.
const $ = document.getElementById.bind(document);

// Variables that keep track of the current game.
let round = 0;       
let score = 0;       
let correct = 0;     
let incorrect = 0;   
let deck = [];       
let current = null;  
let answered = false; 
let audioContext = null; 
let best = Number(sessionStorage.getItem("bestScore") || 0
);

// Displays the saved best score on the webpage.
$("best").textContent = best;

// Returns a randomly shuffled copy of an array.
function shuffle(array) {
    const result = [...array];

  // swaps elements into random positions.
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

// Determines how many answer choices the player receives.
function countChoices() {
    return {
        easy: 3,   
        medium: 4, 
        hard: 6    
    }[$("difficulty").value] || 3;
}

// Starts a new game or resets the current game.
function resetGame() {

    round = 0;
    score = 0;
    correct = 0;
    incorrect = 0;

    // Randomly choose six different birds for the game.
    deck = shuffle(birdData).slice(0, 6);

    // Update the score counters on the webpage.
    $("score").textContent = score;
    $("correct").textContent = correct;
    $("incorrect").textContent = incorrect;

    // Show the game and hide the results screen.
    $("end").style.display = "none";
    $("game").style.display = "grid";

    // Display the first bird.
    showRound();
}

// Displays the bird and answer choices for the current round.
function showRound() {
    // If all birds have been shown, finish the game.
    if (round >= deck.length) {
        finish();
        return;
    }

    // Select the bird for this round.
    current = deck[round];

    // Allow the user to answer the new question.
    answered = false;

    // Display the current round, as 1 / 6.
    $("progress").textContent =
        `${round + 1} / ${deck.length}`;

    // Display the image and alternative text.
    $("specimen").textContent = "Mystery Bird";
    $("birdImage").src = current.image;
    $("birdImage").alt = "Mystery bird to identify";

    // Clear feedback left over from the previous round.
    $("feedback").textContent = "";
    $("feedback").className = "feedback";

    // The player cannot advance until answering.
    $("next").disabled = true;

    // Change the button label on the last round.
    $("next").textContent =
        round === deck.length - 1
            ? "See results →"
            : "Next bird →";

    // Create the answer choices.
    const options = shuffle([
        current,
        ...shuffle(
            birdData.filter(
                bird => bird.name !== current.name
            )
        ).slice(0, countChoices() - 1)
    ]);

    // Remove the previous round's answer buttons.
    $("answers").innerHTML = "";

    // Create a button for each answer choice.
    options.forEach(bird => {
        const button = document.createElement("button");

        button.className = "answer";
        button.textContent = bird.name;

        // When clicked, check whether this bird is correct.
        button.onclick = () => guess(bird, button);

        // Add the button to the answer area in the HTML.
        $("answers").appendChild(button);
    });
}

// Checks the player's answer and updates the score.
function guess(bird, button) {
    
    if (answered) {
        return;
    }

    answered = true;

    // Find all answer buttons and disable them.
    const answerButtons =
        $("answers").querySelectorAll("button");

    answerButtons.forEach(answerButton => {
        answerButton.disabled = true;

        // Highlight the correct answer in green.
        if (answerButton.textContent === current.name) {
            answerButton.classList.add("correct-answer");
        }
    });

    // Compare the selected bird with the actual bird.
    if (bird.name === current.name) {
        correct++;
        score += 1; 

        $("feedback").textContent = "Correct";
        $("feedback").className = "feedback correct";
    } else {
        incorrect++;

        // the correct answer
        $("feedback").textContent =
            `Incorrect. The correct answer is ${current.name}.`;

        $("feedback").className = "feedback incorrect";

        // incorrect choice 
        button.classList.add("wrong-answer");
    }

    // Update the displayed score
    $("score").textContent = score;
    $("correct").textContent = correct;
    $("incorrect").textContent = incorrect;

    // Allow the player to move to the next bird.
    $("next").disabled = false;
}

// Displays the final results after all six rounds.
function finish() {
    
    $("game").style.display = "none";
    $("end").style.display = "block";

    // Save the best score 
    if (score > best) {
        best = score;

        sessionStorage.setItem(
            "bestScore",
            String(best)
        );

        // Update the best score
        $("best").textContent = best;
    }

    // Show the player's final score
    $("summary").textContent =
        `Final score: ${score} points. ` +
        `Correct: ${correct}. Incorrect: ${incorrect}. ` +
        `Best score: ${best}.`;
}

// Play  bird call. Not the actual ones curretly just tests

function playCall() {
    // Make sure a bird is selected.
    if (!current) {
        return;
    }

    // Check whether the browser supports the Web Audio API.
    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        $("feedback").textContent =
            "Audio is not supported in this browser.";
        return;
    }

    // Create the audio system the first time the button is clicked.
    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    // Resume audio if the browser has paused it.
    audioContext.resume();

    // Play each frequency in sequence.
    current.call.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        // Space each tone 0.3 seconds apart.
        const startTime =
            audioContext.currentTime + index * 0.3;

        // Set the tone frequency.
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;

        // Gradually increase and decrease the volume.
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(
            0.15,
            startTime + 0.03
        );
        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            startTime + 0.2
        );

        // Connect the oscillator to the speaker output.
        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        // Start and stop the tone.
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.22);
    });
}

// advance to the next round.

$("next").addEventListener("click", () => {
    if (answered) {
        round++;
        showRound();
    }
});

// Connect the Hear Bird Call button to the sound function.
$("listen").addEventListener("click", playCall);

// Connect both restart buttons to the reset function.
$("restart").addEventListener("click", resetGame);
$("playAgain").addEventListener("click", resetGame);

// Start a new game whenever the difficulty changes.
$("difficulty").addEventListener("change", resetGame);

// restart game
resetGame();

