import { mockMovies } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Calendar, MonitorPlay, Bell, Play } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const movie = mockMovies.find(m => m.id === params.id);
  if (!movie) return { title: 'Not Found' };
  
  return {
    title: `${movie.title} OTT Release Date 2026 | Watch on ${movie.platform}`,
    description: `Watch ${movie.title} on ${movie.platform}. OTT release date, cast, trailer, and details. Language: ${movie.language}.`,
    keywords: `${movie.title} OTT release date, watch ${movie.title} online, ${movie.platform} new releases`,
  };
}

export default function MovieDetail({ params }: { params: { id: string } }) {
  const movie = mockMovies.find(m => m.id === params.id);

  if (!movie) {
    notFound();
  }

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
              {movie.genre.map(g => <span key={g} className="tag">{g}</span>)}
            </div>
            <p className="hero-desc">{movie.description}</p>
            <div className="actions">
              <a href={movie.watchUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                <Play size={18} fill="currentColor" /> Watch on {movie.platform}
              </a>
              <button className="btn btn-secondary">
                <Bell size={18} /> Notify Me
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container section-grid">
        <div className="main-content">
          <div className="info-box">
            <h3>Trailer</h3>
            <div className="video-container">
              <iframe 
                src={movie.trailerUrl} 
                title={`${movie.title} Trailer`} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
          
          <div className="info-box">
            <h3>Cast</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {movie.cast.map(c => (
                <span key={c} style={{ background: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="sidebar">
          <div className="info-box">
            <h3>Release Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <MonitorPlay color="var(--accent-color)" size={24} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Platform</p>
                  <p style={{ fontWeight: 600 }}>{movie.platform}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Calendar color="var(--accent-color)" size={24} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Release Date</p>
                  <p style={{ fontWeight: 600 }}>{new Date(movie.releaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="info-box">
            <h3>SEO Data & Meta</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              This page automatically generates optimal meta tags. Include JSON-LD snippet below for Rich Snippets:
            </p>
            <pre style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.75rem', overflowX: 'auto', color: 'var(--text-secondary)' }}>
{`{
  "@context": "https://schema.org",
  "@type": "Movie",
  "name": "${movie.title}",
  "dateCreated": "${movie.releaseDate}"
}`}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}
