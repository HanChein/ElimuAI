import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../src/screens/auth/LoginScreen';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
};

const renderWithProviders = (component) => {
  return render(
    <NavigationContainer>
      <ThemeProvider>
        <AuthProvider>
          {component}
        </AuthProvider>
      </ThemeProvider>
    </NavigationContainer>
  );
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  it('renders correctly', () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} />
    );

    expect(getByText('Welcome Back!')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('shows validation error for empty fields', async () => {
    const mockAlert = jest.spyOn(global, 'alert').mockImplementation(() => {});
    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} />
    );

    const signInButton = getByText('Sign In');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });

    mockAlert.mockRestore();
  });

  it('handles successful login', async () => {
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        token: 'test-token'
      }),
      ok: true,
    });

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const signInButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockNavigation.replace).toHaveBeenCalledWith('Main');
    });
  });

  it('handles login error', async () => {
    const mockAlert = jest.spyOn(global, 'alert').mockImplementation(() => {});
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: false,
        message: 'Invalid credentials'
      }),
      ok: true,
    });

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const signInButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Login Failed', 'Invalid credentials');
    });

    mockAlert.mockRestore();
  });

  it('navigates to register screen', () => {
    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} />
    );

    const registerLink = getByText("Don't have an account? Sign Up");
    fireEvent.press(registerLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });
});
