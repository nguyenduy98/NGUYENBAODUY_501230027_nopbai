const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shop';

let _db;

const initDb = async () => {
    if (_db) {
        console.log('Database is already initialized!');
        return _db;
    }
    try {
        const client = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        _db = client;
        console.log('Connected to MongoDB!');
        return _db;
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        throw err;
    }
};

const getDb = () => {
    if (!_db) {
        throw new Error('Database not initialized!');
    }
    return _db;
};

module.exports = {
    initDb,
    getDb
};