const WORKER_URL = 'https://streamverse.guestph-20.workers.dev/tmdb-proxy';
let movies = [];
let currentItem;

async function fetchNewMovies() {
  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const params = `discover/movie?primary_release_date.gte=${lastMonth}&primary_release_date.lte=${today}&sort_by=primary_release_date.desc`;
  const response = await fetch(`${WORKER_URL}?endpoint=${params}`);
  const data = await response.json();
  return data.results;
}

async function fetchGenres() {
  const response = await fetch(`${WORKER_URL}?endpoint=genre/movie/list`);
  const data = await response.json();
  return data.genres;
}

async function fetchMoviesByGenre(genreId) {
  const response = await fetch(`${WORKER_URL}?endpoint=discover/movie?with_genres=${genreId}&sort_by=popularity.desc`);
  const data = await response.json();
  return data.results.slice(0, 20); // Limit to 10 items per genre
}

function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    const img = document.createElement('img');
    img.src = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

function displayGenres(genres) {
  const genresContainer = document.getElementById('movie-genres');
  genresContainer.innerHTML = '';
  console.log('Genre: ', genres)
  genres.forEach(async (genre) => {
    const genreMovies = await fetchMoviesByGenre(genre.id);
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
    displayList(genreMovies, `genre-${genre.id}`);
  });
}

function showDetails(item) {
  currentItem = item;
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
  changeServer();
  document.getElementById('modal').style.display = 'flex';
}

function changeServer() {
  const server = document.getElementById('server').value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
  let embedURL = "";

  if (server === "vidsrc.cc") {
    embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
  } else if (server === "vidsrc.me") {
    embedURL = `https://vidsrc.me/embed/${type}/${currentItem.id}`;
  } else if (server === "player.videasy.net") {
    embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
  }

  document.getElementById('modal-video').src = embedURL;
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

function sortMovies() {
  const sortBy = document.getElementById('movies-sort').value;
  let sortedMovies = [...movies];
  if (sortBy === 'release_date.desc') {
    sortedMovies.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
  } else if (sortBy === 'title.asc') {
    sortedMovies.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));
  }
  displayList(sortedMovies, 'new-movies-list');
}

async function init() {
  movies = await fetchNewMovies();
  displayList(movies, 'new-movies-list');
  const genres = await fetchGenres();
  displayGenres(genres);
}

init();
