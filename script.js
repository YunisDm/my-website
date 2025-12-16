// Firebase Configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBZI9ufJHW48U8BBct4ObGTSZwGUr3C5ew",
    authDomain: "alwa-shifta.firebaseapp.com",
    databaseURL: "https://alwa-shifta-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "alwa-shifta",
    storageBucket: "alwa-shifta.firebasestorage.app",
    messagingSenderId: "93576739896",
    appId: "1:93576739896:web:26621cc82681ad6378bacd",
    measurementId: "G-3JW8CSCVDG"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
} catch (e) {
    console.error("Firebase Init Error:", e);
}

const db = firebase.database();
const productsRef = db.ref('products');

let products = [];
let cart = [];

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const cartBtn = document.getElementById('cart-btn');
const closeCartBtn = document.getElementById('close-cart');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const cartCountElement = document.querySelector('.cart-count');
const filterBtns = document.querySelectorAll('.filter-btn');

// Checkout Elements
const checkoutBtn = document.querySelector('.checkout-btn');
const checkoutOverlay = document.getElementById('checkout-overlay');
const closeCheckoutBtn = document.getElementById('close-checkout');
const getLocationBtn = document.getElementById('get-location-btn');
const locationStatus = document.getElementById('location-status');
const confirmOrderBtn = document.getElementById('confirm-order-btn');
const checkoutTotalElement = document.getElementById('checkout-total');

// State
let userLocation = null;
const SHOP_PHONE = "9647721325805"; // Correct international format (Iraq) w/o +

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Listen for real-time updates
    productsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            products = Array.isArray(data) ? data.filter(x => x) : Object.values(data);
        } else {
            products = [];
        }
        renderProducts(products); // Use the global 'products' array which is now updated
    }, (error) => {
        console.error("Firebase Error:", error);
        if (error.code === 'PERMISSION_DENIED') {
            alert("خطأ: لا توجد صلاحية للوصول إلى قاعدة البيانات. يرجى التحقق من قواعد الأمان (Rules) في Firebase.");
        } else {
            alert("حدث خطأ أثناء الاتصال بقاعدة البيانات: " + error.message);
        }
    });

    updateCartUI();
});

