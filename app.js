

// DOM Elements
const trendingGrid = document.getElementById('trendingGrid');
const upcomingGrid = document.getElementById('upcomingGrid');
const thisWeekGrid = document.getElementById('thisWeekGrid');
const resultsGrid = document.getElementById('resultsGrid');
const trendingSection = document.getElementById('trendingSection');
const upcomingSection = document.getElementById('upcomingSection');
const thisWeekSection = document.getElementById('thisWeekSection');
const resultsSection = document.getElementById('resultsSection');
const resultsTitle = document.getElementById('resultsTitle');

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const yearFilter = document.getElementById('yearFilter');
const langFilter = document.getElementById('langFilter');
const genreFilter = document.getElementById('genreFilter');
const platformFilter = document.getElementById('platformFilter');

const navHome = document.getElementById('navHome');
const navFavorites = document.getElementById('navFavorites');

// State
let favorites = JSON.parse(localStorage.getItem('ottFavorites')) || [];
let trendingData = [];
let thisWeekData = [];
let upcomingData = [];
let currentView = 'home'; // home, search, favorites

const loadMoreTrendingBtn = document.getElementById('loadMoreTrendingBtn');
const loadMoreUpcomingBtn = document.getElementById('loadMoreUpcomingBtn');
const loadMoreThisWeekBtn = document.getElementById('loadMoreThisWeekBtn');
const loadMoreResultsBtn = document.getElementById('loadMoreResultsBtn');

let trendingPage = 1;
let thisWeekPage = 2; // Using page 2 of trending to simulate 'This Week'
let upcomingPage = 1;
let searchPage = 1;
let currentSearchQuery = '';

