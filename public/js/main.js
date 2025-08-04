const backdrop = document.querySelector('.backdrop');
const sideDrawer = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('#side-menu-toggle');

function backdropClickHandler() {
  backdrop.style.display = 'none';
  sideDrawer.classList.remove('open');
}

function menuToggleClickHandler() {
  backdrop.style.display = 'block';
  sideDrawer.classList.add('open');
}

if (backdrop) {
  backdrop.addEventListener('click', backdropClickHandler);
}
if (menuToggle) {
  menuToggle.addEventListener('click', menuToggleClickHandler);
}

// Đợi DOM load xong
$(document).ready(function() {
    // Thêm animation cho các phần tử khi scroll
    $(window).scroll(function() {
        $('.animate__animated').each(function() {
            var elementTop = $(this).offset().top;
            var elementBottom = elementTop + $(this).outerHeight();
            var viewportTop = $(window).scrollTop();
            var viewportBottom = viewportTop + $(window).height();

            if (elementBottom > viewportTop && elementTop < viewportBottom) {
                $(this).addClass('animate__fadeIn');
            }
        });
    });

    // Xử lý nút back-to-top
    var btn = $('#back-to-top');
    $(window).scroll(function() {
        if ($(window).scrollTop() > 300) {
            btn.addClass('show');
        } else {
            btn.removeClass('show');
        }
    });

    btn.on('click', function(e) {
        e.preventDefault();
        $('html, body').animate({scrollTop:0}, '300');
    });

    // Toast notifications
    function showToast(message, type = 'success') {
        const toast = $(`
            <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `);
        
        $('.toast-container').append(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Xóa toast sau khi ẩn
        toast.on('hidden.bs.toast', function() {
            $(this).remove();
        });
    }

    // Thêm vào global scope
    window.showToast = showToast;
});

document.addEventListener('DOMContentLoaded', function() {
    // Thêm class fade-in cho các phần tử
    const fadeElements = document.querySelectorAll('.card, .product-card');
    fadeElements.forEach(element => {
        element.classList.add('fade-in');
    });

    // Xử lý nút back-to-top
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'back-to-top';
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopBtn.setAttribute('aria-label', 'Lên đầu trang');
    document.body.appendChild(backToTopBtn);

    // Xử lý sự kiện scroll để hiển thị nút back-to-top
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    // Xử lý sự kiện click để lăn lên đầu trang
    backToTopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({top: 0, behavior: 'smooth'});
    });

    // Active nav-link dựa vào URL hiện tại
    const currentLocation = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentLocation || 
            (linkPath === '/' && currentLocation === '/index') ||
            (linkPath !== '/' && currentLocation.includes(linkPath))) {
            link.classList.add('active');
        }
    });

    // Hiệu ứng hover cho product cards
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.querySelector('.card-img-top')?.classList.add('scale-img');
        });
        card.addEventListener('mouseleave', function() {
            this.querySelector('.card-img-top')?.classList.remove('scale-img');
        });
    });

    // Hiệu ứng dropdown mượt mà
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('show.bs.dropdown', function() {
            const menu = this.querySelector('.dropdown-menu');
            menu.classList.add('animate__animated', 'animate__fadeIn');
        });
    });

    // Toast notifications
    const toastElList = document.querySelectorAll('.toast');
    toastElList.forEach(toastEl => {
        const toast = new bootstrap.Toast(toastEl, {
            autohide: true,
            delay: 5000
        });
        toast.show();
    });

    // Tooltip
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (typeof bootstrap !== 'undefined') {
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }

    // Lazy loading hình ảnh
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    if ('loading' in HTMLImageElement.prototype) {
        // Trình duyệt hỗ trợ lazy loading
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        // Trình duyệt không hỗ trợ lazy loading
        const lazyScript = document.createElement('script');
        lazyScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        document.body.appendChild(lazyScript);
        lazyImages.forEach(img => {
            img.classList.add('lazyload');
            img.setAttribute('data-src', img.getAttribute('data-src'));
        });
    }

    // Kiểm tra và hiển thị thông báo từ flash messages
    const flashMessage = document.querySelector('.flash-message');
    if (flashMessage) {
        setTimeout(() => {
            flashMessage.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            flashMessage.classList.remove('show');
            setTimeout(() => {
                flashMessage.remove();
            }, 500);
        }, 5000);
    }

    // Hiệu ứng fade-in cho tất cả các card
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animation = `fadeIn 0.5s ease forwards ${index * 0.1}s`;
        card.style.opacity = '0';
    });

    // Xử lý nút tăng/giảm số lượng
    const decreaseButtons = document.querySelectorAll('.decrease-quantity');
    const increaseButtons = document.querySelectorAll('.increase-quantity');
    const quantityInputs = document.querySelectorAll('.product-quantity');

    decreaseButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            let currentValue = parseInt(quantityInputs[index].value);
            if (currentValue > 1) {
                quantityInputs[index].value = currentValue - 1;
            }
        });
    });

    increaseButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            let currentValue = parseInt(quantityInputs[index].value);
            quantityInputs[index].value = currentValue + 1;
        });
    });

    // Hiệu ứng hover cho hình ảnh sản phẩm
    const productImages = document.querySelectorAll('.product-detail-image');
    productImages.forEach(img => {
        img.addEventListener('mouseover', function() {
            this.style.transition = 'transform 0.3s ease';
            this.style.transform = 'scale(1.05)';
        });
        
        img.addEventListener('mouseout', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // Xử lý tabs cho phần chi tiết sản phẩm
    const tabLinks = document.querySelectorAll('.nav-link[data-bs-toggle="tab"]');
    const tabContents = document.querySelectorAll('.tab-pane');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', function() {
            const targetId = this.getAttribute('data-bs-target');
            
            // Ẩn tất cả tab content
            tabContents.forEach(content => {
                content.classList.remove('show', 'active');
            });
            
            // Hiển thị tab content được chọn
            const targetContent = document.querySelector(targetId);
            if (targetContent) {
                targetContent.classList.add('show', 'active');
            }
            
            // Cập nhật trạng thái active cho tab
            tabLinks.forEach(tabLink => {
                tabLink.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Xử lý form thêm vào giỏ hàng
    const addToCartForms = document.querySelectorAll('.add-to-cart-form');
    addToCartForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const button = form.querySelector('button[type="submit"]');
            const originalText = button.textContent;
            
            // Hiệu ứng khi nhấn nút thêm vào giỏ hàng
            button.textContent = 'Đã thêm!';
            button.classList.add('added');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('added');
            }, 2000);
        });
    });

    // Khởi tạo các tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
});

