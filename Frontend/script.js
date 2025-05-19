"use strict";

// --- CONFIGURACIÓN GLOBAL ---
const API_URL = "https://ferremax-actualizado.onrender.com"; // O "http://localhost:4000" para desarrollo local
let wompiPublicKey = null;
let frontendBaseUrl = null;
let configLoaded = false;
const CART_STORAGE_KEY = 'ferremaxCart';

// --- ESTADO GLOBAL DE LA APLICACIÓN ---
let allProducts = [];
let productsLoaded = false;
let currentSettings = {};
const categoriesData = [
    { name: "Eléctricas", icon: "fa-solid fa-bolt", id: "electricas" },
    { name: "Manuales", icon: "fa-solid fa-wrench", id: "manuales" },
    { name: "Seguridad", icon: "fa-solid fa-hard-hat", id: "seguridad" },
    { name: "Medición", icon: "fa-solid fa-ruler-combined", id: "medicion" },
    { name: "Tornillería", icon: "fa-solid fa-screwdriver-wrench", id: "tornilleria" },
    { name: "Jardinería", icon: "fa-solid fa-leaf", id: "jardineria" }
];
const adminSubSections = ['admin-products', 'admin-personalize', 'admin-orders', 'admin-product-stats', 'admin-analytics', 'admin-customers'];
const publicSections = ['home', 'products', 'contact', 'policies', 'cart', 'faq', 'order-history'];


// --- REFERENCIAS AL DOM ---
const loginSection = document.getElementById("login-section");
const registerSection = document.getElementById("register-section");
const mainContent = document.getElementById("main-content");
const pageContent = document.getElementById("page-content");
const featuredProductsContainer = document.getElementById("featured-products-container");
const categoryGridContainer = document.getElementById('category-grid-container');
const mainWelcomeTitle = document.getElementById('main-welcome-title');
const mainPromoTitle = document.getElementById('main-promo-title');
const mainPromoText = document.getElementById('main-promo-text');
const productsDisplayArea = document.getElementById("products-display-area");
const cartSection = document.getElementById('cart-section');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSummaryAndCheckout = document.getElementById('cart-summary-and-checkout');
const cartSubtotalSpan = document.getElementById('cart-subtotal');
const cartTotalSpan = document.getElementById('cart-total');
const cartItemCountDesktop = document.getElementById('cart-item-count-desktop');
const cartItemCountMobileIcon = document.getElementById('cart-item-count-mobile-icon');
const cartItemCountMobileMenu = document.getElementById('cart-item-count-mobile-menu');
const paymentButtonContainer = document.getElementById('payment-button-container');
const cartMessageDiv = document.getElementById('cart-message');
const contactForm = document.getElementById("contactForm");
const contactMessageResponseDiv = document.getElementById("contact-message-response");
const contactSubmitButton = document.getElementById("contactSubmitButton");
const contactInfoDetailsDiv = document.getElementById('contact-info-details');
const contactAddressP = document.getElementById('contact-address');
const contactPhoneP = document.getElementById('contact-phone');
const contactEmailP = document.getElementById('contact-email-info');
const socialLinksContainer = document.getElementById('social-links-container');
const faqAccordion = document.getElementById('faq-accordion');
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const logoutButton = document.getElementById("logoutButton");
const logoutButtonMobile = document.getElementById("logoutButtonMobile");
const showRegisterLink = document.getElementById("show-register");
const showLoginLink = document.getElementById("show-login");
const navLinks = document.querySelectorAll(".admin-nav-item");
const mobileMenuButton = document.getElementById("mobile-menu-button");
const mobileMenu = document.getElementById("mobile-menu");
const loginMessageDiv = document.getElementById("login-message");
const registerMessageDiv = document.getElementById("register-message");
const adminMenuDesktopContainer = document.getElementById('admin-menu-desktop-container');
const adminMenuDesktopButton = document.getElementById('admin-menu-desktop-button');
const adminMenuDesktopDropdown = document.getElementById('admin-menu-desktop-dropdown');
const adminMenuMobileContainer = document.getElementById('admin-menu-mobile-container');
const adminSectionContainer = document.getElementById('admin-section-container');
const adminProductsSection = document.getElementById('admin-products-section');
const adminProductsTableContainer = document.getElementById('admin-products-table-container');
const adminProductsMessageDiv = document.getElementById('admin-products-message');
const addProductButton = document.getElementById('add-product-button');
const adminProductFormContainer = document.getElementById('admin-add-edit-product-form-container');
const adminProductForm = document.getElementById('admin-product-form');
const adminCancelButton = document.getElementById('admin-cancel-edit-product');
const adminProductListContainer = document.getElementById('admin-product-list-container');
const adminProductFormMessageDiv = document.getElementById('admin-product-form-message');
const adminCategorySelect = document.getElementById('admin-product-category');
const adminFormTitle = document.getElementById('admin-form-title');
const adminProductIdInput = document.getElementById('admin-product-id');
const adminSaveButton = document.getElementById('admin-save-product-button');
const adminPersonalizeSection = document.getElementById('admin-personalize-section');
const adminPersonalizeMessageDiv = document.getElementById('admin-personalize-message');
const colorPrimaryInput = document.getElementById('setting-colorPrimary');
const colorSecondaryInput = document.getElementById('setting-colorSecondary');
const colorAccentInput = document.getElementById('setting-colorAccent');
const welcomeTitleInput = document.getElementById('setting-welcomeTitle');
const promoBannerTitleInput = document.getElementById('setting-promoBannerTitle');
const promoBannerTextInput = document.getElementById('setting-promoBannerText');
const saveColorsButton = document.getElementById('save-colors-button');
const saveTextsButton = document.getElementById('save-texts-button');
const contactAddressInput = document.getElementById('setting-contactAddress');
const contactPhoneInput = document.getElementById('setting-contactPhone');
const contactEmailInput = document.getElementById('setting-contactEmail');
const socialFacebookInput = document.getElementById('setting-socialFacebook');
const socialTwitterInput = document.getElementById('setting-socialTwitter');
const socialInstagramInput = document.getElementById('setting-socialInstagram');
const socialYoutubeInput = document.getElementById('setting-socialYoutube');
const saveContactSocialButton = document.getElementById('save-contact-social-button');
const adminProductStatsSection = document.getElementById('admin-product-stats-section');
const adminProductViewsContainer = document.getElementById('product-views-container');
const adminProductViewsMessageDiv = document.getElementById('admin-product-views-message');
const adminOrdersSection = document.getElementById('admin-orders-section');
const adminOrdersListContainer = document.getElementById('admin-orders-list-container');
const adminOrderDetailContainer = document.getElementById('admin-order-detail-container');
const adminOrdersMessageDiv = document.getElementById('admin-orders-message');
const adminAnalyticsSection = document.getElementById('admin-analytics-section');
const adminAnalyticsMessageDiv = document.getElementById('admin-analytics-message');
let dailySalesChartInstance = null;
let topProductsChartInstance = null;
const adminCustomersSection = document.getElementById('admin-customers-section');
const adminCustomersListContainer = document.getElementById('admin-customers-list-container');
const adminCustomersMessageDiv = document.getElementById('admin-customers-message');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const adminOrdersBadgeDesktop = document.getElementById('admin-orders-badge-desktop');
const adminOrdersBadgeMobile = document.getElementById('admin-orders-badge-mobile');
const orderHistoryNavLinkDesktop = document.getElementById('order-history-nav-link-desktop');
const orderHistoryNavLinkMobile = document.getElementById('order-history-nav-link-mobile');
const orderHistorySection = document.getElementById('order-history-section');
const orderHistoryMessageDiv = document.getElementById('order-history-message');
const orderHistoryListContainer = document.getElementById('order-history-list-container');
const orderDetailViewContainer = document.getElementById('order-detail-view-container');

