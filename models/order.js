const fs = require('fs');
const path = require('path');

const ordersFile = path.join(
    path.dirname(process.mainModule.filename),
    'data',
    'orders.json'
);

class Order {
    constructor(id, products, customerInfo, totalPrice, userId = null, status = 'pending', createdAt = new Date(), appliedCoupon = null, shippingFee = 0, subtotal = 0) {
        this.id = id;
        this.products = products;
        this.customerInfo = customerInfo;
        this.totalPrice = totalPrice;
        this.userId = userId; // Thêm userId
        this.status = status; // pending, processing, completed, cancelled
        this.createdAt = createdAt;
        this.appliedCoupon = appliedCoupon; // Thông tin mã giảm giá đã áp dụng
        this.shippingFee = shippingFee; // Phí vận chuyển
        this.subtotal = subtotal; // Tổng tiền trước khi áp dụng mã giảm giá
    }

    static getOrders() {
        return new Promise((resolve, reject) => {
            fs.readFile(ordersFile, (err, fileContent) => {
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

    static getOrderById(id) {
        return new Promise(async (resolve, reject) => {
            try {
                const orders = await Order.getOrders();
                const order = orders.find(order => order && order.id && id && order.id.toString() === id.toString());
                resolve(order);
            } catch (err) {
                reject(err);
            }
        });
    }

    static getOrdersByCustomerEmail(email) {
        return new Promise(async (resolve, reject) => {
            try {
                const orders = await Order.getOrders();
                const customerOrders = orders.filter(
                    order => order.customerInfo && order.customerInfo.email === email
                );
                resolve(customerOrders);
            } catch (err) {
                reject(err);
            }
        });
    }

    static getOrdersByUserId(userId) {
        return new Promise(async (resolve, reject) => {
            try {
                const orders = await Order.getOrders();
                const userOrders = orders.filter(
                    order => order.userId && order.userId.toString() === userId.toString()
                );
                resolve(userOrders);
            } catch (err) {
                reject(err);
            }
        });
    }

    static saveOrder(order) {
        return new Promise(async (resolve, reject) => {
            try {
                const orders = await Order.getOrders();
                orders.push(order);
                fs.writeFile(ordersFile, JSON.stringify(orders, null, 2), err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(order);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    static updateOrderStatus(id, status) {
        return new Promise(async (resolve, reject) => {
            try {
                const orders = await Order.getOrders();
                const orderIndex = orders.findIndex(order => order.id === id);
                
                if (orderIndex === -1) {
                    throw new Error('Không tìm thấy đơn hàng');
                }
                
                orders[orderIndex].status = status;
                orders[orderIndex].updatedAt = new Date();
                
                fs.writeFile(ordersFile, JSON.stringify(orders, null, 2), err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(orders[orderIndex]);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    static updateOrder(id, updatedData) {
        return new Promise(async (resolve, reject) => {
            try {
                const orders = await Order.getOrders();
                const orderIndex = orders.findIndex(order => order.id === id);
                
                if (orderIndex === -1) {
                    throw new Error('Không tìm thấy đơn hàng');
                }
                
                // Cập nhật thông tin đơn hàng
                orders[orderIndex] = {
                    ...orders[orderIndex],
                    ...updatedData,
                    updatedAt: new Date()
                };
                
                fs.writeFile(ordersFile, JSON.stringify(orders, null, 2), err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(orders[orderIndex]);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    static deleteOrder(id) {
        return new Promise(async (resolve, reject) => {
            try {
                const orders = await Order.getOrders();
                const updatedOrders = orders.filter(order => order.id !== id);
                
                fs.writeFile(ordersFile, JSON.stringify(updatedOrders, null, 2), err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }
}

module.exports = Order; 