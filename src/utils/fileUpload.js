const fs = require('fs');
const path = require('path');
const multer = require('multer');
const env = require('../config/env');

if (!fs.existsSync(env.uploadDir)) {
    fs.mkdirSync(env.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, env.uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
        cb(null, `${Date.now()}-${safeBase}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['application/pdf'];
    if (!allowed.includes(file.mimetype)) {
        return cb(new Error('Only PDF files are allowed'));
    }

    cb(null, true);
};

const uploadPdf = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

module.exports = {
    uploadPdf
};
