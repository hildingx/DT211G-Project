//Initiera dotenv för att ladda miljövariabler från .env-filen
require('dotenv').config();
const nytApiKey = process.env.NYT_API_KEY;
const tmdbApiKey = process.env.TMDB_API_KEY;

//Hämta data från TMDB-API och Nytimes-API baserat på söksträng
async function fetchMovieDataAndReview(searchQuery) {
    try { 
        const tmdbResponse = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(searchQuery)}&api_key=${tmdbApiKey}`); //EncodeURIComponent gör söksträng "URL-vänlig"
        const tmdbData = await tmdbResponse.json();

        //Skapa objekt med hämtade egenskaper från fetchad data
        if (tmdbData.results.length > 0) {
            const movieData = {
                movieTitle: tmdbData.results[0].title,
                releaseDate: tmdbData.results[0].release_date,
                moviePoster: tmdbData.results[0].poster_path,
                movieOverview: tmdbData.results[0].overview,
            };
            
            //Hämta film-ID för att kunna hämta data med mer utökade egenskaper från ett annat TMDB-api
            const movieId = tmdbData.results[0].id;
            
            const tmdbDataExtendedResponse = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}&language=en-US&append_to_response=credits`);
            const tmdbDataExtended = await tmdbDataExtendedResponse.json();

            //Konvertera egenskapen runtime från minuter till h m
            let runTimeMinutes = tmdbDataExtended.runtime;
            let hours = Math.floor(runTimeMinutes / 60);
            let minutes = runTimeMinutes % 60;

            movieData.runTime = `${hours}h ${minutes}m`;                

            //Hitta namn på regisör
            const director = tmdbDataExtended.credits.crew.find(person => person.job === "Director");
            const directorName = director.name;

            //Plocka ut release-år från releasedatum
            const releaseYear = movieData.releaseDate.split('-')[0];

            //Hämta data från Nytimes API med söksträng + regissör + årtal
            if (releaseYear) {
                const nytResponse = await fetch(`https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${encodeURIComponent(searchQuery + " " + directorName)}&fq=section_name:"Movies"%20AND%20type_of_material:"Review"%20AND%20pub_year:"${releaseYear}"&api-key=${nytApiKey}`);
                const nytData = await nytResponse.json();

                //Om svar erhålles lägg in ytterligare egenskaper i objektet movieData.
                if (nytData.response && nytData.response.docs.length > 0) {
                    movieData.reviewUrl = nytData.response.docs[0].web_url;
                    movieData.reviewAbstract = nytData.response.docs[0].abstract;
                    movieData.headlineMain = nytData.response.docs[0].headline.main;
                    movieData.reviewLeadParagraph = nytData.response.docs[0].lead_paragraph;
                    movieData.reviewer = nytData.response.docs[0].byline.original.replace("By ", "");
                }
            }
            return movieData;
        } else {
            return null;
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}

//Funktion tar emot obj movieData och skriver ut i HTML
function updateDOMWithMovieData(movieData) {
    const moviesEl = document.getElementById('movies');
    //Skriver ut data hämtad från TMDB
    if (movieData) {
        let movieHtml = `
        <div class="movie">
            <div class="tmdb">
                <img src="https://image.tmdb.org/t/p/w500/${movieData.moviePoster}" alt="Filmposter av ${movieData.movieTitle}" class="movie-poster">
                <div class="tmdb-info">
                    <h2>${movieData.movieTitle}</h2>
                    <h3>${movieData.releaseDate.split('-')[0]} • ${movieData.runTime}</h3>
                    <p>${movieData.movieOverview}</p>
                    <p>This product uses the TMDB API but is <br>not endorsed or certified by TMDB.</p>
                    <a href="https://www.themoviedb.org/">
                        <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_1-5bdc75aaebeb75dc7ae79426ddd9be3b2be1e342510f8202baf6bffa71d7f5c4.svg" alt="Data provided by The Movie Database">
                    </a>
                </div>
            </div>
        `;

        //Om abstract innehåller mer än 20 ord väljs headline istället. (Detta för att egenskaperna i Nytimes API skiljer sig lite från film till film. Ibland är abstract att föredra som titel, ibland är headline att föredra)
        const wordCount = movieData.reviewAbstract ? movieData.reviewAbstract.split(' ').length : 0;
        const reviewText = wordCount > 20 ? movieData.headlineMain : movieData.reviewAbstract;

        //Skriver ut data hämtad från NyTimes
        if (movieData.reviewAbstract) {
            movieHtml += `
                <div class="nyt">
                    <blockquote>
                        <h2>${reviewText}</h2>
                        <p>${movieData.reviewLeadParagraph}</p>
                        <cite>- ${movieData.reviewer}</cite>
                    </blockquote>
                    <p>Läs hela recensionen på <a href="${movieData.reviewUrl}" target=”_blank”>New York Times.</a></p>
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

//Applicera klasser med stilar vid visning av film + recension. 
function applyStyles() {
    document.getElementById('search-form').classList.add('form-moved');
    document.body.classList.add('body-bg');
    document.querySelector('h1').classList.add('green-color');
    document.querySelector('.blink-cursor').classList.add('green-cursor');
    document.querySelector('#info-trigger').classList.add('info-trigger-white');
    document.querySelector('footer').classList.add('footer-color');
    document.getElementById('movies').classList.add('movies-styles');
    document.getElementById('favorites').style.display = 'none';
}

//Händelselyssnare vid submit av formulär
document.getElementById('search-form').addEventListener('submit', async function(event) {
    //Hindrar sidan från att laddas om
    event.preventDefault();
    applyStyles();
    //Hämtar sökvärdet
    const searchQuery = document.getElementById('search-box').value;
    //Rensar sökrutan och ersätter med ny placeholder
    const searchInput = document.getElementById('search-box');
    searchInput.value = '';
    searchInput.placeholder = "Sök efter annan film...";
    //Använder sökvärdet i funktionen som hämtar och returnerar data från tmdb och nytimes api.
    const data = await fetchMovieDataAndReview(searchQuery);
    //Kör funktion som tar emot data (movieData objekt i det här fallet) och skriver ut i HTML
    updateDOMWithMovieData(data);
});

//Händelselyssnare vid klick på movie-pick (devs top tre)
document.querySelectorAll('.movie-pick').forEach(pick => {
    pick.addEventListener('click', function() {
        const movieTitle = this.querySelector('.movie-title').textContent;
        fetchMovieDataAndReview(movieTitle).then(data => {
            applyStyles();
            updateDOMWithMovieData(data);
        });
    });
});