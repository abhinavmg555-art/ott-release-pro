export interface Movie {
  id: string;
  title: string;
  language: string;
  platform: string;
  platformLogo: string;
  genre: string[];
  releaseDate: string; // OTT release date
  posterUrl: string;
  description: string;
  cast: string[];
  trailerUrl: string; // YouTube embed URL
  watchUrl: string;
  trending: boolean;
  searched: number; // mock views limit for "Most Searched"
}
