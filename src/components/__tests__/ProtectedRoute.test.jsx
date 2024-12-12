import React from 'react';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '../../routes/ProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
  };
});

const ProtectedComponent = () => <div>Protected Content</div>;

const LoginComponent = () => <div>Login Page</div>;

describe('ProtectedRoute Component', () => {
  test('redirects unauthenticated users to login', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedComponent />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginComponent />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  test('allows authenticated users to access protected route', () => {
    localStorage.setItem('currentUser', 'testuser');

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedComponent />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginComponent />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/protected content/i)).toBeInTheDocument();

    localStorage.removeItem('currentUser');
  });
});
