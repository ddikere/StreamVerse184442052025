const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
let animeList = [];
let currentItem;

async function fetchNewAnime() {
  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&first_air_date.gte=${lastMonth}&first_air_date.lte=${today}&with_original_language=ja&with_genres=16&sort_by=first_air_date.desc`);
  const data = await res.json();
  return data.results;
}

async function fetchGenres() {
  const res = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}`);
  const data = await res.json();
  return data.genres.filter(genre => genre.id !== 16); // Exclude Animation since all are anime
}

async function fetchAnimeByGenre(genreId) {
  const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${genreId},16&with_original_language=ja&sort_by=popularity.desc`);
  const data = await res.json();
  return data.results.slice(0, 10);
}

function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.name;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

function displayGenres(genres) {
  const genresContainer = document.getElementById('anime-genres');
  genresContainer.innerHTML = '';
  genres.forEach(async (genre) => {
    const genreAnime = await fetchAnimeByGenre(genre.id);
    if (genreAnime.length === 0) return; // Skip empty genres
    const genreSection = document.createElement('div');
    genreSection.innerHTML = `
      <h2>${genre.name}</h2>
      <div class="scroll-wrapper">
        <button class="scroll-btn left" onclick="scrollList('genre-${genre.id}', -300)">❮</button>
        <div class="scroll-container" id="genre-${genre.id}"></div>
        <button class="scroll-btn right" onclick="scrollList('genre-${genre.id}', 300)">❯</button>
      </div>
    `;
    genresContainer.appendChild(genreSection);
    displayList(genreAnime, `genre-${genre.id}`);
  });
}

function showDetails(item) {
  currentItem = item;
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
  changeServer();
  document.getElementById('modal').style.display = 'flex';
}

function changeServer() {
  const server = document.getElementById('server').value;
  const type = "tv"
  let embedURL = "";

  if (server === "vidsrc.cc") {
    embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
  } else if (server === "vidsrc.me") {
    embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
  } else if (server === "player.videasy.net") {
    embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
  }

  document.getElementById('modal-video').src = embedURL;
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

function sortAnime() {
  const sortBy = document.getElementById('anime-sort').value;
  let sortedAnime = [...animeList];
  if (sortBy === 'first_air_date.desc') {
    sortedAnime.sort((a, b) => new Date(b.first_air_date) - new Date(a.first_air_date));
  } else if (sortBy === 'name.asc') {
    sortedAnime.sort((a, b) => a.name.localeCompare(b.name));
  }
  displayList(sortedAnime, 'new-anime-list');
}

async function init() {
  animeList = await fetchNewAnime();
  displayList(animeList, 'new-anime-list');
  const genres = await fetchGenres();
  displayGenres(genres);
}

init();