// CSS cho nút back-to-top
const style = document.createElement('style');
style.textContent = `
    #back-to-top {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: var(--primary-color);
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
        z-index: 1000;
    }
    
    #back-to-top.show {
        opacity: 1;
        visibility: visible;
    }
    
    #back-to-top:hover {
        background-color: var(--primary-dark);
        transform: translateY(-5px);
    }
    
    .scale-img {
        transform: scale(1.05) !important;
    }
    
    .flash-message {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1050;
        padding: 15px 25px;
        border-radius: 8px;
        background-color: white;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .flash-message.show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .flash-message.success {
        border-left: 4px solid var(--success-color);
    }
    
    .flash-message.error {
        border-left: 4px solid var(--danger-color);
    }
`;

document.head.appendChild(style);

// Autocomplete tìm kiếm sản phẩm nâng cấp
const searchInput = document.getElementById('search-autocomplete');
const resultList = document.getElementById('autocomplete-list');
if (searchInput && resultList) {
  searchInput.addEventListener('input', async function() {
    const keyword = this.value.trim();
    if (!keyword) {
      resultList.style.display = 'none';
      resultList.innerHTML = '';
      return;
    }
    const res = await fetch(`/api/products/autocomplete?q=${encodeURIComponent(keyword)}`);
    const { products, total } = await res.json();
    if (products.length === 0) {
      resultList.style.display = 'none';
      resultList.innerHTML = '';
      return;
    }
    resultList.innerHTML = products.map(p => 
      `<li class="list-group-item" style="cursor:pointer;display:flex;align-items:center;gap:12px;padding:10px 12px;border-bottom:1px solid #f3f3f3;" onclick="window.location='/products/${p._id}'">
        <img src="${p.imgUrl || '/images/default-product.jpg'}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;">
        <div style="flex:1;">
          <div style="font-weight:600;">${p.title}</div>
          <div style="color:#ff7f32;font-weight:700;">${Number(p.price).toLocaleString('vi-VN')}₫</div>
        </div>
      </li>`
    ).join('') +
    (total > products.length
      ? `<li class="list-group-item text-center" style="color:#ff7f32;cursor:pointer;font-weight:600;" onclick="window.location='/search?q=${encodeURIComponent(keyword)}'">Xem thêm ${total - products.length} sản phẩm</li>`
      : '');
    resultList.style.display = 'block';
  });
  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !resultList.contains(e.target)) {
      resultList.style.display = 'none';
    }
  });
}
