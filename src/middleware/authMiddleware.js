const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authMiddleware = (req, res, next) => {
    try {
        // Ambil token dari header: "Bearer token"
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1]; // Ambil token setelah "Bearer "
        
        if (!token) {
            return res.status(401).json({ message: 'Invalid token format' });
        }
        
        // Verifikasi token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Simpan user info di request
        next();
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
};

module.exports = authMiddleware;
