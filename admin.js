const PASS = "admin123";

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
    console.log("Firebase Initialized");
} catch (e) {
    console.error("Firebase Init Error:", e);
}

const db = firebase.database();
const productsRef = db.ref('products');

// Elements
const loginOverlay = document.getElementById('login-overlay');
const adminContent = document.getElementById('admin-content');
const passInput = document.getElementById('admin-pass');
const tableBody = document.getElementById('admin-products-list');

// Form Elements
const pId = document.getElementById('p-id');
const pName = document.getElementById('p-name');
const pPrice = document.getElementById('p-price');
const pCategory = document.getElementById('p-category');
const pUnit = document.getElementById('p-unit');
const pImage = document.getElementById('p-image');
const formTitle = document.getElementById('form-title');

// Data (Sync with Firebase)
let products = [];

// Login Logic
function checkLogin() {
    if (passInput.value === PASS) {
        loginOverlay.style.display = 'none';
        adminContent.style.display = 'block';
        // Start listening to Firebase
        productsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Convert object to array (if stored as object), or use directly
                // Firebase lists specifically often come back as objects with keys
                // We will handle array-like behavior or object behavior
                products = Array.isArray(data) ? data.filter(x => x) : Object.values(data);
            } else {
                products = [];
            }
            renderAdminProducts();
        }, (error) => {
            console.error("Firebase Error:", error);
            alert("خطأ في الاتصال بقاعدة البيانات (المدير): " + error.message);
        });
    } else {
        alert("كلمة المرور خاطئة!");
    }
}


function logout() {
    location.reload();
}

// Render Products
const adminSearch = document.getElementById('admin-search');

// Search Listener
if (adminSearch) {
    adminSearch.addEventListener('input', renderAdminProducts);
}

// Render Products
function renderAdminProducts() {
    const searchTerm = adminSearch ? adminSearch.value.trim().toLowerCase() : "";
    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm));

    tableBody.innerHTML = filtered.map(p => `
        <tr>
            <td><img src="${p.image}" alt="${p.name}"></td>
            <td>${p.name}</td>
            <td>${p.price} د.ع</td>
            <td>${p.category === 'fruit' ? 'فواكه' : 'خضروات'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editProduct(${p.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete-btn" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// Save (Add/Edit)
function saveProduct() {
    const name = pName.value;
    const price = Number(pPrice.value);
    const category = pCategory.value;
    const unit = pUnit.value;
    const image = pImage.value || "https://placehold.co/400?text=No+Image";

    if (!name || !price) {
        alert("يرجى ملء الاسم والسعر على الأقل");
        return;
    }

    if (pId.value) {
        // Edit Mode
        const id = Number(pId.value);
        // Find the node key if using pushed keys, but for migration consistency keeping numeric IDs for now logic
        // Best practice with Firebase is allow strict reference. 
        // For simplicity reusing the ID logic: UPDATE

        // We need to find the specific node to update. 
        // If we store as array: db.ref('products/' + index)
        // If we store as object logic, we need the key.
        // To keep it simple and compatible with previous logic:
        // We will overwrite the entire products array logic or update the specific index.
        // However, safely, let's just find the index in our local products array and update it.

        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            productsRef.child(index).update({ name, price, category, unit, image });
        }

    } else {
        // Add Mode
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const newProduct = { id: newId, name, price, category, unit, image };
        // We can use the array index as the key for simplicity since we started with an array
        // Or just set the whole list. 
        // Let's use set at specific index to avoid race conditions lightly
        // Actually, simplest is to retrieve the current max index or just append.
        // Since we are migrating from array structure:
        // We will just assume products is an array and set the new index.
        const nextIndex = products.length; // 0-based
        productsRef.child(nextIndex).set(newProduct);
    }

    // No need to call saveToLS() or render() manually, the listener will do it.
    resetForm();
}

// Delete
function deleteProduct(id) {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
        // Finding the index is tricky if we remove items and leave holes in array.
        // Firebase list behavior: if we remove index 2, 0 and 1 remain.
        // Let's just find the item and set it to null (remove).
        // But visual array might shift.
        // A robust way for array-in-firebase is to set the whole array again or filter.
        // Let's update the whole list to be safe and clean holes.
        const updatedProducts = products.filter(p => p.id !== id);
        productsRef.set(updatedProducts);
    }
}


// Edit Setup
function editProduct(id) {
    const p = products.find(p => p.id === id);
    if (p) {
        pId.value = p.id;
        pName.value = p.name;
        pPrice.value = p.price;
        pPrice.value = p.price;
        pCategory.value = p.category;
        pUnit.value = p.unit || 'kg'; // Default to kg if not set
        pImage.value = p.image;
        formTitle.textContent = "تعديل المنتج";
        window.scrollTo(0, 0);
    }
}

// Helpers
function resetForm() {
    pId.value = "";
    pName.value = "";
    pPrice.value = "";
    pImage.value = "";
    formTitle.textContent = "إضافة منتج جديد";
}


// Global scope
window.checkLogin = checkLogin;
window.logout = logout;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.resetForm = resetForm;
