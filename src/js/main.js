//Initiera dotenv för att ladda miljövariabler från .env-filen
require('dotenv').config();
const nytApiKey = process.env.NYT_API_KEY;
const tmdbApiKey = process.env.TMDB_API_KEY;

async function fetchMovieDataAndReview(searchQuery) {
    try {
        const tmdbResponse = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(searchQuery)}&api_key=${tmdbApiKey}&append_to_response=credits`);
        const tmdbData = await tmdbResponse.json();

        if (tmdbData.results.length > 0) {
            console.log(tmdbData.results[0].title);

            const releaseDate = tmdbData.results[0].release_date;
            const releaseYear = releaseDate.split('-')[0];

            if (releaseYear) {
                const nytResponse = await fetch(`https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${encodeURIComponent(searchQuery)}&fq=section_name:"Movies"%20AND%20type_of_material:"Review"%20AND%20pub_year:"${releaseYear}"&api-key=${nytApiKey}`);
                const nytData = await nytResponse.json();

                if (nytData.response && nytData.response.docs.length > 0) {
                    console.log(nytData.response.docs[0].headline.main);
                    console.log("Läs mer:" + nytData.response.docs[0].web_url);
                    //h3: text: nytData.response.docs[0].abstract
                    //Inledande text: nytData.response.docs[0].lead_paragraph
                    //Av: nytData.response.docs[0].byline.original.replace("By ", "");
                } else {
                    console.log("Inga NY Times recensioner hittades för denna film.");
                }
            } else {
                console.log("Inga NY Times recensioner hittades för denna film.");
            }
        } else {
            console.log("Inga filmer hittades med den angivna söktermen.");
        }
    } catch (error) {
        console.error(error);
    }
}



document.getElementById('search-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const searchQuery = document.getElementById('search-box').value;
    //fetchMovieData(searchQuery);
    fetchMovieDataAndReview(searchQuery);
})


