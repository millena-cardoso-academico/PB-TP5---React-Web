import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MovieCarousel from './components/MovieCarousel';
import Navbar from './components/Navbar';
import MyMoviesList from './components/MyMoviesList';
import MovieDetail from './components/MovieDetail';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import Cart from './components/Cart';
import PlansPage from './components/PlansPage';
import ActorMovies from './components/ActorMovies';
import CheckoutPage from './components/CheckoutPage';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import './App.css';

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <AuthProvider>
      <Router>
        <div className="bg-gray-800 dark:bg-gray-200 min-h-screen text-white dark:text-gray-800">
          <Navbar toggleTheme={toggleTheme} theme={theme} />
          <div className="max-w-screen-xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<MovieCarousel />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/mylist" element={<MyMoviesList />} />
              <Route path="/plans" element={<PlansPage />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/actor/:actorId/movies" element={<ActorMovies />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
