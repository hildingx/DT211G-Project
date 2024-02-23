require('dotenv').config();
const nytApiKey = process.env.NYT_API_KEY;
const tmdbApiKey = process.env.TMDB_API_KEY;

async function fetchReviewData() {
    try {
        const response = await fetch(`https://api.nytimes.com/svc/search/v2/articlesearch.json?fq=section_name:"Movies"%20AND%20type_of_material:"Review"&api-key=${process.env.NYT_API_KEY}`);
        const data = await response.json();

        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

//fetchReviewData();

async function fetchMovieData() {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=harry&api_key=${process.env.TMDB_API_KEY}&append_to_response=credits`);
        const data = await response.json();

        console.log(data);
    } catch {
        console.error(error);
    }
}

//fetchMovieData();

