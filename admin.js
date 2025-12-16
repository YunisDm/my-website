const PASS = "admin123";

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
const pImage = document.getElementById('p-image');
const formTitle = document.getElementById('form-title');

// Data
let products = JSON.parse(localStorage.getItem('products')) || [];

// Login Logic
function checkLogin() {
    if (passInput.value === PASS) {
        loginOverlay.style.display = 'none';
        adminContent.style.display = 'block';
        renderAdminProducts();
    } else {
        alert("كلمة المرور خاطئة!");
    }
}

function logout() {
    location.reload();
}

// Render Products
function renderAdminProducts() {
    tableBody.innerHTML = products.map(p => `
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
    const image = pImage.value || "https://placehold.co/400?text=No+Image"; // Placeholder if empty

    if (!name || !price) {
        alert("يرجى ملء الاسم والسعر على الأقل");
        return;
    }

    if (pId.value) {
        // Edit Mode
        const id = Number(pId.value);
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { id, name, price, category, image };
        }
    } else {
        // Add Mode
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, name, price, category, image });
    }

    saveToLS();
    resetForm();
    renderAdminProducts();
}

// Delete
function deleteProduct(id) {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
        products = products.filter(p => p.id !== id);
        saveToLS();
        renderAdminProducts();
    }
}

// Edit Setup
function editProduct(id) {
    const p = products.find(p => p.id === id);
    if (p) {
        pId.value = p.id;
        pName.value = p.name;
        pPrice.value = p.price;
        pCategory.value = p.category;
        pImage.value = p.image;
        formTitle.textContent = "تعديل المنتج";
        window.scrollTo(0, 0);
    }
}

// Helpers
function saveToLS() {
    localStorage.setItem('products', JSON.stringify(products));
}

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
