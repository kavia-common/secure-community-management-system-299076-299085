const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const userRepository = require('../repositories/userRepository');

/**
 * Authentication Service
 * Handles authentication business logic including password hashing, JWT generation, and user verification
 */
class AuthService {
  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  // PUBLIC_INTERFACE
  async hashPassword(password) {
    return bcrypt.hash(password, authConfig.bcrypt.saltRounds);
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} - True if password matches
   */
  // PUBLIC_INTERFACE
  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate access token
   * @param {object} user - User object
   * @returns {string} - JWT access token
   */
  // PUBLIC_INTERFACE
  generateAccessToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      roleId: user.role_id,
      roleName: user.role_name,
      municipalityId: user.municipality_id,
      type: 'access',
    };

    return jwt.sign(payload, authConfig.jwt.accessSecret, {
      expiresIn: authConfig.jwt.accessExpiresIn,
    });
  }

  /**
   * Generate refresh token
   * @param {object} user - User object
   * @returns {string} - JWT refresh token
   */
  // PUBLIC_INTERFACE
  generateRefreshToken(user) {
    const payload = {
      userId: user.id,
      type: 'refresh',
    };

    return jwt.sign(payload, authConfig.jwt.refreshSecret, {
      expiresIn: authConfig.jwt.refreshExpiresIn,
    });
  }

  /**
   * Verify access token
   * @param {string} token - JWT access token
   * @returns {object} - Decoded token payload
   * @throws {Error} - If token is invalid or expired
   */
  // PUBLIC_INTERFACE
  verifyAccessToken(token) {
    return jwt.verify(token, authConfig.jwt.accessSecret);
  }

  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token
   * @returns {object} - Decoded token payload
   * @throws {Error} - If token is invalid or expired
   */
  // PUBLIC_INTERFACE
  verifyRefreshToken(token) {
    return jwt.verify(token, authConfig.jwt.refreshSecret);
  }

  /**
   * Register a new user
   * @param {object} userData - User registration data
   * @returns {Promise<object>} - Created user and tokens
   */
  // PUBLIC_INTERFACE
  async register(userData) {
    const { username, email, password, roleId, municipalityId, firstName, lastName, phone } = userData;

    // Check if email or username already exists
    const [emailExists, usernameExists] = await Promise.all([
      userRepository.emailExists(email),
      userRepository.usernameExists(username),
    ]);

    if (emailExists) {
      throw new Error('Email already registered');
    }

    if (usernameExists) {
      throw new Error('Username already taken');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await userRepository.create({
      username,
      email,
      passwordHash,
      roleId: roleId || 5, // Default to 'viewer' role if not specified
      municipalityId,
      firstName,
      lastName,
      phone,
    });

    // Fetch full user details with role
    const fullUser = await userRepository.findById(user.id);

    // Generate tokens
    const accessToken = this.generateAccessToken(fullUser);
    const refreshToken = this.generateRefreshToken(fullUser);

    return {
      user: this.sanitizeUser(fullUser),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Authenticate user with credentials
   * @param {string} login - Username or email
   * @param {string} password - Plain text password
   * @returns {Promise<object>} - User and tokens
   */
  // PUBLIC_INTERFACE
  async login(login, password) {
    // Try to find user by email or username
    let user = await userRepository.findByEmail(login);
    if (!user) {
      user = await userRepository.findByUsername(login);
    }

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - JWT refresh token
   * @returns {Promise<object>} - New access token
   */
  // PUBLIC_INTERFACE
  async refreshToken(refreshToken) {
    const decoded = this.verifyRefreshToken(refreshToken);

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Fetch user
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
    };
  }

  /**
   * Remove sensitive fields from user object
   * @param {object} user - User object
   * @returns {object} - Sanitized user object
   */
  // PUBLIC_INTERFACE
  sanitizeUser(user) {
    const sanitized = { ...user };
    delete sanitized.password_hash;
    return sanitized;
  }
}

module.exports = new AuthService();
