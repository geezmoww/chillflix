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

const modal = document.getElementById('modal');
const modalVideo = document.getElementById('modal-video');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalImage = document.getElementById('modal-image');
const modalRating = document.getElementById('modal-rating');
const serverSelect = document.getElementById('server');
const searchModal = document.getElementById('search-modal');
const searchResults = document.getElementById('search-results');
const searchInputModal = document.getElementById('search-input');

const listsContainers = document.querySelectorAll('.list');

let searchTimeout;
let searchIndex = -1;

// Cache keys for sessionStorage
const CACHE_KEYS = {
  trendingMovies: 'cf_trending_movies',
  trendingTV: 'cf_trending_tv',
  trendingAnime: 'cf_trending_anime',
  genres: 'cf_genres',
  cacheTime: 'cf_cache_time',
};
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes cache

// ------------------ Fetch Functions ------------------

async function fetchWithCache(url, cacheKey) {
  try {
    const cachedData = sessionStorage.getItem(cacheKey);
    const cacheTime = sessionStorage.getItem(CACHE_KEYS.cacheTime);
    if (cachedData && cacheTime && (Date.now() - cacheTime < CACHE_TTL)) {
      return JSON.parse(cachedData);
    }

    const res = await fetch(url);
    const data = await res.json();

    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    sessionStorage.setItem(CACHE_KEYS.cacheTime, Date.now());
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

async function fetchTrending(type) {
  const url = `${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`;
  const data = await fetchWithCache(url, `cf_trending_${type}`);
  return data?.results || [];
}

async function fetchTrendingAnime() {
  let allResults = [];
  for (let page = 1; page <= 3; page++) {
    const url = `${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`;
    const data = await fetchWithCache(url, `cf_trending_anime_page_${page}`);
    if (data?.results) {
      const filtered = data.results.filter(item =>
        item.original_language === 'ja' && item.genre_ids.includes(16)
      );
      allResults = allResults.concat(filtered);
    }
  }
  return allResults;
}

async function fetchGenres() {
  const url = `${BASE_URL}/genre/movie/list?api_key=${API_KEY}`;
  const data = await fetchWithCache(url, CACHE_KEYS.genres);
  return data?.genres || [];
}

async function fetchMoviesByGenre(genreId) {
  const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`;
  const res = await fetch(url);
  const data = await res.json();
  displayList(data.results, movieGrid);
}

// ------------------ Display Functions ------------------

function displayGenres(genres) {
  genreNav.innerHTML = '';
  genres.forEach(genre => {
    const btn = document.createElement('button');
    btn.textContent = genre.name;
    btn.setAttribute('aria-pressed', 'false');
    btn.classList.add('genre-button');
    btn.onclick = () => {
      categoryTitle.textContent = genre.name;
      fetchMoviesByGenre(genre.id);
    };
    genreNav.appendChild(btn);
  });
}

function displayBanner(item) {
  if (!item || !item.backdrop_path) return;
  const banner = document.getElementById('banner');
  banner.style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  banner.style.transition = 'background-image 0.7s ease-in-out';
  document.getElementById('banner-title').textContent = item.title || item.name;
}

function displayList(items, container) {
  container.innerHTML = '';
  if (!items || items.length === 0) {
    container.innerHTML = '<p>No items found.</p>';
    return;
  }
  items.forEach(item => {
    const img = document.createElement('img');
    img.dataset.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.classList.add('lazy-img');
    img.tabIndex = 0;
    img.setAttribute('role', 'listitem');
    img.addEventListener('click', () => showDetails(item));
    img.addEventListener('keypress', e => {
      if (e.key === 'Enter') showDetails(item);
    });
    container.appendChild(img);
  });
  lazyLoadImages();
}

// ------------------ Lazy Load Images ------------------

function lazyLoadImages() {
  const lazyImages = document.querySelectorAll('img.lazy-img');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy-img');
        obs.unobserve(img);
      }
    });
  }, { rootMargin: "100px" });

  lazyImages.forEach(img => observer.observe(img));
}

// ------------------ Modal Functions ------------------

function showDetails(item) {
  currentItem = item;
  modalTitle.textContent = item.title || item.name;
  modalDescription.textContent = item.overview;
  modalImage.src = `${IMG_URL}${item.poster_path}`;
  modalImage.alt = item.title || item.name;

  // Show half stars rating
  modalRating.innerHTML = getStarsHTML(item.vote_average);

  modalVideo.src = ''; // Reset iframe
  modal.style.display = 'flex';
  modal.classList.add('fade-in');
  serverSelect.value = 'vidsrc.cc';
  changeServer();

  trapFocus(modal);
}

function closeModal() {
  modal.classList.remove('fade-in');
  modal.classList.add('fade-out');
  setTimeout(() => {
    modal.style.display = 'none';
    modalVideo.src = '';
    modal.classList.remove('fade-out');
    releaseFocusTrap();
  }, 300);
}

function getStarsHTML(vote) {
  const rating = vote / 2;
  let fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  let html = '';
  for (let i = 0; i < fullStars; i++) {
    html += '★';
  }
  if (halfStar) html += '⯨'; // Use half star Unicode or custom icon
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    html += '☆';
  }
  return html;
}

function changeServer() {
  const server = serverSelect.value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
  let embedURL = "";

  // Supported servers: vidsrc.cc, vidsrc.me, player.videasy.net (others fallback)
  switch (server) {
    case "vidsrc.cc":
      embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
      break;
    case "vidsrc.me":
      embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
      break;
    case "player.videasy.net":
      embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
      break;
    default:
      // fallback to vidsrc.cc for unsupported servers
      embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
  }
  modalVideo.src = embedURL;
}

// ------------------ Search Functions ------------------

function openSearchModal() {
  searchModal.hidden = false;
  searchInputModal.focus();
}

function closeSearchModal() {
  searchModal.hidden = true;
  searchResults.innerHTML = '';
  searchIndex = -1;
  searchInput.value = '';
}

async function searchTMDB() {
  const query = searchInputModal.value.trim();
  clearTimeout(searchTimeout);

  if (query.length < 3) {
    searchResults.innerHTML = '<p>Type at least 3 characters to search.</p>';
    return;
  }

  searchTimeout = setTimeout(async () => {
    const url = `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.results.length) {
      searchResults.innerHTML = '<p>No results found.</p>';
      return;
    }

    renderSearchResults(data.results);
  }, 300);
}

