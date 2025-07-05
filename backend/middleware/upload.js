const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure folder exists
const uploadDir = path.join(__dirname, '../uploads/profile-pics');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // where to store
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext); // profileImage-xxxxx.jpg
  }
});

const upload = multer({ storage });
module.exports = upload;
