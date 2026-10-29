// Homepage search elements
const searchForm = document.getElementById("birdSearchForm");
const searchInput = document.getElementById("birdSearchInput");
const searchMessage = document.getElementById("searchMessage");

// Handle homepage search
searchForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const search = searchInput.value.trim();

    if (search === "") {
        searchMessage.textContent = "Please enter a bird name.";
        return;
    }

    // Redirect to bird summary with search term
    window.location.href =
        "./birdsummary.html?search=" + encodeURIComponent(search);

});