import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MovieDetail from '../MovieDetail';
import { AuthProvider } from '../../contexts/AuthContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';

vi.mock('axios');

const mockMovieData = {
  id: 1,
  title: 'Test Movie',
  overview: 'This is a test movie.',
  release_date: '2023-01-01',
  runtime: 120,
  genres: [{ id: 1, name: 'Action' }, { id: 2, name: 'Comedy' }],
  vote_average: 8.5,
  poster_path: '/poster1.jpg',
  credits: {
    cast: [
      { id: 101, name: 'Actor One', character: 'Hero', cast_id: 1, profile_path: '/path1.jpg' },
      { id: 102, name: 'Actor Two', character: 'Villain', cast_id: 2, profile_path: '/path2.jpg' },
    ],
  },
  videos: {
    results: [{ key: 'abcd1234' }],
  },
};

describe('MovieDetail Component', () => {
  test('fetches and displays movie details', async () => {
    axios.get.mockImplementation((url) => {
      if (url.startsWith('https://api.themoviedb.org/3/movie/')) {
        return Promise.resolve({ data: mockMovieData });
      }
      if (url.startsWith('http://localhost:3001/watched/')) {
        return Promise.resolve({ data: { watchedMovies: [1, 2, 3] } });
      }
      if (url.startsWith('http://localhost:3001/ratings/')) {
        return Promise.resolve({ data: { rating: 4 } });
      }
      if (url.startsWith('http://localhost:3001/favorites/')) {
        return Promise.resolve({ data: { favoriteMovies: [1, 4, 5] } });
      }
      return Promise.reject(new Error('not found'));
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/movie/1']}>
          <Routes>
            <Route path="/movie/:id" element={<MovieDetail />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/carregando/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /test movie/i })).toBeInTheDocument();
    });

    // Verificar se a sinopse está visível
    expect(screen.getByText(/this is a test movie./i)).toBeInTheDocument();

    // Verificar se os gêneros estão listados
    expect(screen.getByText(/action/i)).toBeInTheDocument();
    expect(screen.getByText(/comedy/i)).toBeInTheDocument();

    // Verificar se o elenco está listado
    expect(screen.getByText(/actor one/i)).toBeInTheDocument();
    expect(screen.getByText(/actor two/i)).toBeInTheDocument();
  });
});
