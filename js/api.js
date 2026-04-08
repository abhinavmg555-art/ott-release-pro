// TMDB API Configuration
const API_KEY = "34ebc60c76725558790de494aa5ff029";
const BASE_URL = "https://api.tmdb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const IMAGE_ORIGINAL_URL = "https://image.tmdb.org/t/p/original";

async function fetchTMDB(endpoint, queryParams = {}) {
    if (!API_KEY) throw new Error("Missing TMDB API Key.");
    
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.append("api_key", API_KEY);
    
    for (const [key, value] of Object.entries(queryParams)) {
        if (value) url.searchParams.append(key, value);
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Fetch TMDB Error:", error);
        throw error;
    }
}

async function getTrendingMovies(page = 1, params = {}) {
    // Uses discover to prioritize Indian Regional Languages (Malayalam, Tamil, Telugu, Hindi)
    return await fetchTMDB("/discover/movie", { 
        page, 
        sort_by: 'popularity.desc',
        with_original_language: 'ml|ta|te|hi|kn', // Forces Indian movies!
        region: 'IN',
        ...params 
    });
}

async function getLatestMovies(page = 1, params = {}) {
    return await fetchTMDB("/movie/now_playing", { page, region: 'IN', ...params });
}

async function searchMovies(query, params = {}) {
    return await fetchTMDB("/search/movie", { query, page: 1, region: 'IN', ...params });
}

async function getMovieDetails(movieId) {
    return await fetchTMDB(`/movie/${movieId}`, { append_to_response: "watch/providers,videos" });
}
