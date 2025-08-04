const path = require('path');

// Đường dẫn đến thư mục fonts
const FONTS_PATH = path.join(__dirname, '..', 'public', 'fonts');

// Cấu hình font cho PDFKit
const FONTS = {
    normal: {
        normal: path.join(FONTS_PATH, 'arial.ttf'),
        bold: path.join(FONTS_PATH, 'arial-bold.ttf'),
        italics: path.join(FONTS_PATH, 'arial-italic.ttf'),
        bolditalics: path.join(FONTS_PATH, 'arial-bold-italic.ttf')
    }
};

module.exports = FONTS; 