// Platform filtering logic (client-side since TMDB lacks full OTT query support by default)
function applyFilters() {
    const selectedPlatform = platformFilter ? platformFilter.value : '';
    const allCards = document.querySelectorAll('.movie-card');
    
    allCards.forEach(card => {
        const cardPlatform = card.dataset.platform;
        if (!selectedPlatform || cardPlatform === selectedPlatform) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

async function fetchData() {
    showLoading();
    trendingPage = 1;
    thisWeekPage = 2;
    upcomingPage = 1;
    try {
        const lang = langFilter ? langFilter.value : '';
        const year = yearFilter ? yearFilter.value : '';
        const genre = genreFilter ? genreFilter.value : '';
        
        const [trendingRes, thisWeekRes, upcomingRes] = await Promise.all([
            getTrendingMovies(lang, trendingPage, year, genre).catch(() => ({ results: [] })),
            getTrendingMovies(lang, thisWeekPage, year, genre).catch(() => ({ results: [] })),
            getUpcomingMovies(lang, upcomingPage, year, genre).catch(() => ({ results: [] }))
        ]);

        trendingData = trendingRes.results;
        thisWeekData = thisWeekRes.results;
        upcomingData = upcomingRes.results;

        refreshView();
    } catch (err) {
        showError(err.message || "Failed to load data. Check API Key.");
    } finally {
        hideLoading();
    }
}

// Initialize
function init() {
    setupUI();
    
    const currentYear = new Date().getFullYear();
    yearFilter.innerHTML = '<option value="">All Years</option>';
    for (let y = currentYear + 2; y >= 1950; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearFilter.appendChild(opt);
    }
    
    fetchData();
}

// Refresh the current view
function refreshView() {
    if (currentView === 'home') {
        trendingSection.classList.remove('hidden');
        thisWeekSection.classList.remove('hidden');
        upcomingSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');

        // Render full arrays (year filtering happens in API now)
        renderMovies(trendingGrid, trendingData, favorites, handleMovieClick, handleFavoriteToggle);
        renderMovies(thisWeekGrid, thisWeekData, favorites, handleMovieClick, handleFavoriteToggle);
        renderMovies(upcomingGrid, upcomingData, favorites, handleMovieClick, handleFavoriteToggle);
        
        loadMoreTrendingBtn.classList.remove('hidden');
        loadMoreThisWeekBtn.classList.remove('hidden');
        loadMoreUpcomingBtn.classList.remove('hidden');
    } else if (currentView === 'favorites') {
        trendingSection.classList.add('hidden');
        thisWeekSection.classList.add('hidden');
        upcomingSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        resultsTitle.textContent = 'Your Favorite Movies';

        const year = yearFilter ? yearFilter.value : '';
        const favFiltered = year ? favorites.filter(m => m.release_date && m.release_date.startsWith(year)) : favorites;

        renderMovies(resultsGrid, favFiltered, favorites, handleMovieClick, handleFavoriteToggle);
        loadMoreResultsBtn.classList.add('hidden'); // no pagination for local storage favorites
    }
    
    // Apply client-side platform filters after DOM update
    applyFilters();
}

// Handlers
async function handleMovieClick(id) {
    showLoading();
    try {
        const details = await getMovieDetails(id);
        renderModal(details);
    } catch (err) {
        showError("Failed to fetch movie details. Check API Key.");
    } finally {
        hideLoading();
    }
}

function handleFavoriteToggle(movie, btnEl) {
    const isFav = favorites.some(fav => fav.id === movie.id);
    if (isFav) {
        favorites = favorites.filter(fav => fav.id !== movie.id);
        btnEl.classList.remove('active');
    } else {
        favorites.push(movie);
        btnEl.classList.add('active');
    }
    localStorage.setItem('ottFavorites', JSON.stringify(favorites));
    
    if (currentView === 'favorites') {
        refreshView();
    }
}

async function performSearch(isAppend = false) {
    const query = searchInput.value.trim();
    if (!query) {
        currentView = 'home';
        refreshView();
        return;
    }

    currentView = 'search';
    if (!isAppend) {
        showLoading();
        searchPage = 1;
        currentSearchQuery = query;
    } else {
        searchPage++;
        loadMoreResultsBtn.textContent = 'Loading...';
    }

    try {
        const year = yearFilter ? yearFilter.value : '';
        const genre = genreFilter ? genreFilter.value : '';
        const res = await searchMovies(currentSearchQuery, year, searchPage, genre);
        
        trendingSection.classList.add('hidden');
        thisWeekSection.classList.add('hidden');
        upcomingSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        loadMoreResultsBtn.classList.remove('hidden');

        if (!isAppend) resultsTitle.textContent = `Search Results for "${currentSearchQuery}"`;
        
        renderMovies(resultsGrid, res.results, favorites, handleMovieClick, handleFavoriteToggle, isAppend);
        applyFilters();
    } catch (err) {
        showError(err.message || "Search failed.");
    } finally {
        hideLoading();
        loadMoreResultsBtn.textContent = 'Load More Results';
    }
}

// Event Listeners
searchBtn.addEventListener('click', () => performSearch(false));
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch(false);
});

yearFilter.addEventListener('change', () => {
    if (currentView === 'search' && searchInput.value.trim()) {
        performSearch(false);
    } else {
        fetchData(); // re-fetch with new year
    }
});

genreFilter.addEventListener('change', () => {
    if (currentView === 'search' && searchInput.value.trim()) {
        performSearch(false);
    } else {
        fetchData(); // re-fetch with new genre
    }
});

langFilter.addEventListener('change', () => {
    if (currentView === 'home') {
        fetchData();
    }
});

if (platformFilter) {
    platformFilter.addEventListener('change', applyFilters);
}

navHome.addEventListener('click', (e) => {
    e.preventDefault();
    currentView = 'home';
    searchInput.value = '';
    navHome.classList.add('active');
    navFavorites.classList.remove('active');
    yearFilter.value = ''; // Reset filter
    genreFilter.value = ''; // Reset filter
    if (platformFilter) platformFilter.value = '';
    fetchData();
});

navFavorites.addEventListener('click', (e) => {
    e.preventDefault();
    currentView = 'favorites';
    navFavorites.classList.add('active');
    navHome.classList.remove('active');
    refreshView();
});

// Load More Handlers
loadMoreTrendingBtn.addEventListener('click', async () => {
    trendingPage++;
    loadMoreTrendingBtn.textContent = 'Loading...';
    try {
        const lang = langFilter ? langFilter.value : '';
        const year = yearFilter ? yearFilter.value : '';
        const genre = genreFilter ? genreFilter.value : '';
        const res = await getTrendingMovies(lang, trendingPage, year, genre);
        trendingData = [...trendingData, ...res.results];
        renderMovies(trendingGrid, res.results, favorites, handleMovieClick, handleFavoriteToggle, true);
        applyFilters();
    } catch(e) { showError(e.message); }
    loadMoreTrendingBtn.textContent = 'Load More';
});

loadMoreThisWeekBtn.addEventListener('click', async () => {
    thisWeekPage++;
    loadMoreThisWeekBtn.textContent = 'Loading...';
    try {
        const lang = langFilter ? langFilter.value : '';
        const year = yearFilter ? yearFilter.value : '';
        const genre = genreFilter ? genreFilter.value : '';
        const res = await getTrendingMovies(lang, thisWeekPage, year, genre);
        thisWeekData = [...thisWeekData, ...res.results];
        renderMovies(thisWeekGrid, res.results, favorites, handleMovieClick, handleFavoriteToggle, true);
        applyFilters();
    } catch(e) { showError(e.message); }
    loadMoreThisWeekBtn.textContent = 'Load More';
});

loadMoreUpcomingBtn.addEventListener('click', async () => {
    upcomingPage++;
    loadMoreUpcomingBtn.textContent = 'Loading...';
    try {
        const lang = langFilter ? langFilter.value : '';
        const year = yearFilter ? yearFilter.value : '';
        const genre = genreFilter ? genreFilter.value : '';
        const res = await getUpcomingMovies(lang, upcomingPage, year, genre);
        upcomingData = [...upcomingData, ...res.results];
        renderMovies(upcomingGrid, res.results, favorites, handleMovieClick, handleFavoriteToggle, true);
        applyFilters();
    } catch(e) { showError(e.message); }
    loadMoreUpcomingBtn.textContent = 'Load More Upcoming';
});

loadMoreResultsBtn.addEventListener('click', () => performSearch(true));

// Boot
document.addEventListener('DOMContentLoaded', init);
