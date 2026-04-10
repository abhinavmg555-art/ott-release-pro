

/**
 * Render Hero Banner
 */
function renderHero(movie, onMovieClick) {
    const heroTitle = document.getElementById('heroTitle');
    const heroMeta = document.getElementById('heroMeta');
    const heroDesc = document.getElementById('heroDesc');
    const heroSection = document.getElementById('heroSection');
    const heroPlayBtn = document.getElementById('heroPlayBtn');
    const heroInfoBtn = document.getElementById('heroInfoBtn');

    if (!movie || !movie.backdrop_path) {
        heroSection.classList.add('hidden');
        return;
    }

    const imgUrl = `${IMAGE_ORIGINAL_URL}${movie.backdrop_path}`;
    heroSection.style.backgroundImage = `url('${imgUrl}')`;
    
    heroTitle.textContent = movie.title;
    
    const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    heroMeta.innerHTML = `<span style="color: #46d369; font-weight: bold;">New</span> | ${releaseYear} | <i class="fa-solid fa-star" style="color: gold;"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}`;
    
    let desc = movie.overview;
    if (desc && desc.length > 150) desc = desc.substring(0, 150) + '...';
    heroDesc.textContent = desc;

    heroPlayBtn.onclick = () => onMovieClick(movie.id);
    heroInfoBtn.onclick = () => onMovieClick(movie.id);
}

/**
 * Show loading spinner
 */
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

/**
 * Show error message
 */
function showError(message) {
    const errorEl = document.getElementById('errorMsg');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    setTimeout(() => {
        errorEl.classList.add('hidden');
    }, 5000); // Hide after 5 seconds
}

/**
 * Render movies to a specific grid element
 */
function renderMovies(gridElement, movies, favorites = [], onMovieClick, onFavoriteClick, append = false) {
    if (!append) gridElement.innerHTML = ''; // Clear existing
    
    if (!movies || movies.length === 0) {
        if (!append) gridElement.innerHTML = '<p style="color: var(--text-secondary);">No movies found.</p>';
        return;
    }

    movies.forEach(movie => {
        // Skip rendering if no poster available
        if (!movie.poster_path) return;

        const isFav = favorites.some(fav => fav.id === movie.id);
        
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.title = movie.title;
        
        const imgUrl = `${IMAGE_BASE_URL}${movie.poster_path}`;
        const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        
        card.innerHTML = `
            <img src="${imgUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${movie.id}">
                <i class="fa-solid fa-heart"></i>
            </button>
            <div class="movie-info">
                <h4 class="movie-title">${movie.title}</h4>
                <div class="movie-meta">
                    <span>${releaseYear}</span>
                    <span><i class="fa-solid fa-star" style="color: gold;"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}</span>
                </div>
                <p class="movie-overview">${movie.overview || 'No overview available.'}</p>
            </div>
        `;

        // Card Click Event for Details
        card.addEventListener('click', (e) => {
            if (e.target.closest('.fav-btn')) return; // Ignore if clicking favorite button
            onMovieClick(movie.id);
        });

        // Favorite Button Event
        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onFavoriteClick(movie, favBtn);
        });

        gridElement.appendChild(card);
    });
}

/**
 * Render Movie Details Modal
 */