// --- FUNCIONES UTILITARIAS ---
// ... (Incluye aquí las funciones showMessage, hideMessages, darkenColor, formatCOP)
function showMessage(element, message, isError = true) {
    if (!element) { console.warn("showMessage: Elemento nulo para mensaje:", message); return; }
    element.textContent = message;
    element.className = `message ${isError ? 'message-error' : 'message-success'}`;
    element.style.display = "block";
    const persistentIds = ["admin-products-message", "admin-product-form-message", "admin-personalize-message", "payment-result-message", "cart-message", "cod-message", "admin-product-views-message", "admin-orders-message", "admin-analytics-message", "admin-customers-message", "order-history-message"];
    if (!persistentIds.includes(element.id)) {
        setTimeout(() => {
            if (element && element.style.display !== 'none' && element.textContent === message) {
                element.style.display = 'none';
            }
        }, 4000);
    }
}

function hideMessages(specificElement = null) {
    if (specificElement) {
        if (specificElement.style) specificElement.style.display = 'none';
    } else {
        document.querySelectorAll(".message").forEach(msg => {
            const persistentIds = ["admin-products-message", "admin-product-form-message", "admin-personalize-message", "payment-result-message", "cart-message", "cod-message", "admin-product-views-message", "admin-orders-message", "admin-analytics-message", "admin-customers-message", "order-history-message"];
            if (!persistentIds.includes(msg.id)) {
                msg.style.display = 'none';
            }
        });
    }
}

