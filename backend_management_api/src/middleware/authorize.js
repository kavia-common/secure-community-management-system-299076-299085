/**
 * Role-Based Authorization Middleware
 * Checks if authenticated user has required role(s) to access resource
 * 
 * @param {string|string[]} allowedRoles - Single role name or array of allowed role names
 * @returns {function} - Express middleware function
 */
// PUBLIC_INTERFACE
const authorize = (allowedRoles) => {
  // Normalize to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    // Check if user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED',
      });
    }

    // Check if user has required role
    if (!roles.includes(req.user.roleName)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
        code: 'FORBIDDEN',
        requiredRoles: roles,
        userRole: req.user.roleName,
      });
    }

    next();
  };
};

module.exports = authorize;
