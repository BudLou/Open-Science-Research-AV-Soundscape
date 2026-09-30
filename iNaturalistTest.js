// This function searches for the first observation of an animal
// on iNaturalist and gets the image URL.

async function iNaturalistTest() {

    // Change this to whatever animal you want to search for
    const search = "red-tailed hawk";

    const url =
        "https://api.inaturalist.org/v1/observations?taxon_name="
        + encodeURIComponent(search)
        + "&photos=true&per_page=1";

    // Send a GET request to the iNaturalist API
    const response = await fetch(url);

    // Convert the API response into JSON
    const data = await response.json();

    // Get the image URL from the first observation
    let imageUrl = data.results[0].photos[0].url;

    // Replace the square image with a higher quality medium image
    imageUrl = imageUrl.replace("square", "medium");

    // Print the image URL
    console.log(imageUrl);
}

// Run the function
iNaturalistTest();