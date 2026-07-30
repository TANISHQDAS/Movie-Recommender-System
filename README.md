# 🎬 CineMatch - Movie Recommender System

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen?logo=github)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![Streamlit](https://img.shields.io/badge/Streamlit-1.30%2B-FF4B4B?logo=streamlit)
![TMDB API](https://img.shields.io/badge/TMDB-API%20v3-01b4e4?logo=themoviedatabase)
![License](https://img.shields.io/badge/License-MIT-green.svg)

> **CineMatch** is an ultra-modern, cinematic Movie Recommender System engineered with a dark glassmorphism design system. It features **dual recommendation engines** (Content-Based Natural Language Cosine Similarity & TMDB Knowledge Graph) to recommend perfect movies based on plot, genres, cast, keywords, or mood!

## 🌐 Live Website & GitHub Pages Setup

- **Live Website URL**: [https://tanishqdas.github.io/Movie-Recommender-System/](https://tanishqdas.github.io/Movie-Recommender-System/)

### How to Enable GitHub Pages on your Repository (1-Minute Setup):
1. Go to your GitHub repository: `https://github.com/TANISHQDAS/Movie-Recommender-System`
2. Click **Settings** ⚙️ -> **Pages** (on the left sidebar).
3. Under **Build and deployment**:
   - Set **Source**: Select **GitHub Actions** (or **Deploy from a branch** -> Branch: `main` / Folder: `/ (root)` or `/docs`).
4. Save and click **Refresh** — your website will be live at `https://tanishqdas.github.io/Movie-Recommender-System/`!

- **🌐 Instant GitHub Pages Hosting**: Zero setup required! Runs natively in the browser via clean HTML5/CSS3/JavaScript.
- **🎨 Glassmorphic Dark Cinema Aesthetic**: Designed with modern typography, glowing status badges, dynamic backdrop blurs, and micro-animation card transforms.
- **🔥 Mood & Vibe Discovery**: Instantly explore movies tailored to your current mood (*Action-Packed*, *Mind-Bending Sci-Fi*, *Spooky Thrills*, *Heartfelt Romance*, *Laugh Out Loud*, *Masterpieces*).
- **▶️ HD Official Trailer Player**: Watch YouTube movie trailers inside an embedded glass modal with one click.
- **👥 Cast & Crew Breakdown**: View top cast members with actor avatars, character names, and role details.
- **🔖 Personal Session Watchlist**: Bookmark your favorite movies to your personal Watchlist (persisted in browser storage).
- **⚡ Dual ML & TMDB Recommendation Engine**: Uses TF-IDF & Cosine Similarity when local dataset model dumps exist, with intelligent live fallback to TMDB API for zero-crash reliability.
- **🎛️ Custom Filters & Sorting**: Filter recommendations by minimum IMDb/TMDB star ratings (7.0+, 8.0+, 8.5+) or release year.

---

## 🛠️ Project Structure

```plaintext
Movie-Recommender-System/
├── index.html              # GitHub Pages Static Web App (Live Web Host)
├── style.css               # Modern Dark Glassmorphic Design System
├── script.js               # Client-side TMDB Recommendation & Filter Logic
├── app.py                  # Python Streamlit Web Application Entry Point
├── build_model.py          # Script to generate movie_list.pkl & similarity.pkl
├── requirements.txt        # Python package dependencies
├── .gitignore              # Git ignore configuration
├── .github/
│   └── workflows/
│       └── deploy.yml      # Automated GitHub Pages Deployment Workflow
├── Dataset/                # TMDB 5000 Movies & Credits dataset documentation
├── Model/                  # Jupyter Notebook for content-based similarity model
└── Images/                 # Project screenshots and assets
```

---

## 🚀 Quick Start & Installation

### Option 1: Live Web App (No Installation)
Visit the live site directly hosted on GitHub Pages:  
👉 **[https://tanishqdas.github.io/Movie-Recommender-System/](https://tanishqdas.github.io/Movie-Recommender-System/)**

---

### Option 2: Run Python Streamlit App Locally

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/TANISHQDAS/Movie-Recommender-System.git
   cd Movie-Recommender-System
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **(Optional) Build Local Model:**
   ```bash
   python build_model.py
   ```

4. **Launch Streamlit Web App:**
   ```bash
   streamlit run app.py
   ```

---

## 🤖 How the Recommendation Model Works

1. **Feature Engineering**: Combines movie overviews, genres, plot keywords, top 3 cast members, and director names into a unified text tag vector.
2. **Text Vectorization**: Applies `CountVectorizer` (up to 5,000 top features, removing English stop words).
3. **Cosine Similarity**: Calculates pairwise cosine angle distances across vector space:
   $$\text{Similarity}(A, B) = \frac{A \cdot B}{\|A\| \|B\|}$$
4. **TMDB Graph Fallback**: Queries TMDB Graph API for live dynamic similarity & discovery when offline pickle dumps are not loaded.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 💖 Acknowledgements

- [The Movie Database (TMDB) API](https://www.themoviedb.org/) for movie metadata, posters, backdrops, and trailer feeds.
- [Streamlit](https://streamlit.io/) for Python web app framework.
