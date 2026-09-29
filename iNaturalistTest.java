import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

//this class searches for the first red tailed hawk observation on iNaturalist and saves the image URL of that observation into imageURL
public class iNaturalistTest {

    public static void main(String[] args) throws Exception {

        String url = "https://api.inaturalist.org/v1/observations"
                //where the search should input should be implemented
                + "?taxon_name=red-tailed%20hawk"
                + "&photos=true&per_page=1";

        URL apiUrl = new URL(url);
        HttpURLConnection connection = (HttpURLConnection) apiUrl.openConnection();
        connection.setRequestMethod("GET");

        BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
        StringBuilder response = new StringBuilder();
        String line;

        //this pulls the entire text from the API and puts it into a string
        while ((line = reader.readLine()) != null) {
            response.append(line);
        }

        reader.close();

        String json = response.toString();
        int start = json.indexOf("\"url\":\"") + 7;
        int end = json.indexOf("\"", start);

        //this extracts the image URL from the JSON response
        String imageUrl = json.substring(start, end);

        //the api gives us a square image of crappy quality, so we replace the "square" with "medium" to get a better image
        imageUrl = imageUrl.replace("square", "medium");
    
        System.out.println(imageUrl);

        connection.disconnect();
    }
}