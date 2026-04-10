import Link from 'next/link';
import Image from 'next/image';
import { Movie } from '@/lib/types';
import { Calendar, Play } from 'lucide-react';

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link href={`/movie/${movie.id}`}>
      <div className="movie-card">
        <Image 
          src={movie.posterUrl} 
          alt={movie.title} 
          width={400} 
          height={600} 
          className="movie-poster"
        />
        <div className="movie-card-overlay">
          <h3 className="movie-title">{movie.title}</h3>
          <div className="movie-meta">
            <span className="movie-platform-badge">{movie.platform}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={12} />
              <span>{new Date(movie.releaseDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
