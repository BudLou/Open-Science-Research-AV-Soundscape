
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("bird-search");

const birdResults = document.getElementById("bird-results");
const resultCount = document.getElementById("result-count");


const loadingMessage = document.getElementById("loading-message");
const errorMessage = document.getElementById("error-message");
const emptyMessage = document.getElementById("empty-message");


const birdImage = document.getElementById("selected-bird-image");
const imagePlaceholder = document.getElementById("image-placeholder");

const birdCommonName = document.getElementById("bird-common-name");
const birdScientificName = document.getElementById("bird-scientific-name");
const birdDescription = document.getElementById("bird-description");

const birdWingspan = document.getElementById("bird-wingspan");
const birdHabitat = document.getElementById("bird-habitat");
const birdStatus = document.getElementById("bird-status");


const birdAudio = document.getElementById("bird-audio");
const playAudioButton = document.getElementById("play-audio-button");

//variable for checkbox for humboldt filter
const checkboxFilter = document.getElementById("humboldt-filter");

loadingMessage.style.display = "none";
errorMessage.style.display = "none";
emptyMessage.style.display = "none";


let previousSearches = [];


let currentSearch = 0;

const showMoreButton = 
    document.getElementById("show-more-button");

let currentPage = 1;
let currentBirdSearch = "";
let totalObservations = 0;
let loadedObservations = 0;
let isLoadingMore = false;

const resultsPerPage = 20;

showMoreButton.hidden = true;


searchForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const search = searchInput.value.trim();

    if (search === "") {
        return;
    }

    searchBird(search);

});

//this function reloads the search if there is something in the search bar and the county button is clicked/unclicked
checkboxFilter.addEventListener("change", function() {

    const search = searchInput.value.trim();

    if (search !== "") {

        searchBird(search);

    }

});

// Check for a search sent from the homepage
const urlParams = new URLSearchParams(window.location.search);

const homepageSearch = urlParams.get("search");

// NEW: Check whether the Humboldt filter was selected in the gallery
const humboldtFilter = urlParams.get("humboldt");

if (humboldtFilter === "true") {
    checkboxFilter.checked = true;
}

if (homepageSearch && homepageSearch.trim() !== "") {

    // Display the search in the sidebar
    searchInput.value = homepageSearch;

    // Run the existing search function
    searchBird(homepageSearch.trim());

}


async function searchBird(search) {

    const searchId = ++currentSearch;
    currentPage = 1;
    currentBirdSearch = search;
    totalObservations = 0;
    loadedObservations = 0;
    isLoadingMore = false;

    showMoreButton.hidden = true;
    showMoreButton.disabled = false;
    showMoreButton.textContent = "Show More";

    loadingMessage.style.display = "block";

    errorMessage.style.display = "none";
    emptyMessage.style.display = "none";

    birdResults.replaceChildren();
    clearSelectedBird();

    resultCount.textContent = "Searching for " + search + "...";


    const url =
        "https://api.inaturalist.org/v1/observations"
        + "?taxon_name=" + encodeURIComponent(search)
        + "&taxon_id=3"
        + "&photos=true"
        + "&per_page=" + resultsPerPage
        + "&page=" + currentPage;
        //the place id for humboldt county is 1247
        + (checkboxFilter.checked ? "&place_id=1247" : "");

        //debugging
    console.log(url);

    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to connect to iNaturalist");
        }

        const data = await response.json();

        if (searchId !== currentSearch) {
            return;
        }

        loadingMessage.style.display = "none";

        if (data.results.length === 0) {

            emptyMessage.style.display = "block";

            resultCount.textContent =
                "No results found for " + search;

            return;
        }

        if (!previousSearches.includes(search)) {
            previousSearches.push(search);
        }

        totalObservations = data.total_results;
        loadedObservations = data.results.length;

        resultCount.textContent =
            "Showing " + loadedObservations
            + " of " + totalObservations
            + " observations for " + search;

        // Display first 20 results
        displayBirdResults(data.results);

        // Show button if more results are available
        showMoreButton.hidden =
            loadedObservations >= totalObservations;

        const firstBird = data.results.find(
            observation => observation.photos?.length > 0
        );

        if (firstBird) {
            selectBird(firstBird);
        }

    } catch (error) {

        if (searchId !== currentSearch) {
            return;
        }

        console.error("iNaturalist Error:", error);

        loadingMessage.style.display = "none";
        errorMessage.style.display = "block";

        resultCount.textContent =
            "Search could not be completed.";

    }

}


