import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function Navbar({ toggleTheme, theme }) {
  const [isOpen, setIsOpen] = useState(false);
  const { signed, signOut } = useAuth();
  const currentUser = localStorage.getItem('currentUser');
  const [cartCount, setCartCount] = useState(0);
  const API_URL = 'http://localhost:3001';

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const fetchCartCount = async () => {
      if (signed && currentUser) {
        try {
          const response = await axios.get(`${API_URL}/cart/${currentUser}`);
          const cartItems = response.data.cart || [];
          console.log(`Itens no carrinho para ${currentUser}:`, cartItems);
          setCartCount(cartItems.length);
        } catch (err) {
          console.error('Erro ao buscar carrinho:', err);
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    fetchCartCount();
  }, [signed, currentUser, API_URL]);

  return (
    <nav className="bg-gray-800 dark:bg-gray-200">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3" onClick={handleLinkClick}>
          <span className="self-center text-2xl font-semibold whitespace-nowrap text-white dark:text-gray-800">
            DigiFlix
          </span>
        </Link>

        {/* Botão de menu mobile */}
        <button
          onClick={handleToggle}
          type="button"
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-controls="navbar-default"
          aria-expanded={isOpen}
        >
          <span className="sr-only">Abrir menu principal</span>
          {isOpen ? (
            <svg
              className="w-6 h-6 text-white dark:text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className="w-6 h-6 text-white dark:text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Links da Navbar */}
        <div
          className={`${isOpen ? 'block' : 'hidden'} w-full md:block md:w-auto`}
          id="navbar-default"
        >
          <ul className="font-medium flex flex-col md:flex-row items-center md:space-x-8 mt-4 md:mt-0">
            <li className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 w-full">
              <div className="flex flex-col md:flex-row md:space-x-4 w-full">
                <Link
                  to="/"
                  onClick={handleLinkClick}
                  className="block py-2 px-3 text-white dark:text-gray-800 rounded hover:bg-gray-700 dark:hover:bg-gray-300 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0"
                >
                  Início
                </Link>
                {signed && (
                  <>
                    <Link
                      to="/mylist"
                      onClick={handleLinkClick}
                      className="block py-2 px-3 text-white dark:text-gray-800 rounded hover:bg-gray-700 dark:hover:bg-gray-300 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0"
                    >
                      Minha Lista
                    </Link>
                    <Link
                      to="/profile"
                      onClick={handleLinkClick}
                      className="block py-2 px-3 text-white dark:text-gray-800 rounded hover:bg-gray-700 dark:hover:bg-gray-300 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0"
                    >
                      Perfil
                    </Link>
                    <Link
                      to="/plans"
                      onClick={handleLinkClick}
                      className="block py-2 px-3 text-white dark:text-gray-800 rounded hover:bg-gray-700 dark:hover:bg-gray-300 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0"
                    >
                      Planos
                    </Link>
                  </>
                )}
                {!signed && (
                  <>
                    <Link
                      to="/login"
                      onClick={handleLinkClick}
                      className="block py-2 px-3 text-white dark:text-gray-800 rounded hover:bg-gray-700 dark:hover:bg-gray-300 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0"
                    >
                      Entrar
                    </Link>
                    <Link
                      to="/register"
                      onClick={handleLinkClick}
                      className="block py-2 px-3 text-white dark:text-gray-800 rounded hover:bg-gray-700 dark:hover:bg-gray-300 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0"
                    >
                      Registrar
                    </Link>
                  </>
                )}
                {signed && (
                  <button
                    onClick={() => {
                      signOut();
                      handleLinkClick();
                    }}
                    className="block py-2 px-3 text-white text-left dark:text-gray-800 rounded hover:bg-gray-700 dark:hover:bg-gray-300 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0"
                  >
                    Sair
                  </button>
                )}
                
                {/* Link para o Carrinho */}
                {signed && (
                  <Link
                    to="/cart"
                    onClick={handleLinkClick}
                    className="relative block py-2 px-3 text-white dark:text-gray-800 rounded hover:bg-gray-700 dark:hover:bg-gray-300 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 ml-4"
                  >
                    Carrinho
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </Link>
                )}
              </div>

              {/* Botão de alternar tema */}
              <button
                onClick={() => {
                  toggleTheme();
                  handleLinkClick();
                }}
                className="flex items-center justify-center w-full md:w-auto rounded text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-400 transition-colors duration-300 p-2"
                aria-label="Alternar tema"
              >
                {theme === 'dark' ? '🌞' : '🌙'}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
