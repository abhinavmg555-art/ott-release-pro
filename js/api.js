// TMDB API Configuration
const API_KEY = "34ebc60c76725558790de494aa5ff029";
const BASE_URL = "https://api.tmdb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const IMAGE_ORIGINAL_URL = "https://image.tmdb.org/t/p/original";

/**
 * Fetch data from TMDB API
 */
async function fetchTMDB(endpoint, queryParams = {}) {
    if (!API_KEY) {
        throw new Error("Missing TMDB API Key.");
    }
    
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.append("api_key", API_KEY);
    
    for (const [key, value] of Object.entries(queryParams)) {
        if (value) url.searchParams.append(key, value);
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fetch TMDB Error:", error);
        throw error;
    }
}

/**
 * Get trending movies
 */
async function getTrendingMovies(page = 1, params = {}) {
    return await fetchTMDB("/discover/movie", { 
        sort_by: "popularity.desc",
        page, 
        ...params 
    });
}

/**
 * Get Upcoming / Future releases
 */
async function getUpcomingMovies(page = 1, params = {}) {
    const today = new Date().toISOString().split('T')[0];
    return await fetchTMDB("/discover/movie", { 
        sort_by: "popularity.desc",
        "primary_release_date.gte": today,
        page, 
        ...params 
    });
}

/**
 * Get latest releases (Now Playing style but fully filterable)
 */
async function getLatestMovies(page = 1, params = {}) {
    const today = new Date().toISOString().split('T')[0];
    return await fetchTMDB("/discover/movie", { 
        sort_by: "popularity.desc",
        "primary_release_date.lte": today,
        page, 
        ...params 
    });
}

/**
 * Search movies by query
 */
async function searchMovies(query, params = {}) {
    return await fetchTMDB("/search/movie", { query, page: 1, ...params });
}

/**
 * Get advanced details of a movie (including providers & videos)
 */
async function getMovieDetails(movieId) {
    return await fetchTMDB(`/movie/${movieId}`, { append_to_response: "watch/providers,videos,release_dates,reviews,credits" });
}