function displayBirdResults(observations) {

    //replacing the delete do not add a delete function
    observations.forEach(function(observation) {


    observations.forEach(function(observation) {

        if (!observation.photos?.length) {
            return;
        }

        const photo = observation.photos[0];


        const imageUrl = photo.url.replace(
            "square",
            "medium"
        );


        const commonName =
            observation.taxon?.preferred_common_name
            || observation.species_guess
            || "Unknown Bird";


        const scientificName =
            observation.taxon?.name
            || "Unknown";

        const card = document.createElement("div");
        card.className = "bird-card";

        const image = document.createElement("img");

        image.src = imageUrl;
        image.alt = commonName;
        image.loading = "lazy";

        const name = document.createElement("h3");
        name.textContent = commonName;

        const scientific = document.createElement("p");

        scientific.className = "scientific-name";
        scientific.textContent = scientificName;

        const link = document.createElement("a");

        link.href =
            "https://www.inaturalist.org/observations/"
            + observation.id;

        link.target = "_blank";
        link.rel = "noopener noreferrer";

        link.textContent = "View Observation";

        card.appendChild(image);
        card.appendChild(name);
        card.appendChild(scientific);
        card.appendChild(link);

        card.addEventListener("click", function(event) {

            if (event.target.closest("a")) {
                return;
            }

            selectBird(observation);

        });

        birdResults.appendChild(card);

    });

}


function selectBird(observation) {

    const commonName =
        observation.taxon?.preferred_common_name
        || observation.species_guess
        || "Unknown Bird";

    const scientificName =
        observation.taxon?.name
        || "Unknown";

    birdCommonName.textContent = commonName;
    birdScientificName.textContent = scientificName;
    searchHumboldtArticles(commonName, scientificName);

    if (observation.photos?.length > 0) {

        let imageUrl = observation.photos[0].url;

        imageUrl = imageUrl.replace(
            "square",
            "large"
        );

        birdImage.src = imageUrl;
        birdImage.alt = commonName;

        birdImage.style.display = "block";
        imagePlaceholder.style.display = "none";

    } else {

        birdImage.removeAttribute("src");
        birdImage.style.display = "none";
        imagePlaceholder.style.display = "flex";

    }

    const location =
        observation.place_guess
        || "Location unavailable";

    const date =
        observation.observed_on
        || "Date unavailable";

    const description =
        observation.description
        || "No description provided for this observation.";

    birdDescription.textContent =
        description
        + "\n\nObserved: " + date
        + "\nLocation: " + location;

    birdDescription.style.whiteSpace = "pre-line";

    birdWingspan.textContent = "N/A";
    birdHabitat.textContent = "N/A";
    birdStatus.textContent = "N/A";


    birdAudio.pause();
    birdAudio.removeAttribute("src");
    birdAudio.load();

    playAudioButton.disabled = true;

    const taxonId = observation.taxon?.id;

    if (taxonId) {
        searchBirdSound(taxonId, currentSearch);
    } else {
        playAudioButton.disabled = true;
        playAudioButton.textContent = "No Bird Call Available";
    }

}


playAudioButton.addEventListener("click", function() {

    if (birdAudio.paused) {

        birdAudio.play().catch(function(error) {
            console.error("Audio playback error:", error);
        });

        playAudioButton.textContent = "Pause Bird Call";

    } else {

        birdAudio.pause();

        playAudioButton.textContent = "Play Bird Call";

    }

});



function clearSelectedBird() {

    document.getElementById("article-link-1").hidden = true;
    document.getElementById("article-link-2").hidden = true;

    birdImage.removeAttribute("src");
    birdImage.style.display = "none";

    imagePlaceholder.style.display = "flex";

    birdCommonName.textContent = "Search for a bird";
    birdScientificName.textContent = "";

    birdDescription.textContent =
        "Search for a bird to view information about the species.";

    birdWingspan.textContent = "--";
    birdHabitat.textContent = "--";
    birdStatus.textContent = "--";

    birdAudio.pause();
    birdAudio.removeAttribute("src");
    birdAudio.load();

    playAudioButton.disabled = true;
    playAudioButton.textContent = "▶ Play Bird Call";
}

//must be here to prevent overwrites
let currentSoundRequest = 0;

async function searchBirdSound(taxonId, searchId) {


    const soundRequestId = ++currentSoundRequest;

    playAudioButton.disabled = true;
    playAudioButton.textContent = "Loading Bird Call...";

    const url =
        "https://api.inaturalist.org/v1/observations"
        + "?taxon_id=" + encodeURIComponent(taxonId)
        + "&sounds=true"
        + "&per_page=20";

    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to retrieve bird sounds");
        }

        const data = await response.json();

        //do not remove; debugged the first time it messed up, and I am not sure if it will run correctly without (might change later)
        console.log("Sound search taxon ID:", taxonId);
        console.log("Sound API URL:", url);
        console.log("Total sound observations:", data.total_results);
        console.log("First sound observation:", data.results[0]);
        console.log("Sounds array:", data.results[0]?.sounds);

        if (
            searchId !== currentSearch ||
            soundRequestId !== currentSoundRequest
        ) {
            return;
        }

        const soundObservation = data.results.find(
            observation =>
                observation.sounds?.some(
                    sound => sound.file_url || sound.url
                )
        );

        if (!soundObservation) {
            playAudioButton.textContent = "No Bird Call Available";
            return;
        }

        const sound = soundObservation.sounds.find(
            sound => sound.file_url || sound.url
        );

        const audioUrl = sound.file_url || sound.url;
        console.log("Selected audio URL:", audioUrl);

        birdAudio.src = audioUrl;
        birdAudio.load();

        playAudioButton.disabled = false;
        playAudioButton.textContent = "▶ Play Bird Call";

        console.log("Bird sound:", sound.file_url);

    } catch (error) {

        if (
            searchId !== currentSearch ||
            soundRequestId !== currentSoundRequest
        ) {
            return;
        }

        console.error("Bird sound error:", error);

        playAudioButton.disabled = true;
        playAudioButton.textContent = "Bird Call Unavailable";
    }
}

