const multer = require('multer');
const path = require('path');
const imagesPath = process.env.IMAGES_PATH;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {       
        cb(null, imagesPath)
    },
    filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, `${uniqueSuffix}-${file.originalname}`);
        }
    })
        
const upload = multer({storage: storage})

module.exports = upload;