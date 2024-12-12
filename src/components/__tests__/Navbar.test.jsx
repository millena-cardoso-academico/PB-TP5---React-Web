import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../Navbar';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter as Router } from 'react-router-dom';
import { vi } from 'vitest';

describe('Navbar Component', () => {
  test('renders Navbar and toggles theme', () => {
    const toggleTheme = vi.fn();
    const theme = 'dark';

    render(
      <AuthProvider>
        <Router>
          <Navbar toggleTheme={toggleTheme} theme={theme} />
        </Router>
      </AuthProvider>
    );

    const toggleButton = screen.getByRole('button', { name: /alternar tema/i });
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });
});