function darkenColor(hex, percent) {
    try {
        hex = hex.replace(/^#/, "");
        if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        const factor = 1 - percent / 100;
        r = Math.max(0, Math.floor(r * factor));
        g = Math.max(0, Math.floor(g * factor));
        b = Math.max(0, Math.floor(b * factor));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (e) {
        console.error("Error darkenColor:", hex, e);
        return hex;
    }
}

function formatCOP(value) {
    if (isNaN(value) || value === null || value === undefined) return '$ 0';
    const formatter = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    return formatter.format(value);
}


// --- FUNCIONES DEL CARRITO ---
// ... (Incluye aquí las funciones getCart, saveCart, addToCart, removeFromCart, updateCartQuantity, calculateCartTotals, updateCartIcon)
function getCart() {
    const cartJson = localStorage.getItem(CART_STORAGE_KEY);
    try {
        const parsedCart = cartJson ? JSON.parse(cartJson) : [];
        return Array.isArray(parsedCart) ? parsedCart.filter(item => item && typeof item.productId !== 'undefined' && item.productId !== null) : [];
    } catch (e) {
        console.error("Error getCart:", e);
        localStorage.removeItem(CART_STORAGE_KEY);
        return [];
    }
}

function saveCart(cart) {
    if (!Array.isArray(cart)) { console.warn("saveCart: Intento de guardar algo que no es un array."); return; }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartIcon();
    if (cartSection && cartSection.style.display !== 'none') {
        renderCartPage();
    }
}

function addToCart(productId, quantity = 1, buttonElement = null) {
    console.log(`[Cart] Add: ${productId} Qty: ${quantity}`);
    if (!allProducts || allProducts.length === 0) {
        console.error("Cart Error: Products not loaded.");
        const msgContainer = cartMessageDiv || (pageContent ? pageContent.querySelector('.message') : null) || document.body;
        showMessage(msgContainer, 'Error: Información del producto no disponible.', true);
        return;
    }
    let cart = getCart();
    const product = allProducts.find(p => p.ID_Producto == productId);
    if (!product) {
        console.error("Cart Error: Product not found:", productId);
        const msgContainer = cartMessageDiv || (pageContent ? pageContent.querySelector('.message') : null) || document.body;
        showMessage(msgContainer, 'Error: Producto no encontrado.', true);
        return;
    }
    const stock = product.cantidad ?? 0;
    const existingItemIndex = cart.findIndex(item => item.productId == productId);
    const msgContainer = cartMessageDiv || (pageContent ? pageContent.querySelector('.message') : null) || document.body;

    if (stock <= 0 && existingItemIndex === -1) {
        showMessage(msgContainer, `"${product.Nombre}" agotado.`, true);
        if (buttonElement) {
            buttonElement.disabled = true;
            buttonElement.innerHTML = '<i class="fas fa-times-circle mr-2"></i>Sin Stock';
            buttonElement.classList.add('btn-gray', 'cursor-not-allowed');
            buttonElement.classList.remove('btn-primary');
        }
        return;
    }

    let addedQty = 0;
    if (existingItemIndex > -1) {
        const currentQtyInCart = cart[existingItemIndex].quantity;
        const potentialTotalQty = currentQtyInCart + quantity;
        if (potentialTotalQty > stock) {
            addedQty = stock - currentQtyInCart;
            if (addedQty > 0) {
                cart[existingItemIndex].quantity = stock;
                showMessage(msgContainer, `Stock máximo (${stock}) alcanzado para "${product.Nombre}". ${addedQty} más añadido(s).`, false);
            } else {
                showMessage(msgContainer, `Ya tienes el stock máximo (${stock}) de "${product.Nombre}" en el carrito.`, true);
            }
        } else {
            cart[existingItemIndex].quantity = potentialTotalQty;
            addedQty = quantity;
        }
    } else {
        if (quantity > stock) {
            addedQty = stock;
            if (addedQty > 0) {
                cart.push({ productId: parseInt(productId), quantity: stock, price: product.precio_unitario, name: product.Nombre, imageUrl: product.imagen_url, stock: stock });
                showMessage(msgContainer, `Stock insuficiente (${stock}) para "${product.Nombre}". Añadido: ${addedQty}.`, true);
            } else {
                showMessage(msgContainer, `"${product.Nombre}" agotado.`, true);
            }
        } else {
            addedQty = quantity;
            cart.push({ productId: parseInt(productId), quantity: quantity, price: product.precio_unitario, name: product.Nombre, imageUrl: product.imagen_url, stock: stock });
        }
    }

    if (addedQty > 0) {
        saveCart(cart);
        if (buttonElement) {
            const originalHtml = buttonElement.innerHTML;
            const originalClasses = buttonElement.className;
            buttonElement.disabled = true;
            buttonElement.innerHTML = '<i class="fas fa-check mr-1"></i> Añadido';
            buttonElement.classList.add('added-feedback');
            setTimeout(() => {
                if (buttonElement?.classList.contains('added-feedback')) {
                    buttonElement.innerHTML = originalHtml;
                    buttonElement.className = originalClasses;
                    const latestCartItem = getCart().find(i => i.productId == productId);
                    const cartQty = latestCartItem?.quantity ?? 0;
                    buttonElement.disabled = (cartQty >= stock);
                    if (buttonElement.disabled) {
                        buttonElement.innerHTML = '<i class="fas fa-times-circle mr-2"></i>Sin Stock';
                        buttonElement.classList.add('btn-gray', 'cursor-not-allowed');
                        buttonElement.classList.remove('btn-primary');
                    }
                    buttonElement.classList.remove('added-feedback');
                }
            }, 1500);
        } else {
            showMessage(msgContainer, '¡Producto añadido!', false);
        }
    }
}

function removeFromCart(productId) {
    console.log(`[Cart] Remove: ${productId}`);
    let cart = getCart();
    const initialLength = cart.length;
    cart = cart.filter(item => item.productId != productId);
    if (cart.length < initialLength) {
        console.log(`[Cart] Item ${productId} removed successfully.`);
        saveCart(cart);
    } else {
        console.warn(`[Cart] Item ${productId} not found to remove.`);
    }
}

function updateCartQuantity(productId, newQuantity) {
    console.log(`[Cart] Update Qty: ${productId} -> ${newQuantity}`);
    const quantityNum = parseInt(newQuantity);
    if (isNaN(quantityNum) || quantityNum < 0) {
        console.warn("Cart Update: Invalid qty", newQuantity);
        if (cartSection && cartSection.style.display !== 'none') renderCartPage();
        return;
    }
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.productId == productId);
    if (itemIndex > -1) {
        const stock = cart[itemIndex].stock || 0;
        if (quantityNum === 0) {
            removeFromCart(productId);
        } else if (quantityNum > stock) {
            cart[itemIndex].quantity = stock;
            saveCart(cart);
            showMessage(cartMessageDiv, `Stock máximo (${stock}) para "${cart[itemIndex].name}".`, true);
        } else {
            cart[itemIndex].quantity = quantityNum;
            saveCart(cart);
            hideMessages(cartMessageDiv);
        }
    } else {
        console.warn("Cart Update: Item not found", productId);
    }
}

function calculateCartTotals() {
    const cart = getCart();
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
    });
    return { subtotal, total: subtotal };
}

