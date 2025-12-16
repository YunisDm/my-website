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
                <span class="product-price">${product.price} د.ع / كغم</span>
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

// Cart Logic
window.addToCart = (id) => {
    const product = products.find(p => p.id === id);
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    updateCartUI();
    openCart();
};

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

function updateQty(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty += change;
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
                        <span>${item.qty}</span>
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


// Make functions global for inline onclick handlers
window.removeFromCart = removeFromCart;
window.updateQty = updateQty;
