"use client";

import { useState, useEffect } from 'react';
import { fetchTrendingMovies } from '@/lib/api';
import { MovieCard } from '@/components/MovieCard';
import { FilterBar } from '@/components/FilterBar';
import { Movie } from '@/lib/types';

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [language, setLanguage] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [genre, setGenre] = useState("All");

  useEffect(() => {
    async function loadMovies() {
      try {
        const liveMovies = await fetchTrendingMovies();
        setMovies(liveMovies);
      } catch (e) {
        console.error("Failed to load TMDB", e);
      } finally {
        setLoading(false);
      }
    }
    loadMovies();
  }, []);

  const filteredMovies = movies.filter(movie => {
    if (language !== "All" && movie.language !== language) return false;
    if (platform !== "All" && movie.platform !== platform) return false;
    if (genre !== "All" && !movie.genre.includes(genre)) return false;
    return true;
  });

  const trendingMovies = movies.filter(m => m.trending).slice(0, 4);
  const mostSearchedMovies = [...movies].sort((a, b) => b.searched - a.searched).slice(4, 8);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <FilterBar 
        language={language} setLanguage={setLanguage}
        platform={platform} setPlatform={setPlatform}
        genre={genre} setGenre={setGenre}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          <h3 className="title">Loading Live TMDB Data... 🍿</h3>
        </div>
      ) : (
        <>
          <section style={{ marginBottom: '3rem' }}>
            <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Trending Today</h2>
            <div className="movie-grid">
              {trendingMovies.map(movie => (
                <MovieCard key={`trending-${movie.id}`} movie={movie} />
              ))}
            </div>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Most Searched This Week</h2>
            <div className="movie-grid">
              {mostSearchedMovies.map(movie => (
                <MovieCard key={`searched-${movie.id}`} movie={movie} />
              ))}
            </div>
          </section>
          
          <section>
            <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>All Releases</h2>
            <p className="subtitle" style={{ marginBottom: '2rem' }}>Track the latest blockbusters across the globe.</p>
            
            {filteredMovies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
                <h3>No movies match your selected filters. Try another combination!</h3>
              </div>
            ) : (
              <div className="movie-grid">
                {filteredMovies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
