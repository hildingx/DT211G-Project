//Initiera dotenv för att ladda miljövariabler från .env-filen
require('dotenv').config();
const nytApiKey = process.env.NYT_API_KEY;
const tmdbApiKey = process.env.TMDB_API_KEY;

const mockData = {
    results: [
        {
          "movieTitle": "Terminator 2",
          "releaseDate": "1991-07-03",
          "moviePoster": "/5M0j0B18abtBI5gi2RhfjjurTqb.jpg",
          "reviewHeadline": "Review/Film; In New 'Terminator,' The Forces of Good Seek Peace, Violently",
          "reviewUrl": "https://www.nytimes.com/1991/07/03/movies/review-film-in-new-terminator-the-forces-of-good-seek-peace-violently.html",
          "reviewAbstract": "Now he's the good guy. Fast, exciting special-effects epic.",
          "reviewLeadParagraph": "Using his imagination and not much more, James Cameron devised \"The Terminator,\" the lean, mean 1984 action film that became a classic of apocalypse-minded science fiction. What this meant, in keeping with inexorable Hollywood logic, was that Mr. Cameron would become a prime candidate for sequel sickness. He would be able to follow up his original shoestring hit with a second installment whose budget is reportedly somewhere near the $100 million mark. That figure suggests at the very least a typographical error, not to mention mistakes of a more serious kind.",
          "reviewer": "By Janet Maslin"
        },
    ],
};

let useMock = true;

async function fetchMovieDataAndReview(searchQuery) {
    if (useMock) {
        return mockData.results[0];
    } else {
            try {
                const tmdbResponse = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(searchQuery)}&api_key=${tmdbApiKey}&append_to_response=credits`);
                const tmdbData = await tmdbResponse.json();

                if (tmdbData.results.length > 0) {
                    console.log(tmdbData.results[0].title);

                    const movieData = {
                        movieTitle: tmdbData.results[0].title,
                        releaseDate: tmdbData.results[0].release_date,
                        moviePoster: tmdbData.results[0].poster_path,
                    };

                    const releaseYear = movieData.releaseDate.split('-')[0];

                    if (releaseYear) {
                        const nytResponse = await fetch(`https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${encodeURIComponent(searchQuery)}&fq=section_name:"Movies"%20AND%20type_of_material:"Review"%20AND%20pub_year:"${releaseYear}"&api-key=${nytApiKey}`);
                        const nytData = await nytResponse.json();

                        if (nytData.response && nytData.response.docs.length > 0) {
                            console.log(nytData.response.docs[0].headline.main);

                            movieData.reviewHeadline = nytData.response.docs[0].headline.main;
                            movieData.reviewUrl = nytData.response.docs[0].web_url;
                            movieData.reviewAbstract = nytData.response.docs[0].abstract;
                            movieData.reviewLeadParagraph = nytData.response.docs[0].lead_paragraph;
                            movieData.reviewer = nytData.response.docs[0].byline.original.replace("By ", "");
                        } else {
                            console.log("Inga NY Times recensioner hittades för denna film.");
                        }
                    } else {
                        console.log("Inga NY Times recensioner hittades för denna film.");
                    }

                    return movieData;
                } else {
                    console.log("Inga filmer hittades med den angivna söktermen.");
                    return null;
                }
            } catch (error) {
                console.error(error);
                return null;
            }
    }
}

function updateDOMWithMovieData(movieData) {
    const moviesEl = document.getElementById('movies');
    if (movieData) {
        let movieHtml = `
        <div class="movie">
            <p>${movieData.movieTitle}</p>
            <p>${movieData.releaseDate}</p>
            <img src="https://image.tmdb.org/t/p/w500/${movieData.moviePoster}" alt="Filmposter av ${movieData.movieTitle}" class="movie-poster">
        `;

        if (movieData.reviewHeadline) {
            movieHtml += `
                <p>${movieData.reviewHeadline}</p>
                <p>${movieData.reviewLeadParagraph}</p>
                <p>Av: ${movieData.reviewer}</p>
                <p>Läs hela recensionen på <a href="${movieData.reviewUrl}">NYT</a></p>
            `;
        } else {
            movieHtml += `<p>Ingen recension hittades.</p>`;
        }

        movieHtml += `</div>`;
        moviesEl.innerHTML = movieHtml;
    } else {
        moviesEl.innerHTML = "<p>Ingen filmdata hittades.</p>";
    }
}


document.getElementById('search-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const searchQuery = document.getElementById('search-box').value;
    const data = await fetchMovieDataAndReview(searchQuery);
    updateDOMWithMovieData(data);
})


