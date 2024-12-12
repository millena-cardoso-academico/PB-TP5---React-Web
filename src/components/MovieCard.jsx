// src/components/MovieCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function MovieCard({ movie }) {
  return (
    <div className="bg-gray-700 dark:bg-gray-300 p-4 rounded-lg">
      <Link to={`/movie/${movie.id}`} className="block">
        <img
          src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : 'https://via.placeholder.com/200x300?text=Sem+Imagem'}
          alt={movie.title}
          className="w-full h-auto rounded hover:scale-105 transform transition-transform duration-300"
          loading="lazy"
        />
        <h3 className="text-lg mt-2 text-center text-white dark:text-gray-800">
          {movie.title}
        </h3>
      </Link>
    </div>
  );
}

export default MovieCard;
