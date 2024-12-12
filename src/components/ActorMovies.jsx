import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import MovieCard from './MovieCard';

const TMDB_API_KEY = 'c59086531f209ac2717b0e50f8c6ef59';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function ActorMovies() {
  const { actorId } = useParams();
  const [actorName, setActorName] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActorData = async () => {
      try {
        const actorResponse = await axios.get(`${TMDB_BASE_URL}/person/${actorId}`, {
          params: {
            api_key: TMDB_API_KEY,
            language: 'pt-BR',
          },
        });
        setActorName(actorResponse.data.name);

        const creditsResponse = await axios.get(`${TMDB_BASE_URL}/person/${actorId}/movie_credits`, {
          params: {
            api_key: TMDB_API_KEY,
            language: 'pt-BR',
          },
        });
        setMovies(creditsResponse.data.cast);
      } catch (err) {
        console.error('Erro ao buscar dados do ator:', err);
        setError('Não foi possível carregar os filmes do ator.');
      } finally {
        setLoading(false);
      }
    };

    fetchActorData();
  }, [actorId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500 dark:text-gray-400">Carregando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-red-500 dark:text-red-400">{error}</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:underline">
        &larr; Voltar
      </Link>
      <div className="mt-4">
        <h1 className="text-3xl font-bold text-white dark:text-gray-800">
          Filmes de {actorName}
        </h1>
      </div>

      {movies.length === 0 ? (
        <div className="mt-8 flex justify-center items-center">
          <span className="text-gray-500 dark:text-gray-400">
            Nenhum filme encontrado para este ator.
          </span>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ActorMovies;
