document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const filterBtns = document.querySelectorAll(".filter-btn");
    
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

        if (searchQuery) {
            trendingRes = await searchMovies(searchQuery, params);
            document.querySelector("#trendingGrid").previousElementSibling.innerHTML = `Search Results: ${searchQuery}`;
            document.querySelector("#latestGrid").parentElement.style.display = "none";
        } else {
            document.querySelector("#trendingGrid").previousElementSibling.innerHTML = `🔥 Trending Now`;
            document.querySelector("#latestGrid").parentElement.style.display = "block";
            
            [trendingRes, latestRes] = await Promise.all([
                getTrendingMovies(1, params),
                getLatestMovies(1, params)
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

    // Search
    searchBtn.addEventListener('click', () => executeSearch());
    searchInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') executeSearch();
    });

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
            container.innerHTML = "<p style='color: var(--text-secondary); grid-column: 1/-1;'>No movies found.</p>";
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
            const badgeCode = getProviderBadgeCode();

            card.innerHTML = `
                <div class="card-img-wrapper">
                    <img src="${posterUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">
                    <div class="badge-container">
                        ${isNew ? '<span class="new-badge">NEW TODAY</span>' : ''}
                        ${badgeCode}
                    </div>
                    <div class="watch-trailer-btn">
                        <button onclick="playTrailer(${movie.id}, event)">▶ Trailer</button>
                    </div>
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title || movie.name}</h3>
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
    }

    // Trailers
    window.playTrailer = async function(movieId, event) {
        if(event) event.stopPropagation();
        
        try {
            const details = await getMovieDetails(movieId);
            const videos = details.videos?.results || [];
            const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.find(v => v.site === 'YouTube');
            
            if (trailer) {
                const iframe = document.createElement('iframe');
                iframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
                iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                iframe.allowFullscreen = true;
                
                trailerContainer.innerHTML = '';
                trailerContainer.appendChild(iframe);
                trailerModal.classList.add('active');
            } else {
                alert("Trailer not available for this title.");
            }
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
// --- LIVE SEARCH (As you type) ---
document.getElementById('searchInput').addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    const allCards = document.querySelectorAll('.movie-card');
    const noResultsMsg = document.getElementById('noResultsMsg');
    let found = false;

    allCards.forEach(card => {
        const titleElement = card.querySelector('.movie-title');
        if (titleElement) {
            const title = titleElement.textContent.toLowerCase();
            if (title.includes(query)) {
                card.style.display = 'flex';
                found = true;
            } else {
                card.style.display = 'none';
            }
        }
    });

    if (!found && query.length > 0) {
        if(noResultsMsg) noResultsMsg.style.display = 'block';
    } else {
        if(noResultsMsg) noResultsMsg.style.display = 'none';
    }
});
