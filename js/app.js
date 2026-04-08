document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const searchInput = document.getElementById("searchInput");
    const filterBtns = document.querySelectorAll(".filter-btn");
    const languageFilter = document.getElementById("languageFilter");
    const genreFilter = document.getElementById("genreFilter");
    const yearFilter = document.getElementById("yearFilter");
    
    // Grids
    const trendingGrid = document.getElementById("trendingGrid");
    const latestGrid = document.getElementById("latestGrid");
    const latestSection = document.getElementById("latestSection");
    const noResultsMsg = document.getElementById("noResultsMsg");
    
    const heroTitle = document.getElementById("heroTitle");
    const heroMeta = document.getElementById("heroMeta");
    const heroDesc = document.getElementById("heroDesc");
    const heroSection = document.getElementById("heroSection");
    const heroTrailerBtn = document.getElementById("heroTrailerBtn");
    
    const trailerModal = document.getElementById("trailerModal");
    const closeTrailer = document.getElementById("closeTrailer");
    const trailerContainer = document.getElementById("trailerContainer");
    
    let currentProvider = "all"; 
    let heroMovieId = null;
    let searchTimeout = null;

    // --- Init ---
    async function init() {
        showSkeletons(trendingGrid);
        showSkeletons(latestGrid);
        try { await loadSections(); } catch (e) {}
    }

    // --- Dynamic API Calls ---
    async function loadSections(searchQuery = null) {
        let trendingRes, latestRes;
        
        // Grab values from our Dropdowns!
        const params = {
            watch_region: "IN"
        };
        
        if (languageFilter.value !== "") params.with_original_language = languageFilter.value;
        if (genreFilter.value !== "") params.with_genres = genreFilter.value;
        if (yearFilter.value !== "") params.primary_release_year = yearFilter.value;
        
        // Grab OTT Platform
        if (currentProvider !== "all") { params.with_watch_providers = currentProvider; }

        if (searchQuery) {
            // Live Search
            trendingRes = await searchMovies(searchQuery, params);
            document.querySelector("#trendingGrid").previousElementSibling.innerHTML = `Search Results: ${searchQuery}`;
            latestSection.style.display = "none";
        } else {
            // Default Load
            document.querySelector("#trendingGrid").previousElementSibling.innerHTML = `🔥 Trending Now`;
            latestSection.style.display = "block";
            
            [trendingRes, latestRes] = await Promise.all([
                getTrendingMovies(1, params),
                getLatestMovies(1, params)
            ]);
        }
        
        renderMovies(trendingRes.results, trendingGrid);
        if(!searchQuery && latestRes) {
            renderMovies(latestRes.results, latestGrid);
        }
        
        if(trendingRes.results && trendingRes.results.length > 0) {
            setHero(trendingRes.results[0]);
        }
    }

    // --- Dropdown EVENTS ---
    
    // When ANY dropdown changes, reload everything dynamically!
    function handleFiltersChanged() {
        const query = searchInput.value.trim();
        showSkeletons(trendingGrid);
        showSkeletons(latestGrid);
        loadSections(query ? query : null);
    }

    languageFilter.addEventListener('change', handleFiltersChanged);
    genreFilter.addEventListener('change', handleFiltersChanged);
    yearFilter.addEventListener('change', handleFiltersChanged);

    // OTT Platform Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentProvider = btn.dataset.provider;
            handleFiltersChanged();
        });
    });

    // Live Search As You Type
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            if(!query) { init(); return; }
            showSkeletons(trendingGrid);
            loadSections(query);
        }, 400); 
    });

    // --- HELPERS ---
    function isToday(dateString) { return dateString === new Date().toISOString().split('T')[0]; }

    function getProviderBadgeCode() {
        if (currentProvider === "8") return `<span class="ott-badge ott-netflix">NETFLIX</span>`;
        if (currentProvider === "119") return `<span class="ott-badge ott-prime">PRIME VIDEO</span>`;
        if (currentProvider === "122") return `<span class="ott-badge ott-hotstar">HOTSTAR</span>`;
        return `<span class="ott-badge ott-default">STREAMING</span>`;
    }

    function renderMovies(movies, container) {
        container.innerHTML = "";
        
        if (!movies || movies.length === 0) {
            noResultsMsg.style.display = "block";
            return;
        } else {
            noResultsMsg.style.display = "none";
        }

        if(container.id === 'latestGrid') {
            movies.sort((a,b) => new Date(b.release_date || 0) - new Date(a.release_date || 0));
        }

        movies.slice(0, 12).forEach((movie, index) => {
            if(!movie.poster_path) return;
            const card = document.createElement("div");
            card.classList.add("movie-card", "animate-card");
            card.style.animationDelay = `${index * 0.05}s`;
            
            const isNew = isToday(movie.release_date);
            const rDate = movie.release_date ? movie.release_date.substring(0,4) : 'N/A';
            const rate = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';
            
            card.innerHTML = `
                <div class="card-img-wrapper">
                    <img src="${IMAGE_BASE_URL}${movie.poster_path}" class="movie-poster" loading="lazy">
                    <div class="badge-container">
                        ${isNew ? '<span class="new-badge">NEW TODAY</span>' : ''}
                        ${getProviderBadgeCode()}
                    </div>
                    <div class="watch-trailer-btn">
                        <button onclick="playTrailer(${movie.id}, event)">▶ Trailer</button>
                    </div>
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title || movie.name}</h3>
                    <div class="movie-meta-btm">
                        <span>${rDate}</span>
                        <span class="rating">★ ${rate}</span>
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
        heroMeta.innerHTML = `<span class="rating-badge">★ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}</span>`;
        heroDesc.textContent = movie.overview;
        heroTrailerBtn.style.display = "inline-flex";
    }

    window.playTrailer = async function(movieId, event) {
        if(event) event.stopPropagation();
        try {
            const details = await getMovieDetails(movieId);
            const videos = details.videos?.results || [];
            const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.find(v => v.site === 'YouTube');
            if (trailer) {
                trailerContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" allow="autoplay; fullscreen"></iframe>`;
                trailerModal.classList.add('active');
            } else alert("Trailer not available.");
        } catch(e) {}
    };
    
    heroTrailerBtn.addEventListener('click', () => { if(heroMovieId) playTrailer(heroMovieId); });
    closeTrailer.addEventListener('click', () => { trailerModal.classList.remove('active'); trailerContainer.innerHTML = ''; });
    
    function showSkeletons(container) {
        container.innerHTML = "";
        for(let i=0; i<4; i++) container.innerHTML += `<div class="movie-card skeleton"><div class="skeleton-img"></div></div>`;
    }

    init();
});
