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
