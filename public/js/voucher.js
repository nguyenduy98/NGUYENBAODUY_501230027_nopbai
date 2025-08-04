// Voucher functionality
let appliedCoupon = null;
let discountAmount = 0;
let selectedVoucher = null;
let availableVouchers = [];
// totalPrice sẽ được set từ checkout page, không khai báo lại để tránh conflict

// Load available vouchers
async function loadVouchers() {
  try {
    console.log('Voucher.js: Loading vouchers...');
    const response = await fetch('/admin/api/coupons');
    const data = await response.json();
    console.log('Voucher.js: Response:', data);
    if (data.success) {
      availableVouchers = data.coupons;
      renderVoucherList();
      console.log('Voucher.js: Vouchers loaded successfully');
    } else {
      console.log('Voucher.js: API returned error:', data.message);
    }
  } catch (error) {
    console.error('Voucher.js: Error loading vouchers:', error);
    alert('Có lỗi khi tải danh sách voucher: ' + error.message);
  }
}

// Render voucher list
function renderVoucherList() {
  const voucherList = document.getElementById('voucherList');
  if (!voucherList) return;
  
  voucherList.innerHTML = '';

  availableVouchers.forEach(voucher => {
    const voucherCard = document.createElement('div');
    voucherCard.className = 'voucher-card mb-3 p-3 border rounded';

    const daysLeft = Math.ceil((new Date(voucher.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    const isExpiring = daysLeft <= 1;

            voucherCard.innerHTML = `
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <div class="d-flex align-items-center mb-2">
                <div class="me-3">
                  <div class="fw-bold" style="font-size: 18px;">MÃ GIẢM GIÁ</div>
                  <div style="font-size: 12px;">TOÀN NGÀNH HÀNG</div>
                </div>
                <div class="ms-auto text-end">
                  <div class="fw-bold">
                    ${voucher.type === 'percent' 
                      ? (voucher.maxDiscount ? `Giảm ${voucher.value}% (tối đa ₫${voucher.maxDiscount.toLocaleString('vi-VN')}k)` : `Giảm ${voucher.value}%`)
                      : `Giảm tối đa ₫${voucher.maxDiscount ? voucher.maxDiscount.toLocaleString('vi-VN') : voucher.value.toLocaleString('vi-VN')}k`
                    }
                  </div>
                  <div style="font-size: 12px;">Đơn Tối Thiểu ₫${voucher.minOrder ? voucher.minOrder.toLocaleString('vi-VN') : '0'}k</div>
                </div>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <div style="font-size: 12px;">
                  ${isExpiring ? 'Sắp hết hạn' : 'Còn lại'}: ${daysLeft} ngày
                  <a href="#" class="text-white ms-2" style="text-decoration: underline;">Điều Kiện</a>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" name="selectedVoucher" value="${voucher._id}" id="voucher_${voucher._id}">
                </div>
              </div>
            </div>
          </div>
          ${voucher.quantity > 1 ? `<div class="voucher-quantity-badge">x ${voucher.quantity}</div>` : ''}
        `;

    voucherList.appendChild(voucherCard);
  });
}

    // Apply voucher
    function applyVoucher(voucher) {
      appliedCoupon = voucher;
      
      // Calculate discount
      if (voucher.type === 'fixed' && voucher.value >= 10000 && voucher.value <= 100000) {
        discountAmount = 0;
        window.freeship = voucher.value;
      } else if (voucher.type === 'fixed') {
        discountAmount = voucher.value;
        window.freeship = 0;
      } else if (voucher.type === 'percent') {
        discountAmount = Math.round(totalPrice * voucher.value / 100);
        if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
          discountAmount = voucher.maxDiscount;
        }
        window.freeship = 0;
      }

      // Show selected voucher
      const selectedVoucherEl = document.getElementById('selectedVoucher');
      const selectedVoucherCodeEl = document.getElementById('selectedVoucherCode');
      const selectedVoucherDescEl = document.getElementById('selectedVoucherDesc');
      const selectVoucherBtn = document.getElementById('selectVoucherBtn');
      
      if (selectedVoucherEl && selectedVoucherCodeEl && selectedVoucherDescEl && selectVoucherBtn) {
        selectedVoucherCodeEl.textContent = voucher.code;
        selectedVoucherDescEl.textContent = 
          voucher.type === 'percent' ? `Giảm ${voucher.value}%` : `Giảm ${voucher.value.toLocaleString('vi-VN')}₫`;
        selectedVoucherEl.style.display = 'block';
        selectVoucherBtn.style.display = 'none';
      }

      // Update display
      const discountAmountEl = document.getElementById('discountAmount');
      const discountRowEl = document.getElementById('discountRow');
      const couponMessageEl = document.getElementById('couponMessage');
      const subtotalEl = document.getElementById('subtotal');
      
      if (discountAmountEl && discountRowEl && couponMessageEl) {
        discountAmountEl.textContent = '-' + discountAmount.toLocaleString('vi-VN') + '₫';
        discountRowEl.style.display = discountAmount > 0 ? 'flex' : 'none';
        couponMessageEl.textContent = '';
      }

      // Update subtotal display
      if (subtotalEl) {
        const afterDiscount = totalPrice - discountAmount;
        subtotalEl.textContent = afterDiscount.toLocaleString('vi-VN') + '₫';
      }
      
      // Cập nhật các trường ẩn cho form
      const appliedCouponHidden = document.getElementById('appliedCouponHidden');
      const subtotalHidden = document.getElementById('subtotalHidden');
      if (appliedCouponHidden && subtotalHidden) {
        appliedCouponHidden.value = JSON.stringify(voucher);
        subtotalHidden.value = totalPrice - discountAmount;
      }
      
      // Gọi updateShippingFee để cập nhật tổng tiền
      if (typeof updateShippingFee === 'function') {
        updateShippingFee();
      }
    }

  // Initialize voucher functionality
  document.addEventListener('DOMContentLoaded', function() {
    try {
      console.log('Voucher.js: DOMContentLoaded started');
      
      // totalPrice đã được set từ checkout page, không cần set lại
      console.log('Voucher.js: totalPrice available:', typeof totalPrice !== 'undefined' ? totalPrice : 'undefined');
      
      // Select voucher button
      const selectVoucherBtn = document.getElementById('selectVoucherBtn');
      if (selectVoucherBtn) {
        console.log('Voucher.js: Found selectVoucherBtn, adding click listener');
        selectVoucherBtn.addEventListener('click', function() {
          console.log('Voucher.js: Button clicked, loading vouchers...');
          try {
            loadVouchers();
            const modal = new bootstrap.Modal(document.getElementById('voucherModal'));
            modal.show();
            console.log('Voucher.js: Modal opened successfully');
          } catch (error) {
            console.error('Voucher.js: Error opening modal:', error);
            alert('Có lỗi khi mở modal voucher: ' + error.message);
          }
        });
      } else {
        console.log('Voucher.js: selectVoucherBtn not found');
      }
    } catch (error) {
      console.error('Voucher.js: Error in DOMContentLoaded:', error);
    }

    // Handle checkbox selection (only allow one at a time)
    document.addEventListener('change', function(e) {
      if (e.target.name === 'selectedVoucher' && e.target.type === 'checkbox') {
        // Uncheck all other checkboxes
        const allCheckboxes = document.querySelectorAll('input[name="selectedVoucher"]');
        allCheckboxes.forEach(checkbox => {
          if (checkbox !== e.target) {
            checkbox.checked = false;
          }
        });
      }
    });

  // Apply voucher code
  const applyVoucherCodeBtn = document.getElementById('applyVoucherCodeBtn');
  if (applyVoucherCodeBtn) {
    applyVoucherCodeBtn.addEventListener('click', async function() {
      const codeInput = document.getElementById('voucherCodeInput');
      if (!codeInput) return;
      
      const code = codeInput.value.trim();
      if (!code) return;

      try {
        const response = await fetch(`/admin/api/coupon/${code}?total=${totalPrice}`);
        const data = await response.json();
        
        if (data.success) {
          selectedVoucher = data.coupon;
          codeInput.value = '';
          alert('Mã voucher hợp lệ! Vui lòng chọn voucher để áp dụng.');
        } else {
          alert(data.message || 'Mã voucher không hợp lệ');
        }
      } catch (error) {
        alert('Có lỗi xảy ra khi kiểm tra mã voucher');
      }
    });
  }

  // Confirm voucher selection
  const confirmVoucherBtn = document.getElementById('confirmVoucherBtn');
  if (confirmVoucherBtn) {
    confirmVoucherBtn.addEventListener('click', async function() {
      const selectedCheckbox = document.querySelector('input[name="selectedVoucher"]:checked');
      if (!selectedCheckbox) {
        alert('Vui lòng chọn một voucher');
        return;
      }

      const voucherId = selectedCheckbox.value;
      const voucher = availableVouchers.find(v => v._id === voucherId);
      
      if (voucher) {
        try {
          // Ghi lại việc sử dụng voucher
          const response = await fetch('/admin/api/coupon/use', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ couponId: voucherId })
          });
          
          const data = await response.json();
          if (data.success) {
            applyVoucher(voucher);
            const modal = bootstrap.Modal.getInstance(document.getElementById('voucherModal'));
            if (modal) modal.hide();
          } else {
            alert(data.message || 'Có lỗi xảy ra khi sử dụng voucher!');
          }
        } catch (error) {
          console.error('Error using voucher:', error);
          alert('Có lỗi xảy ra khi sử dụng voucher!');
        }
      }
    });
  }

  // Remove voucher
  const removeVoucherBtn = document.getElementById('removeVoucherBtn');
  if (removeVoucherBtn) {
    removeVoucherBtn.addEventListener('click', function() {
      appliedCoupon = null;
      discountAmount = 0;
      window.freeship = 0;
      
      const selectedVoucherEl = document.getElementById('selectedVoucher');
      const selectVoucherBtn = document.getElementById('selectVoucherBtn');
      const discountRowEl = document.getElementById('discountRow');
      const couponMessageEl = document.getElementById('couponMessage');
      const subtotalEl = document.getElementById('subtotal');
      
      if (selectedVoucherEl && selectVoucherBtn && discountRowEl && couponMessageEl) {
        selectedVoucherEl.style.display = 'none';
        selectVoucherBtn.style.display = 'block';
        discountRowEl.style.display = 'none';
        couponMessageEl.textContent = '';
      }

      // Reset subtotal to original price
      if (subtotalEl) {
        subtotalEl.textContent = totalPrice.toLocaleString('vi-VN') + '₫';
      }
      
      // Xóa các trường ẩn cho form
      const appliedCouponHidden = document.getElementById('appliedCouponHidden');
      const subtotalHidden = document.getElementById('subtotalHidden');
      if (appliedCouponHidden && subtotalHidden) {
        appliedCouponHidden.value = '';
        subtotalHidden.value = totalPrice;
      }
      
      // Gọi updateShippingFee để cập nhật tổng tiền
      if (typeof updateShippingFee === 'function') {
        updateShippingFee();
      }
    });
  }
}); 