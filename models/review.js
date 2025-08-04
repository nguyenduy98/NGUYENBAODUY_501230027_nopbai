const fs = require('fs');
const path = require('path');

const reviewsFile = path.join(
    path.dirname(process.mainModule.filename),
    'data',
    'reviews.json'
);

class Review {
    constructor(productId, userId, orderId, rating, comment, createdAt = new Date(), adminReply = null) {
        this.productId = productId;
        this.userId = userId;
        this.orderId = orderId;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
        this.adminReply = adminReply;
    }

    static getAllReviews() {
        return new Promise((resolve, reject) => {
            fs.readFile(reviewsFile, (err, fileContent) => {
                if (err) {
                    resolve([]);
                } else {
                    try {
                        resolve(JSON.parse(fileContent));
                    } catch (e) {
                        resolve([]);
                    }
                }
            });
        });
    }

    static addReview(review) {
        return new Promise(async (resolve, reject) => {
            try {
                const reviews = await Review.getAllReviews();
                // Gán _id nếu chưa có
                if (!review._id) review._id = Date.now().toString();
                reviews.push(review);
                fs.writeFile(reviewsFile, JSON.stringify(reviews, null, 2), err => {
                    if (err) reject(err);
                    else resolve(review);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    static getReviewsByProductId(productId) {
        return new Promise(async (resolve, reject) => {
            try {
                const reviews = await Review.getAllReviews();
                resolve(reviews.filter(r => r.productId == productId)); // so sánh lỏng để lấy cả string và ObjectId
            } catch (err) {
                reject(err);
            }
        });
    }

    static getReviewsByUserId(userId) {
        return new Promise(async (resolve, reject) => {
            try {
                const reviews = await Review.getAllReviews();
                resolve(reviews.filter(r => r.userId === userId));
            } catch (err) {
                reject(err);
            }
        });
    }

    static getReviewByOrderAndProduct(orderId, productId) {
        return new Promise(async (resolve, reject) => {
            try {
                const reviews = await Review.getAllReviews();
                resolve(reviews.find(r => r.orderId === orderId && r.productId === productId));
            } catch (err) {
                reject(err);
            }
        });
    }

    static deleteReviewById(id) {
        return new Promise(async (resolve, reject) => {
            try {
                const reviews = await Review.getAllReviews();
                const newReviews = reviews.filter(r => r._id !== id);
                fs.writeFile(reviewsFile, JSON.stringify(newReviews, null, 2), err => {
                    if (err) reject(err);
                    else resolve();
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    static addAdminReply(reviewId, adminReply) {
        return new Promise(async (resolve, reject) => {
            try {
                const reviews = await Review.getAllReviews();
                const reviewIndex = reviews.findIndex(r => r._id === reviewId);
                if (reviewIndex === -1) {
                    reject(new Error('Review not found'));
                    return;
                }
                reviews[reviewIndex].adminReply = {
                    content: adminReply,
                    createdAt: new Date()
                };
                fs.writeFile(reviewsFile, JSON.stringify(reviews, null, 2), err => {
                    if (err) reject(err);
                    else resolve(reviews[reviewIndex]);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    static updateAdminReply(reviewId, adminReply) {
        return new Promise(async (resolve, reject) => {
            try {
                const reviews = await Review.getAllReviews();
                const reviewIndex = reviews.findIndex(r => r._id === reviewId);
                if (reviewIndex === -1) {
                    reject(new Error('Review not found'));
                    return;
                }
                reviews[reviewIndex].adminReply = {
                    content: adminReply,
                    createdAt: new Date()
                };
                fs.writeFile(reviewsFile, JSON.stringify(reviews, null, 2), err => {
                    if (err) reject(err);
                    else resolve(reviews[reviewIndex]);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    static deleteAdminReply(reviewId) {
        return new Promise(async (resolve, reject) => {
            try {
                const reviews = await Review.getAllReviews();
                const reviewIndex = reviews.findIndex(r => r._id === reviewId);
                if (reviewIndex === -1) {
                    reject(new Error('Review not found'));
                    return;
                }
                reviews[reviewIndex].adminReply = null;
                fs.writeFile(reviewsFile, JSON.stringify(reviews, null, 2), err => {
                    if (err) reject(err);
                    else resolve(reviews[reviewIndex]);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
}

module.exports = Review; 