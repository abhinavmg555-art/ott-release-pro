document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const tabBtns = document.querySelectorAll(".tab-btn");
    const filterBtn = document.getElementById("filterBtn");
    
    // Grids
    const trendingGrid = document.getElementById("trendingGrid");
    const upcomingGrid = document.getElementById("upcomingGrid");
    const latestGrid = document.getElementById("latestGrid");
    
    // Sections
    const tmTrending = document.getElementById("tmTrending");
    const tmUpcoming = document.getElementById("tmUpcoming");
    const tmLatest = document.getElementById("tmLatest");
    
    // Hero Elements
    const heroTitle = document.getElementById("heroTitle");
    const heroRating = document.getElementById("heroRating");
    const heroYear = document.getElementById("heroYear");
    const heroDesc = document.getElementById("heroDesc");
    const heroSection = document.getElementById("heroSection");
    const heroTrailerBtn = document.getElementById("heroTrailerBtn");
    
    // Modals
    const filterModal = document.getElementById("filterModal");
    const closeFilter = document.getElementById("closeFilter");
    const applyFilterBtn = document.getElementById("applyFilterBtn");
    
    const trailerModal = document.getElementById("trailerModal");
    const closeTrailer = document.getElementById("closeTrailer");
    const trailerContainer = document.getElementById("trailerContainer");
    
    // Filters
    const langFilter = document.getElementById("langFilter");
    const genreFilter = document.getElementById("genreFilter");
    const yearFilter = document.getElementById("yearFilter");
    
    // State
    let currentFilterState = {
        language: '',
        with_genres: '',
        primary_release_year: ''
    };
    
    let isFetching = false;
    let heroMovieId = null;

    // Initialization
    async function init() {
        showLoading(trendingGrid);
        showLoading(upcomingGrid);
        showLoading(latestGrid);
        
        try {
            await loadAllSections();
        } catch(error) {
            console.error(error);
        }
    }

    async function loadAllSections() {
        const params = getFilterParams();
        
        const [trending, upcoming, latest] = await Promise.all([
            getTrendingMovies(1, params),
            getUpcomingMovies(1, params),
            getLatestMovies(1, params)
        ]);
        
        renderMovies(trending.results, trendingGrid);
        renderMovies(upcoming.results, upcomingGrid);
        renderMovies(latest.results, latestGrid);
        
        // Set Hero
        if(trending.results.length > 0) {
            setHero(trending.results[0]);
        }
    }
    
    function getFilterParams() {
        const params = {};
        if(currentFilterState.language) params.with_original_language = currentFilterState.language;
        if(currentFilterState.with_genres) params.with_genres = currentFilterState.with_genres;
        if(currentFilterState.primary_release_year) params.primary_release_year = currentFilterState.primary_release_year;
        return params;
    }

    // Rendering
    function renderMovies(movies, container) {
        container.innerHTML = "";
        if (!movies || movies.length === 0) {
            container.innerHTML = "<p style='color: var(--text-secondary); grid-column: 1/-1;'>No movies found.</p>";
            return;
        }

        movies.slice(0, 10).forEach(movie => {
            if(!movie.poster_path) return;
            
            const card = document.createElement("div");
            card.classList.add("movie-card");
            
            const posterUrl = `${IMAGE_BASE_URL}${movie.poster_path}`;
            const releaseYear = movie.release_date ? movie.release_date.substring(0,4) : 'N/A';
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';
            
            card.innerHTML = `
                <div class="card-img-wrapper">
                    <img src="${posterUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">
                    <div class="ott-badge">TMDB</div>
                    <div class="watch-trailer-btn">
                        <button onclick="playTrailer(${movie.id}, event)">Watch Trailer</button>
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
            
            card.addEventListener('click', () => openMovieDetails(movie.id));
            container.appendChild(card);
        });
    }

    function setHero(movie) {
        if(!movie.backdrop_path) return;
        heroMovieId = movie.id;
        heroSection.style.backgroundImage = `url(${IMAGE_ORIGINAL_URL}${movie.backdrop_path})`;
        heroTitle.textContent = movie.title || movie.name;
        heroYear.textContent = movie.release_date ? movie.release_date.substring(0,4) : '';
        heroRating.textContent = movie.vote_average ? movie.vote_average.toFixed(1) : '';
        heroDesc.textContent = movie.overview;
    }

    window.playTrailer = async function(movieId, event) {
        if(event) {
            event.stopPropagation();
        }
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
                alert("Trailer not available");
            }
        } catch(e) {
            console.error("Error fetching trailer", e);
        }
    };
    
    heroTrailerBtn.addEventListener('click', () => {
        if(heroMovieId) {
            playTrailer(heroMovieId);
        }
    });

    closeTrailer.addEventListener('click', () => {
        trailerModal.classList.remove('active');
        trailerContainer.innerHTML = '';
    });

    // Filtering
    filterBtn.addEventListener('click', () => {
        filterModal.classList.add('active');
    });

    closeFilter.addEventListener('click', () => {
        filterModal.classList.remove('active');
    });

    applyFilterBtn.addEventListener('click', async () => {
        currentFilterState.language = langFilter.value;
        currentFilterState.with_genres = genreFilter.value;
        currentFilterState.primary_release_year = yearFilter.value;
        
        filterModal.classList.remove('active');
        
        tmTrending.scrollIntoView({ behavior: 'smooth' });
        await init();
    });

    // Search
    searchBtn.addEventListener('click', executeSearch);
    searchInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') executeSearch();
    });

    async function executeSearch() {
        const query = searchInput.value.trim();
        if(!query) return;
        
        tmUpcoming.style.display = 'none';
        tmLatest.style.display = 'none';
        
        document.querySelector("#tmTrending .section-title").textContent = `Search Results for "${query}"`;
        showLoading(trendingGrid);
        
        try {
            const results = await searchMovies(query, getFilterParams());
            renderMovies(results.results, trendingGrid);
            
            if(results.results.length > 0) {
                setHero(results.results[0]);
            }
        } catch (e) {
            console.error(e);
        }
    }

    // Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const target = btn.dataset.target;
            tmTrending.style.display = 'none';
            tmUpcoming.style.display = 'none';
            tmLatest.style.display = 'none';
            
            document.querySelector("#tmTrending .section-title").textContent = `Trending Now`;
            
            if(target === 'all') {
                tmTrending.style.display = 'block';
                tmUpcoming.style.display = 'block';
                tmLatest.style.display = 'block';
            } else {
                document.getElementById(target).style.display = 'block';
            }
        });
    });

    // Utilities
    function showLoading(container) {
        container.innerHTML = `<p style="color:var(--accent); text-align:center; padding: 20px; grid-column:1/-1;">Loading...</p>`;
    }

    init();
});