//Humboldt Digital Commons Search
function searchHumboldtArticles(commonName, scientificName) {

    const link1 = document.getElementById("article-link-1");
    const link2 = document.getElementById("article-link-2");

    const baseUrl =
        "https://digitalcommons.humboldt.edu/do/search/";

    const commonUrl =
        baseUrl
        + "?q=" + encodeURIComponent(commonName)
        + "&start=0&context=1";

    const scientificUrl =
        baseUrl
        + "?q=" + encodeURIComponent(scientificName)
        + "&start=0&context=1";

    link1.href = commonUrl;
    link1.textContent = "Research: " + commonName;
    link1.hidden = false;

    link2.href = scientificUrl;
    link2.textContent = "Research: " + scientificName;
    link2.hidden = false;
}

//Load more option
showMoreButton.addEventListener("click", loadMoreBirds);

async function loadMoreBirds() {

    // Prevent multiple requests
    if (isLoadingMore) {
        return;
    }

    if (loadedObservations >= totalObservations) {
        showMoreButton.hidden = true;
        return;
    }

    isLoadingMore = true;

    showMoreButton.disabled = true;
    showMoreButton.textContent = "Loading...";

    const searchId = currentSearch;
    const nextPage = currentPage + 1;

    const url =
        "https://api.inaturalist.org/v1/observations"
        + "?taxon_name="
        + encodeURIComponent(currentBirdSearch)
        + "&taxon_id=3"
        + "&photos=true"
        + "&per_page=" + resultsPerPage
        + "&page=" + nextPage;

    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to load more observations");
        }

        const data = await response.json();

        // Ignore results if the user started a new search
        if (searchId !== currentSearch) {
            return;
        }

        currentPage = nextPage;

        displayBirdResults(data.results);

        loadedObservations += data.results.length;

        resultCount.textContent =
            "Showing " + loadedObservations
            + " of " + totalObservations
            + " observations for "
            + currentBirdSearch;

        if (
            loadedObservations >= totalObservations ||
            data.results.length === 0
        ) {
            showMoreButton.hidden = true;
        }

    } catch (error) {

        if (searchId !== currentSearch) {
            return;
        }

        console.error("Load more error:", error);

        showMoreButton.textContent = "Try Again";

    } finally {

        if (searchId === currentSearch) {
            isLoadingMore = false;
            showMoreButton.disabled = false;

            if (showMoreButton.textContent !== "Try Again") {
                showMoreButton.textContent = "Show More";
            }
        }

    }
}
