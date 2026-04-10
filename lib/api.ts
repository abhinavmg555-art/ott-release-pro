export const API_KEY = "34ebc60c76725558790de494aa5ff029";
export const BASE_URL = "https://api.tmdb.org/3";
export const IMAGE_URL = "https://image.tmdb.org/t/p/w500";

export async function fetchTrendingMovies() {
  const res = await fetch(
    `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=en-US`
  );
  const data = await res.json();
  
  // Convert TMDB's messy data into our clean Movie Card format!
  return data.results.map((movie: any) => ({
    id: movie.id.toString(),
    title: movie.title || movie.name,
    language: movie.original_language === 'hi' ? 'Hindi' : movie.original_language === 'ml' ? 'Malayalam' : 'English',
    platform: 'Theaters / VOD',
    platformLogo: '',
    genre: ['Action', 'Drama'], // We will expand this later!
    releaseDate: movie.release_date || movie.first_air_date,
    posterUrl: `${IMAGE_URL}${movie.poster_path}`,
    description: movie.overview,
    trending: true,
    searched: movie.popularity,
  }));
}