function renderModal(details) {
    const modal = document.getElementById('movieModal');
    const modalBody = document.getElementById('modalBody');
    
    const posterUrl = details.poster_path ? `${IMAGE_BASE_URL}${details.poster_path}` : 'https://via.placeholder.com/300x450';
    const releaseYear = details.release_date ? details.release_date.split('-')[0] : 'N/A';
    
    // Format Runtime to "2h 15m" style
    let runtimeStr = 'Unknown Runtime';
    if (details.runtime) {
        const hours = Math.floor(details.runtime / 60);
        const mins = details.runtime % 60;
        runtimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    // Format Genres to "Action/Adventure" style
    const genreStr = (details.genres && details.genres.length > 0) 
        ? details.genres.map(g => g.name).join('/') 
        : 'Unknown Genre';

    const revenue = details.revenue && details.revenue > 0 ? `$${(details.revenue / 1000000).toFixed(1)}M` : 'Unknown';
    
    // Extract digital (OTT) release date by checking multiple regions
    let digitalDateStr = '';
    if (details.release_dates && details.release_dates.results) {
        let localReleases = details.release_dates.results.find(r => r.iso_3166_1 === 'IN') 
                         || details.release_dates.results.find(r => r.iso_3166_1 === 'US');
        
        // If still nothing, just grab the very first country that has any info
        if (!localReleases && details.release_dates.results.length > 0) {
            localReleases = details.release_dates.results[0];
        }
                         
        if (localReleases && localReleases.release_dates) {
            const digital = localReleases.release_dates.find(d => d.type === 4); // Type 4 is Digital/OTT
            if (digital) {
                const dateObj = new Date(digital.release_date.split('T')[0]);
                digitalDateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            }
        }
    }
    
    // Extract Age Certification (e.g. U, UA, R)
    let certification = '';
    if (details.release_dates && details.release_dates.results) {
        const inReleases = details.release_dates.results.find(r => r.iso_3166_1 === 'IN') || details.release_dates.results.find(r => r.iso_3166_1 === 'US');
        if (inReleases && inReleases.release_dates) {
            const cert = inReleases.release_dates.find(d => d.certification && d.certification !== '');
            if (cert) certification = cert.certification;
        }
    }
    const certString = certification ? ` • ${certification}` : '';
    
    // Process OTT Providers (Check IN, then US, then ANY country to find a platform)
    const allProvidersInfo = (details['watch/providers'] && details['watch/providers'].results) ? details['watch/providers'].results : {};
    let providers = allProvidersInfo['IN'] || allProvidersInfo['US'];
    
    if (!providers) {
        // Fallback to any region that has flatrate
        const backupRegion = Object.keys(allProvidersInfo).find(k => allProvidersInfo[k].flatrate);
        if (backupRegion) providers = allProvidersInfo[backupRegion];
        else providers = {};
    }
    
    // Grab the official watch index link
    const watchLink = providers.link || `https://www.themoviedb.org/movie/${details.id}/watch`;
    
    const flatrateProviders = providers.flatrate || [];
    const rentProviders = providers.rent || [];
    const buyProviders = providers.buy || [];
    
    const allProvidersMap = new Map();
    [...flatrateProviders, ...rentProviders, ...buyProviders].forEach(p => {
        if (!allProvidersMap.has(p.provider_id)) {
            allProvidersMap.set(p.provider_id, p);
        }
    });
    
    const combinedProviders = Array.from(allProvidersMap.values());
    const topProviderName = combinedProviders.length > 0 ? combinedProviders[0].provider_name : '';
    
    // Generate the custom OTT release sentence the user requested
    let ottReleaseSentence = '';
    if (topProviderName && digitalDateStr) {
        ottReleaseSentence = `<p style="color: #E50914; font-weight: 800; font-size: 16px; margin: 15px 0;">
                                 <i class="fa-solid fa-play"></i> Releasing on ${topProviderName} on ${digitalDateStr}
                              </p>`;
    } else if (topProviderName) {
         ottReleaseSentence = `<p style="color: #E50914; font-weight: 800; font-size: 16px; margin: 15px 0;">
                                 <i class="fa-solid fa-play"></i> Streaming on ${topProviderName}
                              </p>`;
    } else if (digitalDateStr) {
         ottReleaseSentence = `<p style="color: #E50914; font-weight: 800; font-size: 16px; margin: 15px 0;">
                                 <i class="fa-solid fa-play"></i> Releasing Digitally on ${digitalDateStr}
                              </p>`;
    }

    let providersHtml = '';
    if (combinedProviders.length > 0) {
        providersHtml = `
            <div class="ott-providers" style="margin-top: 10px;">
                <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 5px;">*Click a logo to open directly in a new tab</p>
                <div class="providers-list">
                    ${combinedProviders.map(p => `
                        <a href="${watchLink}" target="_blank" style="transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <img class="provider-logo" src="${IMAGE_BASE_URL}${p.logo_path}" alt="${p.provider_name}" title="Watch on ${p.provider_name} (Opens in new tab)">
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
         providersHtml = `
            <div class="ott-providers" style="margin-top: 15px;">
                <p style="color: var(--text-secondary); font-size: 13px;"><i class="fa-solid fa-circle-info"></i> TMDB database does not have an OTT platform confirmed for this movie yet.</p>
            </div>
        `;
    }

    // Process Reviews
    let reviewHtml = '';
    if (details.reviews && details.reviews.results && details.reviews.results.length > 0) {
        const topReview = details.reviews.results[0]; // grab the most relevant review
        let contentShort = topReview.content;
        if (contentShort.length > 250) contentShort = contentShort.substring(0, 250) + '...';
        
        // Use Regex to convert any raw http links in the review text to actual clickable <a> tags
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        contentShort = contentShort.replace(urlRegex, '<a href="$1" target="_blank" style="color: #4da8da; text-decoration: underline;" title="Open link in new tab">$1</a>');

        reviewHtml = `
            <div class="movie-review" style="margin-top: 20px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                <h4 style="color: var(--accent); margin-bottom: 8px;"><i class="fa-solid fa-comment-dots"></i> Review by ${topReview.author}</h4>
                <p style="font-size: 14px; font-style: italic; color: #ddd; line-height: 1.5;">"${contentShort}"</p>
                <a href="${topReview.url}" target="_blank" style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; display: inline-block;">Read full review on TMDB <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
            </div>
        `;
    }

    // Process Credits (Cast & Crew)
    let creditsHtml = '';
    if (details.credits) {
        let gridRows = '';
        
        // Cast (Top 6)
        if (details.credits.cast && details.credits.cast.length > 0) {
            const topCast = details.credits.cast.slice(0, 6).map(c => c.name).join(', ');
            gridRows += `
                <div class="credits-role">Cast</div>
                <div class="credits-names">${topCast}</div>
            `;
        }
        
        // Crew (Director, Producer, Music)
        if (details.credits.crew) {
            const directors = details.credits.crew.filter(c => c.job === 'Director').map(c => c.name).join(', ');
            const producers = details.credits.crew.filter(c => c.job === 'Producer').slice(0, 3).map(c => c.name).join(', ');
            const musicPeople = details.credits.crew.filter(c => c.job === 'Original Music Composer' || c.job === 'Music Director' || c.job === 'Music').slice(0, 2).map(c => c.name).join(', ');
            
            if (directors) {
                gridRows += `
                    <div class="credits-role">Director</div>
                    <div class="credits-names">${directors}</div>
                `;
            }
            if (producers) {
                gridRows += `
                    <div class="credits-role">Producer</div>
                    <div class="credits-names">${producers}</div>
                `;
            }
            if (musicPeople) {
                gridRows += `
                    <div class="credits-role">Music By</div>
                    <div class="credits-names">${musicPeople}</div>
                `;
            }
        }
        
        if (gridRows) {
            creditsHtml = `<div class="credits-grid">${gridRows}</div>`;
        }
    }

    // Extract Trailer
    let trailerHtml = '';
    if (details.videos && details.videos.results) {
        // Find Official YouTube Trailer (fallback to any YouTube video if trailer missing)
        const trailer = details.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') 
                     || details.videos.results.find(v => v.site === 'YouTube');
        
        if (trailer) {
            trailerHtml = `
                <a href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank" class="trailer-btn" title="Watch Trailer on YouTube">
                    <i class="fa-brands fa-youtube" style="font-size: 18px;"></i> Watch Trailer
                </a>
            `;
        }
    }

    modalBody.innerHTML = `
        <img src="${posterUrl}" alt="${details.title}" class="modal-poster">
        <div class="modal-info">
            <h2 class="modal-title" style="margin-bottom: 5px;">${details.title}</h2>
            <p style="color: var(--text-secondary); font-size: 15px; margin-bottom: 15px;">
                ${releaseYear}${certString} • ${genreStr} • ${runtimeStr}
            </p>
            ${trailerHtml}
            <div class="modal-meta">
                ${digitalDateStr ? `<span style="color: var(--accent);" title="Digital OTT Release Date"><i class="fa-solid fa-laptop"></i> OTT: ${digitalDateStr}</span>` : ''}
                <span title="Box Office Earnings"><i class="fa-solid fa-sack-dollar"></i> ${revenue}</span>
                <span title="User Rating"><i class="fa-solid fa-star" style="color: gold;"></i> ${details.vote_average.toFixed(1)}</span>
            </div>
            ${creditsHtml}
            ${ottReleaseSentence}
            ${providersHtml}
            <p class="modal-overview" style="margin-top: 15px;">${details.overview}</p

/**
 * Render Hero Banner
 */
function renderHero(movie, onMovieClick) {
    const heroTitle = document.getElementById('heroTitle');
    const heroMeta = document.getElementById('heroMeta');
    const heroDesc = document.getElementById('heroDesc');
    const heroSection = document.getElementById('heroSection');
    const heroPlayBtn = document.getElementById('heroPlayBtn');
    const heroInfoBtn = document.getElementById('heroInfoBtn');

    if (!movie || !movie.backdrop_path) {
        heroSection.classList.add('hidden');
        return;
    }

    const imgUrl = `${IMAGE_ORIGINAL_URL}${movie.backdrop_path}`;
    heroSection.style.backgroundImage = `url('${imgUrl}')`;
    
    heroTitle.textContent = movie.title;
    
    const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    heroMeta.innerHTML = `<span style="color: #46d369; font-weight: bold;">New</span> | ${releaseYear} | <i class="fa-solid fa-star" style="color: gold;"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}`;
    
    let desc = movie.overview;
    if (desc && desc.length > 150) desc = desc.substring(0, 150) + '...';
    heroDesc.textContent = desc;

    heroPlayBtn.onclick = () => onMovieClick(movie.id);
    heroInfoBtn.onclick = () => onMovieClick(movie.id);
}

/**
 * Show loading spinner
 */
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

/**
 * Show error message
 */
function showError(message) {
    const errorEl = document.getElementById('errorMsg');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    setTimeout(() => {
        errorEl.classList.add('hidden');
    }, 5000); // Hide after 5 seconds
}

/**
 * Render movies to a specific grid element
 */
function renderMovies(gridElement, movies, favorites = [], onMovieClick, onFavoriteClick, append = false) {
    if (!append) gridElement.innerHTML = ''; // Clear existing
    
    if (!movies || movies.length === 0) {
        if (!append) gridElement.innerHTML = '<p style="color: var(--text-secondary);">No movies found.</p>';
        return;
    }

    movies.forEach(movie => {
        // Skip rendering if no poster available
        if (!movie.poster_path) return;

        const isFav = favorites.some(fav => fav.id === movie.id);
        
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.title = movie.title;
        
        const imgUrl = `${IMAGE_BASE_URL}${movie.poster_path}`;
        const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        
        card.innerHTML = `
            <img src="${imgUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${movie.id}">
                <i class="fa-solid fa-heart"></i>
            </button>
            <div class="movie-info">
                <h4 class="movie-title">${movie.title}</h4>
                <div class="movie-meta">
                    <span>${releaseYear}</span>
                    <span><i class="fa-solid fa-star" style="color: gold;"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}</span>
                </div>
                <p class="movie-overview">${movie.overview || 'No overview available.'}</p>
            </div>
        `;

        // Card Click Event for Details
        card.addEventListener('click', (e) => {
            if (e.target.closest('.fav-btn')) return; // Ignore if clicking favorite button
            onMovieClick(movie.id);
        });

        // Favorite Button Event
        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onFavoriteClick(movie, favBtn);
        });

        gridElement.appendChild(card);
    });
}

/**
 * Render Movie Details Modal
 */
function renderModal(details) {
    const modal = document.getElementById('movieModal');
    const modalBody = document.getElementById('modalBody');
    
    const posterUrl = details.poster_path ? `${IMAGE_BASE_URL}${details.poster_path}` : 'https://via.placeholder.com/300x450';
    const releaseYear = details.release_date ? details.release_date.split('-')[0] : 'N/A';
    
    // Format Runtime to "2h 15m" style
    let runtimeStr = 'Unknown Runtime';
    if (details.runtime) {
        const hours = Math.floor(details.runtime / 60);
        const mins = details.runtime % 60;
        runtimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    // Format Genres to "Action/Adventure" style
    const genreStr = (details.genres && details.genres.length > 0) 
        ? details.genres.map(g => g.name).join('/') 
        : 'Unknown Genre';

    const revenue = details.revenue && details.revenue > 0 ? `$${(details.revenue / 1000000).toFixed(1)}M` : 'Unknown';
    
    // Extract digital (OTT) release date by checking multiple regions
    let digitalDateStr = '';
    if (details.release_dates && details.release_dates.results) {
        let localReleases = details.release_dates.results.find(r => r.iso_3166_1 === 'IN') 
                         || details.release_dates.results.find(r => r.iso_3166_1 === 'US');
        
        // If still nothing, just grab the very first country that has any info
        if (!localReleases && details.release_dates.results.length > 0) {
            localReleases = details.release_dates.results[0];
        }
                         
        if (localReleases && localReleases.release_dates) {
            const digital = localReleases.release_dates.find(d => d.type === 4); // Type 4 is Digital/OTT
            if (digital) {
                const dateObj = new Date(digital.release_date.split('T')[0]);
                digitalDateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            }
        }
    }
    
    // Extract Age Certification (e.g. U, UA, R)
    let certification = '';
    if (details.release_dates && details.release_dates.results) {
        const inReleases = details.release_dates.results.find(r => r.iso_3166_1 === 'IN') || details.release_dates.results.find(r => r.iso_3166_1 === 'US');
        if (inReleases && inReleases.release_dates) {
            const cert = inReleases.release_dates.find(d => d.certification && d.certification !== '');
            if (cert) certification = cert.certification;
        }
    }
    const certString = certification ? ` • ${certification}` : '';
    
    // Process OTT Providers (Check IN, then US, then ANY country to find a platform)
    const allProvidersInfo = (details['watch/providers'] && details['watch/providers'].results) ? details['watch/providers'].results : {};
    let providers = allProvidersInfo['IN'] || allProvidersInfo['US'];
    
    if (!providers) {
        // Fallback to any region that has flatrate
        const backupRegion = Object.keys(allProvidersInfo).find(k => allProvidersInfo[k].flatrate);
        if (backupRegion) providers = allProvidersInfo[backupRegion];
        else providers = {};
    }
    
    // Grab the official watch index link
    const watchLink = providers.link || `https://www.themoviedb.org/movie/${details.id}/watch`;
    
    const flatrateProviders = providers.flatrate || [];
    const rentProviders = providers.rent || [];
    const buyProviders = providers.buy || [];
    
    const allProvidersMap = new Map();
    [...flatrateProviders, ...rentProviders, ...buyProviders].forEach(p => {
        if (!allProvidersMap.has(p.provider_id)) {
            allProvidersMap.set(p.provider_id, p);
        }
    });
    
    const combinedProviders = Array.from(allProvidersMap.values());
    const topProviderName = combinedProviders.length > 0 ? combinedProviders[0].provider_name : '';
    
    // Generate the custom OTT release sentence the user requested
    let ottReleaseSentence = '';
    if (topProviderName && digitalDateStr) {
        ottReleaseSentence = `<p style="color: #E50914; font-weight: 800; font-size: 16px; margin: 15px 0;">
                                 <i class="fa-solid fa-play"></i> Releasing on ${topProviderName} on ${digitalDateStr}
                              </p>`;
    } else if (topProviderName) {
         ottReleaseSentence = `<p style="color: #E50914; font-weight: 800; font-size: 16px; margin: 15px 0;">
                                 <i class="fa-solid fa-play"></i> Streaming on ${topProviderName}
                              </p>`;
    } else if (digitalDateStr) {
         ottReleaseSentence = `<p style="color: #E50914; font-weight: 800; font-size: 16px; margin: 15px 0;">
                                 <i class="fa-solid fa-play"></i> Releasing Digitally on ${digitalDateStr}
                              </p>`;
    }

    let providersHtml = '';
    if (combinedProviders.length > 0) {
        providersHtml = `
            <div class="ott-providers" style="margin-top: 10px;">
                <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 5px;">*Click a logo to open directly in a new tab</p>
                <div class="providers-list">
                    ${combinedProviders.map(p => `
                        <a href="${watchLink}" target="_blank" style="transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <img class="provider-logo" src="${IMAGE_BASE_URL}${p.logo_path}" alt="${p.provider_name}" title="Watch on ${p.provider_name} (Opens in new tab)">
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
         providersHtml = `
            <div class="ott-providers" style="margin-top: 15px;">
                <p style="color: var(--text-secondary); font-size: 13px;"><i class="fa-solid fa-circle-info"></i> TMDB database does not have an OTT platform confirmed for this movie yet.</p>
            </div>
        `;
    }

    // Process Reviews
    let reviewHtml = '';
    if (details.reviews && details.reviews.results && details.reviews.results.length > 0) {
        const topReview = details.reviews.results[0]; // grab the most relevant review
        let contentShort = topReview.content;
        if (contentShort.length > 250) contentShort = contentShort.substring(0, 250) + '...';
        
        // Use Regex to convert any raw http links in the review text to actual clickable <a> tags
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        contentShort = contentShort.replace(urlRegex, '<a href="$1" target="_blank" style="color: #4da8da; text-decoration: underline;" title="Open link in new tab">$1</a>');

        reviewHtml = `
            <div class="movie-review" style="margin-top: 20px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                <h4 style="color: var(--accent); margin-bottom: 8px;"><i class="fa-solid fa-comment-dots"></i> Review by ${topReview.author}</h4>
                <p style="font-size: 14px; font-style: italic; color: #ddd; line-height: 1.5;">"${contentShort}"</p>
                <a href="${topReview.url}" target="_blank" style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; display: inline-block;">Read full review on TMDB <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
            </div>
        `;
    }

    // Process Credits (Cast & Crew)
    let creditsHtml = '';
    if (details.credits) {
        let gridRows = '';
        
        // Cast (Top 6)
        if (details.credits.cast && details.credits.cast.length > 0) {
            const topCast = details.credits.cast.slice(0, 6).map(c => c.name).join(', ');
            gridRows += `
                <div class="credits-role">Cast</div>
                <div class="credits-names">${topCast}</div>
            `;
        }
        
        // Crew (Director, Producer, Music)
        if (details.credits.crew) {
            const directors = details.credits.crew.filter(c => c.job === 'Director').map(c => c.name).join(', ');
            const producers = details.credits.crew.filter(c => c.job === 'Producer').slice(0, 3).map(c => c.name).join(', ');
            const musicPeople = details.credits.crew.filter(c => c.job === 'Original Music Composer' || c.job === 'Music Director' || c.job === 'Music').slice(0, 2).map(c => c.name).join(', ');
            
            if (directors) {
                gridRows += `
                    <div class="credits-role">Director</div>
                    <div class="credits-names">${directors}</div>
                `;
            }
            if (producers) {
                gridRows += `
                    <div class="credits-role">Producer</div>
                    <div class="credits-names">${producers}</div>
                `;
            }
            if (musicPeople) {
                gridRows += `
                    <div class="credits-role">Music By</div>
                    <div class="credits-names">${musicPeople}</div>
                `;
            }
        }
        
        if (gridRows) {
            creditsHtml = `<div class="credits-grid">${gridRows}</div>`;
        }
    }

    // Extract Trailer
    let trailerHtml = '';
    if (details.videos && details.videos.results) {
        // Find Official YouTube Trailer (fallback to any YouTube video if trailer missing)
        const trailer = details.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') 
                     || details.videos.results.find(v => v.site === 'YouTube');
        
        if (trailer) {
            trailerHtml = `
                <a href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank" class="trailer-btn" title="Watch Trailer on YouTube">
                    <i class="fa-brands fa-youtube" style="font-size: 18px;"></i> Watch Trailer
                </a>
            `;
        }
    }

    modalBody.innerHTML = `
        <img src="${posterUrl}" alt="${details.title}" class="modal-poster">
        <div class="modal-info">
            <h2 class="modal-title" style="margin-bottom: 5px;">${details.title}</h2>
            <p style="color: var(--text-secondary); font-size: 15px; margin-bottom: 15px;">
                ${releaseYear}${certString} • ${genreStr} • ${runtimeStr}
            </p>
            ${trailerHtml}
            <div class="modal-meta">
                ${digitalDateStr ? `<span style="color: var(--accent);" title="Digital OTT Release Date"><i class="fa-solid fa-laptop"></i> OTT: ${digitalDateStr}</span>` : ''}
                <span title="Box Office Earnings"><i class="fa-solid fa-sack-dollar"></i> ${revenue}</span>
                <span title="User Rating"><i class="fa-solid fa-star" style="color: gold;"></i> ${details.vote_average.toFixed(1)}</span>
            </div>
            ${creditsHtml}
            ${ottReleaseSentence}
            ${providersHtml}
            <p class="modal-overview" style="margin-top: 15px;">${details.overview}</p>
            ${reviewHtml}
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

/**
 * Initial UI setup (closing modal)
 */
function setupUI() {
    const modal = document.getElementById('movieModal');
    const closeBtn = document.querySelector('.close-btn');

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto'; // Restore scrolling
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    });
}


/**
 * Render Hero Banner
 */
function renderHero(movie, onMovieClick) {
    const heroTitle = document.getElementById('heroTitle');
    const heroMeta = document.getElementById('heroMeta');
    const heroDesc = document.getElementById('heroDesc');
    const heroSection = document.getElementById('heroSection');
    const heroPlayBtn = document.getElementById('heroPlayBtn');
    const heroInfoBtn = document.getElementById('heroInfoBtn');

    if (!movie || !movie.backdrop_path) {
        heroSection.classList.add('hidden');
        return;
    }

    const imgUrl = `${IMAGE_ORIGINAL_URL}${movie.backdrop_path}`;
    heroSection.style.backgroundImage = `url('${imgUrl}')`;
    
    heroTitle.textContent = movie.title;
    
    const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    heroMeta.innerHTML = `<span style="color: #46d369; font-weight: bold;">New</span> | ${releaseYear} | <i class="fa-solid fa-star" style="color: gold;"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}`;
    
    let desc = movie.overview;
    if (desc && desc.length > 150) desc = desc.substring(0, 150) + '...';
    heroDesc.textContent = desc;

    heroPlayBtn.onclick = () => onMovieClick(movie.id);
    heroInfoBtn.onclick = () => onMovieClick(movie.id);
}

/**
 * Show loading spinner
 */
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

/**
 * Show error message
 */
function showError(message) {
    const errorEl = document.getElementById('errorMsg');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    setTimeout(() => {
        errorEl.classList.add('hidden');
    }, 5000); // Hide after 5 seconds
}

/**
 * Render movies to a specific grid element
 */
function renderMovies(gridElement, movies, favorites = [], onMovieClick, onFavoriteClick, append = false) {
    if (!append) gridElement.innerHTML = ''; // Clear existing
    
    if (!movies || movies.length === 0) {
        if (!append) gridElement.innerHTML = '<p style="color: var(--text-secondary);">No movies found.</p>';
        return;
    }

    movies.forEach(movie => {
        // Skip rendering if no poster available
        if (!movie.poster_path) return;

        const isFav = favorites.some(fav => fav.id === movie.id);
        
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.title = movie.title;
        
        const imgUrl = `${IMAGE_BASE_URL}${movie.poster_path}`;
        const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        
        card.innerHTML = `
            <img src="${imgUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${movie.id}">
                <i class="fa-solid fa-heart"></i>
            </button>
            <div class="movie-info">
                <h4 class="movie-title">${movie.title}</h4>
                <div class="movie-meta">
                    <span>${releaseYear}</span>
                    <span><i class="fa-solid fa-star" style="color: gold;"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}</span>
                </div>
                <p class="movie-overview">${movie.overview || 'No overview available.'}</p>
            </div>
        `;

        // Card Click Event for Details
        card.addEventListener('click', (e) => {
            if (e.target.closest('.fav-btn')) return; // Ignore if clicking favorite button
            onMovieClick(movie.id);
        });

        // Favorite Button Event
        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onFavoriteClick(movie, favBtn);
        });

        gridElement.appendChild(card);
    });
}

/**
 * Render Movie Details Modal
 */
function renderModal(details) {
    const modal = document.getElementById('movieModal');
    const modalBody = document.getElementById('modalBody');
    
    const posterUrl = details.poster_path ? `${IMAGE_BASE_URL}${details.poster_path}` : 'https://via.placeholder.com/300x450';
    const releaseYear = details.release_date ? details.release_date.split('-')[0] : 'N/A';
    
    // Format Runtime to "2h 15m" style
    let runtimeStr = 'Unknown Runtime';
    if (details.runtime) {
        const hours = Math.floor(details.runtime / 60);
        const mins = details.runtime % 60;
        runtimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    // Format Genres to "Action/Adventure" style
    const genreStr = (details.genres && details.genres.length > 0) 
        ? details.genres.map(g => g.name).join('/') 
        : 'Unknown Genre';

    const revenue = details.revenue && details.revenue > 0 ? `$${(details.revenue / 1000000).toFixed(1)}M` : 'Unknown';
    
    // Extract digital (OTT) release date by checking multiple regions
    let digitalDateStr = '';
    if (details.release_dates && details.release_dates.results) {
        let localReleases = details.release_dates.results.find(r => r.iso_3166_1 === 'IN') 
                         || details.release_dates.results.find(r => r.iso_3166_1 === 'US');
        
        // If still nothing, just grab the very first country that has any info
        if (!localReleases && details.release_dates.results.length > 0) {
            localReleases = details.release_dates.results[0];
        }
                         
        if (localReleases && localReleases.release_dates) {
            const digital = localReleases.release_dates.find(d => d.type === 4); // Type 4 is Digital/OTT
            if (digital) {
                const dateObj = new Date(digital.release_date.split('T')[0]);
                digitalDateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            }
        }
    }
    
    // Extract Age Certification (e.g. U, UA, R)
    let certification = '';
    if (details.release_dates && details.release_dates.results) {
        const inReleases = details.release_dates.results.find(r => r.iso_3166_1 === 'IN') || details.release_dates.results.find(r => r.iso_3166_1 === 'US');
        if (inReleases && inReleases.release_dates) {
            const cert = inReleases.release_dates.find(d => d.certification && d.certification !== '');
            if (cert) certification = cert.certification;
        }
    }
    const certString = certification ? ` • ${certification}` : '';
    
    // Process OTT Providers (Check IN, then US, then ANY country to find a platform)
    const allProvidersInfo = (details['watch/providers'] && details['watch/providers'].results) ? details['watch/providers'].results : {};
    let providers = allProvidersInfo['IN'] || allProvidersInfo['US'];
    
    if (!providers) {
        // Fallback to any region that has flatrate
        const backupRegion = Object.keys(allProvidersInfo).find(k => allProvidersInfo[k].flatrate);
        if (backupRegion) providers = allProvidersInfo[backupRegion];
        else providers = {};
    }
    
    // Grab the official watch index link
    const watchLink = providers.link || `https://www.themoviedb.org/movie/${details.id}/watch`;
    
    const flatrateProviders = providers.flatrate || [];
    const rentProviders = providers.rent || [];
    const buyProviders = providers.buy || [];
    
    const allProvidersMap = new Map();
    [...flatrateProviders, ...rentProviders, ...buyProviders].forEach(p => {
        if (!allProvidersMap.has(p.provider_id)) {
            allProvidersMap.set(p.provider_id, p);
        }
    });
    
    const combinedProviders = Array.from(allProvidersMap.values());
    const topProviderName = combinedProviders.length > 0 ? combinedProviders[0].provider_name : '';
    
    // Generate the custom OTT release sentence the user requested
    let ottReleaseSentence = '';
    if (topProviderName && digitalDateStr) {
        ottReleaseSentence = `<p style="color: #E50914; font-weight: 800; font-size: 16px; margin: 15px 0;">
                                 <i class="fa-solid fa-play"></i> Releasing on ${topProviderName} on ${digitalDateStr}
                              </p>`;
    } else if (topProviderName) {
         ottReleaseSentence = `<p style="color: #E50914; font-weight: 800; font-size: 16px; margin: 15px 0;">
                                 <i class="fa-solid fa-play"></i> Streaming on ${topProviderName}
                              </p>`;
    } else if (digitalDateStr) {
         ottReleaseSentence = `<p style="color: #E50914; font-weight: 800; font-size: 16px; margin: 15px 0;">
                                 <i class="fa-solid fa-play"></i> Releasing Digitally on ${digitalDateStr}
                              </p>`;
    }

    let providersHtml = '';
    if (combinedProviders.length > 0) {
        providersHtml = `
            <div class="ott-providers" style="margin-top: 10px;">
                <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 5px;">*Click a logo to open directly in a new tab</p>
                <div class="providers-list">
                    ${combinedProviders.map(p => `
                        <a href="${watchLink}" target="_blank" style="transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <img class="provider-logo" src="${IMAGE_BASE_URL}${p.logo_path}" alt="${p.provider_name}" title="Watch on ${p.provider_name} (Opens in new tab)">
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
         providersHtml = `
            <div class="ott-providers" style="margin-top: 15px;">
                <p style="color: var(--text-secondary); font-size: 13px;"><i class="fa-solid fa-circle-info"></i> TMDB database does not have an OTT platform confirmed for this movie yet.</p>
            </div>
        `;
    }

    // Process Reviews
    let reviewHtml = '';
    if (details.reviews && details.reviews.results && details.reviews.results.length > 0) {
        const topReview = details.reviews.results[0]; // grab the most relevant review
        let contentShort = topReview.content;
        if (contentShort.length > 250) contentShort = contentShort.substring(0, 250) + '...';
        
        // Use Regex to convert any raw http links in the review text to actual clickable <a> tags
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        contentShort = contentShort.replace(urlRegex, '<a href="$1" target="_blank" style="color: #4da8da; text-decoration: underline;" title="Open link in new tab">$1</a>');

        reviewHtml = `
            <div class="movie-review" style="margin-top: 20px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                <h4 style="color: var(--accent); margin-bottom: 8px;"><i class="fa-solid fa-comment-dots"></i> Review by ${topReview.author}</h4>
                <p style="font-size: 14px; font-style: italic; color: #ddd; line-height: 1.5;">"${contentShort}"</p>
                <a href="${topReview.url}" target="_blank" style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; display: inline-block;">Read full review on TMDB <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
            </div>
        `;
    }

    // Process Credits (Cast & Crew)
    let creditsHtml = '';
    if (details.credits) {
        let gridRows = '';
        
        // Cast (Top 6)
        if (details.credits.cast && details.credits.cast.length > 0) {
            const topCast = details.credits.cast.slice(0, 6).map(c => c.name).join(', ');
            gridRows += `
                <div class="credits-role">Cast</div>
                <div class="credits-names">${topCast}</div>
            `;
        }
        
        // Crew (Director, Producer, Music)
        if (details.credits.crew) {
            const directors = details.credits.crew.filter(c => c.job === 'Director').map(c => c.name).join(', ');
            const producers = details.credits.crew.filter(c => c.job === 'Producer').slice(0, 3).map(c => c.name).join(', ');
            const musicPeople = details.credits.crew.filter(c => c.job === 'Original Music Composer' || c.job === 'Music Director' || c.job === 'Music').slice(0, 2).map(c => c.name).join(', ');
            
            if (directors) {
                gridRows += `
                    <div class="credits-role">Director</div>
                    <div class="credits-names">${directors}</div>
                `;
            }
            if (producers) {
                gridRows += `
                    <div class="credits-role">Producer</div>
                    <div class="credits-names">${producers}</div>
                `;
            }
            if (musicPeople) {
                gridRows += `
                    <div class="credits-role">Music By</div>
                    <div class="credits-names">${musicPeople}</div>
                `;
            }
        }
        
        if (gridRows) {
            creditsHtml = `<div class="credits-grid">${gridRows}</div>`;
        }
    }

    // Extract Trailer
    let trailerHtml = '';
    if (details.videos && details.videos.results) {
        // Find Official YouTube Trailer (fallback to any YouTube video if trailer missing)
        const trailer = details.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') 
                     || details.videos.results.find(v => v.site === 'YouTube');
        
        if (trailer) {
            trailerHtml = `
                <a href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank" class="trailer-btn" title="Watch Trailer on YouTube">
                    <i class="fa-brands fa-youtube" style="font-size: 18px;"></i> Watch Trailer
                </a>
            `;
        }
    }

    modalBody.innerHTML = `
        <img src="${posterUrl}" alt="${details.title}" class="modal-poster">
        <div class="modal-info">
            <h2 class="modal-title" style="margin-bottom: 5px;">${details.title}</h2>
            <p style="color: var(--text-secondary); font-size: 15px; margin-bottom: 15px;">
                ${releaseYear}${certString} • ${genreStr} • ${runtimeStr}
            </p>
            ${trailerHtml}
            <div class="modal-meta">
                ${digitalDateStr ? `<span style="color: var(--accent);" title="Digital OTT Release Date"><i class="fa-solid fa-laptop"></i> OTT: ${digitalDateStr}</span>` : ''}
                <span title="Box Office Earnings"><i class="fa-solid fa-sack-dollar"></i> ${revenue}</span>
                <span title="User Rating"><i class="fa-solid fa-star" style="color: gold;"></i> ${details.vote_average.toFixed(1)}</span>
            </div>
            ${creditsHtml}
            ${ottReleaseSentence}
            ${providersHtml}
            <p class="modal-overview" style="margin-top: 15px;">${details.overview}</p>
            ${reviewHtml}
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

/**
 * Initial UI setup (closing modal)
 */
function setupUI() {
    const modal = document.getElementById('movieModal');
    const closeBtn = document.querySelector('.close-btn');

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto'; // Restore scrolling
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    });
}


/**
 * Render Hero Banner
 */
function renderHero(movie, onMovieClick) {
    const heroTitle = document.getElementById('heroTitle');
    const heroMeta = document.getElementById('heroMeta');
    const heroDesc = document.getElementById('heroDesc');
    const heroSection = document.getElementById('heroSection');
    const heroPlayBtn = document.getElementById('heroPlayBtn');
    const heroInfoBtn = document.getElementById('heroInfoBtn');

    if (!movie || !movie.backdrop_path) {
        heroSection.classList.add('hidden');
        return;
    }

    const imgUrl = `${IMAGE_ORIGINAL_URL}${movie.backdrop_path}`;
    heroSection.style.backgroundImage = `url('${imgUrl}')`;
    
    heroTitle.textContent = movie.title;
    
    const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    heroMeta.innerHTML = `<span style="color: #46d369; font-weight: bold;">New</span> | ${releaseYear} | <i class="fa-solid fa-star" style="color: gold;"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}`;
    
    let desc = movie.overview;
    if (desc && desc.length > 150) desc = desc.substring(0, 150) + '...';
    heroDesc.textContent = desc;

    heroPlayBtn.onclick = () => onMovieClick(movie.id);
    heroInfoBtn.onclick = () => onMovieClick(movie.id);
}

/**
 * Show loading spinner
 */
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

/**
 * Show error message
 */
function showError(message) {
    const errorEl = document.getElementById('errorMsg');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    setTimeout(() => {
        errorEl.classList.add('hidden');
    }, 5000); // Hide after 5 seconds
}

/**
 * Render movies to a specific grid element
 */
function renderMovies(gridElement, movies, favorites = [], onMovieClick, onFavoriteClick, append = false) {
    if (!append) gridElement.innerHTML = ''; // Clear existing
    
    if (!movies || movies.length === 0) {
        if (!append) gridElement.innerHTML = '<p style="color: var(--text-secondary);">No movies found.</p>';
        return;
    }

    movies.forEach(movie => {
        // Skip rendering if no poster available
        if (!movie.poster_path) return;

        const isFav = favorites.some(fav => fav.id === movie.id);
        
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.title = movie.title;
        
        const imgUrl = `${IMAGE_BASE_URL}${movie.poster_path}`;
        const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        
        card.innerHTML = `
            <img src="${imgUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${movie.id}">
                <i class="fa-solid fa-heart"></i>
            </button>
            <div class="movie-info">
                <h4 class="movie-title">${movie.title}</h4>
                <div class="movie-meta">
                    <span>${releaseYear}</span>
                    <span><i class="fa-solid fa-star" style="color: gold;"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}</span>
                </div>
                <p class="movie-overview">${movie.overview || 'No overview available.'}</p>
            </div>
        `;

        // Card Click Event for Details
        card.addEventListener('click', (e) => {
            if (e.target.closest('.fav-btn')) return; // Ignore if clicking favorite button
            onMovieClick(movie.id);
        });

        // Favorite Button Event
        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onFavoriteClick(movie, favBtn);
        });

        gridElement.appendChild(card);
    });
}

/**
 * Render Movie Details Modal
 */
function renderModal(details) {
    const modal = document.getElementById('movieModal');
    const modalBody = document.getElementById('modalBody');
    
    const posterUrl = details.poster_path ? `${IMAGE_BASE_URL}${details.poster_path}` : 'https://via.placeholder.com/300x450';
    const releaseYear = details.release_date ? details.release_date.split('-')[0] : 'N/A';
    
    // Format Runtime to "2h 15m" style
    let runtimeStr = 'Unknown Runtime';
    if (details.runtime) {
        const hours = Math.floor(details.runtime / 60);
        const mins = details.runtime % 60;
        runtimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    // Format Genres to "Action/Adventure" style
    const genreStr = (details.genres && details.genres.length > 0) 
        ? details.genres.map(g => g.name).join('/') 
        : 'Unknown Genre';

    const revenue = details.revenue && details.revenue > 0 ? `$${(details.revenue / 1000000).toFixed(1)}M` : 'Unknown';
    
    // Extract digital (OTT) release date by checking multiple regions
    let digitalDateStr = '';
    if (details.release_dates && details.release_dates.results) {
        let localReleases = details.release_dates.results.find(r => r.iso_3166_1 === 'IN') 
                         || details.release_dates.results.find(r => r.iso_3166_1 === 'US');
        
        // If still nothing, just grab the very first country that has any info
        if (!localReleases && details.release_dates.results.length > 0) {
            localReleases = details.release_dates.results[0];
        }
                         
        if (localReleases && localReleases.release_dates) {
            const digital = localReleases.release_dates.find(d => d.type === 4); // Type 4 is Digital/OTT
            if (digital) {
                const dateObj = new Date(digital.release_date.split('T')[0]);
                digitalDateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            }
        }
    }
    
    // Extract Age Certification (e.g. U, UA, R)
    let certification = '';
    if (details.release_dates && details.release_dates.results) {
        const inReleases = details.release_dates.results.find(r => r.iso_3166_1 === 'IN') || details.release_dates.results.find(r => r.iso_3166_1 === 'US');
        if (inReleases && inReleases.release_dates) {
            const cert = inReleases.release_dates.find(d => d.certification && d.certification !== '');
            if (cert) certification = cert.certification;
        }
    }
    const certString = certification ? ` • ${certification}` : '';
    
    // Process OTT Providers (Check IN, then US, then ANY country to find a platform)
    const allProvidersInfo = (details['watch/providers'] && details['watch/providers'].results) ? details['watch/providers'].results : {};
    let providers = allProvidersInfo['IN'] || allProvidersInfo['US'];
    
    if (!providers) {
        // Fallback to any region that has flatrate
        const backupRegion = Object.keys(allProvidersInfo).find(k => allProvidersInfo[k].flatrate);
        if (backupRegion) providers = allProvidersInfo[backupRegion];
        else providers = {};
    }
    
    // Grab the official watch index link
    const watchLink = providers.link || `https://www.themoviedb.org/movie/${details.id}/watch`;
    
    const flatrateProviders = providers.flatrate || [];
    const rentProviders = providers.rent || [];
    const buyProviders = providers.buy || [];
    
    const allProvidersMap = new Map();
    [...flatrateProviders, ...rentProviders, ...buyProviders].forEach(p => {
        if (!allProvidersMap.has(p.provider_id)) {
            allProvidersMap.set(p.provider_id, p);
        }
    });
    
    const combinedProviders = Array.from(allProvidersMap.values());
    const topProviderName = combinedProviders.length > 0 ? combinedProviders[0].provider_name : '';
    
    // Generate the custom OTT release sentence the user requested
    let ottReleaseSentence = '';
    if (topProviderName && digitalDateStr) {
        ottReleaseSentence = `<p style="color: #E50914; font-weight: 800; font-size: 16px; margin: 15px 0;">
                                 <i class="fa-solid fa-play"></i> Releasing on ${topProviderName} on ${digitalDateStr}
                              </p>`;
    } else if (topProviderName) {
         ottReleaseSentence = `<p style="color: #E50914; font-weight: 800; font-size: 16px; margin: 15px 0;">
                                 <i class="fa-solid fa-play"></i> Streaming on ${topProviderName}
                              </p>`;
    } else if (digitalDateStr) {
         ottReleaseSentence = `<p style="color: #E50914; font-weight: 800; font-size: 16px; margin: 15px 0;">
                                 <i class="fa-solid fa-play"></i> Releasing Digitally on ${digitalDateStr}
                              </p>`;
    }

    let providersHtml = '';
    if (combinedProviders.length > 0) {
        providersHtml = `
            <div class="ott-providers" style="margin-top: 10px;">
                <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 5px;">*Click a logo to open directly in a new tab</p>
                <div class="providers-list">
                    ${combinedProviders.map(p => `
                        <a href="${watchLink}" target="_blank" style="transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <img class="provider-logo" src="${IMAGE_BASE_URL}${p.logo_path}" alt="${p.provider_name}" title="Watch on ${p.provider_name} (Opens in new tab)">
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
         providersHtml = `
            <div class="ott-providers" style="margin-top: 15px;">
                <p style="color: var(--text-secondary); font-size: 13px;"><i class="fa-solid fa-circle-info"></i> TMDB database does not have an OTT platform confirmed for this movie yet.</p>
            </div>
        `;
    }

    // Process Reviews
    let reviewHtml = '';
    if (details.reviews && details.reviews.results && details.reviews.results.length > 0) {
        const topReview = details.reviews.results[0]; // grab the most relevant review
        let contentShort = topReview.content;
        if (contentShort.length > 250) contentShort = contentShort.substring(0, 250) + '...';
        
        // Use Regex to convert any raw http links in the review text to actual clickable <a> tags
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        contentShort = contentShort.replace(urlRegex, '<a href="$1" target="_blank" style="color: #4da8da; text-decoration: underline;" title="Open link in new tab">$1</a>');

        reviewHtml = `
            <div class="movie-review" style="margin-top: 20px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                <h4 style="color: var(--accent); margin-bottom: 8px;"><i class="fa-solid fa-comment-dots"></i> Review by ${topReview.author}</h4>
                <p style="font-size: 14px; font-style: italic; color: #ddd; line-height: 1.5;">"${contentShort}"</p>
                <a href="${topReview.url}" target="_blank" style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; display: inline-block;">Read full review on TMDB <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
            </div>
        `;
    }

    // Process Credits (Cast & Crew)
    let creditsHtml = '';
    if (details.credits) {
        let gridRows = '';
        
        // Cast (Top 6)
        if (details.credits.cast && details.credits.cast.length > 0) {
            const topCast = details.credits.cast.slice(0, 6).map(c => c.name).join(', ');
            gridRows += `
                <div class="credits-role">Cast</div>
                <div class="credits-names">${topCast}</div>
            `;
        }
        
        // Crew (Director, Producer, Music)
        if (details.credits.crew) {
            const directors = details.credits.crew.filter(c => c.job === 'Director').map(c => c.name).join(', ');
            const producers = details.credits.crew.filter(c => c.job === 'Producer').slice(0, 3).map(c => c.name).join(', ');
            const musicPeople = details.credits.crew.filter(c => c.job === 'Original Music Composer' || c.job === 'Music Director' || c.job === 'Music').slice(0, 2).map(c => c.name).join(', ');
            
            if (directors) {
                gridRows += `
                    <div class="credits-role">Director</div>
                    <div class="credits-names">${directors}</div>
                `;
            }
            if (producers) {
                gridRows += `
                    <div class="credits-role">Producer</div>
                    <div class="credits-names">${producers}</div>
                `;
            }
            if (musicPeople) {
                gridRows += `
                    <div class="credits-role">Music By</div>
                    <div class="credits-names">${musicPeople}</div>
                `;
            }
        }
        
        if (gridRows) {
            creditsHtml = `<div class="credits-grid">${gridRows}</div>`;
        }
    }

    // Extract Trailer
    let trailerHtml = '';
    if (details.videos && details.videos.results) {
        // Find Official YouTube Trailer (fallback to any YouTube video if trailer missing)
        const trailer = details.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') 
                     || details.videos.results.find(v => v.site === 'YouTube');
        
        if (trailer) {
            trailerHtml = `
                <a href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank" class="trailer-btn" title="Watch Trailer on YouTube">
                    <i class="fa-brands fa-youtube" style="font-size: 18px;"></i> Watch Trailer
                </a>
            `;
        }
    }

    modalBody.innerHTML = `
        <img src="${posterUrl}" alt="${details.title}" class="modal-poster">
        <div class="modal-info">
            <h2 class="modal-title" style="margin-bottom: 5px;">${details.title}</h2>
            <p style="color: var(--text-secondary); font-size: 15px; margin-bottom: 15px;">
                ${releaseYear}${certString} • ${genreStr} • ${runtimeStr}
            </p>
            ${trailerHtml}
            <div class="modal-meta">
                ${digitalDateStr ? `<span style="color: var(--accent);" title="Digital OTT Release Date"><i class="fa-solid fa-laptop"></i> OTT: ${digitalDateStr}</span>` : ''}
                <span title="Box Office Earnings"><i class="fa-solid fa-sack-dollar"></i> ${revenue}</span>
                <span title="User Rating"><i class="fa-solid fa-star" style="color: gold;"></i> ${details.vote_average.toFixed(1)}</span>
            </div>
            ${creditsHtml}
            ${ottReleaseSentence}
            ${providersHtml}
            <p class="modal-overview" style="margin-top: 15px;">${details.overview}</p>
            ${reviewHtml}
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

/**
 * Initial UI setup (closing modal)
 */
function setupUI() {
    const modal = document.getElementById('movieModal');
    const closeBtn = document.querySelector('.close-btn');

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto'; // Restore scrolling
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    });
}

            ${reviewHtml}
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

/**
 * Initial UI setup (closing modal)
 */
function setupUI() {
    const modal = document.getElementById('movieModal');
    const closeBtn = document.querySelector('.close-btn');

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto'; // Restore scrolling
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    });
}
