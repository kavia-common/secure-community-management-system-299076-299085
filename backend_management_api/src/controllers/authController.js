const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const { isValidEmail, isValidPassword, isValidUsername, sanitizeInput } = require('../utils/validation');

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */
class AuthController {
  /**
   * Register a new user
   * POST /auth/register
   * 
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  // PUBLIC_INTERFACE
  async register(req, res) {
    try {
      const {
        username,
        email,
        password,
        roleId,
        municipalityId,
        firstName,
        lastName,
        phone,
      } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields',
          code: 'MISSING_FIELDS',
          required: ['username', 'email', 'password'],
        });
      }

      // Sanitize inputs
      const sanitizedUsername = sanitizeInput(username);
      const sanitizedEmail = sanitizeInput(email);

      // Validate email format
      if (!isValidEmail(sanitizedEmail)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid email format',
          code: 'INVALID_EMAIL',
        });
      }

      // Validate username format
      if (!isValidUsername(sanitizedUsername)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid username. Must be 3-100 characters, alphanumeric with underscore or hyphen.',
          code: 'INVALID_USERNAME',
        });
      }

      // Validate password
      const passwordValidation = isValidPassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          status: 'error',
          message: passwordValidation.error,
          code: 'INVALID_PASSWORD',
        });
      }

      // Register user
      const result = await authService.register({
        username: sanitizedUsername,
        email: sanitizedEmail,
        password,
        roleId,
        municipalityId,
        firstName: firstName ? sanitizeInput(firstName) : null,
        lastName: lastName ? sanitizeInput(lastName) : null,
        phone: phone ? sanitizeInput(phone) : null,
      });

      return res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);

      if (error.message === 'Email already registered' || error.message === 'Username already taken') {
        return res.status(400).json({
          status: 'error',
          message: error.message,
          code: 'DUPLICATE_USER',
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Registration failed',
        code: 'REGISTRATION_ERROR',
      });
    }
  }

  /**
   * Authenticate user and issue tokens
   * POST /auth/login
   * 
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  // PUBLIC_INTERFACE
  async login(req, res) {
    try {
      const { login, password } = req.body;

      // Validate required fields
      if (!login || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields',
          code: 'MISSING_FIELDS',
          required: ['login', 'password'],
        });
      }

      // Sanitize login
      const sanitizedLogin = sanitizeInput(login);

      // Authenticate user
      const result = await authService.login(sanitizedLogin, password);

      return res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      console.error('Login error:', error);

      if (error.message === 'Invalid credentials' || error.message === 'Account is inactive') {
        return res.status(401).json({
          status: 'error',
          message: error.message,
          code: 'AUTHENTICATION_FAILED',
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Login failed',
        code: 'LOGIN_ERROR',
      });
    }
  }

  /**
   * Get current authenticated user information
   * GET /auth/me
   * 
   * @param {object} req - Express request object (with user from authenticate middleware)
   * @param {object} res - Express response object
   */
  // PUBLIC_INTERFACE
  async me(req, res) {
    try {
      // User ID is set by authenticate middleware
      const user = await userRepository.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      const sanitizedUser = authService.sanitizeUser(user);

      return res.status(200).json({
        status: 'success',
        data: {
          user: sanitizedUser,
        },
      });
    } catch (error) {
      console.error('Get user error:', error);

      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve user information',
        code: 'GET_USER_ERROR',
      });
    }
  }

  /**
   * Refresh access token using refresh token
   * POST /auth/refresh
   * 
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  // PUBLIC_INTERFACE
  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          status: 'error',
          message: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN',
        });
      }

      const result = await authService.refreshToken(refreshToken);

      return res.status(200).json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      console.error('Token refresh error:', error);

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Refresh token expired',
          code: 'TOKEN_EXPIRED',
        });
      }

      if (error.name === 'JsonWebTokenError' || error.message === 'Invalid token type') {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid refresh token',
          code: 'INVALID_TOKEN',
        });
      }

      if (error.message === 'User not found' || error.message === 'Account is inactive') {
        return res.status(401).json({
          status: 'error',
          message: error.message,
          code: 'REFRESH_FAILED',
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Token refresh failed',
        code: 'REFRESH_ERROR',
      });
    }
  }

  /**
   * Logout user (client should discard tokens)
   * POST /auth/logout
   * 
   * Note: Since we're using stateless JWT tokens, actual logout is handled client-side
   * by discarding the tokens. This endpoint serves as a formal logout action.
   * In a production system with refresh token rotation, you would invalidate the refresh token here.
   * 
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  // PUBLIC_INTERFACE
  async logout(req, res) {
    try {
      // In a stateless JWT system, logout is primarily client-side
      // The client should discard both access and refresh tokens
      
      return res.status(200).json({
        status: 'success',
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);

      return res.status(500).json({
        status: 'error',
        message: 'Logout failed',
        code: 'LOGOUT_ERROR',
      });
    }
  }
}

module.exports = new AuthController();