function renderSearchResults(results) {
  searchResults.innerHTML = '';
  results.forEach((item, idx) => {
    const div = document.createElement('div');
    div.classList.add('search-result');
    div.tabIndex = 0;
    div.textContent = `${item.title || item.name} (${item.media_type})`;
    div.dataset.index = idx;
    div.onclick = () => {
      showDetails(item);
      closeSearchModal();
    };
    div.onkeydown = e => {
      if (e.key === 'Enter') {
        showDetails(item);
        closeSearchModal();
      }
    };
    searchResults.appendChild(div);
  });
  searchIndex = -1;
}

function handleSearchKeydown(e) {
  const results = searchResults.querySelectorAll('.search-result');
  if (!results.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    searchIndex = (searchIndex + 1) % results.length;
    updateSearchSelection(results);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    searchIndex = (searchIndex - 1 + results.length) % results.length;
    updateSearchSelection(results);
  } else if (e.key === 'Enter' && searchIndex >= 0) {
    e.preventDefault();
    results[searchIndex].click();
  }
}

function updateSearchSelection(results) {
  results.forEach((el, i) => {
    if (i === searchIndex) {
      el.classList.add('selected');
      el.focus();
    } else {
      el.classList.remove('selected');
    }
  });
}

// ------------------ Focus Trap ------------------

let focusedElementBeforeModal;

function trapFocus(element) {
  focusedElementBeforeModal = document.activeElement;
  const focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
  const focusableElements = element.querySelectorAll(focusableElementsString);
  if (!focusableElements.length) return;

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  element.addEventListener('keydown', function trap(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    } else if (e.key === 'Escape') {
      closeModal();
    }
  });

  firstFocusable.focus();
}

function releaseFocusTrap() {
  if (focusedElementBeforeModal) focusedElementBeforeModal.focus();
}

// ------------------ Event Listeners ------------------

window.addEventListener('DOMContentLoaded', async () => {
  // Load genres and trending on startup
  const genres = await fetchGenres();
  displayGenres(genres);

  const trendingMovies = await fetchTrending('movie');
  displayList(trendingMovies, movieGrid);
  displayBanner(trendingMovies[0]);

  const trendingTV = await fetchTrending('tv');
  displayList(trendingTV, tvGrid);

  const trendingAnime = await fetchTrendingAnime();
  displayList(trendingAnime, animeGrid);
});

modal.querySelector('.close').addEventListener('click', closeModal);

serverSelect.addEventListener('change', changeServer);

searchInput.addEventListener('focus', openSearchModal);

searchInputModal.addEventListener('input', searchTMDB);
searchInputModal.addEventListener('keydown', handleSearchKeydown);

document.getElementById('search-close').addEventListener('click', closeSearchModal);

// Hamburger menu toggle for mobile (assumes you have .hamburger and .nav-menu elements)
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });
}
