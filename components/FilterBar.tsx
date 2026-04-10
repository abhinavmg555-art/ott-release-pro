"use client";

import { LANGUAGES, PLATFORMS, GENRES } from '@/lib/data';

interface FilterBarProps {
  language: string;
  setLanguage: (val: string) => void;
  platform: string;
  setPlatform: (val: string) => void;
  genre: string;
  setGenre: (val: string) => void;
}

export function FilterBar({ language, setLanguage, platform, setPlatform, genre, setGenre }: FilterBarProps) {
  return (
    <div className="filters-wrapper">
      <div className="filter-group">
        <label className="filter-label">Language</label>
        <select className="filter-select" value={language} onChange={e => setLanguage(e.target.value)}>
          {LANGUAGES.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Platform</label>
        <select className="filter-select" value={platform} onChange={e => setPlatform(e.target.value)}>
          {PLATFORMS.map(plat => (
            <option key={plat} value={plat}>{plat}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Genre</label>
        <select className="filter-select" value={genre} onChange={e => setGenre(e.target.value)}>
          {GENRES.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
