import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import RatingForm from '../components/RatingForm';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const API_KEY = 'c59086531f209ac2717b0e50f8c6ef59';
const API_URL = 'http://localhost:3001';

function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const { signed } = useAuth();
  const currentUser = localStorage.getItem('currentUser');
  const [isWatched, setIsWatched] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [hasRated, setHasRated] = useState(false);
  const [showtimes] = useState(['14:00', '16:00', '19:00', '21:00']);
  const [selectedShowtime, setSelectedShowtime] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState('');

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}`,
          {
            params: {
              api_key: API_KEY,
              language: 'pt-BR',
              append_to_response: 'credits,videos',
            },
          }
        );

        setMovie(response.data);
        setCast(response.data.credits.cast);

        if (signed && currentUser) {
          const [watchedResponse, ratingResponse] = await Promise.all([
            axios.get(`${API_URL}/watched/${currentUser}`),
            axios.get(`${API_URL}/ratings/${currentUser}/${id}`),
          ]);

          const watchedMovies = watchedResponse.data.watchedMovies || [];
          setIsWatched(watchedMovies.includes(parseInt(id)));

          if (ratingResponse.data && ratingResponse.data.rating != null) {
            setUserRating(ratingResponse.data.rating);
            setHasRated(true);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes do filme:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id, signed, currentUser]);

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (signed && currentUser) {
        try {
          const response = await axios.get(`${API_URL}/favorites/${currentUser}`);
          const favoriteMovies = response.data.favoriteMovies || [];
          setIsFavorite(favoriteMovies.includes(parseInt(id)));
        } catch (error) {
          console.error('Erro ao buscar filmes favoritos:', error);
        }
      }
    };

    fetchFavoriteStatus();
  }, [signed, currentUser, id]);

  const handleMarkAsWatched = async () => {
    if (!currentUser) {
      alert('Usuário não autenticado.');
      return;
    }

    try {
      await axios.post(`${API_URL}/watched`, {
        username: currentUser,
        movie_id: id,
      });
      setIsWatched(true);
    } catch (error) {
      console.error('Erro ao marcar o filme como visto:', error);
      alert(error.response?.data?.error || 'Erro ao marcar o filme como visto.');
    }
  };

  const handleRatingSubmit = async (rating) => {
    if (!currentUser) {
      alert('Usuário não autenticado.');
      return;
    }

    try {
      await axios.post(`${API_URL}/ratings`, {
        username: currentUser,
        movie_id: id,
        rating,
      });
      setUserRating(rating);
      setHasRated(true);
    } catch (error) {
      console.error('Erro ao enviar a avaliação:', error);
      alert(error.response?.data?.error || 'Erro ao enviar a avaliação.');
    }
  };

  const handleAddToCart = async () => {
    if (!currentUser) {
      alert('Usuário não autenticado.');
      return;
    }

    if (!selectedShowtime || !selectedDate) {
      alert('Por favor, selecione um horário e uma data.');
      return;
    }

    setAddingToCart(true);
    try {
      await axios.post(`${API_URL}/cart`, {
        title: movie.title,
        username: currentUser,
        movie_id: id,
        showtime: selectedShowtime,
        date: selectedDate.toISOString().split('T')[0],
      });
      setCartMessage('Ingresso adicionado ao carrinho com sucesso!');
      setSelectedShowtime('');
      setSelectedDate(null);
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      alert(error.response?.data?.error || 'Erro ao adicionar ao carrinho.');
    } finally {
      setAddingToCart(false);
      setTimeout(() => setCartMessage(''), 5000);
    }
  };

  const handleAddFavorite = async () => {
    if (!currentUser) {
      alert('Usuário não autenticado.');
      return;
    }

    setFavoriteLoading(true);
    try {
      const response = await axios.post(`${API_URL}/favorites`, {
        username: currentUser,
        movie_id: id,
      });
      setIsFavorite(true);
      setFavoriteMessage(response.data.message || 'Filme adicionado aos favoritos com sucesso.');
    } catch (error) {
      console.error('Erro ao adicionar aos favoritos:', error);
      alert(error.response?.data?.error || 'Erro ao adicionar aos favoritos.');
    } finally {
      setFavoriteLoading(false);
      setTimeout(() => setFavoriteMessage(''), 5000);
    }
  };

  const handleRemoveFavorite = async () => {
    if (!currentUser) {
      alert('Usuário não autenticado.');
      return;
    }

    setFavoriteLoading(true);
    try {
      const response = await axios.delete(`${API_URL}/favorites`, {
        data: {
          username: currentUser,
          movie_id: id,
        },
      });
      setIsFavorite(false);
      setFavoriteMessage(response.data.message || 'Filme removido dos favoritos com sucesso.');
    } catch (error) {
      console.error('Erro ao remover dos favoritos:', error);
      alert(error.response?.data?.error || 'Erro ao remover dos favoritos.');
    } finally {
      setFavoriteLoading(false);
      setTimeout(() => setFavoriteMessage(''), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500 dark:text-gray-400">Carregando...</span>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500 dark:text-gray-400">Filme não encontrado.</span>
      </div>
    );
  }

  const formattedDate = movie.release_date
    ? new Date(movie.release_date).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Data não disponível';

  return (
    <div className="bg-gray-700 dark:bg-gray-300 p-8 rounded-lg shadow-2xl">
      <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:underline">
        &larr; Voltar
      </Link>
      <div className="mt-4 flex flex-col md:flex-row">
        <div className="md:w-1/3 relative">
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            className="w-full h-auto rounded"
            loading="lazy"
          />
          {isWatched && (
            <div className="absolute top-4 right-4">
              <span role="img" aria-label="Visto" className="text-3xl">
                👁️
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 md:mt-0 md:ml-6 md:w-2/3">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white dark:text-gray-800">{movie.title}</h1>
            
            {/* Botão de Favorito */}
            {signed && (
              <div className="mt-2 md:mt-0">
                {isFavorite ? (
                  <button
                    onClick={handleRemoveFavorite}
                    className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ${
                      favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={favoriteLoading}
                  >
                    {favoriteLoading ? 'Removendo...' : 'Remover dos Favoritos'}
                  </button>
                ) : (
                  <button
                    onClick={handleAddFavorite}
                    className={`px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 ${
                      favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={favoriteLoading}
                  >
                    {favoriteLoading ? 'Adicionando...' : 'Adicionar aos Favoritos'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mensagem de Favorito */}
          {favoriteMessage && (
            <div className="mt-2 p-2 bg-green-500 text-white rounded">
              {favoriteMessage}
            </div>
          )}

          <p className="mt-2 text-gray-300 dark:text-gray-700">{movie.overview}</p>
          <div className="mt-4">
            <span className="font-semibold text-white dark:text-gray-800">Lançamento:</span>{' '}
            <span className="text-gray-300 dark:text-gray-700">{formattedDate}</span>
          </div>
          <div className="mt-2">
            <span className="font-semibold text-white dark:text-gray-800">Duração:</span>{' '}
            <span className="text-gray-300 dark:text-gray-700">{movie.runtime} minutos</span>
          </div>
          <div className="mt-2">
            <span className="font-semibold text-white dark:text-gray-800">Gêneros:</span>{' '}
            {movie.genres.map((genre) => (
              <span key={genre.id} className="text-gray-300 dark:text-gray-700 mr-2">
                {genre.name}
              </span>
            ))}
          </div>
          <div className="mt-2">
            <span className="font-semibold text-white dark:text-gray-800">Avaliação TMDB:</span>{' '}
            <span className="text-gray-300 dark:text-gray-700">{movie.vote_average} / 10</span>
          </div>

          {signed && !isWatched && (
            <button
              onClick={handleMarkAsWatched}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Marcar como visto
            </button>
          )}

          {signed && isWatched && (
            <div className="mt-4">
              <h2 className="text-xl font-bold text-white dark:text-gray-800">Sua Avaliação:</h2>
              {!hasRated ? (
                <RatingForm onSubmit={handleRatingSubmit} />
              ) : (
                <div className="mt-2">
                  <p className="text-gray-300 dark:text-gray-700">
                    Você avaliou este filme com {userRating} de 5.
                  </p>
                  <button
                    onClick={() => setHasRated(false)}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Editar Avaliação
                  </button>
                </div>
              )}
            </div>
          )}

          {movie.videos && movie.videos.results.length > 0 && (
            <div className="mt-4">
              <a
                href={`https://www.youtube.com/watch?v=${movie.videos.results[0].key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-indigo-600 dark:bg-indigo-400 text-white dark:text-black rounded hover:bg-indigo-700 dark:hover:bg-indigo-500"
              >
                Assistir Trailer
              </a>
            </div>
          )}

          {/* Seção: Horários de Transmissão */}
          {signed && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-white dark:text-gray-800">Horários de Transmissão</h2>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {showtimes.map((time, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedShowtime(time)}
                    className={`px-4 py-2 rounded ${
                      selectedShowtime === time
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-500 text-gray-800 dark:text-white hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>

              {/* Seleção de Data */}
              {selectedShowtime && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-white dark:text-gray-800">Selecione a Data:</h3>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    minDate={new Date()}
                    maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                    dateFormat="dd/MM/yyyy"
                    className="mt-2 p-2 rounded border border-gray-400 dark:border-gray-600 text-gray-600"
                  />
                </div>
              )}

              {/* Botão para Adicionar ao Carrinho */}
              {selectedShowtime && selectedDate && (
                <button
                  onClick={handleAddToCart}
                  className={`mt-6 px-6 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 ${
                    addingToCart ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={addingToCart}
                >
                  {addingToCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                </button>
              )}

              {/* Mensagem de Confirmação */}
              {cartMessage && (
                <div className="mt-4 p-4 bg-green-500 text-white rounded">
                  {cartMessage}
                </div>
              )}
            </div>
          )}

          {/* Seção: Elenco */}
          {cast.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-white dark:text-gray-800">Elenco</h2>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {cast.slice(0, 12).map((actor) => (
                  <Link to={`/actor/${actor.id}/movies`} key={actor.cast_id} className="block">
                    <div className="bg-gray-800 dark:bg-gray-200 p-4 rounded hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors duration-300">
                      <img
                        src={
                          actor.profile_path
                            ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                            : 'https://via.placeholder.com/185x278?text=Sem+Imagem'
                        }
                        alt={actor.name}
                        className="w-full h-auto rounded"
                        loading="lazy"
                      />
                      <div className="mt-2">
                        <p className="text-white dark:text-gray-800 font-semibold">{actor.name}</p>
                        <p className="text-gray-300 dark:text-gray-700 text-sm">
                          como {actor.character}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MovieDetail;
