const jwt = require('jsonwebtoken');
module.exports = function (req, res, next) {
    console.log('🔐 Auth middleware triggered for:', req.method, req.path);
    
    const authHeader = req.headers['authorization'];
    console.log('🔑 Authorization header:', authHeader ? `Bearer ${authHeader.substring(0, 20)}...` : 'missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ Auth failed: No valid authorization header');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('🎫 Token extracted, length:', token.length);
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token verified successfully for admin:', decoded.admin.id);
        req.admin = decoded.admin;
        next();
    } catch (err) {
        console.log('❌ Token verification failed:', err.message);
        return res.status(401).json({ message: 'Token is not valid' });
    }
};