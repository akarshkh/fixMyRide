const jwt = require('jsonwebtoken');

// Token authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token.' });
        }
        
        // Store decoded token information in req.user
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };
        next();
    });
}

// Role-based authentication middleware
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
}

// Multi-role authentication middleware
function requireRoles(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Access denied. Insufficient permissions.',
                allowedRoles,
                userRole: req.user?.role
            });
        }
        next();
    };
}

// Staff-only middleware for service requests
function requireStaffRole(req, res, next) {
    if (!req.user || req.user.role !== 'staff') {
        return res.status(403).json({ 
            error: 'Access denied. Only Staff members can perform this action.',
            reason: 'Service request creation is restricted to Staff members only'
        });
    }
    next();
}

module.exports = { 
    authenticateToken, 
    requireRole, 
    requireRoles, 
    requireStaffRole 
};
