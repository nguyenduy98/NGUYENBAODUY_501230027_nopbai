const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./product');

// Đường dẫn đến file lưu giỏ hàng
const p = path.join(
    path.dirname(process.mainModule.filename),
    'data',
    'cart.json'
);

// Schema cho giỏ hàng
const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    imgUrl: {
        type: String
    },
    qty: {
        type: Number,
        required: true,
        default: 1
    }
});

const cartSchema = new mongoose.Schema({
    items: [cartItemSchema],
    totalPrice: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Lưu giỏ hàng vào file (tạm thời vẫn giữ cách cũ)
// Trong tương lai sẽ lưu vào MongoDB
module.exports = class Cart {
    static async addProduct(id) {
        try {
            // Lấy thông tin sản phẩm
            const product = await Product.findById(id);
            if (!product) {
                throw new Error('Không tìm thấy sản phẩm');
            }

            // Chuyển đổi giá tiền sang số
            let price = product.price.toString().replace(/[.,]/g, '');
            price = parseInt(price);
            if (isNaN(price)) price = 0;

            // Đọc giỏ hàng hiện tại
            let cart = { products: [], totalPrice: 0 };
            try {
                const fileContent = await fs.promises.readFile(p);
                cart = JSON.parse(fileContent);
            } catch (err) {
                cart = { products: [], totalPrice: 0 };
            }

            // Tìm sản phẩm trong giỏ hàng
            const existingProductIndex = cart.products.findIndex(prod => prod.id === id);
            const existingProduct = cart.products[existingProductIndex];

            // Cập nhật hoặc thêm sản phẩm
            if (existingProduct) {
                const updatedProduct = { ...existingProduct };
                updatedProduct.qty = updatedProduct.qty + 1;
                cart.products = [...cart.products];
                cart.products[existingProductIndex] = updatedProduct;
            } else {
                cart.products.push({
                    id: id,
                    title: product.title,
                    price: price,
                    imgUrl: product.imgUrl,
                    qty: 1
                });
            }

            // Cập nhật tổng tiền
            cart.totalPrice = cart.products.reduce((total, item) => {
                return total + (item.price * item.qty);
            }, 0);

            // Lưu giỏ hàng
            await fs.promises.writeFile(p, JSON.stringify(cart));
            return cart;
        } catch (error) {
            console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
            throw error;
        }
    }

    static async deleteProduct(id) {
        try {
            // Đọc giỏ hàng hiện tại
            let cart = { products: [], totalPrice: 0 };
            try {
                const fileContent = await fs.promises.readFile(p);
                cart = JSON.parse(fileContent);
            } catch (err) {
                return cart;
            }

            // Tìm sản phẩm cần xóa
            const product = cart.products.find(prod => prod.id === id);
            if (!product) return cart;

            // Xóa sản phẩm khỏi giỏ hàng
            cart.products = cart.products.filter(prod => prod.id !== id);

            // Cập nhật tổng tiền
            cart.totalPrice = cart.products.reduce((total, item) => {
                return total + (item.price * item.qty);
            }, 0);

            // Lưu giỏ hàng
            await fs.promises.writeFile(p, JSON.stringify(cart));
            return cart;
        } catch (error) {
            console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
            throw error;
        }
    }

    static async updateQuantity(id, action) {
        try {
            // Đọc giỏ hàng hiện tại
            let cart = { products: [], totalPrice: 0 };
            try {
                const fileContent = await fs.promises.readFile(p);
                cart = JSON.parse(fileContent);
            } catch (err) {
                return cart;
            }

            // Tìm sản phẩm cần cập nhật
            const productIndex = cart.products.findIndex(prod => prod.id === id);
            if (productIndex === -1) return cart;

            // Tạo bản sao của sản phẩm để cập nhật
            const product = { ...cart.products[productIndex] };

            // Cập nhật số lượng theo hành động
            if (action === 'increase') {
                product.qty += 1;
            } else if (action === 'decrease') {
                if (product.qty > 1) {
                    product.qty -= 1;
                } else {
                    // Nếu số lượng = 1 và giảm thì xóa sản phẩm
                    return Cart.deleteProduct(id);
                }
            } else {
                // Nếu action không hợp lệ thì trả về giỏ hàng hiện tại
                return cart;
            }

            // Cập nhật giỏ hàng
            cart.products[productIndex] = product;

            // Cập nhật tổng tiền
            cart.totalPrice = cart.products.reduce((total, item) => {
                return total + (item.price * item.qty);
            }, 0);

            // Lưu giỏ hàng
            await fs.promises.writeFile(p, JSON.stringify(cart));
            return cart;
        } catch (error) {
            console.error('Lỗi khi cập nhật số lượng sản phẩm:', error);
            throw error;
        }
    }

    static async getCart() {
        try {
            // Đọc file giỏ hàng
            let cart = { products: [], totalPrice: 0 };
            try {
                const fileContent = await fs.promises.readFile(p);
                cart = JSON.parse(fileContent);
            } catch (err) {
                return cart;
            }

            return cart;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin giỏ hàng:', error);
            return { products: [], totalPrice: 0 };
        }
    }

    static async deleteCart() {
        try {
            await fs.promises.writeFile(p, JSON.stringify({ products: [], totalPrice: 0 }));
        } catch (err) {
            console.error('Lỗi khi xóa giỏ hàng:', err);
            throw err;
        }
    }
}; 