"use client";

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="header">
      <div className="container header-content">
        <Link href="/" className="logo">
          OTTTracker
        </Link>
        <div className="search-bar">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Search movies, series..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
}
