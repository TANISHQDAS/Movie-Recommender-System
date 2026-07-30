/**
 * CineMatch AI Movie Recommender System - Client-Side Engine
 * TMDB API v3 Integration with Local Storage Watchlist & Mood Discovery
 */

const TMDB_API_KEY = '8265bd1679663a7ea12ac168da84d2e8';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';
const PROFILE_BASE_URL = 'https://image.tmdb.org/t/p/w185';

// State Management
let currentMovie = null;
let recommendedMoviesList = [];
let watchlist = JSON.parse(localStorage.getItem('cinematch_watchlist')) || [];
let searchDebounceTimer = null;

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchDropdown = document.getElementById('search-results-dropdown');
const clearSearchBtn = document.getElementById('clear-search-btn');
const movieGrid = document.getElementById('movie-grid');
const loader = document.getElementById('loader');
const sectionTitle = document.getElementById('section-title');
const resultCount = document.getElementById('result-count');
const castGrid = document.getElementById('cast-grid');
const ratingFilter = document.getElementById('rating-filter');
const sortFilter = document.getElementById('sort-filter');
const watchlistCountBadge = document.getElementById('watchlist-count');

// Hero Spotlight DOM Elements
const heroPoster = document.getElementById('hero-poster');
const heroTitle = document.getElementById('hero-title');
const heroTagline = document.getElementById('hero-tagline');
const heroOverview = document.getElementById('hero-overview');
const heroRating = document.getElementById('hero-rating');
const heroYear = document.getElementById('hero-year');
const heroRuntime = document.getElementById('hero-runtime');
const heroGenres = document.getElementById('hero-genres');
const heroTrailerBtn = document.getElementById('hero-trailer-btn');
const heroWatchlistBtn = document.getElementById('hero-watchlist-btn');
const heroRecommendBtn = document.getElementById('hero-recommend-btn');
const backdropBg = document.getElementById('backdrop-bg');

// Modal Elements
const trailerModal = document.getElementById('trailer-modal');
const trailerIframe = document.getElementById('trailer-iframe');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCloseOverlay = document.getElementById('modal-close-overlay');
const modalMovieTitle = document.getElementById('modal-movie-title');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    updateWatchlistBadge();
    setupEventListeners();
    // Load default hero movie: Interstellar (157336)
    loadMovieDetails(157336);
});

// Event Listeners Setup
function setupEventListeners() {
    // Search input handlers
    searchInput.addEventListener('input', handleSearchInput);
    clearSearchBtn.addEventListener('click', clearSearch);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box-container')) {
            searchDropdown.classList.add('hidden');
        }
    });

    // Mood Filter Chips
    const moodChips = document.querySelectorAll('.mood-chip');
    moodChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            moodChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const mood = chip.dataset.mood;
            handleMoodFilter(mood);
        });
    });

    // Filters
    ratingFilter.addEventListener('change', applyFiltersAndSort);
    sortFilter.addEventListener('change', applyFiltersAndSort);

    // Hero Action Buttons
    heroTrailerBtn.addEventListener('click', () => {
        if (currentMovie) openTrailerModal(currentMovie.id, currentMovie.title);
    });

    heroWatchlistBtn.addEventListener('click', () => {
        if (currentMovie) toggleWatchlist(currentMovie);
    });

    heroRecommendBtn.addEventListener('click', () => {
        if (currentMovie) fetchRecommendations(currentMovie.id, currentMovie.title);
    });

    // Modal Close Handlers
    modalCloseBtn.addEventListener('click', closeTrailerModal);
    modalCloseOverlay.addEventListener('click', closeTrailerModal);

    // Watchlist Navigation Button
    document.getElementById('watchlist-nav-btn').addEventListener('click', (e) => {
        e.preventDefault();
        renderWatchlistSection();
    });
}

