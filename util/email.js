require('dotenv').config(); // LUÔN để ở dòng đầu tiên
const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,            // Dùng TLS thay vì SSL
        secure: false,        // false nếu dùng port 587
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        },
        debug: true
    });

    transporter.verify(function(error, success) {
        if (error) {
            console.error('Lỗi kết nối email server:', error);
        } else {
            console.log('Email server sẵn sàng');
        }
    });
} else {
    console.error('GMAIL_USER hoặc GMAIL_APP_PASSWORD chưa được cấu hình trong file .env');
}

// HTML của email xác nhận đơn hàng
const orderConfirmationHTML = (orderId, customerInfo) => `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #0d6efd; margin-bottom: 10px;">Cảm ơn bạn đã đặt hàng tại Freshmart!</h2>
            <p style="font-size: 16px;">Đơn hàng của bạn đã được xác nhận và đang được xử lý.</p>
            <p style="font-size: 15px; color: #28a745;"><b>Chúng tôi sẽ liên hệ với bạn để xác nhận và giao hàng trong thời gian sớm nhất.</b></p>
            <p style="font-size: 15px; color: #ff4444;">Nếu có thắc mắc, vui lòng liên hệ hotline: 0123456789</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #0d6efd; font-size: 16px; margin-top: 0;">Thông tin đơn hàng:</h3>
            <p style="margin: 0;"><strong>Mã đơn hàng:</strong> #${orderId}</p>
            <p style="margin: 10px 0;"><strong>Ngày đặt:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #0d6efd; font-size: 16px; margin-top: 0;">Thông tin người nhận:</h3>
            <p style="margin: 5px 0;"><strong>Họ tên:</strong> ${customerInfo.gender === 'female' ? 'Chị' : 'Anh'} ${customerInfo.fullName}</p>
            <p style="margin: 5px 0;"><strong>Số điện thoại:</strong> ${customerInfo.phone}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${customerInfo.email}</p>
            <h4 style="color: #0d6efd; font-size: 14px; margin: 15px 0 5px 0;">Địa chỉ giao hàng:</h4>
            <p style="margin: 5px 0;"><strong>Địa chỉ:</strong> ${customerInfo.address || customerInfo.streetAddress}</p>
            <p style="margin: 5px 0;"><strong>Phường/Xã:</strong> ${customerInfo.wardName || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Quận/Huyện:</strong> ${customerInfo.districtName || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Tỉnh/Thành:</strong> ${customerInfo.provinceName || 'N/A'}</p>
            ${customerInfo.note ? `<p style="margin: 15px 0 5px 0;"><strong>Ghi chú:</strong> ${customerInfo.note}</p>` : ''}
        </div>

        <div style="background: #fffbe6; padding: 18px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ffe58f;">
            <h3 style="color: #faad14; font-size: 16px; margin-top: 0;">Hướng dẫn thanh toán</h3>
            <ul style="padding-left: 18px;">
                <li>Quý khách vui lòng chuẩn bị đủ tiền mặt khi nhận hàng (COD).</li>
                <li>Kiểm tra kỹ sản phẩm trước khi thanh toán.</li>
                <li>Nếu có nhu cầu chuyển khoản, vui lòng liên hệ hotline để được hướng dẫn chi tiết.</li>
            </ul>
        </div>

        <div style="background: #e6fffb; padding: 18px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #87e8de;">
            <h3 style="color: #13c2c2; font-size: 16px; margin-top: 0;">Ưu đãi dành cho bạn</h3>
            <ul style="padding-left: 18px;">
                <li>Nhập mã <b>FRESH10</b> giảm 10% cho đơn tiếp theo.</li>
                <li>Miễn phí giao hàng cho đơn từ 500.000đ.</li>
            </ul>
        </div>

        <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 20px;">
            <h3 style="color: #0d6efd; font-size: 16px;">Thông tin liên hệ hỗ trợ:</h3>
            <ul style="list-style: none; padding: 0; margin: 10px 0;">
                <li style="margin-bottom: 8px;">📞 Hotline: 0123456789</li>
                <li style="margin-bottom: 8px;">🏪 Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</li>
                <li>⏰ Thời gian làm việc: 8:00 - 22:00 (Thứ 2 - Chủ nhật)</li>
            </ul>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee;">
            <p style="color: #666; font-size: 12px; margin: 0;">
                Email này được gửi tự động, vui lòng không trả lời.<br>
                Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của Freshmart!
            </p>
        </div>
    </div>
`;

// Gửi email xác nhận đơn hàng
exports.sendOrderConfirmation = async (email, orderId, pdfBuffer, customerInfo) => {
    try {
        if (!transporter) {
            console.error('Không thể gửi mail: transporter chưa được cấu hình');
            return;
        }

        if (!email) throw new Error('Thiếu email người nhận');
        if (!orderId) throw new Error('Thiếu mã đơn hàng');
        if (!customerInfo) throw new Error('Thiếu thông tin khách hàng');

        // Kiểm tra các trường bắt buộc trong customerInfo
        const requiredFields = ['fullName', 'phone', 'email', 'address'];
        for (const field of requiredFields) {
            if (!customerInfo[field] && !(field === 'address' && customerInfo.streetAddress)) {
                throw new Error(`Thiếu thông tin ${field} của khách hàng`);
            }
        }

        customerInfo.gender = customerInfo.gender || 'male';
        customerInfo.note = customerInfo.note || '';

        const mailOptions = {
            from: `"Shop Online" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `Xác nhận đơn hàng #${orderId}`,
            html: orderConfirmationHTML(orderId, customerInfo),
            attachments: pdfBuffer ? [
                {
                    filename: `invoice-${orderId}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ] : []
        };

        console.log('Đang gửi email đến:', email);
        const info = await transporter.sendMail(mailOptions);
        console.log('Email đã gửi thành công:', info.messageId);
        return info;
    } catch (error) {
        console.error('Chi tiết lỗi gửi email:', {
            errorName: error.name,
            errorMessage: error.message,
            errorCode: error.code,
            errorCommand: error.command,
            errorResponse: error.response
        });
        throw new Error(`Lỗi gửi email: ${error.message}`);
    }
};

// Gửi email cập nhật trạng thái đơn hàng
exports.sendOrderStatus = async (email, orderId, status) => {
    try {
        if (!transporter) {
            throw new Error('Transporter chưa được cấu hình');
        }
        if (!email || !orderId || !status) {
            throw new Error('Thiếu thông tin để gửi email cập nhật');
        }

        const mailOptions = {
            from: `"Shop Online" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `Cập nhật đơn hàng #${orderId}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Cập nhật trạng thái đơn hàng</h2>
                    <p><strong>Mã đơn hàng:</strong> #${orderId}</p>
                    <p><strong>Trạng thái mới:</strong> ${status}</p>
                    <hr>
                    <p>Hotline: 0123456789 | Địa chỉ: 123 Đường ABC, TP.HCM</p>
                    <p style="font-size: 12px; text-align: center; color: #888;">Email này được gửi tự động.</p>
                </div>
            `
        };

        console.log('Đang gửi email cập nhật trạng thái đến:', email);
        const info = await transporter.sendMail(mailOptions);
        console.log('Email cập nhật đã gửi thành công:', info.messageId);
        return info;
    } catch (error) {
        console.error('Chi tiết lỗi gửi email cập nhật:', {
            errorName: error.name,
            errorMessage: error.message,
            errorCode: error.code,
            errorCommand: error.command,
            errorResponse: error.response
        });
        throw new Error(`Lỗi gửi email cập nhật: ${error.message}`);
    }
};


// Hàm test gửi mail đơn giản

