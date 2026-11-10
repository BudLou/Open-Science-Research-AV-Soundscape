
import {
    getUser,
    getTaxonIds,
    saveData,
    onUserDataChange
} from "./firebaseAuth.js";

// HTML ELEMENTS
const birdResults = document.getElementById("bird-results");
const humboldtFilter = document.getElementById("humboldt-filter");
const galleryLoading = document.getElementById("gallery-loading");
const galleryError = document.getElementById("gallery-error");
const galleryEmpty = document.getElementById("gallery-empty");
const galleryDescription = document.getElementById("gallery-description");
const gallerySearch = document.getElementById("gallery-search");

// GALLERY VARIABLES
let currentPage = 1;
let loading = false;

async function loadBirds(reset = false) {
    if (loading) return;

    loading = true;

    galleryLoading.style.display = "block";
    galleryError.style.display = "none";
    galleryEmpty.style.display = "none";

    if (reset) {
        currentPage = 1;
        birdResults.innerHTML = "";
    }

    try {
        const url =
            "https://api.inaturalist.org/v1/observations/species_counts"
            + "?taxon_id=3"
            + "&per_page=40"
            + "&page=" + currentPage
            //the place id for humboldt county is 1247
            + (humboldtFilter.checked ? "&place_id=1247" : "");

        galleryDescription.textContent = humboldtFilter.checked
            ? "Bird species observed in Humboldt County."
            : "Explore birds from around the world.";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("API request failed.");
        }

        const data = await response.json();
        const birds = data.results.map(item => item.taxon);

        if (birds.length === 0 && currentPage === 1) {
            galleryEmpty.style.display = "block";
        }

        //create a card
        birds.forEach(bird => {
            createBirdCard(bird);
        });

        currentPage++;
        updateLoadMoreButton(birds.length);
    }
    catch (error) {
        console.error(error);
        galleryError.style.display = "block";
    }
    finally {
        loading = false;
        galleryLoading.style.display = "none";
    }
}

function createBirdCard(bird) {
    const card = document.createElement("div");
    card.className = "bird-card";

    // load the image
    const image = document.createElement("img");

    //dont load images unless you scroll down to see them
    image.loading = "lazy";
    image.alt = bird.preferred_common_name;

    if (bird.default_photo) {
        image.src = bird.default_photo.medium_url;
    }
    else {
        image.src = "placeholder.png";
    }

    //get teh common name
    const commonName = document.createElement("h3");
    commonName.textContent = bird.preferred_common_name;

    // get the scientific name
    const scientificName = document.createElement("p");
    scientificName.className = "scientific-name";
    scientificName.textContent = bird.name;

    //create the card
    card.appendChild(image);
    card.appendChild(commonName);
    card.appendChild(scientificName);
    card.appendChild(createSaveButton(bird));

    //if the card is clicked, go to birdSummary
    card.addEventListener("click", function() {
        const birdName = bird.preferred_common_name;

        window.location.href =
            "birdSummary.html?search=" + encodeURIComponent(birdName)
            + "&humboldt=" + humboldtFilter.checked;
    });

    birdResults.appendChild(card);
}

//create save button
function createSaveButton(bird) {
    const button = document.createElement("button");
    button.className = "save-bird-button";
    button.dataset.taxonId = bird.id;

    updateSaveButton(button);

    button.addEventListener("click", async function(event) {
        event.stopPropagation();

        if (!getUser()) {
            button.textContent = "Sign in to save";
            return;
        }

        const taxonIds = getTaxonIds();
        const index = taxonIds.indexOf(bird.id);
        const wasSaved = index !== -1;

        if (wasSaved) {
            taxonIds.splice(index, 1);
        }
        else {
            if (taxonIds.length >= 1000) return;
            taxonIds.push(bird.id);
        }

        updateSaveButton(button);

        try {
            await saveData();
        }
        catch (error) {
            console.error(error);

            if (wasSaved) {
                taxonIds.push(bird.id);
            }
            else {
                const newIndex = taxonIds.indexOf(bird.id);
                if (newIndex !== -1) taxonIds.splice(newIndex, 1);
            }

            updateSaveButton(button);
        }
    });

    return button;
}

//update save button text
function updateSaveButton(button) {
    const id = Number(button.dataset.taxonId);

    if (!getUser()) {
        button.textContent = "Sign in to save";
    }
    else {
        button.textContent = getTaxonIds().includes(id)
            ? "Saved"
            : "Save";
    }
}

//button to load more birds
function updateLoadMoreButton(numberOfBirds) {
    let button = document.getElementById("load-more-button");

    if (!button) {
        button = document.createElement("button");
        button.id = "load-more-button";
        button.textContent = "Load More Birds";

        button.addEventListener("click", function() {
            loadBirds();
        });

        birdResults.parentElement.appendChild(button);
    }

    button.style.display = numberOfBirds === 40 ? "block" : "none";
}

//reloads the birds when humboldt filter is clicked
humboldtFilter.addEventListener("change", function() {
    loadBirds(true);
});

//go to birdSummary page for search
gallerySearch.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        const searchName = gallerySearch.value.trim();

        if (searchName !== "") {
            window.location.href =
                "birdSummary.html?search=" + encodeURIComponent(searchName)
                + "&humboldt=" + humboldtFilter.checked;
        }
    }
});

//update save buttons when login state or saved birds change
onUserDataChange(() => {
    document.querySelectorAll(".save-bird-button").forEach(button => {
        updateSaveButton(button);
    });
});

//load on page startup
loadBirds(true);