function updateCartIcon() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    const counts = [cartItemCountDesktop, cartItemCountMobileIcon, cartItemCountMobileMenu];
    counts.forEach(el => {
        if (el) {
            el.textContent = totalItems;
            el.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    });
}

// --- LOG PRODUCT VIEW ---
async function logProductView(productId) { /* ... (código completo) ... */ }
        
// --- RENDER CART PAGE ---
function renderCartPage() { /* ... (código completo) ... */ }
async function handleCheckout() { /* ... (código completo) ... */ }
async function handleCashOnDeliverySubmit(event) { /* ... (código completo) ... */ }

// --- FUNCIONES DE RENDERIZADO (PRODUCTOS, CATEGORÍAS, ETC.) ---
function renderProductCard(product) { /* ... (código completo) ... */ }
function renderProductGrid(container) { /* ... (código completo) ... */ }
function renderFeaturedProducts(container) { /* ... (código completo) ... */ }
function renderProductDetailContent(container, product) { /* ... (código completo) ... */ }
function renderProductDetail(container, productId) { /* ... (código completo) ... */ }
function renderCategories() { /* ... (código completo) ... */ }

// --- NUEVAS FUNCIONES PARA HISTORIAL DE PEDIDOS DEL USUARIO ---
async function loadAndRenderUserOrders() { /* ... (código completo) ... */ }
function renderUserOrdersTable(orders) { /* ... (código completo) ... */ }
async function loadAndRenderUserOrderDetail(orderId) { /* ... (código completo) ... */ }
function renderUserOrderDetailContent(order) { /* ... (código completo) ... */ }
        
// --- FUNCIONES DE CARGA DE DATOS ---
async function loadFrontendConfig() { /* ... (código completo) ... */ }
async function loadAndStorePublicProducts() { /* ... (código completo) ... */ }
async function loadSiteSettings() { /* ... (código completo) ... */ }

// --- FUNCIONES DE ADMINISTRACIÓN ---
async function loadAdminProducts() { /* ... (código completo) ... */ }
function renderAdminProductTable(products) { /* ... (código completo) ... */ }
function showAdminProductForm(product = null) { /* ... (código completo) ... */ }
async function handleEditProduct(productId) { /* ... (código completo) ... */ }
function showAdminProductList() { /* ... (código completo) ... */ }
async function handleDeleteProduct(productId) { /* ... (código completo) ... */ }
async function loadCategoriesIntoSelect() { /* ... (código completo) ... */ }
async function loadAndRenderProductViews() { /* ... (código completo) ... */ }
async function loadAndRenderAdminOrders() { /* ... (código completo) ... */ }
async function loadAndRenderOrderDetail(orderId) { /* ... (código completo para admin) ... */ }
async function updateOrderStatus(orderId, newStatus) { /* ... (código completo para admin) ... */ }
async function loadAndRenderAnalytics() { /* ... (código completo) ... */ }
async function loadAndRenderAdminCustomers() { /* ... (código completo) ... */ }
let lastPendingOrderCount = 0; 
let orderCheckInterval = null;
function updateAdminOrderBadges(count) { /* ... (código completo) ... */ }
async function checkNewOrders() { /* ... (código completo) ... */ }

