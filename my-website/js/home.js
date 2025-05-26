const API_KEY = 'a60b696953041bed5ae202cbf6cec755';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem;

const movieGrid = document.getElementById('movies-list');
const tvGrid = document.getElementById('tvshows-list');
const animeGrid = document.getElementById('anime-list');
const genreNav = document.getElementById('genreNav');
const categoryTitle = document.getElementById('categoryTitle');
const searchInput = document.getElementById('search-input');

// Fetch Trending (movie or tv)
async function fetchTrending(type) {
  const res = await fetch(${BASE_URL}/trending/${type}/week?api_key=${API_KEY});
  const data = await res.json();
  return data.results;
}

// Fetch Anime (Japanese TV with genre 16 = Animation)
async function fetchTrendingAnime() {
  let allResults = [];
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page});
    const data = await res.json();
    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids.includes(16)
    );
    allResults = allResults.concat(filtered);
  }
  return allResults;
}

// Fetch Genres
async function fetchGenres() {
  const res = await fetch(${BASE_URL}/genre/movie/list?api_key=${API_KEY});
  const data = await res.json();
  return data.genres;
}

// Display Genres as Buttons
function displayGenres(genres) {
  genreNav.innerHTML = '';
  genres.forEach(genre => {
    const btn = document.createElement('button');
    btn.textContent = genre.name;
    btn.onclick = () => {
      categoryTitle.textContent = genre.name;
      fetchMoviesByGenre(genre.id);
    };
    genreNav.appendChild(btn);
  });
}

// Fetch & Display movies by genre
async function fetchMoviesByGenre(genreId) {
  const res = await fetch(${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId});
  const data = await res.json();
  displayList(data.results, movieGrid);
}

// Display Banner with random movie from list
function displayBanner(item) {
  document.getElementById('banner').style.backgroundImage = url(${IMG_URL}${item.backdrop_path});
  document.getElementById('banner-title').textContent = item.title || item.name;
}

// Display movies/TV/anime list in grid container
function displayList(items, container) {
  container.innerHTML = '';
  if (!items || items.length === 0) {
    container.innerHTML = '<p>No items found.</p>';
    return;
  }
  items.forEach(item => {
    const img = document.createElement('img');
    img.src = ${IMG_URL}${item.poster_path};
    img.alt = item.title || item.name;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

// Show modal with movie details & video embed
function showDetails(item) {
  currentItem = item;
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = ${IMG_URL}${item.poster_path};
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
  changeServer();
  document.getElementById('modal').style.display = 'flex';
}

// Change video embed server in modal
function changeServer() {
  const server = document.getElementById('server').value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
  let embedURL = "";

  if (server === "vidsrc.cc") {
    embedURL = https://vidsrc.cc/v2/embed/${type}/${currentItem.id};
  } else if (server === "vidsrc.me") {
    embedURL = https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id};
  } else if (server === "player.videasy.net") {
    embedURL = https://player.videasy.net/${type}/${currentItem.id};
  }

  document.getElementById('modal-video').src = embedURL;
}

// Close modal
function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

// Search movies with debounce
let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const query = searchInput.value.trim();
    if (query.length > 2) {
      categoryTitle.textContent = Search: ${query};
      await searchMovies(query);
    } else if (query.length === 0) {
      categoryTitle.textContent = 'Trending Movies';
      await loadInitialData();
    }
  }, 500);
});

async function searchMovies(query) {
  const res = await fetch(${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)});
  const data = await res.json();
  displayList(data.results, movieGrid);
}

// Initial load trending movies, tv, anime, genres
async function loadInitialData() {
  const movies = await fetchTrending('movie');
  const tvShows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();
  const genres = await fetchGenres();

  displayBanner(movies[Math.floor(Math.random() * movies.length)]);
  displayList(movies, movieGrid);
  displayList(tvShows, tvGrid);
  displayList(anime, animeGrid);
  displayGenres(genres);
}

// Drag scroll for lists
function enableDragScroll(selector) {
  const containers = document.querySelectorAll(selector);

  containers.forEach(container => {
    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
      isDown = true;
      container.classList.add('active');
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    });

    container.addEventListener('mouseleave', () => {
      isDown = false;
      container.classList.remove('active');
    });

    container.addEventListener('mouseup', () => {
      isDown = false;
      container.classList.remove('active');
    });

    container.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2; //scroll speed
      container.scrollLeft = scrollLeft - walk;
    });

    // Mobile touch support
    container.addEventListener('touchstart', (e) => {
      startX = e.touches[0].pageX;
      scrollLeft = container.scrollLeft;
    });

    container.addEventListener('touchmove', (e) => {
      const x = e.touches[0].pageX;
      const walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    });
  });
}

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadInitialData();
  enableDragScroll('.drag-scroll');
});
