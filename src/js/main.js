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

let useMock = false;

async function fetchMovieDataAndReview(searchQuery) {
    if (useMock) {
        return mockData.results[0];
    } else {
            try {
                const tmdbResponse = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(searchQuery)}&api_key=${tmdbApiKey}`);
                const tmdbData = await tmdbResponse.json();

                if (tmdbData.results.length > 0) {
                    console.log(tmdbData.results[0].title);

                    const movieData = {
                        movieTitle: tmdbData.results[0].title,
                        releaseDate: tmdbData.results[0].release_date,
                        moviePoster: tmdbData.results[0].poster_path,
                        movieOverview: tmdbData.results[0].overview,
                    };
                    
                    const movieId = tmdbData.results[0].id;
                    console.log("movie id " + movieId);

                    
                    const tmdbDataExtendedResponse = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}&language=en-US&append_to_response=credits`);
                    const tmdbDataExtended = await tmdbDataExtendedResponse.json();

                    let runTimeMinutes = tmdbDataExtended.runtime;
                    let hours = Math.floor(runTimeMinutes / 60);
                    let minutes = runTimeMinutes % 60;

                    movieData.runTime = `${hours}h ${minutes}m`;                

                    const director = tmdbDataExtended.credits.crew.find(person => person.job === "Director");
                    const directorName = director.name;
                    console.log("director " + directorName);

                    const releaseYear = movieData.releaseDate.split('-')[0];

                    if (releaseYear) {
                        const nytResponse = await fetch(`https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${encodeURIComponent(searchQuery + " " + directorName)}&fq=section_name:"Movies"%20AND%20type_of_material:"Review"%20AND%20pub_year:"${releaseYear}"&api-key=${nytApiKey}`);
                        const nytData = await nytResponse.json();

                        if (nytData.response && nytData.response.docs.length > 0) {
                            movieData.reviewUrl = nytData.response.docs[0].web_url;
                            movieData.reviewAbstract = nytData.response.docs[0].abstract;
                            movieData.headlineMain = nytData.response.docs[0].headline.main;
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
            <div class="tmdb">
                <img src="https://image.tmdb.org/t/p/w500/${movieData.moviePoster}" alt="Filmposter av ${movieData.movieTitle}" class="movie-poster">
                <div class="tmdb-info">
                    <h2>${movieData.movieTitle}</h2>
                    <h3>${movieData.releaseDate.split('-')[0]} • ${movieData.runTime}</h3>
                    <p>${movieData.movieOverview}</p>
                    <p>Data provided by:</p>
                    <a href="https://www.themoviedb.org/">
                        <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_1-5bdc75aaebeb75dc7ae79426ddd9be3b2be1e342510f8202baf6bffa71d7f5c4.svg" alt="Data provided by The Movie Database">
                    </a>
                </div>
            </div>
        `;

        const wordCount = movieData.reviewAbstract ? movieData.reviewAbstract.split(' ').length : 0;
        const reviewText = wordCount > 20 ? movieData.headlineMain : movieData.reviewAbstract;

        if (movieData.reviewAbstract) {
            movieHtml += `
                <div class="nyt">
                    <blockquote>
                        <h2>${reviewText}</h2>
                        <p>${movieData.reviewLeadParagraph}</p>
                        <cite>- ${movieData.reviewer}</cite>
                    </blockquote>
                    <p>Läs hela recensionen på <a href="${movieData.reviewUrl}">New York Times.</a></p>
                    <a href="https://developer.nytimes.com/">
                        <img src="https://developer.nytimes.com/files/poweredby_nytimes_200c.png?v=1583354208354" alt="Data provided by New York Times-logo">
                    </a>
                </div>
            `;
        } else {
            movieHtml += `<p class="no-review">Ingen recension hittades.</p>`;
        }

        movieHtml += `</div>`;
        moviesEl.innerHTML = movieHtml;
    } else {
        moviesEl.innerHTML = `<p class="no-data">Inga filmer hittades med den angivna söktermen.</p>`;
    }
}


document.getElementById('search-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    this.classList.add('form-moved');
    document.body.classList.add('body-bg');
    document.querySelector('h1').classList.add('green-color');
    document.querySelector('.blink-cursor').classList.add('green-cursor');
    document.querySelector('#info-trigger').classList.add('info-trigger-white');
    document.getElementById('movies').classList.add('movies-styles');
    document.getElementById('favorites').style.display = 'none';
    const searchInput = document.getElementById('search-box');
    const searchQuery = document.getElementById('search-box').value;
    searchInput.placeholder = "Sök efter en ny film...";
    const data = await fetchMovieDataAndReview(searchQuery);
    updateDOMWithMovieData(data);
})


document.querySelectorAll('.movie-pick').forEach(pick => {
    pick.addEventListener('click', function() {
        const movieTitle = this.querySelector('.movie-title').textContent;
        fetchMovieDataAndReview(movieTitle).then(data => {
            document.getElementById('search-form').classList.add('form-moved');
            document.body.classList.add('body-bg');
            document.querySelector('h1').classList.add('green-color');
            document.querySelector('.blink-cursor').classList.add('green-cursor');
            document.querySelector('#info-trigger').classList.add('info-trigger-white');
            document.getElementById('movies').classList.add('movies-styles');
            document.getElementById('favorites').style.display = 'none';
            updateDOMWithMovieData(data);
        });
    });
});