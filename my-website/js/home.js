const apiKey = 'a60b696953041bed5ae202cbf6cec755';
const movieGrid = document.getElementById('movieGrid');
const categoryTitle = document.getElementById('categoryTitle');
const genreNav = document.getElementById('genreNav');
const searchInput = document.getElementById('searchInput');

const fetchMovies = async (url) => {
  movieGrid.innerHTML = '<p>Loading movies...</p>';
  try {
    const res = await fetch(url);
    const data = await res.json();
    displayMovies(data.results);
  } catch (error) {
    movieGrid.innerHTML = '<p>Error loading movies. Try again later.</p>';
  }
};

const displayMovies = (movies) => {
  movieGrid.innerHTML = '';
  if (!movies || movies.length === 0) {
    movieGrid.innerHTML = '<p>No movies found.</p>';
    return;
  }
  movies.forEach((movie) => {
    const movieEl = document.createElement('div');
    movieEl.classList.add('movie');
    movieEl.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" />
      <h3>${movie.title}</h3>
    `;
    movieGrid.appendChild(movieEl);
  });
};

const fetchGenres = async () => {
  const res = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`);
  const data = await res.json();
  displayGenres(data.genres);
};

const displayGenres = (genres) => {
  genres.forEach((genre) => {
    const btn = document.createElement('button');
    btn.textContent = genre.name;
    btn.addEventListener('click', () => {
      categoryTitle.textContent = genre.name;
      fetchMovies(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genre.id}`);
    });
    genreNav.appendChild(btn);
  });
};

searchInput.addEventListener('input', () => {
  const query = searchInput.value;
  if (query.length > 2) {
    categoryTitle.textContent = `Search: ${query}`;
    fetchMovies(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`);
  } else if (query.length === 0) {
    categoryTitle.textContent = 'Trending Movies';
    fetchMovies(`https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`);
  }
});

// Load Trending on Start
fetchMovies(`https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`);
fetchGenres();