// --- FUNCIONES DE NAVEGACIÓN Y UI ---
function applySiteSettings() { /* ... (código completo) ... */ }
function applyColorSettings(settings) { /* ... (código completo) ... */ }
function applyTextSettings(settings) { /* ... (código completo) ... */ }
function applyContactInfo(settings) { /* ... (código completo) ... */ }
function populatePersonalizeForm() { /* ... (código completo) ... */ }
async function saveSiteSettings(settingsToSave, type = 'general') { /* ... (código completo) ... */ }
function openImageModal(imageUrl) { /* ... (código completo) ... */ }
function closeImageModal() { /* ... (código completo) ... */ }
function closeImageModalOnClick(event) { /* ... (código completo) ... */ }
function updateUI(isLoggedIn) { /* ... (código completo, incluyendo orderHistoryNavLinkDesktop/Mobile) ... */ }
async function showPageSection(sectionId, detailId = null) { /* ... (código completo, incluyendo 'order-history') ... */ }
        
// --- MANEJADORES DE EVENTOS ---
function handleLogout() { /* ... (código completo, incluyendo limpieza de userId) ... */ }
function handleCategoryClick(event) { /* ... (código completo) ... */ }
function handleGridOrDetailClick(event) { /* ... (código completo) ... */ }

// --- LÓGICA DE INICIALIZACIÓN DE LA APLICACIÓN ---
document.addEventListener("DOMContentLoaded", async () => {
    console.log(">>> DOM Cargado. Iniciando App Ferremax...");
    try {
        await loadFrontendConfig();
        // Limpieza de carrito si es inválido
        try {
            const cartData = localStorage.getItem(CART_STORAGE_KEY);
            if (cartData) {
                const parsed = JSON.parse(cartData);
                if (!Array.isArray(parsed)) {
                    localStorage.removeItem(CART_STORAGE_KEY);
                } else {
                    const validCart = parsed.filter(item => item && typeof item.productId !== 'undefined' && item.productId !== null);
                    if (validCart.length !== parsed.length) {
                        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validCart));
                    }
                }
            }
        } catch (e) {
            console.warn("Error al parsear carrito, limpiando...", e);
            localStorage.removeItem(CART_STORAGE_KEY);
        }

        const currentYearSpan = document.getElementById("current-year");
        if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
        
        const isLoggedIn = localStorage.getItem("userLoggedIn") === "true";
        console.log(">>> Estado Login Inicial:", isLoggedIn);
        
        console.log(">>> Cargando Settings del Sitio...");
        await loadSiteSettings(); 
        
        updateUI(isLoggedIn); 
        updateCartIcon();

        console.log(">>> Añadiendo Listeners...");
        if (loginForm) {
            loginForm.addEventListener("submit", async (event) => {
                event.preventDefault(); 
                if(loginMessageDiv) hideMessages(loginMessageDiv);
                const emailElement = document.getElementById("login-email");
                const passwordElement = document.getElementById("login-password");
                const email = emailElement ? emailElement.value : null;
                const password = passwordElement ? passwordElement.value : null;
                
                const button = loginForm.querySelector('button[type="submit"]');
                if (!button) return; 
                button.disabled = true; button.textContent = 'Ingresando...';
                
                if (!email || !password) {
                    showMessage(loginMessageDiv, "Correo y contraseña son requeridos.", true);
                    button.disabled = false; button.textContent = 'Iniciar Sesión';
                    return;
                }

                try {
                    const response = await fetch(`${API_URL}/api/login`, { 
                        method: "POST", 
                        headers: { "Content-Type": "application/json" }, 
                        body: JSON.stringify({ email, password }) 
                    });
                    const result = await response.json();
                    if (response.ok && result.success && result.user) {
                        localStorage.setItem("userLoggedIn", "true");
                        localStorage.setItem("userEmail", result.user.email);
                        localStorage.setItem("userRole", result.user.role || 'cliente');
                        localStorage.setItem("userId", result.user.id);
                        productsLoaded = false; 
                        await loadSiteSettings(); 
                        updateUI(true); 
                        await showPageSection("home");
                    } else { 
                        showMessage(loginMessageDiv, result.message || "Error en el login. Verifica tus credenciales.", true); 
                    }
                } catch (error) { 
                    console.error("Error login fetch:", error); 
                    if (error instanceof TypeError && error.message.toLowerCase().includes("failed to fetch")) {
                         showMessage(loginMessageDiv, "No se pudo conectar con el servidor. Verifica tu conexión o la URL del servidor.", true);
                    } else {
                        showMessage(loginMessageDiv, "Ocurrió un error inesperado. Intenta de nuevo.", true);
                    }
                } finally { 
                    if (button) { button.disabled = false; button.textContent = 'Iniciar Sesión'; } 
                }
            });
        }

        if (registerForm) {
            registerForm.addEventListener("submit", async (event) => {
                event.preventDefault(); 
                if(registerMessageDiv) hideMessages(registerMessageDiv);
                const usernameElement = document.getElementById("register-username");
                const emailElement = document.getElementById("register-email");
                const passwordElement = document.getElementById("register-password");

                const username = usernameElement ? usernameElement.value : null;
                const email = emailElement ? emailElement.value : null;
                const password = passwordElement ? passwordElement.value : null;

                const button = registerForm.querySelector('button[type="submit"]');
                if (!button) return; 
                
                if (!username || !email || !password) {
                     showMessage(registerMessageDiv, "Todos los campos son requeridos.", true);
                     return;
                }
                if (password.length < 6) { 
                    showMessage(registerMessageDiv, "La contraseña debe tener al menos 6 caracteres.", true); return; 
                }
                button.disabled = true; button.textContent = 'Registrando...';
                try {
                    const response = await fetch(`${API_URL}/api/register`, { 
                        method: "POST", 
                        headers: { "Content-Type": "application/json" }, 
                        body: JSON.stringify({ username, email, password }) 
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        showMessage(registerMessageDiv, "¡Registro exitoso! Ahora puedes iniciar sesión.", false);
                        setTimeout(() => {
                            if (registerSection) registerSection.style.display = "none";
                            if (loginSection) loginSection.style.display = "block";
                            if (loginForm) loginForm.reset();
                            if (registerForm) registerForm.reset();
                            hideMessages();
                        }, 2500);
                    } else { 
                        showMessage(registerMessageDiv, result.message || "Error en el registro.", true); 
                    }
                } catch (error) { 
                    console.error("Error registro fetch:", error); 
                     if (error instanceof TypeError && error.message.toLowerCase().includes("failed to fetch")) {
                        showMessage(registerMessageDiv, "No se pudo conectar con el servidor.", true);
                    } else {
                        showMessage(registerMessageDiv, "Error al intentar registrar. Intenta de nuevo.", true);
                    }
                } finally { 
                    if (button) { button.disabled = false; button.textContent = 'Registrarse'; } 
                }
            });
        }
        
        if (contactForm && contactSubmitButton) {
            contactForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                if(contactMessageResponseDiv) hideMessages(contactMessageResponseDiv);
                contactSubmitButton.disabled = true;
                contactSubmitButton.textContent = "Enviando...";
                const formData = new FormData(contactForm);
                const contactData = Object.fromEntries(formData.entries());
                if (!contactData.name || !contactData.email || !contactData.subject || !contactData.message) {
                    showMessage(contactMessageResponseDiv, "Por favor, completa todos los campos.", true);
                    contactSubmitButton.disabled = false;
                    contactSubmitButton.textContent = "Enviar Mensaje";
                    return;
                }
                try {
                    const response = await fetch(`${API_URL}/api/contact`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(contactData)
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        showMessage(contactMessageResponseDiv, "¡Mensaje recibido! Gracias por contactarnos.", false);
                        contactForm.reset();
                    } else {
                        showMessage(contactMessageResponseDiv, result.message || "Error al enviar el mensaje.", true);
                    }
                } catch (error) {
                    console.error("Error contacto fetch:", error);
                    showMessage(contactMessageResponseDiv, "Error de conexión al enviar el mensaje.", true);
                } finally {
                    contactSubmitButton.disabled = false;
                    contactSubmitButton.textContent = "Enviar Mensaje";
                }
            });
        }


        if (logoutButton) logoutButton.addEventListener("click", handleLogout);
        if (logoutButtonMobile) logoutButtonMobile.addEventListener("click", handleLogout);
        
        if (showRegisterLink) showRegisterLink.addEventListener("click", (event) => { 
            event.preventDefault(); 
            if (loginSection) loginSection.style.display = "none"; 
            if (registerSection) registerSection.style.display = "block"; 
            hideMessages(); 
        });
        if (showLoginLink) showLoginLink.addEventListener("click", (event) => { 
            event.preventDefault(); 
            if (registerSection) registerSection.style.display = "none"; 
            if (loginSection) loginSection.style.display = "block"; 
            hideMessages(); 
        });

        navLinks.forEach(link => {
            link.addEventListener("click", (event) => {
                const sectionId = link.getAttribute("data-section");
                if (sectionId) {
                    event.preventDefault();
                    showPageSection(sectionId);
                }
            });
        });
        
        const promoBtn = document.querySelector('.promo-banner .cta-button'); 
        if (promoBtn) {
            promoBtn.addEventListener('click', (e) => {
                const sectionId = promoBtn.getAttribute('data-section');
                if (sectionId) {
                    e.preventDefault();
                    showPageSection(sectionId);
                }
            });
        }
        
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener("click", () => {
                const isExpanded = mobileMenuButton.getAttribute("aria-expanded") === "true";
                mobileMenuButton.setAttribute("aria-expanded", !isExpanded);
                mobileMenu.classList.toggle("hidden");
                const openIcon = mobileMenuButton.querySelector("svg.block");
                const closeIcon = mobileMenuButton.querySelector("svg.hidden");
                if (openIcon) openIcon.classList.toggle("hidden");
                if (closeIcon) closeIcon.classList.toggle("hidden");
            });
        }
        if (adminMenuDesktopButton && adminMenuDesktopDropdown) {
             adminMenuDesktopButton.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                adminMenuDesktopDropdown.classList.toggle('hidden'); 
            });
            document.addEventListener('click', (e) => { 
                if (adminMenuDesktopContainer && !adminMenuDesktopContainer.contains(e.target) && adminMenuDesktopDropdown && !adminMenuDesktopDropdown.classList.contains('hidden')) {
                    adminMenuDesktopDropdown.classList.add('hidden');
                }
            });
        }
        
        if (pageContent) pageContent.addEventListener('click', handleGridOrDetailClick);
        
        if (cartItemsContainer) {
            cartItemsContainer.addEventListener('change', (e) => {
                if (e.target.matches('.cart-item-qty-input')) {
                    updateCartQuantity(e.target.dataset.productIdQty, e.target.value);
                }
            });
            cartItemsContainer.addEventListener('click', (e) => {
                const removeButton = e.target.closest('.cart-item-remove-button');
                if (removeButton) {
                    removeFromCart(removeButton.dataset.productIdRemove);
                }
            });
        }
        
        if (categoryGridContainer) categoryGridContainer.addEventListener('click', handleCategoryClick);
        
        if (addProductButton) addProductButton.addEventListener('click', () => showAdminProductForm());
        if (adminCancelButton) adminCancelButton.addEventListener('click', showAdminProductList);
        
        if (adminProductForm) { /* ... (código completo del listener para adminProductForm submit) ... */ }

        if (saveColorsButton) saveColorsButton.addEventListener('click', () => { /* ... */ });
        if (saveTextsButton) saveTextsButton.addEventListener('click', () => { /* ... */ });
        if (saveContactSocialButton) saveContactSocialButton.addEventListener('click', () => { /* ... */ });
        
        if (faqAccordion) {
            faqAccordion.addEventListener('click', (e) => {
                const question = e.target.closest('.faq-question');
                if (question) {
                    const item = question.parentElement;
                    if (item) item.classList.toggle('active');
                }
            });
        }

        console.log(">>> Mostrando Sección Inicial...");
        if (isLoggedIn) {
            await showPageSection("home");
        } else {
            console.log(">>> Mostrando sección de Login (usuario no logueado).");
            // updateUI(false) ya debería haber mostrado la sección de login si es el comportamiento deseado por defecto.
            // Si loginSection no es null y es la primera vista, se mostrará por defecto o por la lógica en updateUI.
        }
        console.log(">>> INICIALIZACIÓN COMPLETA (Ferremax App) <<<");
    } catch (error) {
        console.error("!!! ERROR CRÍTICO DURANTE LA INICIALIZACIÓN !!!", error);
        if (document.body) {
            document.body.innerHTML = `<div style="padding: 2rem; text-align: center; color: red; font-family: sans-serif; border: 2px solid red; margin: 2rem;"><h1>Error Crítico</h1><p>La aplicación no pudo iniciarse correctamente.</p><p>Por favor, revisa la consola del navegador (presiona F12) para más detalles.</p><p style="margin-top: 1rem; font-weight: bold;">Mensaje: ${error.message}</p></div>`;
        }
    }
});

