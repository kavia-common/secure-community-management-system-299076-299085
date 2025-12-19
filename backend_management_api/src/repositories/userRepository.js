const pool = require('../config/database');

/**
 * User Repository
 * Handles all database operations for the users table
 */
class UserRepository {
  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<object|null>} - User object or null
   */
  // PUBLIC_INTERFACE
  async findByEmail(email) {
    const query = `
      SELECT u.id, u.username, u.email, u.password_hash, u.role_id, u.municipality_id,
             u.first_name, u.last_name, u.phone, u.profile_image_url, u.is_active,
             u.last_login, u.email_verified, u.created_at, u.updated_at,
             r.role_name, r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1 AND u.deleted_at IS NULL
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<object|null>} - User object or null
   */
  // PUBLIC_INTERFACE
  async findByUsername(username) {
    const query = `
      SELECT u.id, u.username, u.email, u.password_hash, u.role_id, u.municipality_id,
             u.first_name, u.last_name, u.phone, u.profile_image_url, u.is_active,
             u.last_login, u.email_verified, u.created_at, u.updated_at,
             r.role_name, r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.username = $1 AND u.deleted_at IS NULL
    `;
    const result = await pool.query(query, [username]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<object|null>} - User object or null
   */
  // PUBLIC_INTERFACE
  async findById(id) {
    const query = `
      SELECT u.id, u.username, u.email, u.role_id, u.municipality_id,
             u.first_name, u.last_name, u.phone, u.profile_image_url, u.is_active,
             u.last_login, u.email_verified, u.created_at, u.updated_at,
             r.role_name, r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1 AND u.deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create new user
   * @param {object} userData - User data object
   * @returns {Promise<object>} - Created user object
   */
  // PUBLIC_INTERFACE
  async create(userData) {
    const {
      username,
      email,
      passwordHash,
      roleId,
      municipalityId,
      firstName,
      lastName,
      phone,
    } = userData;

    const query = `
      INSERT INTO users (
        username, email, password_hash, role_id, municipality_id,
        first_name, last_name, phone, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING id, username, email, role_id, municipality_id,
                first_name, last_name, phone, is_active, created_at
    `;

    const values = [
      username,
      email,
      passwordHash,
      roleId,
      municipalityId || null,
      firstName || null,
      lastName || null,
      phone || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update user's last login timestamp
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  // PUBLIC_INTERFACE
  async updateLastLogin(userId) {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(query, [userId]);
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} - True if email exists
   */
  // PUBLIC_INTERFACE
  async emailExists(email) {
    const query = 'SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL';
    const result = await pool.query(query, [email]);
    return result.rows.length > 0;
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} - True if username exists
   */
  // PUBLIC_INTERFACE
  async usernameExists(username) {
    const query = 'SELECT 1 FROM users WHERE username = $1 AND deleted_at IS NULL';
    const result = await pool.query(query, [username]);
    return result.rows.length > 0;
  }
}

module.exports = new UserRepository();
