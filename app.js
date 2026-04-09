document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const filterBtns = document.querySelectorAll(".filter-btn");
    const langFilter = document.getElementById("langFilter");
    const genreFilter = document.getElementById("genreFilter");
    const yearFilter = document.getElementById("yearFilter");
    
    // Populate years
    if (yearFilter) {
        const currentYear = new Date().getFullYear();
        for (let y = currentYear + 2; y >= 2000; y--) {
            const option = document.createElement("option");
            option.value = y;
            option.textContent = y;
            yearFilter.appendChild(option);
        }
    }
    
    // Grids
    const trendingGrid = document.getElementById("trendingGrid");
    const latestGrid = document.getElementById("latestGrid");
    
    // Hero Elements
    const heroTitle = document.getElementById("heroTitle");
    const heroMeta = document.getElementById("heroMeta");
    const heroDesc = document.getElementById("heroDesc");
    const heroSection = document.getElementById("heroSection");
    const heroTrailerBtn = document.getElementById("heroTrailerBtn");
    
    // Modals & UI
    const trailerModal = document.getElementById("trailerModal");
    const closeTrailer = document.getElementById("closeTrailer");
    const trailerContainer = document.getElementById("trailerContainer");
    const themeToggle = document.getElementById("themeToggle");
    const backToTop = document.getElementById("backToTop");
    const filterToggleBtn = document.getElementById("filterToggleBtn");
    const advancedFilters = document.getElementById("advancedFilters");

    if (filterToggleBtn && advancedFilters) {
        filterToggleBtn.addEventListener("click", () => {
            if (advancedFilters.style.display === "none") {
                advancedFilters.style.display = "flex";
                advancedFilters.style.animation = "slideUpFade 0.3s ease";
            } else {
                advancedFilters.style.display = "none";
            }
        });
    }

    // Mobile Search Modal Events
    const mobileSearchTrigger = document.getElementById("mobileSearchTrigger");
    const searchModal = document.getElementById("searchModal");
    const closeSearchModal = document.getElementById("closeSearchModal");
    const mobileSearchInput = document.getElementById("mobileSearchInput");

    if (mobileSearchTrigger && searchModal) {
        mobileSearchTrigger.addEventListener("click", () => {
            searchModal.classList.add("active");
            if(mobileSearchInput) mobileSearchInput.focus();
        });
    }
    if (closeSearchModal) {
        closeSearchModal.addEventListener("click", () => {
            searchModal.classList.remove("active");
        });
    }

    // Bottom Nav Active State logic
    const navItems = document.querySelectorAll(".bottom-nav .nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", function() {
            if(!this.id || this.id !== "mobileSearchTrigger") {
                navItems.forEach(n => n.classList.remove("active"));
                this.classList.add("active");
            }
        });
    });

    // Watchlist State Array
    let watchlist = JSON.parse(localStorage.getItem('ott_watchlist')) || [];

    // Global toggle function
    window.toggleWatchlist = function(movieId, event) {
        if(event) event.stopPropagation();
        movieId = parseInt(movieId);
        const index = watchlist.indexOf(movieId);
        if(index > -1) {
            watchlist.splice(index, 1);
        } else {
            watchlist.push(movieId);
        }
        localStorage.setItem('ott_watchlist', JSON.stringify(watchlist));
        
        // Update DOM button visually
        const btn = event.currentTarget;
        if(btn) {
            if (watchlist.includes(movieId)) {
                btn.innerHTML = '❤️';
            } else {
                btn.innerHTML = '🤍';
            }
        }
    };
    
    // State
    let currentProvider = "all"; // all, 8, 119, 122, others
    let heroMovieId = null;

    // --- Theme Toggle ---
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";

    themeToggle.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("theme", next);
        themeToggle.textContent = next === "dark" ? "☀️" : "🌙";
    });

    // --- Back to Top ---
    window.addEventListener("scroll", () => {
        if (window.scrollY > 500) {
            backToTop.classList.add("visible");
        } else {
            backToTop.classList.remove("visible");
        }
    });

    backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Initialization
    async function init() {
        showSkeletons(trendingGrid);
        showSkeletons(latestGrid);
        
        try {
            await loadSections();
        } catch(error) {
            console.error(error);
        }
    }

    async function loadSections(searchQuery = null) {
        let trendingRes, latestRes;
        
        const params = {
            watch_region: "IN"
        };
        
        // Handle filter providers
        if (currentProvider !== "all" && currentProvider !== "others") {
            params.with_watch_providers = currentProvider;
        } else if (currentProvider === "others") {
            // Exclude netflix(8), prime(119), hotstar(122)
            params.without_watch_providers = "8|119|122";
        }
        
        // Handle Lang, Genre, Year
        if (langFilter && langFilter.value) {
            if (langFilter.value !== "global") {
                params.with_original_language = langFilter.value;
            }
        } else {
            // Default home view -> Strictly Force Indian Languages!
            params.with_original_language = "ml|ta|te|hi|kn|bn";
        }
        
        if (genreFilter && genreFilter.value) {
            params.with_genres = genreFilter.value;
        }
        if (yearFilter && yearFilter.value) {
            params.primary_release_year = yearFilter.value;
        }

        if (searchQuery) {
            trendingRes = await searchMovies(searchQuery, params);
            document.querySelector("#trendingGrid").previousElementSibling.innerHTML = `Search Results: ${searchQuery}`;
            document.querySelector("#latestGrid").parentElement.style.display = "none";
        } else {
            document.querySelector("#trendingGrid").previousElementSibling.innerHTML = `🔥 Trending & Latest Releases`;
            document.querySelector("#latestGrid").parentElement.style.display = "block";
            document.querySelector("#latestGrid").previousElementSibling.innerHTML = `🚀 Upcoming Releases`;
            
            [trendingRes, latestRes] = await Promise.all([
                getTrendingMovies(1, params),
                getUpcomingMovies(1, params)
            ]);
        }
        
        renderMovies(trendingRes.results, trendingGrid);
        if(!searchQuery && latestRes) {
            renderMovies(latestRes.results, latestGrid);
        }
        
        // Update Hero
        if(trendingRes.results && trendingRes.results.length > 0) {
            setHero(trendingRes.results[0]);
        }
    }

    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentProvider = btn.dataset.provider;
            
            searchInput.value = ""; // Reset search
            showSkeletons(trendingGrid);
            showSkeletons(latestGrid);
            loadSections();
            
            // Scroll to trending smoothly
            document.querySelector('.filters-container').scrollIntoView({ behavior: 'smooth' });
        });
    });

    [langFilter, genreFilter, yearFilter].forEach(select => {
        if(select) {
            select.addEventListener('change', () => {
                showSkeletons(trendingGrid);
                showSkeletons(latestGrid);
                loadSections(searchInput.value.trim() || null);
            });
        }
    });

    // Search
    let searchTimeout;
    
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearTimeout(searchTimeout);
            executeSearch();
            // Optional: Dismiss the mobile keyboard after pressing search
            if (document.activeElement) document.activeElement.blur();
        });
    }

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            executeSearch();
        }, 250); // 250ms debounce for lightning-fast real-time filtering
    });

    if(mobileSearchInput) {
        mobileSearchInput.addEventListener('input', (e) => {
            searchInput.value = e.target.value;
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                executeSearch();
            }, 400); 
        });
        mobileSearchInput.addEventListener('keydown', (e) => {
             if(e.key === 'Enter') {
                 searchModal.classList.remove("active");
                 executeSearch();
             }
        });
    }

    function executeSearch() {
        const query = searchInput.value.trim();
        if(!query) {
            init();
            return;
        }
        showSkeletons(trendingGrid);
        loadSections(query);
    }

    // Rendering Helpers
    function getProviderBadgeCode() {
        if (currentProvider === "8") return `<span class="ott-badge ott-netflix">NETFLIX</span>`;
        if (currentProvider === "119") return `<span class="ott-badge ott-prime">PRIME VIDEO</span>`;
        if (currentProvider === "122") return `<span class="ott-badge ott-hotstar">HOTSTAR</span>`;
        return `<span class="ott-badge ott-default">STREAMING</span>`;
    }

    function isToday(dateString) {
        if(!dateString) return false;
        const today = new Date().toISOString().split('T')[0];
        return dateString === today;
    }

    function renderMovies(movies, container) {
        container.innerHTML = "";
        if (!movies || movies.length === 0) {
            container.innerHTML = `
                <div style='color: var(--text-secondary); grid-column: 1/-1; text-align: center; font-size: 18px; padding: 60px 20px;'>
                    <div style="font-size: 48px; margin-bottom: 15px; filter: grayscale(1); opacity: 0.7;">🤷‍♂️</div>
                    <h3 style="color: var(--text-primary); font-size: 1.5rem; margin-bottom: 8px;">No results found</h3>
                    <p style="color: var(--text-secondary); font-size: 0.95rem;">Try adjusting your filters or search terms.</p>
                </div>`;
            return;
        }

        // Sort by latest release date if we aren't specifically trending
        if(container.id === 'latestGrid') {
            movies.sort((a,b) => new Date(b.release_date || 0) - new Date(a.release_date || 0));
        }

        movies.slice(0, 12).forEach((movie, index) => {
            if(!movie.poster_path) return;
            
            const card = document.createElement("div");
            card.classList.add("movie-card", "animate-card");
            card.style.animationDelay = `${index * 0.05}s`;
            
            const posterUrl = `${IMAGE_BASE_URL}${movie.poster_path}`;
            const releaseYear = movie.release_date ? movie.release_date.substring(0,4) : 'N/A';
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';
            
            const isNew = isToday(movie.release_date);
            let isUpcoming = false;
            if (movie.release_date) {
                const releaseDate = new Date(movie.release_date);
                if (releaseDate > new Date()) {
                    isUpcoming = true;
                }
            }
            
            let badgeCode = getProviderBadgeCode();
            if (isUpcoming) {
                badgeCode = `<span class="ott-badge ott-default" style="background:#f39c12">COMING SOON</span>`;
            }

            // Highlight Matched Search Text
            let displayTitle = movie.title || movie.name;
            const currentSearch = searchInput.value.trim();
            if (currentSearch) {
                // Escape regex special chars to be safe
                const safeSearch = currentSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(${safeSearch})`, "gi");
                displayTitle = displayTitle.replace(regex, `<span style="color: var(--accent); font-weight: 800;">$1</span>`);
            }

            const isWatchlisted = watchlist.includes(movie.id);

            card.innerHTML = `
                <div class="card-img-wrapper">
                    <img src="${posterUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">
                    <button class="watchlist-btn" onclick="toggleWatchlist(${movie.id}, event)" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); border: none; font-size: 16px; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; z-index: 5; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                        ${isWatchlisted ? '❤️' : '🤍'}
                    </button>
                    <div class="badge-container">
                        ${isNew ? '<span class="new-badge">NEW TODAY</span>' : ''}
                        ${badgeCode}
                    </div>
                    <div class="watch-trailer-btn">
                        <button onclick="playTrailer(${movie.id}, event)">▶ Trailer</button>
                    </div>
                </div>
                <div class="movie-info">
                    <h3 class="movie-title" title="${movie.title || movie.name}">${displayTitle}</h3>
                    <div class="movie-meta-btm">
                        <span>${releaseYear}</span>
                        <span class="rating">★ ${rating}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    function setHero(movie) {
        if(!movie.backdrop_path) return;
        heroMovieId = movie.id;
        heroSection.style.backgroundImage = `url(${IMAGE_ORIGINAL_URL}${movie.backdrop_path})`;
        
        heroTitle.textContent = movie.title || movie.name;
        heroMeta.innerHTML = `
            <span class="rating-badge">★ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}</span>
            <span class="hero-year">${movie.release_date ? movie.release_date.substring(0,4) : 'N/A'}</span>
            ${isToday(movie.release_date) ? '<span class="new-badge">JUST RELEASED</span>' : ''}
        `;
        heroDesc.textContent = movie.overview;
        heroTrailerBtn.style.display = "inline-flex";

        let heroWatchlistBtn = document.getElementById("heroWatchlistBtn");
        if(!heroWatchlistBtn) {
            heroWatchlistBtn = document.createElement("button");
            heroWatchlistBtn.id = "heroWatchlistBtn";
            heroWatchlistBtn.style.cssText = "display: inline-flex; align-items: center; background: rgba(255,255,255,0.2); color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; margin-left: 10px; backdrop-filter: blur(5px); transition: transform 0.2s ease, background 0.2s;";
            
            heroWatchlistBtn.onmouseover = () => { heroWatchlistBtn.style.background = "rgba(255,255,255,0.3)"; heroWatchlistBtn.style.transform = "scale(1.05)"; };
            heroWatchlistBtn.onmouseout = () => { heroWatchlistBtn.style.background = "rgba(255,255,255,0.2)"; heroWatchlistBtn.style.transform = "scale(1)"; };

            heroTrailerBtn.parentNode.insertBefore(heroWatchlistBtn, heroTrailerBtn.nextSibling);
        }
        const isWatchlisted = watchlist.includes(movie.id);
        heroWatchlistBtn.innerHTML = isWatchlisted ? '❤️ Watchlisted' : '🔔 Notify Me / Watchlist';
        heroWatchlistBtn.onclick = (e) => {
            window.toggleWatchlist(movie.id, e);
            const nowWatchlisted = watchlist.includes(movie.id);
            heroWatchlistBtn.innerHTML = nowWatchlisted ? '❤️ Watchlisted' : '🔔 Notify Me';
        };
    }

    // Trailers & Details Modal
    window.playTrailer = async function(movieId, event) {
        if(event) event.stopPropagation();
        
        try {
            const details = await getMovieDetails(movieId);
            const posterUrl = details.poster_path ? `${IMAGE_BASE_URL}${details.poster_path}` : 'https://via.placeholder.com/300x450';
            const releaseYear = details.release_date ? details.release_date.substring(0,4) : 'N/A';
            
            let runtimeStr = 'Unknown Runtime';
            if (details.runtime) {
                const hours = Math.floor(details.runtime / 60);
                const mins = details.runtime % 60;
                runtimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            }

            const genreStr = (details.genres && details.genres.length > 0) ? details.genres.map(g => g.name).join('/') : 'Unknown Genre';
            const revenue = details.revenue && details.revenue > 0 ? `$${(details.revenue / 1000000).toFixed(1)}M` : 'Unknown';
            
            let digitalDateStr = '';
            if (details.release_dates && details.release_dates.results) {
                let localReleases = details.release_dates.results.find(r => r.iso_3166_1 === 'IN') || details.release_dates.results.find(r => r.iso_3166_1 === 'US') || details.release_dates.results[0];
                if (localReleases && localReleases.release_dates) {
                    const digital = localReleases.release_dates.find(d => d.type === 4);
                    if (digital) digitalDateStr = new Date(digital.release_date.split('T')[0]).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                }
            }
            
            let certification = '';
            if (details.release_dates && details.release_dates.results) {
                const inReleases = details.release_dates.results.find(r => r.iso_3166_1 === 'IN') || details.release_dates.results.find(r => r.iso_3166_1 === 'US');
                if (inReleases && inReleases.release_dates) {
                    const cert = inReleases.release_dates.find(d => d.certification);
                    if (cert) certification = cert.certification;
                }
            }
            const certString = certification ? ` • ${certification}` : '';
            
            const allProvidersInfo = (details['watch/providers'] && details['watch/providers'].results) ? details['watch/providers'].results : {};
            let providers = allProvidersInfo['IN'] || allProvidersInfo['US'];
            if (!providers) {
                const backupRegion = Object.keys(allProvidersInfo).find(k => allProvidersInfo[k].flatrate);
                if (backupRegion) providers = allProvidersInfo[backupRegion];
                else providers = {};
            }
            
            const watchLink = providers.link || `https://www.themoviedb.org/movie/${details.id}/watch`;
            const flatrateProviders = providers.flatrate || [];
            const rentProviders = providers.rent || [];
            const buyProviders = providers.buy || [];
            
            const allProvidersMap = new Map();
            [...flatrateProviders, ...rentProviders, ...buyProviders].forEach(p => {
                if (!allProvidersMap.has(p.provider_id)) allProvidersMap.set(p.provider_id, p);
            });
            const combinedProviders = Array.from(allProvidersMap.values());
            const topProviderName = combinedProviders.length > 0 ? combinedProviders[0].provider_name : '';
            
            let ottReleaseSentence = '';
            if (topProviderName && digitalDateStr) ottReleaseSentence = `<p style="color: #E50914; font-weight: 800; font-size: 16px; margin: 15px 0;">🚀 Releasing on ${topProviderName} on ${digitalDateStr}</p>`;
            else if (topProviderName) ottReleaseSentence = `<p style="color: #E50914; font-weight: 800; font-size: 16px; margin: 15px 0;">▶ Streaming on ${topProviderName}</p>`;
            else if (digitalDateStr) ottReleaseSentence = `<p style="color: #E50914; font-weight: 800; font-size: 16px; margin: 15px 0;">🚀 Releasing Digitally on ${digitalDateStr}</p>`;

            let providersHtml = '';
            if (combinedProviders.length > 0) {
                providersHtml = `<div class="ott-providers" style="margin-top: 10px;">
                    <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 5px;">*Click a logo to open directly in a new tab</p>
                    <div class="providers-list">
                        ${combinedProviders.map(p => `<a href="${watchLink}" target="_blank" style="transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><img class="provider-logo" src="${IMAGE_BASE_URL}${p.logo_path}" alt="${p.provider_name}" title="Watch on ${p.provider_name}"></a>`).join('')}
                    </div>
                </div>`;
            }

            let reviewHtml = '';
            if (details.reviews && details.reviews.results && details.reviews.results.length > 0) {
                const topReview = details.reviews.results[0];
                let contentShort = topReview.content.length > 250 ? topReview.content.substring(0, 250) + '...' : topReview.content;
                contentShort = contentShort.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: #4da8da; text-decoration: underline;">$1</a>');
                reviewHtml = `<div class="movie-review" style="margin-top: 20px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                    <h4 style="color: var(--accent); margin-bottom: 8px;">Review by ${topReview.author}</h4>
                    <p style="font-size: 14px; font-style: italic; color: #ddd; line-height: 1.5;">"${contentShort}"</p>
                    <a href="${topReview.url}" target="_blank" style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; display: inline-block;">Read full review on TMDB ↗</a>
                </div>`;
            }

            let creditsHtml = '';
            if (details.credits) {
                let gridRows = '';
                if (details.credits.cast && details.credits.cast.length > 0) {
                    const topCast = details.credits.cast.slice(0, 6).map(c => c.name).join(', ');
                    gridRows += `<div class="credits-role">Cast</div><div class="credits-names">${topCast}</div>`;
                }
                if (details.credits.crew) {
                    const directors = details.credits.crew.filter(c => c.job === 'Director').map(c => c.name).join(', ');
                    const producers = details.credits.crew.filter(c => c.job === 'Producer').slice(0, 3).map(c => c.name).join(', ');
                    const musicPeople = details.credits.crew.filter(c => ['Original Music Composer', 'Music Director', 'Music'].includes(c.job)).slice(0, 2).map(c => c.name).join(', ');
                    if (directors) gridRows += `<div class="credits-role">Director</div><div class="credits-names">${directors}</div>`;
                    if (producers) gridRows += `<div class="credits-role">Producer</div><div class="credits-names">${producers}</div>`;
                    if (musicPeople) gridRows += `<div class="credits-role">Music By</div><div class="credits-names">${musicPeople}</div>`;
                }
                if (gridRows) creditsHtml = `<div class="credits-grid">${gridRows}</div>`;
            }

            let trailerHtml = '';
            const trailer = details.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') || details.videos?.results?.find(v => v.site === 'YouTube');
            if (trailer) trailerHtml = `<a href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank" class="trailer-btn" title="Watch Trailer on YouTube">▶ Watch Trailer</a>`;

            trailerContainer.innerHTML = `
                <img src="${posterUrl}" alt="${details.title}" class="modal-poster">
                <div class="modal-info">
                    <h2 class="modal-title" style="margin-bottom: 5px;">${details.title}</h2>
                    <p style="color: var(--text-secondary); font-size: 15px; margin-bottom: 15px;">
                        ${releaseYear}${certString} • ${genreStr} • ${runtimeStr}
                    </p>
                    ${trailerHtml}
                    <div class="modal-meta">
                        ${digitalDateStr ? `<span style="color: var(--accent);" title="Digital OTT Release Date">OTT: ${digitalDateStr}</span>` : ''}
                        <span title="Box Office Earnings">💰 ${revenue}</span>
                        <span title="User Rating">⭐ ${details.vote_average.toFixed(1)}</span>
                    </div>
                    ${creditsHtml}
                    ${ottReleaseSentence}
                    ${providersHtml}
                    <p class="modal-overview" style="margin-top: 15px;">${details.overview}</p>
                    ${reviewHtml}
                </div>
            `;
            trailerModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } catch(e) {
            console.error(e);
        }
    };
    
    heroTrailerBtn.addEventListener('click', () => {
        if(heroMovieId) playTrailer(heroMovieId);
    });

    closeTrailer.addEventListener('click', () => {
        trailerModal.classList.remove('active');
        trailerContainer.innerHTML = '';
        document.body.style.overflow = '';
    });

    // Utilities
    function showSkeletons(container) {
        container.innerHTML = "";
        for(let i=0; i<4; i++) {
            container.innerHTML += `<div class="movie-card skeleton"><div class="skeleton-img"></div></div>`;
        }
    }

    // Start
    init();
});
