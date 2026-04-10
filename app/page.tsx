"use client";

import { useState, useEffect } from 'react';
import { MovieCard } from '@/components/MovieCard';
import { FilterBar } from '@/components/FilterBar';
import { Movie } from '@/lib/types';

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [language, setLanguage] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [genre, setGenre] = useState("All");
  const [year, setYear] = useState("All");
  const [page, setPage] = useState(1);

  // Ask the backend server securely!
  async function fetchBackend(p: number) {
    const res = await fetch('/api/tmdb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, platform, genre, year, page: p })
    });
    return await res.json();
  }

  // When you change a dropdown, start fresh!
  useEffect(() => {
    setPage(1);
    setLoading(true);
    fetchBackend(1).then(data => {
      setMovies(data);
      setLoading(false);
    });
  }, [language, platform, genre, year]);

  // When you click Load More, append to the grid!
  const handleLoadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const newMovies = await fetchBackend(nextPage);
    setMovies(prev => [...prev, ...newMovies]);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const trendingMovies = movies.filter(m => m.trending).slice(0, 4);
  const mostSearchedMovies = [...movies].sort((a, b) => b.searched - a.searched).slice(0, 4);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <FilterBar 
        language={language} setLanguage={setLanguage}
        platform={platform} setPlatform={setPlatform}
        genre={genre} setGenre={setGenre}
        year={year} setYear={setYear}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          <h3 className="title">Bypassing Network & Fetching Live... 🍿</h3>
        </div>
      ) : (
        <>
          <section style={{ marginBottom: '3rem' }}>
            <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Trending Right Now</h2>
            <div className="movie-grid">
              {trendingMovies.map((movie, idx) => (
                <MovieCard key={`trending-${movie.id}-${idx}`} movie={movie} />
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
              <>
                <div className="movie-grid">
                  {movies.map((movie, idx) => (
                    <MovieCard key={`${movie.id}-${idx}`} movie={movie} />
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleLoadMore} 
                    disabled={loadingMore}
                    style={{ padding: '0.75rem 2.5rem', fontSize: '1rem', cursor: 'pointer' }}
                  >
                    {loadingMore ? "Loading Next Page..." : "Load More Movies"}
                  </button>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Calendar, MonitorPlay, Bell, Play } from 'lucide-react';

const API_KEY = "34ebc60c76725558790de494aa5ff029";

async function getLiveMovie(id: string) {
  const res = await fetch(`https://api.tmdb.org/3/movie/${id}?api_key=${API_KEY}&append_to_response=videos,credits`);
  if (!res.ok) return null;
  const movie = await res.json();
  
  const trailer = movie.videos?.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube");

  return {
    id: movie.id.toString(),
    title: movie.title || movie.name,
    language: movie.original_language.toUpperCase(),
    platform: "Search Platforms",
    genre: movie.genres?.map((g: any) => g.name) || ["Various"],
    releaseDate: movie.release_date || "",
    posterUrl: `https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}`,
    description: movie.overview || "No description available yet.",
    cast: movie.credits?.cast?.slice(0, 6).map((c: any) => c.name) || ["Top Secret Cast"],
    trailerUrl: trailer ? `https://www.youtube.com/embed/${trailer.key}` : "",
    watchUrl: movie.homepage || "#"
  };
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const movie = await getLiveMovie(params.id);
  if (!movie) return { title: 'Movie Not Found' };
  
  return {
    title: `${movie.title} OTT Release Date & Details`,
    description: `Watch ${movie.title} trailer, release date, and cast tracking.`,
  };
}

export default async function MovieDetail({ params }: { params: { id: string } }) {
  const movie = await getLiveMovie(params.id);
  if (!movie) notFound();

  return (
    <>
      <div className="hero-section">
        <Image src={movie.posterUrl} alt={movie.title} fill className="hero-bg" priority />
        <div className="hero-overlay"></div>
        <div className="container" style={{ position: 'relative', zIndex: 10, width: '100%' }}>
          <div className="hero-content">
            <h1 className="hero-title">{movie.title}</h1>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="tag">{movie.language}</span>
              {movie.genre.map((g: string) => <span key={g} className="tag">{g}</span>)}
            </div>
            <p className="hero-desc">{movie.description}</p>
            <div className="actions">
              <button className="btn btn-primary">
                <Play size={18} fill="currentColor" /> Watch Trailer
              </button>
              <button className="btn btn-secondary">
                <Bell size={18} /> Notify when Released
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container section-grid">
        <div className="main-content">
          {movie.trailerUrl ? (
            <div className="info-box">
              <h3>Official Trailer</h3>
              <div className="video-container">
                <iframe 
                  src={movie.trailerUrl} title={`${movie.title} Trailer`} frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                ></iframe>
              </div>
            </div>
          ) : null}
          
          <div className="info-box">
            <h3>Headlining Cast</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {movie.cast.map((c: string) => (
                <span key={c} style={{ background: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: '99px', fontSize: '0.875rem' }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="sidebar">
          <div className="info-box">
            <h3>Global Release Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <MonitorPlay color="var(--accent-color)" size={24} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status</p>
                  <p style={{ fontWeight: 600 }}>{movie.platform}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Calendar color="var(--accent-color)" size={24} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Premiere Date</p>
                  <p style={{ fontWeight: 600 }}>{new Date(movie.releaseDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
