module.exports = (req, res, next) => {
  const isAdmin = true; // Replace with actual admin auth logic
  if (!isAdmin) return res.status(403).json({ msg: 'Access denied' });
  next();
};