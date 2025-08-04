const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Đường dẫn đến font Times New Roman trong Windows
const WINDOWS_FONTS_PATH = 'C:\\Windows\\Fonts';
const TIMES_REGULAR = path.join(WINDOWS_FONTS_PATH, 'times.ttf');
const TIMES_BOLD = path.join(WINDOWS_FONTS_PATH, 'timesbd.ttf');

function generateInvoice(order) {
    return new Promise((resolve, reject) => {
        try {
            // Tạo document với Times New Roman
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            // Đăng ký font Times New Roman
            doc.registerFont('Times-Regular', TIMES_REGULAR);
            doc.registerFont('Times-Bold', TIMES_BOLD);

            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));

            // Tiêu đề hóa đơn
            doc.font('Times-Bold')
                .fontSize(24)
                .text('HÓA ĐƠN', {
                    align: 'center',
                    characterSpacing: 1
                });
            doc.moveDown();

            // Thông tin đơn hàng
            doc.font('Times-Regular')
                .fontSize(12)
                .text(`Mã đơn hàng: #${order.id}`)
                .text(`Ngày: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}`)
                .moveDown();

            // Thông tin khách hàng
            if (order.customerInfo) {
                doc.font('Times-Bold')
                    .text('THÔNG TIN KHÁCH HÀNG:')
                    .moveDown(0.5);
                doc.font('Times-Regular')
                    .fontSize(11)
                    .text(`Họ tên: ${order.customerInfo.name || order.customerInfo.fullName || ''}`)
                    .text(`Số điện thoại: ${order.customerInfo.phone}`)
                    .text(`Email: ${order.customerInfo.email}`);

                // Thêm thông tin địa chỉ chi tiết
                doc.font('Times-Bold')
                    .moveDown(0.5)
                    .text('ĐỊA CHỈ GIAO HÀNG:')
                    .moveDown(0.5);
                
                doc.font('Times-Regular');
                if (order.customerInfo.address) {
                    doc.text(`Địa chỉ: ${order.customerInfo.address}`);
                }
                if (order.customerInfo.wardName) {
                    doc.text(`Phường/Xã: ${order.customerInfo.wardName}`);
                }
                if (order.customerInfo.districtName) {
                    doc.text(`Quận/Huyện: ${order.customerInfo.districtName}`);
                }
                if (order.customerInfo.provinceName) {
                    doc.text(`Tỉnh/Thành: ${order.customerInfo.provinceName}`);
                }
                
                if (order.customerInfo.note) {
                    doc.moveDown(0.5)
                        .font('Times-Bold')
                        .text('GHI CHÚ:')
                        .font('Times-Regular')
                        .text(`${order.customerInfo.note}`);
                }
                doc.moveDown();
            }

            // Header bảng sản phẩm
            doc.font('Times-Bold')
                .fontSize(11);
            const tableTop = doc.y;
            const tableHeaders = [
                { text: 'STT', x: 50, width: 40, align: 'center' },
                { text: 'Sản phẩm', x: 100, width: 190, align: 'left' },
                { text: 'Giá', x: 300, width: 90, align: 'right' },
                { text: 'SL', x: 400, width: 40, align: 'center' },
                { text: 'Tổng', x: 450, width: 90, align: 'right' }
            ];

            // Vẽ header bảng
            tableHeaders.forEach(header => {
                doc.text(header.text, header.x, tableTop, {
                    width: header.width,
                    align: header.align
                });
            });

            // Kẻ đường line
            doc.moveTo(50, doc.y + 5)
                .lineTo(540, doc.y + 5)
                .stroke();
            doc.moveDown();

            // Danh sách sản phẩm
            doc.font('Times-Regular');
            let y = doc.y;
            (order.products || []).forEach((p, index) => {
                const price = Number(p.price || 0);
                const qty = Number(p.qty || 1);
                const total = price * qty;

                doc.text(String(index + 1), 50, y, { width: 40, align: 'center' })
                    .text(p.title || 'Không có tên', 100, y, { width: 190 })
                    .text(price.toLocaleString('vi-VN'), 300, y, { width: 90, align: 'right' })
                    .text(String(qty), 400, y, { width: 40, align: 'center' })
                    .text(total.toLocaleString('vi-VN'), 450, y, { width: 90, align: 'right' });
                
                y = doc.y + 10;
                doc.y = y;
            });

            // Kẻ đường line tổng cộng
            doc.moveTo(50, doc.y)
                .lineTo(540, doc.y)
                .stroke();
            doc.moveDown();

            // Tổng cộng
            const totalPrice = Number(order.totalPrice || 0);
            doc.font('Times-Bold')
                .fontSize(12)
                .text(
                    `Tổng cộng: ${totalPrice.toLocaleString('vi-VN')} đ`,
                    { align: 'right' }
                );

            // Footer
            doc.font('Times-Regular')
                .moveDown(2)
                .fontSize(11)
                .text('Cảm ơn quý khách đã mua hàng!', { align: 'center' })
                .moveDown(0.5)
                .text('Mọi thắc mắc xin vui lòng liên hệ:', { align: 'center' })
                .text('0123456789', { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateInvoice
}; 