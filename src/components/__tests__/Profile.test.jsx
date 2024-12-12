import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../Login';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('../../contexts/AuthContext', () => ({
  __esModule: true,
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: vi.fn(),
}));

vi.mock('axios');

import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

describe('Login Component', () => {
  let mockNavigate;
  let signInMock;

  beforeEach(() => {
    vi.resetAllMocks();

    mockNavigate = vi.fn();
    useNavigate.mockReturnValue(mockNavigate);

    signInMock = vi.fn();
    useAuth.mockReturnValue({
      signIn: signInMock,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('renders login form', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.getByText(/usuário/i)).toBeInTheDocument();
    expect(screen.getByText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();

    const usernameInput = screen.getByLabelText(/usuário/i) || screen.getByRole('textbox');
    const passwordInput = screen.getByLabelText(/senha/i) || screen.getByRole('textbox', { name: /senha/i });

    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  test('fills in the input fields', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthProvider>
    );

    const usernameInput = screen.getByLabelText(/usuário/i) || screen.getByRole('textbox');
    const passwordInput = screen.getByLabelText(/senha/i) || screen.getByRole('textbox', { name: /senha/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
  });
});