// Fetch Full Movie Details by ID
async function loadMovieDetails(movieId) {
    showLoader(true);
    try {
        const res = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits,recommendations,similar`);
        if (!res.ok) throw new Error('Movie not found');
        const data = await res.json();
        
        currentMovie = data;
        renderHeroSpotlight(data);
        renderCast(data.credits ? data.credits.cast : []);
        
        // Fetch recommendations for this movie
        const recs = (data.recommendations && data.recommendations.results.length > 0) 
            ? data.recommendations.results 
            : (data.similar ? data.similar.results : []);
            
        recommendedMoviesList = recs;
        applyFiltersAndSort();
        showLoader(false);
    } catch (err) {
        console.error('Error loading movie:', err);
        showLoader(false);
    }
}

// Render Hero Spotlight Section
function renderHeroSpotlight(movie) {
    const posterUrl = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';
    const backdropUrl = movie.backdrop_path ? `${BACKDROP_BASE_URL}${movie.backdrop_path}` : posterUrl;
    
    heroPoster.src = posterUrl;
    heroPoster.alt = movie.title;
    backdropBg.style.backgroundImage = `url('${backdropUrl}')`;
    
    heroTitle.textContent = movie.title;
    heroTagline.textContent = movie.tagline ? `"${movie.tagline}"` : '';
    heroOverview.textContent = movie.overview || 'No overview available for this title.';
    heroRating.innerHTML = `<i class="fa-solid fa-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}`;
    heroYear.textContent = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    heroRuntime.textContent = movie.runtime ? `${movie.runtime} mins` : 'N/A';

    // Genres
    heroGenres.innerHTML = (movie.genres || []).map(g => `<span class="genre-pill">${g.name}</span>`).join('');

    // Update Watchlist Button state
    updateHeroWatchlistBtnState(movie.id);

    // Smooth scroll to top when hero updates
    document.getElementById('hero-spotlight').scrollIntoView({ behavior: 'smooth' });
}

// Render Cast Cards
function renderCast(castList) {
    castGrid.innerHTML = '';
    const topCast = castList.slice(0, 6);

    if (topCast.length === 0) {
        castGrid.innerHTML = '<p style="color: var(--text-muted);">No cast information available.</p>';
        return;
    }

    topCast.forEach(member => {
        const avatarUrl = member.profile_path ? `${PROFILE_BASE_URL}${member.profile_path}` : 'https://via.placeholder.com/185x185?text=No+Photo';
        const card = document.createElement('div');
        card.className = 'cast-card';
        card.innerHTML = `
            <img src="${avatarUrl}" alt="${member.name}" class="cast-avatar">
            <div class="cast-name">${member.name}</div>
            <div class="cast-character">${member.character || 'Actor'}</div>
        `;
        castGrid.appendChild(card);
    });
}

// Live Search Input Handler
function handleSearchInput(e) {
    const query = e.target.value.trim();
    clearSearchBtn.style.visibility = query ? 'visible' : 'hidden';

    clearTimeout(searchDebounceTimer);
    if (!query) {
        searchDropdown.classList.add('hidden');
        return;
    }

    searchDebounceTimer = setTimeout(() => {
        fetchSearchResults(query);
    }, 300);
}

// Fetch Search Results from TMDB
async function fetchSearchResults(query) {
    try {
        const res = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`);
        const data = await res.json();
        renderSearchDropdown(data.results ? data.results.slice(0, 8) : []);
    } catch (err) {
        console.error('Search error:', err);
    }
}

// Render Search Dropdown Items
function renderSearchDropdown(results) {
    if (results.length === 0) {
        searchDropdown.innerHTML = '<div class="dropdown-item">No movies found.</div>';
        searchDropdown.classList.remove('hidden');
        return;
    }

    searchDropdown.innerHTML = results.map(m => {
        const poster = m.poster_path ? `${IMAGE_BASE_URL}${m.poster_path}` : 'https://via.placeholder.com/40x60?text=No+Img';
        const year = m.release_date ? m.release_date.split('-')[0] : '';
        return `
            <div class="dropdown-item" data-id="${m.id}">
                <img src="${poster}" alt="${m.title}">
                <div>
                    <div style="font-weight: 600; color: white;">${m.title}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${year} • ⭐ ${m.vote_average ? m.vote_average.toFixed(1) : 'N/A'}</div>
                </div>
            </div>
        `;
    }).join('');

    searchDropdown.classList.remove('hidden');

    // Attach click listeners to dropdown items
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const movieId = item.dataset.id;
            searchDropdown.classList.add('hidden');
            searchInput.value = '';
            clearSearchBtn.style.visibility = 'hidden';
            loadMovieDetails(movieId);
        });
    });
}

function clearSearch() {
    searchInput.value = '';
    clearSearchBtn.style.visibility = 'hidden';
    searchDropdown.classList.add('hidden');
}

// Fetch Recommendations
async function fetchRecommendations(movieId, movieTitle) {
    sectionTitle.innerHTML = `<i class="fa-solid fa-sparkles"></i> Recommendations Similar to "${movieTitle}"`;
    loadMovieDetails(movieId);
}

// Filter by Mood / Vibe
async function handleMoodFilter(mood) {
    showLoader(true);
    let endpoint = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`;
    let titleText = 'Popular Movies';

    switch (mood) {
        case 'action':
            endpoint = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=28&sort_by=popularity.desc`;
            titleText = '🔥 High-Octane Action Packed';
            break;
        case 'scifi':
            endpoint = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=878&sort_by=popularity.desc`;
            titleText = '🧠 Mind-Bending Sci-Fi';
            break;
        case 'horror':
            endpoint = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=27&sort_by=popularity.desc`;
            titleText = '👻 Spooky & Suspenseful Thrills';
            break;
        case 'romance':
            endpoint = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=10749&sort_by=popularity.desc`;
            titleText = '❤️ Heartfelt Romance & Drama';
            break;
        case 'comedy':
            endpoint = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=35&sort_by=popularity.desc`;
            titleText = '😂 Laugh Out Loud Comedies';
            break;
        case 'top':
            endpoint = `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}`;
            titleText = '🏆 Legendary Cinema Masterpieces';
            break;
        default:
            titleText = '🌟 Discover Movies';
            break;
    }

    sectionTitle.innerHTML = `<i class="fa-solid fa-compass"></i> ${titleText}`;

    try {
        const res = await fetch(endpoint);
        const data = await res.json();
        recommendedMoviesList = data.results || [];
        applyFiltersAndSort();
        showLoader(false);
    } catch (err) {
        console.error('Mood fetch error:', err);
        showLoader(false);
    }
}

// Apply Filters & Sorting to Recommendations
function applyFiltersAndSort() {
    const minRating = parseFloat(ratingFilter.value) || 0;
    const sortBy = sortFilter.value;

    let filtered = recommendedMoviesList.filter(m => (m.vote_average || 0) >= minRating);

    if (sortBy === 'rating') {
        filtered.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    } else if (sortBy === 'release_date') {
        filtered.sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0));
    } else {
        filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    resultCount.textContent = `Showing ${filtered.length} movies`;
    renderMovieGrid(filtered);
}

// Render Movie Grid
function renderMovieGrid(movies) {
    movieGrid.innerHTML = '';

    if (movies.length === 0) {
        movieGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">
                <i class="fa-solid fa-film" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>No movies match the selected filters. Try broadening your criteria!</p>
            </div>
        `;
        return;
    }

    movies.forEach(movie => {
        const posterUrl = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';
        const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        const isSaved = watchlist.some(item => item.id === movie.id);

        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <div class="card-poster-wrapper">
                <img src="${posterUrl}" alt="${movie.title}" class="card-poster" loading="lazy">
                <span class="card-rating-tag"><i class="fa-solid fa-star"></i> ${rating}</span>
            </div>
            <div class="card-body">
                <div class="card-title" title="${movie.title}">${movie.title}</div>
                <div class="card-meta">
                    <span>${year}</span>
                    <span><i class="fa-solid fa-fire"></i> ${Math.round(movie.popularity || 0)}</span>
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary btn-icon card-trailer-btn" data-id="${movie.id}" data-title="${movie.title}">
                        <i class="fa-solid fa-play"></i> Trailer
                    </button>
                    <button class="btn ${isSaved ? 'btn-primary' : 'btn-secondary'} btn-icon card-watchlist-btn" data-id="${movie.id}">
                        <i class="fa-solid ${isSaved ? 'fa-check' : 'fa-plus'}"></i>
                    </button>
                </div>
            </div>
        `;

        // Card Click opens movie details in Hero
        card.querySelector('.card-poster-wrapper').addEventListener('click', () => {
            loadMovieDetails(movie.id);
        });

        // Trailer Button Click
        card.querySelector('.card-trailer-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openTrailerModal(movie.id, movie.title);
        });

        // Watchlist Button Click
        card.querySelector('.card-watchlist-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWatchlist(movie);
            applyFiltersAndSort();
        });

        movieGrid.appendChild(card);
    });
}

// Watchlist Section Renderer
function renderWatchlistSection() {
    const watchlistSection = document.getElementById('watchlist-section');
    const watchlistGrid = document.getElementById('watchlist-grid');
    watchlistSection.classList.remove('hidden');

    watchlistGrid.innerHTML = '';

    if (watchlist.length === 0) {
        watchlistGrid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 2rem;">Your watchlist is currently empty. Click "+ Add to Watchlist" on any movie to save it here!</p>';
    } else {
        renderWatchlistGrid(watchlist);
    }

    watchlistSection.scrollIntoView({ behavior: 'smooth' });
}

function renderWatchlistGrid(movies) {
    const watchlistGrid = document.getElementById('watchlist-grid');
    watchlistGrid.innerHTML = '';

    movies.forEach(movie => {
        const posterUrl = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <div class="card-poster-wrapper">
                <img src="${posterUrl}" alt="${movie.title}" class="card-poster">
                <span class="card-rating-tag"><i class="fa-solid fa-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
            </div>
            <div class="card-body">
                <div class="card-title">${movie.title}</div>
                <div class="card-actions">
                    <button class="btn btn-outline-danger btn-icon remove-watchlist-btn" data-id="${movie.id}">
                        <i class="fa-solid fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `;

        card.querySelector('.card-poster-wrapper').addEventListener('click', () => loadMovieDetails(movie.id));
        card.querySelector('.remove-watchlist-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWatchlist(movie);
            renderWatchlistSection();
        });

        watchlistGrid.appendChild(card);
    });
}