// --- SCRIPT DEL NUEVO CARRUSEL ---
document.addEventListener('DOMContentLoaded', () => {
    const newCarouselSlidesContainer = document.getElementById("new-carousel-slides");
    const newIndicatorsContainer = document.getElementById("new-carousel-indicators");
    const newPrevBtn = document.getElementById("new-prevBtn");
    const newNextBtn = document.getElementById("new-nextBtn");
    
    // Verificación adicional para asegurarse de que los contenedores del carrusel existen
    if (!newCarouselSlidesContainer || !newIndicatorsContainer || !newPrevBtn || !newNextBtn) {
        console.warn("Carousel containers not found for new carousel. El carrusel no se inicializará.");
        return; // Detener la ejecución del script del carrusel si los elementos no existen
    }
    
    let newCurrentIndex = 0;
    let newTotalSlides = 0;
    let newCarouselInterval;

    function updateNewCarousel(index, smooth = true) {
        if (!newCarouselSlidesContainer || !newIndicatorsContainer) return;
        if (smooth) {
            newCarouselSlidesContainer.style.transition = "transform 0.7s ease-in-out";
        } else {
            newCarouselSlidesContainer.style.transition = "none";
        }
        newCarouselSlidesContainer.style.transform = `translateX(-${index * 100}%)`;
        
        const dots = newIndicatorsContainer.querySelectorAll(".carousel-dot");
        dots.forEach((dot, i) => {
            if(dot) {
                dot.classList.toggle("bg-gray-600", i === index);
                dot.classList.toggle("bg-gray-300", i !== index);
            }
        });
        newCurrentIndex = index;
    }

    function newShowNextSlide() {
        if (newTotalSlides === 0) return;
        let nextIndex = (newCurrentIndex + 1) % newTotalSlides;
        updateNewCarousel(nextIndex);
    }

    function newShowPrevSlide() {
        if (newTotalSlides === 0) return;
        let prevIndex = (newCurrentIndex - 1 + newTotalSlides) % newTotalSlides;
        updateNewCarousel(prevIndex);
    }

    function startNewCarouselInterval() {
        stopNewCarouselInterval();
        if (newTotalSlides > 1) {
            newCarouselInterval = setInterval(newShowNextSlide, 7000);
        }
    }

    function stopNewCarouselInterval() {
        clearInterval(newCarouselInterval);
    }

    newNextBtn.addEventListener("click", () => { newShowNextSlide(); stopNewCarouselInterval(); startNewCarouselInterval(); });
    newPrevBtn.addEventListener("click", () => { newShowPrevSlide(); stopNewCarouselInterval(); startNewCarouselInterval(); });

    fetch(`${API_URL}/api/productos?limit=5`)
        .then(res => {
            if (!res.ok) throw new Error(`Error ${res.status} fetching products for carousel`);
            return res.json();
        })
        .then(productos => {
            if (!newCarouselSlidesContainer || !newIndicatorsContainer) {
                console.error("Carousel containers disappeared during fetch."); return;
            }
            newCarouselSlidesContainer.innerHTML = '';
            newIndicatorsContainer.innerHTML = '';
            newTotalSlides = productos.length;

            if (newTotalSlides === 0) {
                newCarouselSlidesContainer.innerHTML = '<p class="p-4 text-center text-gray-500 w-full">No hay productos para mostrar en el carrusel.</p>';
                if(newPrevBtn) newPrevBtn.style.display = 'none';
                if(newNextBtn) newNextBtn.style.display = 'none';
                if(newIndicatorsContainer) newIndicatorsContainer.style.display = 'none';
                return;
            }

            productos.forEach((producto, i) => {
                const slide = document.createElement("div");
                slide.className = "w-full flex-shrink-0 bg-white p-6 flex flex-col items-center justify-center text-center min-h-[300px]";
                const imageOnError = `this.onerror=null;this.src='https://placehold.co/400x249/fecaca/b91c1c?text=Err';this.alt='Imagen no disponible';`;
                const imageUrl = producto.imagen_url || `https://placehold.co/400x250/e2e8f0/64748b?text=Producto`;
                const precioFormateado = typeof formatCOP === 'function' ? formatCOP(producto.precio_unitario) : '$' + (producto.precio_unitario || 0);
                
                slide.innerHTML = `
                    <img src="${imageUrl}" alt="${producto.Nombre || 'Producto'}" class="rounded shadow mb-4 max-h-48 sm:max-h-64 object-contain product-carousel-image" onerror="${imageOnError}" data-product-id="${producto.ID_Producto}">
                    <h3 class="text-lg sm:text-xl font-semibold text-gray-700 mt-2">${producto.Nombre || 'Producto'}</h3>
                    <p class="text-gray-600 mt-1 text-sm truncate w-full max-w-xs">${producto.Descripcion || "Excelente producto para tus proyectos."}</p>
                    <p class="text-green-600 font-bold mt-2">${precioFormateado}</p>`;
                newCarouselSlidesContainer.appendChild(slide);

                const imgElement = slide.querySelector('.product-carousel-image');
                if (imgElement) {
                    imgElement.addEventListener('click', () => {
                        const productId = producto.ID_Producto;
                        console.log(`Carousel image clicked for product ID: ${productId}`);
                        if (typeof showPageSection === 'function') {
                            showPageSection('products', productId);
                            stopNewCarouselInterval();
                        } else { console.error('showPageSection function is not available globally.'); }
                    });
                }

                const dot = document.createElement("span");
                dot.className = "carousel-dot";
                dot.addEventListener("click", () => { updateNewCarousel(i); stopNewCarouselInterval(); startNewCarouselInterval(); });
                newIndicatorsContainer.appendChild(dot);
            });

            if (newTotalSlides <= 1) {
                if(newPrevBtn) newPrevBtn.style.display = 'none';
                if(newNextBtn) newNextBtn.style.display = 'none';
                if(newIndicatorsContainer) newIndicatorsContainer.style.display = 'none';
            } else {
                if(newPrevBtn) newPrevBtn.style.display = 'block';
                if(newNextBtn) newNextBtn.style.display = 'block';
                if(newIndicatorsContainer) newIndicatorsContainer.style.display = 'flex';
            }
            updateNewCarousel(0, false);
            startNewCarouselInterval();

            const carouselSection = document.getElementById('new-carousel-section');
            if (carouselSection) {
                carouselSection.addEventListener('mouseenter', stopNewCarouselInterval);
                carouselSection.addEventListener('mouseleave', startNewCarouselInterval);
            }
        })
        .catch(error => {
            console.error("Error al cargar productos para el nuevo carrusel:", error);
            if (newCarouselSlidesContainer) {
                newCarouselSlidesContainer.innerHTML = `<p class="p-4 text-center text-red-500 w-full">Error al cargar carrusel: ${error.message}</p>`;
            }
            if(newPrevBtn) newPrevBtn.style.display = 'none';
            if(newNextBtn) newNextBtn.style.display = 'none';
            if(newIndicatorsContainer) newIndicatorsContainer.style.display = 'none';
        });
});