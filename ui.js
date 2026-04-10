

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
        
        // Dummy Platform Logic for Demo (Based on movie ID so it's consistent)
        const platforms = ['netflix', 'prime', 'hotstar', 'other'];
        const platformIndex = movie.id % platforms.length;
        const platform = platforms[platformIndex];
        
        let platformBadgeText = 'Other';
        let platformClass = 'platform-other';
        let watchButtonHtml = '';
        
        if (platform === 'netflix') {
            platformBadgeText = 'Netflix';
            platformClass = 'platform-netflix';
            watchButtonHtml = `<a href="https://www.netflix.com" target="_blank" class="watch-btn watch-netflix" onclick="event.stopPropagation()"><i class="fa-solid fa-play"></i> Watch on Netflix</a>`;
        } else if (platform === 'prime') {
            platformBadgeText = 'Prime Video';
            platformClass = 'platform-prime';
            // Replace with your real Amazon affiliate link
            watchButtonHtml = `<a href="https://www.amazon.in/dp/XXXXXXXX?tag=youraffid" target="_blank" class="watch-btn watch-prime" onclick="event.stopPropagation()"><i class="fa-solid fa-play"></i> Watch on Prime</a>`;
        } else if (platform === 'hotstar') {
            platformBadgeText = 'Hotstar';
            platformClass = 'platform-hotstar';
            watchButtonHtml = `<a href="https://www.hotstar.com" target="_blank" class="watch-btn watch-hotstar" onclick="event.stopPropagation()"><i class="fa-solid fa-play"></i> Watch on Hotstar</a>`;
        }

        // Only add to dataset if not already in the array, for filtering
        card.dataset.platform = platform;
        
        card.innerHTML = `
            <img src="${imgUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${movie.id}">
                <i class="fa-solid fa-heart"></i>
            </button>
            <div class="movie-info">
                <span class="platform-badge ${platformClass}">${platformBadgeText}</span>
                <h4 class="movie-title">${movie.title}</h4>
                <div class="movie-meta">
                    <span>${releaseYear}</span>
                    <span><i class="fa-solid fa-star" style="color: gold;"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}</span>
                </div>
                <p class="movie-overview">${movie.overview || 'No overview available.'}</p>
                <div class="watch-actions">
                    ${watchButtonHtml}
                    <button class="view-details-btn" style="margin-top: 5px; width: 100%; background: transparent; border: 1px solid var(--accent); color: var(--accent); padding: 8px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background='var(--accent)'; this.style.color='white'" onmouseout="this.style.background='transparent'; this.style.color='var(--accent)'">View Details</button>
                </div>
            </div>
        `;

        // Card Click Event for Details
        card.addEventListener('click', (e) => {
            if (e.target.closest('.fav-btn') || e.target.closest('.watch-btn') || e.target.closest('.view-details-btn')) {
                if (e.target.closest('.view-details-btn')) {
                    onMovieClick(movie.id);
                }
                return; // Ignore if clicking favorite or watch link directly
            }
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
    // Affiliate Links Distribution Logic
    const affiliateLinks = [
        'https://amzn.to/4edsGSQ',
        'https://amzn.to/4cAyl4b',
        'https://amzn.to/47QfHmd',
        'https://amzn.to/3Qu6dqK',
        'https://amzn.to/3O9D2Zw',
        'https://amzn.to/41kXDgt',
        'https://amzn.to/3NY1Nb4',
        'https://amzn.to/4miwm7S',
        'https://amzn.to/4tB9umt',
        'https://amzn.to/3ObU5tW'
    ];
    
    // Uniquely assign ONE link based on the movie's unique ID to ensure even distribution
    const linkIndex = details.id ? (details.id % affiliateLinks.length) : 0;
    const selectedAffiliateLink = affiliateLinks[linkIndex];

    const dynamicWatchContainer = `
        <div class="watch-container">
            <h3>🎬 Available to Stream Now</h3>
            <a href="${selectedAffiliateLink}" target="_blank" rel="nofollow sponsored" class="watch-btn">
                ▶ Watch on Prime Video
            </a>
        </div>
    `;

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
            <p class="modal-overview" style="margin-top: 15px; margin-bottom: 15px;">${details.overview}</p>
            
            <!-- In-Content AdSense for the Detail Page -->
            <div class="ad-container" style="margin: 15px 0;">
                <p class="ad-label">Advertisement</p>
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-format="fluid"
                     data-ad-layout-key="-fb+5w+4e-db+86"
                     data-ad-client="ca-pub-XXXXXXXX"
                     data-ad-slot="YYYYYYYY"></ins>
            </div>

            <!-- Custom Affiliate Watch Container as Requested (DYNAMIC) -->
            ${dynamicWatchContainer}

            ${reviewHtml}
        </div>
    `;

    modal.classList.remove('hidden');
    // Initialize the adsbygoogle push for the newly added ad unit in the modal if needed
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
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