// Toggle Watchlist Storage
function toggleWatchlist(movie) {
    const index = watchlist.findIndex(item => item.id === movie.id);
    if (index >= 0) {
        watchlist.splice(index, 1);
    } else {
        watchlist.push(movie);
    }
    localStorage.setItem('cinematch_watchlist', JSON.stringify(watchlist));
    updateWatchlistBadge();
    if (currentMovie && currentMovie.id === movie.id) {
        updateHeroWatchlistBtnState(movie.id);
    }
}

function updateWatchlistBadge() {
    watchlistCountBadge.textContent = watchlist.length;
}

function updateHeroWatchlistBtnState(movieId) {
    const isSaved = watchlist.some(item => item.id === movieId);
    if (isSaved) {
        heroWatchlistBtn.innerHTML = '<i class="fa-solid fa-check"></i> In Watchlist';
        heroWatchlistBtn.classList.replace('btn-secondary', 'btn-primary');
    } else {
        heroWatchlistBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add to Watchlist';
        heroWatchlistBtn.classList.replace('btn-primary', 'btn-secondary');
    }
}

// Official Trailer Modal Handlers
async function openTrailerModal(movieId, title) {
    modalMovieTitle.textContent = `${title} - Official Trailer`;
    trailerModal.classList.remove('hidden');
    trailerIframe.src = '';

    try {
        const res = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`);
        const data = await res.json();
        const trailer = (data.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube') || data.results[0];

        if (trailer && trailer.key) {
            trailerIframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
        } else {
            alert('Trailer video unavailable for this title.');
            closeTrailerModal();
        }
    } catch (err) {
        console.error('Trailer load error:', err);
        closeTrailerModal();
    }
}

function closeTrailerModal() {
    trailerModal.classList.add('hidden');
    trailerIframe.src = '';
}

function showLoader(show) {
    if (show) {
        loader.classList.remove('hidden');
        movieGrid.classList.add('hidden');
    } else {
        loader.classList.add('hidden');
        movieGrid.classList.remove('hidden');
    }
}
