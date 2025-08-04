const validateProduct = (product) => {
    const errors = [];
    
    // Kiểm tra title
    if (!product.title || product.title.trim().length === 0) {
        errors.push('Tên sản phẩm không được để trống');
    }
    
    // Kiểm tra description
    if (!product.description || product.description.trim().length === 0) {
        errors.push('Mô tả sản phẩm không được để trống');
    }
    
    // Kiểm tra price
    if (!product.price || isNaN(parseFloat(product.price))) {
        errors.push('Giá sản phẩm phải là một số hợp lệ');
    } else if (parseFloat(product.price) <= 0) {
        errors.push('Giá sản phẩm phải lớn hơn 0');
    }
    
    // Kiểm tra imgUrl
    if (!product.imgUrl || product.imgUrl.trim().length === 0) {
        errors.push('URL hình ảnh không được để trống');
    } else if (!product.imgUrl.startsWith('/images/')) {
        errors.push('URL hình ảnh phải bắt đầu bằng /images/');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

module.exports = {
    validateProduct
}; 