// Render Products
function renderProducts(items) {
    productsGrid.innerHTML = items.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-img">
            <div class="product-info">
                <h3>${product.name}</h3>
                <span class="product-price">${product.price} د.ع / ${product.unit === 'piece' ? 'قطعة' : 'كغم'}</span>
                <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                    <i class="fa-solid fa-basket-shopping"></i> أضف للسلة
                </button>
            </div>
        </div>
    `).join('');
}

// Filter Logic
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Active class
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter
        const category = btn.getAttribute('data-filter');
        if (category === 'all') {
            renderProducts(products);
        } else {
            const filtered = products.filter(p => p.category === category);
            renderProducts(filtered);
        }
    });
});

// Qty Modal Elements
const qtyOverlay = document.getElementById('qty-overlay');
const closeQtyBtn = document.getElementById('close-qty');
const qtyProductName = document.getElementById('qty-product-name');
const qtyOptionsKg = document.getElementById('qty-options-kg');
const qtyOptionsPiece = document.getElementById('qty-options-piece');
const qtyInputPiece = document.getElementById('qty-input-piece');
const confirmAddBtn = document.getElementById('confirm-add-btn');

let currentSelectedProduct = null;
let currentSelectedQty = 0;

// Open Qty Modal (Replaces direct Add)
window.addToCart = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    currentSelectedProduct = product;
    qtyProductName.textContent = product.name;

    // Reset UI
    qtyOverlay.classList.add('open');
    document.querySelectorAll('.weight-btn').forEach(b => b.classList.remove('selected'));

    if (product.unit === 'piece') {
        qtyOptionsKg.style.display = 'none';
        qtyOptionsPiece.style.display = 'block';
        qtyInputPiece.value = 1;
        currentSelectedQty = 1;
    } else {
        qtyOptionsKg.style.display = 'block';
        qtyOptionsPiece.style.display = 'none';
        currentSelectedQty = 0; // User must select
    }

    // Disable add button until selection (for kg)
    if (product.unit !== 'piece') {
        // Optional: could auto select 1kg or disable btn
        // Let's auto select nothing and wait for user? Or default to 1kg?
        // User asked "choose quarter, half...", implies active choice.
    }
};

window.selectWeight = (weight) => {
    currentSelectedQty = weight;
    // Visually update buttons
    const buttons = document.querySelectorAll('.weight-btn');
    buttons.forEach(btn => {
        if (btn.textContent.includes(weight)) { // Simple check, or check value attribute if added
            btn.classList.add('selected');
        } else {
            // We can't easily check float in text without data attribute.
            // Let's rely on event target closest logic if possible, 
            // or just strict match if we added data attributes.
            // Since I didn't add data attributes, I recall text content.
            // Actually, better way:
            btn.classList.remove('selected');
        }
    });
    // Add selected class to the clicked one (event bubbling issue if I don't pass event)
    // Let's use event.target
    event.target.classList.add('selected');
};

window.adjustPiece = (delta) => {
    let val = parseInt(qtyInputPiece.value);
    val += delta;
    if (val < 1) val = 1;
    qtyInputPiece.value = val;
    currentSelectedQty = val;
};

// Confirm Add
confirmAddBtn.addEventListener('click', () => {
    if (currentSelectedQty <= 0) {
        showToast("يرجى اختيار الكمية أولاً");
        return;
    }

    const product = currentSelectedProduct;
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.qty += currentSelectedQty;
        // Float fix
        if (product.unit !== 'piece') {
            existingItem.qty = Math.round(existingItem.qty * 100) / 100;
        }
    } else {
        cart.push({ ...product, qty: currentSelectedQty });
    }

    updateCartUI();
    showToast(`تم إضافة ${currentSelectedQty} ${product.unit === 'piece' ? 'قطعة' : 'كغم'} للسلة`);

    qtyOverlay.classList.remove('open');
});

closeQtyBtn.addEventListener('click', () => {
    qtyOverlay.classList.remove('open');
});

// Cart Logic
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

function updateQty(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        // Determine step based on unit
        let step = 1;
        if (item.unit !== 'piece') {
            step = 0.25;
        }

        // If change is positive (add), add step. If negative (remove), subtract step.
        // The onclick sends 1 or -1. We need to multiply by step.
        const actualChange = change * step;

        item.qty += actualChange;

        // Fix floating point precision issues (e.g. 0.300000004)
        item.qty = Math.round(item.qty * 100) / 100;

        if (item.qty <= 0) {
            removeFromCart(id);
        } else {
            updateCartUI();
        }
    }
}

function updateCartUI() {
    // Count
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    cartCountElement.textContent = totalCount;

    // Items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">السلة فارغة</p>';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span class="cart-item-price">${item.price * item.qty} د.ع</span>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
                        <span>${item.qty} ${item.unit === 'piece' ? 'قطعة' : 'كغم'}</span>
                        <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                        <i class="fa-solid fa-trash remove-item" onclick="removeFromCart(${item.id})"></i>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Total
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    cartTotalElement.textContent = `${total} د.ع`;
}

// Cart Open/Close
function openCart() {
    cartOverlay.classList.add('open');
}

function closeCart() {
    cartOverlay.classList.remove('open');
}

cartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', (e) => {
    if (e.target === cartOverlay) {
        closeCart();
    }
});

// Checkout Logic
checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        alert("السلة فارغة!");
        return;
    }
    closeCart();
    checkoutOverlay.classList.add('open');
    // Update total in checkout
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    checkoutTotalElement.textContent = `${total} د.ع`;
});

closeCheckoutBtn.addEventListener('click', () => {
    checkoutOverlay.classList.remove('open');
});

// Geolocation
getLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        locationStatus.textContent = "المتصفح لا يدعم تحديد الموقع.";
        return;
    }

    locationStatus.textContent = "جاري تحديد الموقع...";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            userLocation = `https://www.google.com/maps?q=${lat},${lng}`;
            locationStatus.textContent = "تم تحديد الموقع بنجاح ✅";
            locationStatus.style.color = "#2ecc71";
        },
        (error) => {
            locationStatus.textContent = "تعذر تحديد الموقع. يرجى تفعيل GPS.";
            locationStatus.style.color = "#e74c3c";
            console.error(error);
        }
    );
});

// WhatsApp Integration
confirmOrderBtn.addEventListener('click', () => {
    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;
    const address = document.getElementById('customer-address').value;

    if (!name || !phone || !address) {
        alert("يرجى ملء جميع الحقول المطلوبة.");
        return;
    }

    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    let message = `*طلب جديد من علوة شفتة*\n\n`;
    message += `*الاسم:* ${name}\n`;
    message += `*الهاتف:* ${phone}\n`;
    message += `*العنوان:* ${address}\n`;

    if (userLocation) {
        message += `*الموقع:* ${userLocation}\n`;
    }

    message += `\n*الطلبات:*\n`;
    cart.forEach(item => {
        message += `- ${item.name} (x${item.qty}) - ${item.price * item.qty} د.ع\n`;
    });

    message += `\n*المجموع الكلي:* ${total} د.ع`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${SHOP_PHONE}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
});


// Toast Function
function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${msg}`;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

