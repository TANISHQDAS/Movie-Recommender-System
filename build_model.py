"""
Build Script for Movie Recommender System Model.
Downloads/processes the TMDB 5000 dataset and generates `movie_list.pkl` & `similarity.pkl`.
"""

import os
import pickle
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def build():
    print("Starting Model Generation...")
    
    movies_path = 'Dataset/tmdb_5000_movies.csv'
    credits_path = 'Dataset/tmdb_5000_credits.csv'
    
    if not os.path.exists(movies_path) or not os.path.exists(credits_path):
        print(f"Dataset files not found in Dataset/ directory. Skipping offline model build.")
        return

    print("Loading Datasets...")
    movies = pd.read_csv(movies_path)
    credits = pd.read_csv(credits_path)
    
    # Merge datasets
    movies = movies.merge(credits, on='title')
    
    # Select relevant features
    movies = movies[['movie_id', 'title', 'overview', 'genres', 'keywords', 'cast', 'crew']]
    movies.dropna(inplace=True)
    
    # Extract tags helper
    import ast
    def convert(obj):
        L = []
        for i in ast.literal_eval(obj):
            L.append(i['name'])
        return L

    def convert3(obj):
        L = []
        counter = 0
        for i in ast.literal_eval(obj):
            if counter != 3:
                L.append(i['name'])
                counter += 1
            else:
                break
        return L

    def fetch_director(obj):
        L = []
        for i in ast.literal_eval(obj):
            if i['job'] == 'Director':
                L.append(i['name'])
                break
        return L

    print("Processing Features...")
    movies['genres'] = movies['genres'].apply(convert)
    movies['keywords'] = movies['keywords'].apply(convert)
    movies['cast'] = movies['cast'].apply(convert3)
    movies['crew'] = movies['crew'].apply(fetch_director)
    movies['overview'] = movies['overview'].apply(lambda x: x.split())
    
    # Remove spaces from strings
    for col in ['genres', 'keywords', 'cast', 'crew']:
        movies[col] = movies[col].apply(lambda x: [i.replace(" ", "") for i in x])
        
    movies['tags'] = movies['overview'] + movies['genres'] + movies['keywords'] + movies['cast'] + movies['crew']
    
    new_df = movies[['movie_id', 'title', 'tags']].copy()
    new_df['tags'] = new_df['tags'].apply(lambda x: " ".join(x).lower())
    
    print("Vectorizing Text & Calculating Cosine Similarity Matrix...")
    cv = CountVectorizer(max_features=5000, stop_words='english')
    vectors = cv.fit_transform(new_df['tags']).toarray()
    
    similarity = cosine_similarity(vectors)
    
    # Export model files
    print("Exporting pickle files...")
    pickle.dump(new_df, open('movie_list.pkl', 'wb'))
    pickle.dump(similarity, open('similarity.pkl', 'wb'))
    
    print("Successfully built movie_list.pkl and similarity.pkl!")

if __name__ == '__main__':
    build()
