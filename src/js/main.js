async function fetchReviewData() {
    try {
        const response = await fetch("https://api.nytimes.com/svc/search/v2/articlesearch.json?fq=section_name:%22Movies%22%20AND%20type_of_material:%22Review%22&api-key=qg2eTClj7amxRfzreMN776WOGElnByzB");
        const data = await response.json();

        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

//fetchData();

const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4YTEyMGYwMjYyNTA1NzRlMDYyNzU1ODhhMzJmZGVjYSIsInN1YiI6IjY1ZDcxZGY4YjA0NjA1MDE3YjBhOTY4ZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.4M-n0rzAklAIF5RHUNtrE0zQigSAUy7gzojZRfKGj20'
    }
  };

async function fetchMovieData() {
    try {
        const response = await fetch('https://api.themoviedb.org/3/authentication', options);
        const data = await response.json();

        console.log(data);
    } catch {
        console.error(error);
    }
}

//fetchMovieData();