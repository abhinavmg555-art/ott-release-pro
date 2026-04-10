export const API_KEY = "34ebc60c76725558790de494aa5ff029";
export const BASE_URL = "https://api.tmdb.org/3";
export const IMAGE_URL = "https://image.tmdb.org/t/p/w500";

// Map our dropdowns to TMDB's internal secret codes!
const platformMap: Record<string, string> = {
  "Netflix": "8", "Prime Video": "119", "Disney+ Hotstar": "122",
  "Jio Cinema": "220", "Zee5": "232", "Sony Liv": "237"
};

const languageMap: Record<string, string> = {
  "Hindi": "hi", "English": "en", "Malayalam": "ml", "Tamil": "ta", "Telugu": "te"
};

const genreMap: Record<string, string> = {
  "Action": "28", "Comedy": "35", "Drama": "18", "Thriller": "53", "Horror": "27"
};

export async function fetchAdvancedMovies(options: { language?: string, platform?: string, genre?: string } = {}) {
  const params = new URLSearchParams({
    api_key: API_KEY, watch_region: "IN", sort_by: "popularity.desc"
  });

  // Attach the powerful OTT & Language filters!
  if (options.language && options.language !== "All") params.set("with_original_language", languageMap[options.language] || "");
  if (options.platform && options.platform !== "All") params.set("with_watch_providers", platformMap[options.platform] || "");
  if (options.genre && options.genre !== "All") params.set("with_genres", genreMap[options.genre] || "");

  const res = await fetch(`${BASE_URL}/discover/movie?${params.toString()}`);
  const data = await res.json();
  
  return data.results.map((movie: any) => ({
    id: movie.id.toString(),
    title: movie.title || movie.name,
    language: Object.keys(languageMap).find(key => languageMap[key] === movie.original_language) || "Various",
    platform: options.platform && options.platform !== "All" ? options.platform : 'Multiple Platforms',
    platformLogo: '',
    genre: [], 
    releaseDate: movie.release_date || movie.first_air_date || "Coming Soon",
    posterUrl: movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800',
    description: movie.overview,
    trending: movie.popularity > 100,
    searched: movie.vote_count,
  }));
}
