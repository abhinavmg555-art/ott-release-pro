"use client";

import { useState, useEffect } from 'react';
import { fetchAdvancedMovies } from '@/lib/api';
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
      setLoading(true);
      try {
        const liveMovies = await fetchAdvancedMovies({ language, platform, genre });
        setMovies(liveMovies);
      } catch (e) {
        console.error("Failed to load TMDB", e);
      } finally {
        setLoading(false);
      }
    }
    loadMovies();
  }, [language, platform, genre]);

  const trendingMovies = movies.filter(m => m.trending).slice(0, 4);
  const mostSearchedMovies = [...movies].sort((a, b) => b.searched - a.searched).slice(0, 4);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <FilterBar 
        language={language} setLanguage={setLanguage}
        platform={platform} setPlatform={setPlatform}
        genre={genre} setGenre={setGenre}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          <h3 className="title">Loading Live Databases... 🍿</h3>
        </div>
      ) : (
        <>
           <section style={{ marginBottom: '3rem' }}>
            <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Trending Right Now</h2>
            <div className="movie-grid">
              {trendingMovies.map(movie => (
                <MovieCard key={`trending-${movie.id}`} movie={movie} />
              ))}
            </div>
          </section>
          
          <section>
            <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Full OTT Release List</h2>
            <p className="subtitle" style={{ marginBottom: '2rem' }}>Showing Live TMDB results matching your filters.</p>
            
            {movies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
                <h3>No movies match your filters. Try another combination!</h3>
              </div>
            ) : (
              <div className="movie-grid">
                {movies.map(movie => (
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
