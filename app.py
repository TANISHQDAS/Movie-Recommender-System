import os
import pickle
import requests
import streamlit as st
import streamlit.components.v1 as components
from dotenv import load_dotenv

# Load environment variables from a local .env file (if present)
load_dotenv()

# ==============================================================================
# Page Configuration & Theme
# ==============================================================================
st.set_page_config(
    page_title="CineMatch AI - Movie Recommender System",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Glassmorphic CSS Styling
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Outfit:wght@500;700;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    
    .stApp {
        background-color: #070913;
        background-image: radial-gradient(circle at 50% 0%, rgba(15, 23, 42, 0.8) 0%, rgba(7, 9, 19, 0.98) 100%);
    }
    
    /* Header Styling */
    .brand-header {
        text-align: center;
        padding: 1.5rem 0 2rem;
    }
    .brand-title {
        font-family: 'Outfit', sans-serif;
        font-size: 3rem;
        font-weight: 800;
        background: linear-gradient(135deg, #FFFFFF 0%, #E50914 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.25rem;
    }
    .brand-subtitle {
        color: #94A3B8;
        font-size: 1.1rem;
    }
    
    /* Glassmorphic Container Cards */
    .glass-card {
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    
    /* Movie Titles & Rating Badges */
    .movie-title-text {
        font-family: 'Outfit', sans-serif;
        font-size: 1.15rem;
        font-weight: 700;
        color: #F8FAFC;
        margin-top: 0.5rem;
    }
    .rating-pill {
        display: inline-block;
        background: rgba(255, 215, 0, 0.15);
        color: #FFD700;
        border: 1px solid rgba(255, 215, 0, 0.4);
        padding: 0.2rem 0.6rem;
        border-radius: 20px;
        font-weight: 700;
        font-size: 0.85rem;
        margin-bottom: 0.5rem;
    }
    
    /* Custom Streamlit Button Tweaks */
    .stButton>button {
        background: linear-gradient(135deg, #E50914 0%, #B20710 100%);
        color: white;
        border: none;
        border-radius: 10px;
        padding: 0.6rem 1.5rem;
        font-weight: 700;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(229, 9, 20, 0.4);
    }
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(229, 9, 20, 0.6);
        background: linear-gradient(135deg, #FF1F2D 0%, #E50914 100%);
    }
    
    /* Expander styling */
    .streamlit-expanderHeader {
        background-color: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
    }
    </style>
    """, unsafe_allow_html=True)

# TMDB API key is now loaded from the environment instead of being hardcoded.
# Set it in a local .env file (see .env.example) or as a real environment
# variable / Streamlit secret in production.
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

if not TMDB_API_KEY:
    st.error(
        "TMDB_API_KEY is not set. Create a `.env` file (see `.env.example`) "
        "or set the TMDB_API_KEY environment variable before running the app."
    )
    st.stop()

# ==============================================================================
# Helper Functions & Data Fetching
# ==============================================================================
@st.cache_data(show_spinner=False)
def fetch_movie_details(movie_id):
    url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={TMDB_API_KEY}&append_to_response=videos,credits"
    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            return res.json()
    except Exception:
        pass
    return None

@st.cache_data(show_spinner=False)
def fetch_poster(poster_path):
    if poster_path:
        return f"https://image.tmdb.org/t/p/w500/{poster_path}"
    return "https://via.placeholder.com/500x750?text=No+Poster"

@st.cache_data(show_spinner=False)
def fetch_tmdb_recommendations(movie_id):
    url = f"https://api.themoviedb.org/3/movie/{movie_id}/recommendations?api_key={TMDB_API_KEY}"
    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            return res.json().get('results', [])
    except Exception:
        pass
    return []

# ==============================================================================
# Data Loading (Dual Engine Support)
# ==============================================================================
movies_df = None
similarity_matrix = None

# Attempt to load local pkl files if built locally
possible_pkl_paths = ['movie_list.pkl', 'Website/movie_list.pkl', 'Model/movie_list.pkl']
for path in possible_pkl_paths:
    if os.path.exists(path):
        try:
            movies_df = pickle.load(open(path, 'rb'))
            sim_path = path.replace('movie_list.pkl', 'similarity.pkl')
            if os.path.exists(sim_path):
                similarity_matrix = pickle.load(open(sim_path, 'rb'))
            break
        except Exception:
            pass

# Session State for Watchlist
if 'watchlist' not in st.session_state:
    st.session_state.watchlist = []

# ==============================================================================
# Recommendation Function
# ==============================================================================
def get_recommendations(selected_title, limit=5):
    recommended_list = []
    
    # 1. Try Local Cosine Similarity ML Engine
    if movies_df is not None and similarity_matrix is not None and selected_title in movies_df['title'].values:
        try:
            index = movies_df[movies_df['title'] == selected_title].index[0]
            distances = sorted(list(enumerate(similarity_matrix[index])), reverse=True, key=lambda x: x[1])
            
            for i in distances[1:limit+1]:
                movie_id = movies_df.iloc[i[0]].movie_id
                movie_title = movies_df.iloc[i[0]].title
                details = fetch_movie_details(movie_id)
                
                poster_url = fetch_poster(details.get('poster_path')) if details else "https://via.placeholder.com/500x750?text=No+Poster"
                
                recommended_list.append({
                    'id': movie_id,
                    'title': movie_title,
                    'poster': poster_url,
                    'rating': details.get('vote_average', 'N/A') if details else 'N/A',
                    'overview': details.get('overview', 'No overview available') if details else 'No overview available',
                    'release_date': details.get('release_date', 'N/A') if details else 'N/A',
                    'videos': details.get('videos', {}).get('results', []) if details else []
                })
            return recommended_list
        except Exception:
            pass

    # 2. Fallback / Live TMDB Recommendation Engine
    # Search for movie ID on TMDB API
    search_url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={selected_title}"
    try:
        res = requests.get(search_url).json()
        if res.get('results'):
            movie_id = res['results'][0]['id']
            recs = fetch_tmdb_recommendations(movie_id)
            for m in recs[:limit]:
                details = fetch_movie_details(m['id'])
                recommended_list.append({
                    'id': m['id'],
                    'title': m['title'],
                    'poster': fetch_poster(m.get('poster_path')),
                    'rating': round(m.get('vote_average', 0), 1),
                    'overview': m.get('overview', 'No overview available'),
                    'release_date': m.get('release_date', 'N/A'),
                    'videos': details.get('videos', {}).get('results', []) if details else []
                })
    except Exception as e:
        st.error(f"Error fetching recommendations: {e}")
        
    return recommended_list

# ==============================================================================
# Header UI
# ==============================================================================
st.markdown("""
    <div class="brand-header">
        <h1 class="brand-title">🎬 CineMatch AI</h1>
        <p class="brand-subtitle">Ultra-fast personalized movie recommendations powered by Content ML & TMDB</p>
    </div>
""", unsafe_allow_html=True)

# Sidebar Navigation & Filter Controls
with st.sidebar:
    st.image("https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400&auto=format&fit=crop", use_container_width=True)
    st.markdown("### ⚙️ Preference Center")
    min_rating = st.slider("Minimum Rating Threshold", 0.0, 9.0, 6.0, 0.5)
    rec_count = st.slider("Number of Recommendations", 3, 10, 5)
    
    st.markdown("---")
    st.markdown(f"### 🔖 Personal Watchlist ({len(st.session_state.watchlist)})")
    if st.session_state.watchlist:
        for w_movie in st.session_state.watchlist:
            st.markdown(f"- **{w_movie}**")
        if st.button("Clear Watchlist"):
            st.session_state.watchlist = []
            st.rerun()
    else:
        st.caption("No saved movies yet.")

# Main Movie Selector
if movies_df is not None:
    movie_options = movies_df['title'].values
else:
    movie_options = [
        "Interstellar", "Inception", "The Dark Knight", "Avatar", "The Matrix", 
        "Titanic", "Avengers: Endgame", "Pulp Fiction", "Forrest Gump", "Gladiator"
    ]

selected_movie = st.selectbox(
    "🔍 Search or select a movie you loved:",
    options=movie_options,
    index=0
)

# Recommend Trigger
if st.button("🚀 Discover Similar Movies"):
    with st.spinner("Analyzing neural content similarity & TMDB graph..."):
        recommendations = get_recommendations(selected_movie, limit=rec_count)
        
        # Apply min rating filter
        filtered_recs = [m for m in recommendations if (isinstance(m['rating'], (int, float)) and m['rating'] >= min_rating) or m['rating'] == 'N/A']

        if filtered_recs:
            st.markdown("---")
            st.markdown(f"### 🌟 Top Recommendations for *{selected_movie}*")
            
            cols = st.columns(len(filtered_recs))
            
            for idx, movie in enumerate(filtered_recs):
                with cols[idx]:
                    st.image(movie['poster'], use_container_width=True)
                    st.markdown(f"<div class='movie-title-text'>{movie['title']}</div>", unsafe_allow_html=True)
                    st.markdown(f"<div class='rating-pill'>⭐ {movie['rating']}</div>", unsafe_allow_html=True)
                    
                    # Watchlist toggle
                    if movie['title'] in st.session_state.watchlist:
                        if st.button("✓ Saved", key=f"saved_{movie['id']}"):
                            st.session_state.watchlist.remove(movie['title'])
                            st.rerun()
                    else:
                        if st.button("+ Watchlist", key=f"add_{movie['id']}"):
                            st.session_state.watchlist.append(movie['title'])
                            st.rerun()
                            
                    # More info expander
                    with st.expander("ℹ️ Details & Trailer"):
                        st.markdown(f"**Release Date:** {movie['release_date']}")
                        st.markdown(f"**Overview:** {movie['overview']}")
                        
                        # Find YouTube trailer video
                        trailers = [v for v in movie['videos'] if v.get('type') == 'Trailer' and v.get('site') == 'YouTube']
                        if trailers:
                            trailer_key = trailers[0]['key']
                            st.video(f"https://www.youtube.com/watch?v={trailer_key}")
        else:
            st.warning("No recommendations met your rating criteria. Try adjusting the slider on the left!")

# Footer
st.markdown("---")
st.markdown("<p style='text-align: center; color: #64748B;'>Crafted with ❤️ for Movie Enthusiasts • Hosted on GitHub Pages & Streamlit Cloud</p>", unsafe_allow_html=True)
