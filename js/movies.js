const WORKER_URL = 'https://streamverse.guestph-20.workers.dev/tmdb-proxy';
let movies = [];
let currentItem;
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';
const MOVIES_PER_PAGE = 70;

async function fetchNewMovies() {
  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const params = `discover/movie?primary_release_date.gte=${lastMonth}&primary_release_date.lte=${today}&sort_by=primary_release_date.desc`;
  const response = await fetch(`${WORKER_URL}?endpoint=${params}`);
  const data = await response.json();
  return data.results;
}

async function fetchMovies(page = 1, moviesPerPage = MOVIES_PER_PAGE) {
  const movies = [];
  let remaining = moviesPerPage;
  let currentFetchPage = page;
  const moviesPerApiPage = 20; // TMDB returns 20 movies per page
  while (remaining > 0 && currentFetchPage <= totalPages) {
    const url = searchQuery
      ? `${WORKER_URL}?endpoint=/search/movie?query=${encodeURIComponent(searchQuery)}&page=${currentFetchPage}`
      : `${WORKER_URL}?endpoint=/discover/movie?page=${currentFetchPage}&sort_by=popularity.desc`
    const response = await fetch(url);
    const data = await response.json();
    totalPages = Math.ceil(data.total_results / MOVIES_PER_PAGE); // Adjust total pages for 60 movies per page
    const fetchedMovies = data.results;
    movies.push(...fetchedMovies);
    remaining -= fetchedMovies.length;
    currentFetchPage++;
  }
  return movies.slice(0, moviesPerPage);
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
  updatePagination();
}

function updatePagination() {
  const pageInfo = document.getElementById('page-info');
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('prev-page').disabled = currentPage === 1;
  document.getElementById('next-page').disabled = currentPage === totalPages;
}

async function changePage(direction) {
  currentPage += direction;
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;
  await fetchAndDisplayMovies();
}

async function searchMovies() {
  searchQuery = document.getElementById('search-bar').value.toLowerCase();
  currentPage = 1;
  await fetchAndDisplayMovies();
}

async function sortMovies() {
  const sortBy = document.getElementById('movies-sort').value;
  await fetchAndDisplayMovies(sortBy);
}

async function fetchAndDisplayMovies(sortBy = document.getElementById('movies-sort').value) {
  const url = searchQuery
    ? `${WORKER_URL}?endpoint=search/movie?query=${encodeURIComponent(searchQuery)}&page=${currentPage}`
    : `${WORKER_URL}?endpoint=discover/movie?page=${currentPage}&sort_by=${sortBy}`;
  const res = await fetch(url);
  const data = await res.json();
  movies = data.results;
  totalPages = data.total_pages;
  displayList(movies, 'movies-list');
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

function sortNewMovies() {
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
  await fetchAndDisplayMovies();
}

init();
