// TMDB API Configuration
const API_KEY = "34ebc60c76725558790de494aa5ff029";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const IMAGE_ORIGINAL_URL = "https://image.tmdb.org/t/p/original";

/**
 * Helper to fetch data from TMDB API
 */
async function fetchTMDB(endpoint, queryParams = {}) {
    if (API_KEY === "YOUR_API_KEY_HERE" || !API_KEY) {
        throw new Error("Missing TMDB API Key. Please add it to js/api.js.");
    }
    
    // Construct URL with query params
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.append("api_key", API_KEY);
    
    for (const [key, value] of Object.entries(queryParams)) {
        if (value) url.searchParams.append(key, value);
    }

    const response = await fetch(url);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.status_message || `API Error: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Get trending movies (weekly)
 */
async function getTrendingMovies(lang = '', page = 1, year = '', genre = '') {
    const params = {
        sort_by: "popularity.desc",
        page: page,
        region: "IN"
    };
    if (lang) params.with_original_language = lang;
    if (year) params.primary_release_year = year;
    if (genre) params.with_genres = genre;
    
    return await fetchTMDB("/discover/movie", params);
}

/**
 * Get upcoming movies
 */
async function getUpcomingMovies(lang = '', page = 1, year = '', genre = '') {
    const today = new Date().toISOString().split('T')[0];
    const params = {
        sort_by: "popularity.desc",
        "primary_release_date.gte": today,
        page: page,
        region: "IN"
    };
    if (lang) params.with_original_language = lang;
    if (year) params.primary_release_year = year;
    if (genre) params.with_genres = genre;

    return await fetchTMDB("/discover/movie", params);
}

/**
 * Search movies by query
 */
async function searchMovies(query, year = "", page = 1, genre = "") {
    const params = { query, page };
    if (year) params.primary_release_year = year;
    
    const response = await fetchTMDB("/search/movie", params);
    
    // TMDB Search API doesn't support with_genres natively, so loop in JS side.
    if (genre && response.results) {
        response.results = response.results.filter(m => m.genre_ids && m.genre_ids.includes(parseInt(genre)));
    }
    
    return response;
}

/**
 * Get advanced details of a movie (including providers)
 */
async function getMovieDetails(movieId) {
    return await fetchTMDB(`/movie/${movieId}`, { append_to_response: "watch/providers,release_dates,reviews,credits,videos" });
}


