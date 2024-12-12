import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FaWhatsapp, FaTelegramPlane, FaInstagram } from 'react-icons/fa';

function Profile() {
  const { signed } = useAuth();
  const currentUser = localStorage.getItem('currentUser');
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [purchasedMovies, setPurchasedMovies] = useState([]);
  const [username, setUsername] = useState('');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planEndDate, setPlanEndDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_KEY = 'c59086531f209ac2717b0e50f8c6ef59'; 
  const API_URL = 'http://localhost:3001';

  const [limitUsage, setLimitUsage] = useState({
    movie_limit: 0,
    purchased: 0,
    remaining: 0
  });

  const parseDateTime = (dateTimeStr) => {
    if (!dateTimeStr) {
      console.error('parseDateTime: dateTimeStr is undefined or null');
      return new Date(); 
    }

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(dateTimeStr)) {

      const isoString = dateTimeStr.replace(' ', 'T') + 'Z';
      const parsedDate = new Date(isoString);
      if (isNaN(parsedDate)) {
        console.error(`parseDateTime: Invalid date - ${dateTimeStr}`);
        return new Date();
      }
      return parsedDate;
    }

    if (/^\d{2}\/\d{2}\/\d{4}( \d{2}:\d{2}(:\d{2})?)?$/.test(dateTimeStr)) {
      const [date, time] = dateTimeStr.split(' ');
      const [day, month, year] = date.split('/');
      if (time) {
        const [hours, minutes, seconds] = time.split(':');
        return new Date(year, month - 1, day, hours, minutes, seconds || 0);
      } else {
        return new Date(year, month - 1, day);
      }
    }

    console.error(`parseDateTime: Unknown dateTimeStr format - ${dateTimeStr}`);
    return new Date();
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (signed && currentUser) {
          const userResponse = await axios.get(`${API_URL}/user/${currentUser}`);
          setUsername(userResponse.data.username || currentUser);

          const planResponse = await axios.get(`${API_URL}/user_plan/${currentUser}`);
          setCurrentPlan(planResponse.data.plan);
          setPlanEndDate(planResponse.data.plan ? planResponse.data.plan.end_date : null);

          const usageResponse = await axios.get(`${API_URL}/limit_usage/${currentUser}`);
          setLimitUsage({
            movie_limit: usageResponse.data.movie_limit,
            purchased: usageResponse.data.purchased,
            remaining: usageResponse.data.remaining
          });

          const watchedResponse = await axios.get(`${API_URL}/watched/${currentUser}`);
          const movieIds = watchedResponse.data.watchedMovies || [];

          if (movieIds.length === 0) {
            setWatchedMovies([]);
          } else {
            const limitedMovieIds = movieIds.slice(0, 5);

            const moviePromises = limitedMovieIds.map(async (id) => {
              try {
                const movieResponse = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
                  params: {
                    api_key: API_KEY,
                    language: 'pt-BR',
                  },
                });
                return movieResponse.data;
              } catch (movieError) {
                console.error(`Erro ao buscar detalhes do filme ID ${id}:`, movieError);
                return null;
              }
            });

            const movies = await Promise.all(moviePromises);
            const validMovies = movies.filter(movie => movie !== null);
            setWatchedMovies(validMovies);
          }

          const purchasedResponse = await axios.get(`${API_URL}/purchased/${currentUser}`);
          const purchasedData = purchasedResponse.data.purchasedMovies || [];
          setPurchasedMovies(purchasedData);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário ou filmes assistidos:', error);
        setError('Não foi possível carregar os dados do perfil.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [signed, currentUser, API_KEY, API_URL]);

  if (!signed) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500 dark:text-gray-400">Você precisa estar logado para ver seu perfil.</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500 dark:text-gray-400">Carregando perfil...</span>
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

  const hasSessionPassed = (sessionDateTime) => {
    const now = new Date();
    const session = new Date(sessionDateTime);
    return session < now;
  };

  const copyToClipboard = async (url) => {
    if (!navigator.clipboard) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Link copiado para a área de transferência!');
      } catch (err) {
        console.error('Falha ao copiar o link: ', err);
        alert('Falha ao copiar o link.');
      }
      document.body.removeChild(textArea);
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      alert('Link copiado para a área de transferência!');
    } catch (err) {
      console.error('Falha ao copiar o link: ', err);
      alert('Falha ao copiar o link.');
    }
  };

  return (
    <div className="p-8">
      {/* Informações do Usuário */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white dark:text-gray-800">Perfil</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
          Bem-vindo, <span className="font-semibold">{username}</span>!
        </p>
      </div>

      {/* Informações do Plano */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white dark:text-gray-800 mb-4">Seu Plano</h2>
        {currentPlan ? (
          <div className="bg-gray-700 dark:bg-gray-300 p-4 rounded-lg">
            <p className="text-lg text-white dark:text-gray-800">Plano: {currentPlan.name}</p>
            <p className="text-lg text-white dark:text-gray-800">
              Ingressos Permitidos por Mês: {limitUsage.movie_limit}
            </p>
            {planEndDate && (
              <p className="text-lg text-white dark:text-gray-800">
                Encerramento do Plano: {parseDateTime(currentPlan.end_date).toLocaleDateString('pt-BR')}
              </p>
            )}
            {/* Exibir Uso do Plano */}
            <div className="mt-4">
              <p className="text-lg text-white dark:text-gray-800">
                Ingressos Comprados: {limitUsage.purchased} / {limitUsage.movie_limit}
              </p>
              <div className="w-full bg-gray-300 dark:bg-gray-400 rounded-full h-4 mt-2">
                <div
                  className="bg-blue-500 dark:bg-blue-700 h-4 rounded-full"
                  style={{
                    width: `${(limitUsage.purchased / limitUsage.movie_limit) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="text-lg text-white dark:text-gray-800 mt-2">
                Ingressos Restantes: {limitUsage.remaining}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-700 dark:bg-gray-300 p-4 rounded-lg">
            <p className="text-lg text-white dark:text-gray-800">
              Você não tem nenhum plano ativo.
            </p>
            <Link to="/plans" className="text-blue-500 dark:text-blue-700 hover:underline">
              Assine um plano agora
            </Link>
          </div>
        )}
      </div>

      {/* Lista de Filmes Assistidos Recentemente */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white dark:text-gray-800 mb-4">
          Filmes Assistidos Recentemente
        </h2>
        {watchedMovies.length === 0 ? (
          <div className="flex justify-center items-center h-48">
            <span className="text-gray-500 dark:text-gray-400">
              Nenhum filme marcado como visto.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {watchedMovies.map((movie) => (
              <div key={movie.id} className="bg-gray-700 dark:bg-gray-300 p-4 rounded-lg">
                {/* Apenas a imagem e o título são clicáveis */}
                <Link to={`/movie/${movie.id}`} className="block">
                  <img
                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full h-auto rounded hover:scale-105 transform transition-transform duration-300"
                    loading="lazy"
                  />
                  <h3 className="text-lg mt-2 text-center text-white dark:text-gray-800">
                    {movie.title}
                  </h3>
                </Link>
              </div>
            ))}
            {/* Botão para Ver Mais Filmes */}
            <div className="flex justify-center items-center bg-gray-700 dark:bg-gray-300 p-4 rounded-lg">
              <Link to="/mylist" className="text-center text-blue-500 dark:text-blue-700 hover:underline">
                Ver Mais
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Ingressos Comprados */}
      <div>
        <h2 className="text-2xl font-semibold text-white dark:text-gray-800 mb-4">Ingressos Comprados</h2>
        {purchasedMovies.length === 0 ? (
          <div className="flex justify-center items-center h-48">
            <span className="text-gray-500 dark:text-gray-400">Nenhum ingresso comprado.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {purchasedMovies.map((item) => {
              const sessionDateTime = parseDateTime(`${item.date} ${item.showtime}`);
              const sessionPassed = hasSessionPassed(sessionDateTime);

              const purchaseDateTime = parseDateTime(item.purchase_date);
              const formattedPurchaseDate = purchaseDateTime.toLocaleDateString('pt-BR');
              const formattedPurchaseTime = purchaseDateTime.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const movieLink = `${window.location.origin}/movie/${item.movie_id}`;

              return (
                <div
                  key={item.movie_id}
                  className={`p-4 rounded-lg ${
                    sessionPassed
                      ? 'bg-gray-500 dark:bg-gray-400 cursor-not-allowed'
                      : 'bg-gray-700 dark:bg-gray-300 hover:bg-gray-600 dark:hover:bg-gray-200 cursor-pointer'
                  }`}
                >
                  {/* Apenas a imagem e o título são clicáveis */}
                  <Link to={`/movie/${item.movie_id}`} className={`block ${sessionPassed ? 'cursor-default' : ''}`}>
                    <h3 className="text-lg mt-2 text-center text-white dark:text-gray-800">
                      {item.title}
                    </h3>
                    <p className="text-sm text-center text-gray-400 dark:text-gray-600">
                      Sessão: {sessionDateTime.toLocaleDateString('pt-BR')} às{' '}
                      {sessionDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm text-center text-gray-400 dark:text-gray-600">
                      Compra: {formattedPurchaseDate} às {formattedPurchaseTime}
                    </p>
                  </Link>
                  
                  {/* Botões de Compartilhamento */}
                  <div className="mt-4 flex justify-center space-x-4">
                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/?text=Confira este filme: ${encodeURIComponent(movieLink)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 hover:text-green-700"
                      title="Compartilhar no WhatsApp"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaWhatsapp size={24} />
                    </a>

                    {/* Telegram */}
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(movieLink)}&text=Confira este filme!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                      title="Compartilhar no Telegram"
                      onClick={(e) => e.stopPropagation()} 
                    >
                      <FaTelegramPlane size={24} />
                    </a>

                    {/* Instagram (Copiar Link) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(movieLink);
                      }}
                      className="text-pink-500 hover:text-pink-700"
                      title="Copiar Link para Compartilhar no Instagram"
                    >
                      <FaInstagram size={24} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
