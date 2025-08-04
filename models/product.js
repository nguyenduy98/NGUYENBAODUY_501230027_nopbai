const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    imgUrl: {
        type: String,
        required: true,
        trim: true
    },
    banner: {
        type: String,
        required: true,
        enum: ['gift', 'vietnam', 'import'],
        default: 'gift'
    },
    isKg: {
        type: Boolean,
        default: false
    },
    stock: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);