const hasRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (roles.includes(req.user.role)) {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
    };
};

module.exports = { hasRole };
