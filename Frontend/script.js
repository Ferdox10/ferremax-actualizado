// Frontend/script.js
"use strict";

// --- CONFIGURACIÓN GLOBAL ---
const API_URL = "https://ferremax-actualizado.onrender.com";
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
const cartCheckoutMessage = document.getElementById('payment-result-message'); // Re-check this ID, might be general
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
// Admin order notification badges
const adminOrdersBadgeDesktop = document.getElementById('admin-orders-badge-desktop');
const adminOrdersBadgeMobile = document.getElementById('admin-orders-badge-mobile');
const adminOrdersBadgeSidebar = document.getElementById('admin-orders-badge-sidebar'); // For new dashboard sidebar

// --- DASHBOARD ADMIN ---
const adminDashboardWrapper = document.getElementById('admin-dashboard-wrapper');
const adminDashboardLink = document.getElementById('admin-dashboard-link'); // Main link to show dashboard view

// Navegación para el nuevo dashboard (link principal)
if (adminDashboardLink) {
    adminDashboardLink.addEventListener('click', function (e) {
        e.preventDefault();
        showPageSection('admin-dashboard');
    });
}

// --- HISTORIAL DE COMPRAS ---
const purchaseHistorySection = document.getElementById('purchase-history-section');
const purchaseHistoryMessage = document.getElementById('purchase-history-message');
const historyListContainer = document.getElementById('history-list-container');
const navLinkPurchaseHistoryDesktop = document.getElementById('nav-link-purchase-history-desktop');
const navLinkPurchaseHistoryMobile = document.getElementById('nav-link-purchase-history-mobile');

function renderPurchaseHistory(orders) {
    if (!historyListContainer) return;
    historyListContainer.innerHTML = '';
    if (!orders || orders.length === 0) {
        historyListContainer.innerHTML = '<p class="text-center text-gray-500 p-4">No tienes compras registradas.</p>';
        return;
    }
    orders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'border rounded-lg p-4 bg-white shadow';
        orderDiv.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <div>
                    <span class="font-semibold">Pedido #${order.ID_Pedido}</span>
                    <span class="ml-2 text-gray-500 text-sm">${new Date(order.Fecha_Pedido).toLocaleDateString()}</span>
                </div>
                <div class="mt-2 md:mt-0">
                    <span class="text-sm font-medium">Estado:</span> <span class="inline-block px-2 py-1 rounded text-xs ${order.Estado_Pedido === 'Pagado' || order.Estado_Pedido === 'Entregado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">${order.Estado_Pedido}</span>
                    <span class="ml-4 text-sm font-medium">Total:</span> <span class="font-bold">${formatCOP(order.Total_Pedido)}</span>
                </div>
            </div>
            <div class="overflow-x-auto mt-2">
                <table class="min-w-full text-sm">
                    <thead><tr><th class="text-left">Producto</th><th>Cantidad</th><th>Precio</th></tr></thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td class="py-1 flex items-center gap-2">
                                    <img src="${item.imageUrl || 'https://placehold.co/40x40/e5e7eb/4b5563?text=NI'}" alt="${item.name}" class="w-8 h-8 object-contain rounded mr-2">
                                    ${item.name}
                                </td>
                                <td class="text-center">${item.quantity}</td>
                                <td>${formatCOP(item.pricePaid)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="text-xs text-gray-400 mt-2">Método de pago: ${order.Metodo_Pago || 'N/A'}${order.Referencia_Pago ? ` | Ref: ${order.Referencia_Pago}` : ''}</div>
        `;
        historyListContainer.appendChild(orderDiv);
    });
}

async function fetchPurchaseHistory() {
    if (!purchaseHistorySection) return;
    // No se muestra la sección aquí, solo se fetchean los datos. showPageSection lo hace.
    if (purchaseHistoryMessage) purchaseHistoryMessage.style.display = 'none';
    if (historyListContainer) historyListContainer.innerHTML = '<p class="text-center text-gray-500 p-4">Cargando historial...</p>';
    
    const user = JSON.parse(localStorage.getItem('ferremaxUser'));
    if (!user || !user.id) {
        renderPurchaseHistory([]);
        if (purchaseHistoryMessage) showMessage(purchaseHistoryMessage, 'Debes iniciar sesión para ver tu historial.', true);
        return;
    }
    try {
        const response = await fetch(`${API_URL}/api/user/orders`, {
            headers: { 'x-user-id': user.id }
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => null);
            throw new Error(errData?.message || `Error ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
            renderPurchaseHistory(data.orders);
        } else {
            renderPurchaseHistory([]);
            if (purchaseHistoryMessage) showMessage(purchaseHistoryMessage, data.message || 'No se pudo obtener el historial.', true);
        }
    } catch (error) {
        renderPurchaseHistory([]);
        if (purchaseHistoryMessage) showMessage(purchaseHistoryMessage, `Error al cargar el historial: ${error.message}`, true);
    }
}

function showPurchaseHistoryPage() { // Renombrado para claridad, invocado por showPageSection
    // Ocultar otras secciones principales lo hace showPageSection
    if (purchaseHistorySection) purchaseHistorySection.style.display = 'block';
    fetchPurchaseHistory();
}

function updatePurchaseHistoryMenuVisibility() {
    const user = JSON.parse(localStorage.getItem('ferremaxUser'));
    const isClient = user && user.role !== 'admin';
    if (navLinkPurchaseHistoryDesktop) navLinkPurchaseHistoryDesktop.style.display = isClient ? '' : 'none';
    if (navLinkPurchaseHistoryMobile) navLinkPurchaseHistoryMobile.style.display = isClient ? '' : 'none';
}

// --- FUNCIONES UTILITARIAS ---
function showMessage(element, message, isError = true) {
    if (!element) { console.warn("showMessage: Elemento nulo."); return; }
    element.textContent = message;
    element.className = `message ${isError ? 'message-error' : 'message-success'}`;
    element.style.display = "block";

    const persistentIds = ["admin-products-message", "admin-product-form-message", "admin-personalize-message", "payment-result-message", "cart-message", "cod-message", "admin-product-views-message", "admin-orders-message", "admin-analytics-message", "admin-customers-message", "purchase-history-message"];

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
            const persistentIds = ["admin-products-message", "admin-product-form-message", "admin-personalize-message", "payment-result-message", "cart-message", "cod-message", "admin-product-views-message", "admin-orders-message", "admin-analytics-message", "admin-customers-message", "purchase-history-message"];
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
    if (isNaN(value)) return '$ 0';
    const formatter = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    return formatter.format(value);
}

// --- FUNCIONES DEL CARRITO ---
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
        showMessage(cartMessageDiv || pageContent.querySelector('.message') || pageContent, 'Error: Información del producto no disponible.', true);
        return;
    }
    let cart = getCart();
    const product = allProducts.find(p => p.ID_Producto == productId);
    if (!product) {
        console.error("Cart Error: Product not found:", productId);
        showMessage(cartMessageDiv || pageContent.querySelector('.message') || pageContent, 'Error: Producto no encontrado.', true);
        return;
    }
    const stock = product.cantidad ?? 0;
    const existingItemIndex = cart.findIndex(item => item.productId == productId);
    if (stock <= 0 && existingItemIndex === -1) {
        showMessage(cartMessageDiv || pageContent.querySelector('.message') || pageContent, `"${product.Nombre}" agotado.`, true);
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
                showMessage(cartMessageDiv || pageContent.querySelector('.message') || pageContent, `Stock máximo (${stock}) alcanzado para "${product.Nombre}". ${addedQty} más añadido(s).`, false);
            } else {
                showMessage(cartMessageDiv || pageContent.querySelector('.message') || pageContent, `Ya tienes el stock máximo (${stock}) de "${product.Nombre}" en el carrito.`, true);
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
                showMessage(cartMessageDiv || pageContent.querySelector('.message') || pageContent, `Stock insuficiente (${stock}) para "${product.Nombre}". Añadido: ${addedQty}.`, true);
            } else {
                 showMessage(cartMessageDiv || pageContent.querySelector('.message') || pageContent, `"${product.Nombre}" agotado.`, true);
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
                }
            }, 1500);
        } else {
            showMessage(cartMessageDiv || pageContent.querySelector('.message') || pageContent, '¡Producto añadido!', false);
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
        renderCartPage();
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
async function logProductView(productId) {
    try {
        await fetch(`${API_URL}/api/products/${productId}/view`, { method: 'POST' });
    } catch (error) {
        console.warn(`Error al registrar vista para producto ID ${productId}:`, error);
    }
}

// --- RENDER CART PAGE ---
function renderCartPage() {
    console.log("[Cart] Rendering page...");
    if (!cartItemsContainer || !cartSummaryAndCheckout || !cartSubtotalSpan || !cartTotalSpan) {
        console.error("Cart Render: Missing DOM elements");
        if (pageContent) pageContent.innerHTML = '<p class="text-red-600 text-center p-4">Error interno al mostrar el carrito.</p>';
        return;
    }
    const cart = getCart();
    cartItemsContainer.innerHTML = "";
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Tu carrito está vacío.</p>';
        cartSummaryAndCheckout.style.display = 'none';
        const wompiBtn = document.getElementById('wompi-checkout-btn');
        if (wompiBtn) wompiBtn.style.display = 'none';
        const codBtn = document.getElementById('cod-checkout-btn');
        if (codBtn) codBtn.style.display = 'none';
        if (paymentButtonContainer) paymentButtonContainer.innerHTML = '';
    } else {
        const { subtotal, total } = calculateCartTotals();
        cart.forEach(item => {
            if (!item || typeof item.productId === 'undefined' || item.productId === null) {
                console.warn("[Cart Render] Ignorando item inválido:", item);
                return;
            }
            const imageUrl = item.imageUrl || `https://placehold.co/60x60/e5e7eb/4b5563?text=NI`;
            const imageOnError = `this.onerror=null;this.src='https://placehold.co/60x59/fecaca/b91c1c?text=Err';`;
            const priceF = formatCOP(item.price);
            const itemTotalF = formatCOP((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0));
            const stock = item.stock || 0;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item flex items-center justify-between border-b py-4 last:border-b-0 flex-wrap gap-2';
            itemDiv.innerHTML = `
                <div class="flex items-center flex-grow min-w-[200px]">
                    <img src="${imageUrl}" alt="${item.name || ''}" onerror="${imageOnError}" class="w-16 h-16 object-contain mr-4">
                    <div>
                        <h4 class="font-semibold text-gray-800">${item.name || 'N/A'}</h4>
                        <p class="text-sm text-gray-600">Precio: ${priceF}</p>
                        <p class="text-xs text-gray-500 mt-1">Stock: ${stock}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2 sm:space-x-3">
                    <label for="qty-${item.productId}" class="sr-only">Cantidad</label>
                    <input type="number" id="qty-${item.productId}" value="${item.quantity}" min="1" max="${stock}" data-product-id-qty="${item.productId}" class="border rounded px-1 py-1 w-14 sm:w-16 text-center cart-item-qty-input" aria-label="Cantidad">
                    <p class="font-semibold w-20 text-right">${itemTotalF}</p>
                    <button class="remove-item-btn cart-item-remove-button" data-product-id-remove="${item.productId}" title="Eliminar">
                        <i class="fas fa-trash-alt pointer-events-none"></i>
                    </button>
                </div>`;
            cartItemsContainer.appendChild(itemDiv);
        });
        cartSubtotalSpan.textContent = formatCOP(subtotal);
        cartTotalSpan.textContent = formatCOP(total);
        cartSummaryAndCheckout.style.display = 'block';
        const paymentOptionsDiv = document.createElement('div');
        paymentOptionsDiv.className = 'mt-6 border-t pt-6';
        paymentOptionsDiv.innerHTML = `
            <h4 class="text-lg font-semibold mb-3">Selecciona tu método de pago:</h4>
            <div class="space-y-3">
                <button id="wompi-checkout-btn" class="btn btn-primary w-full">Pagar con Wompi (Tarjeta, PSE, etc.)</button>
                <button id="cod-checkout-btn" class="btn btn-secondary w-full">Pago Contra Entrega</button>
            </div>
            <div id="cod-form-container" style="display:none;" class="mt-4 p-4 border rounded bg-gray-50">
                <h5 class="font-semibold mb-2">Datos para Pago Contra Entrega:</h5>
                <form id="cod-form" class="space-y-3">
                    <div><label for="cod-name">Nombre Completo*</label><input type="text" id="cod-name" name="cod-name" required></div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label for="cod-department">Departamento*</label><input type="text" id="cod-department" name="cod-department" required></div>
                        <div><label for="cod-city">Ciudad*</label><input type="text" id="cod-city" name="cod-city" required></div>
                    </div>
                    <div><label for="cod-address">Dirección Completa (Calle, Número, Barrio)*</label><textarea id="cod-address" name="cod-address" rows="2" required></textarea></div>
                    <div><label for="cod-reference-point">Punto de Referencia (Opcional)</label><textarea id="cod-reference-point" name="cod-reference-point" rows="2"></textarea></div>
                    <div><label for="cod-phone">Teléfono*</label><input type="tel" id="cod-phone" name="cod-phone" required></div>
                    <div><label for="cod-email">Correo Electrónico*</label><input type="email" id="cod-email" name="cod-email" required></div>
                    <button type="submit" class="btn btn-success w-full">Confirmar Pedido Contra Entrega</button>
                </form>
                <div id="cod-message" class="message mt-3"></div>
            </div>
            <div id="payment-result-message-container">
                <p id="payment-result-message" class="message mt-2 text-center"></p>
            </div>`;
        if (paymentButtonContainer) {
            paymentButtonContainer.innerHTML = '';
            paymentButtonContainer.appendChild(paymentOptionsDiv);
        } else {
            cartSummaryAndCheckout.appendChild(paymentOptionsDiv);
        }
        document.getElementById('wompi-checkout-btn')?.addEventListener('click', handleCheckout);
        const codCheckoutBtn = document.getElementById('cod-checkout-btn');
        const codFormContainer = document.getElementById('cod-form-container');
        const codForm = document.getElementById('cod-form');
        codCheckoutBtn?.addEventListener('click', () => {
            codFormContainer.style.display = 'block';
            codCheckoutBtn.style.display = 'none';
            const wompiBtn = document.getElementById('wompi-checkout-btn');
            if (wompiBtn) wompiBtn.style.display = 'none';
            const loggedInEmail = localStorage.getItem('userEmail');
            if (loggedInEmail && document.getElementById('cod-email')) {
                document.getElementById('cod-email').value = loggedInEmail;
            }
        });
        codForm?.addEventListener('submit', handleCashOnDeliverySubmit);
    }
    hideMessages(cartMessageDiv);
    if (cartCheckoutMessage) hideMessages(cartCheckoutMessage);
}

// --- CASH ON DELIVERY SUBMIT ---
async function handleCashOnDeliverySubmit(event) {
    event.preventDefault();
    const codMessageDiv = document.getElementById('cod-message');
    if (codMessageDiv) hideMessages(codMessageDiv);
    const customerInfo = {
        name: document.getElementById('cod-name')?.value.trim(),
        department: document.getElementById('cod-department')?.value.trim(),
        city: document.getElementById('cod-city')?.value.trim(),
        address: document.getElementById('cod-address')?.value.trim(),
        referencePoint: document.getElementById('cod-reference-point')?.value.trim() || null,
        phone: document.getElementById('cod-phone')?.value.trim(),
        email: document.getElementById('cod-email')?.value.trim(),
    };
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address || !customerInfo.department || !customerInfo.city || !customerInfo.email) {
        if (codMessageDiv) showMessage(codMessageDiv, "Por favor, completa todos los datos requeridos (*) para el envío.", true);
        return;
    }
    const cartForBackend = getCart().map(item => {
        const productDetails = allProducts.find(p => p.ID_Producto == item.productId);
        return {
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            stock: productDetails ? productDetails.cantidad : 0
        };
    });
    if (cartForBackend.length === 0) {
        if (codMessageDiv) showMessage(codMessageDiv, "Tu carrito está vacío.", true);
        return;
    }
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Procesando...'; }
    try {
        const response = await fetch(`${API_URL}/api/orders/cash-on-delivery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart: cartForBackend, customerInfo })
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || `Error ${response.status}`);
        }
        showMessage(cartMessageDiv || document.getElementById('payment-result-message'), "¡Pedido contra entrega recibido! Nos pondremos en contacto contigo pronto. Tu carrito ha sido vaciado.", false);
        event.target.reset();
        const codFormContainerEl = document.getElementById('cod-form-container');
        if (codFormContainerEl) codFormContainerEl.style.display = 'none';
        saveCart([]);
        renderCartPage();
        updateCartIcon();
    } catch (error) {
        console.error("Error al enviar pedido contra entrega:", error);
        if (codMessageDiv) showMessage(codMessageDiv, `Error al procesar tu pedido: ${error.message}`, true);
    } finally {
        if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Confirmar Pedido Contra Entrega'; }
    }
}

// --- FUNCIONES DE RENDERIZADO (PRODUCTOS, CATEGORÍAS, ETC.) ---
function renderProductCard(product) {
    const div = document.createElement("div");
    div.className = `product-card`;
    const imageUrl = product.imagen_url || `https://placehold.co/300x200/e5e7eb/4b5563?text=NI`;
    const imageOnError = `this.onerror=null;this.src='https://placehold.co/300x199/fecaca/b91c1c?text=Err';`;
    const price = formatCOP(product.precio_unitario);
    const stock = product.cantidad ?? 0;
    const isOutOfStock = stock <= 0;
    div.innerHTML = `
        <div class="card-img-container product-detail-link cursor-pointer" data-product-id-detail="${product.ID_Producto}">
            <img src="${imageUrl}" class="card-img-top" alt="${product.Nombre || ''}" onerror="${imageOnError}">
        </div>
        <div class="p-4 flex flex-col flex-grow">
            <h5 class="text-lg font-semibold text-gray-800 truncate mb-1 product-detail-link cursor-pointer" title="${product.Nombre || ''}" data-product-id-detail="${product.ID_Producto}">${product.Nombre || 'N/A'}</h5>
            <p class="text-xl font-bold product-price mt-auto mb-3">${price}</p>
            <button class="add-to-cart-button mt-auto w-full btn ${isOutOfStock ? 'btn-gray cursor-not-allowed' : 'btn-primary'}" data-product-id-add="${product.ID_Producto}" ${isOutOfStock ? 'disabled title="Sin stock"' : ''}>
                ${isOutOfStock ? '<i class="fas fa-times-circle mr-2"></i>Sin Stock' : '<i class="fas fa-cart-plus mr-2"></i>Añadir'}
            </button>
        </div>`;
    return div;
}

function renderProductGrid(container) {
    if (!container) return;
    container.innerHTML = "";
    container.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";
    if (!allProducts || allProducts.length === 0) {
        container.innerHTML = '<p class="col-span-full text-center text-gray-500 p-4">No hay productos disponibles.</p>';
        return;
    }
    allProducts.forEach(p => container.appendChild(renderProductCard(p)));
}

function renderFeaturedProducts(container) {
    if (!container) return;
    container.innerHTML = "";
    container.className = "grid grid-cols-1 md:grid-cols-3 gap-6";
    if (!allProducts || allProducts.length === 0) {
        container.innerHTML = '<p class="col-span-full text-center text-gray-500 p-4">No hay productos destacados.</p>';
        return;
    }
    const featured = allProducts.slice(0, 3);
    featured.forEach(p => container.appendChild(renderProductCard(p)));
}

function renderProductDetailContent(container, product) {
    container.innerHTML = "";
    const detailDiv = document.createElement("div");
    detailDiv.className = "product-detail-container";
    const imageURLs = [product.imagen_url, product.imagen_url_2, product.imagen_url_3, product.imagen_url_4, product.imagen_url_5].filter(url => url);
    const mainImageUrl = imageURLs.length > 0 ? imageURLs[0] : `https://placehold.co/600x400/e5e7eb/4b5563?text=NI`;
    const imageOnError = `this.onerror=null;this.src='https://placehold.co/600x399/fecaca/b91c1c?text=Err';`;
    const price = formatCOP(product.precio_unitario);
    const stock = product.cantidad ?? 0;
    const isOutOfStock = stock <= 0;
    let thumbnailsHTML = '';
    if (imageURLs.length > 1) {
        thumbnailsHTML = imageURLs.map((url, index) => `
            <img src="${url}" alt="Miniatura ${index + 1}" class="thumbnail-img ${index === 0 ? 'active' : ''}" onclick="changeMainImage('${url}', this)">
        `).join('');
    }
    detailDiv.innerHTML = `
        <div class="product-detail-image-container">
            <div class="main-image-wrapper">
                <img id="mainProductImage" src="${mainImageUrl}" class="product-detail-image" alt="${product.Nombre || ''}" onerror="${imageOnError}" title="Haz clic para ampliar">
            </div>
            ${imageURLs.length > 1 ? `<div class="thumbnail-container">${thumbnailsHTML}</div>` : ''}
        </div>
        <div class="product-detail-info">
            <h3 class="text-2xl lg:text-3xl font-bold text-gray-800 mb-3">${product.Nombre || 'N/A'}</h3>
            <button id="toggleDescriptionBtn" class="text-sm link-primary mb-3">Ver Descripción</button>
            <p id="productDescriptionText" class="product-description-text">${product.Descripcion || 'Descripción no disponible.'}</p>
            <p class="text-sm text-gray-500 mb-2 mt-4">Disponibles: ${stock}</p>
            <p class="text-3xl font-bold product-price mb-6">${price}</p>
            <button class="add-to-cart-button w-full sm:w-auto btn ${isOutOfStock ? 'btn-gray cursor-not-allowed' : 'btn-primary'} mb-4" data-product-id-add="${product.ID_Producto}" ${isOutOfStock ? 'disabled title="Sin stock"' : ''}>
                ${isOutOfStock ? '<i class="fas fa-times-circle mr-2"></i>Sin Stock' : '<i class="fas fa-cart-plus mr-2"></i>Añadir al Carrito'}
            </button>
            <button id="back-to-products" class="mt-6 w-full sm:w-auto btn btn-gray">
                <i class="fas fa-arrow-left mr-2"></i>Volver a Productos
            </button>
        </div>`;
    container.appendChild(detailDiv);
    const backBtn = detailDiv.querySelector("#back-to-products");
    if (backBtn) backBtn.addEventListener("click", () => showPageSection("products"));
    const mainImageEl = detailDiv.querySelector("#mainProductImage");
    if (mainImageEl) mainImageEl.addEventListener('click', () => openImageModal(mainImageEl.src));
    const toggleBtn = detailDiv.querySelector("#toggleDescriptionBtn");
    const descriptionText = detailDiv.querySelector("#productDescriptionText");
    if (toggleBtn && descriptionText) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = descriptionText.style.display === 'none';
            descriptionText.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? 'Ocultar Descripción' : 'Ver Descripción';
        });
    }
    if (product && product.ID_Producto) {
        logProductView(product.ID_Producto);
    }
}

window.changeMainImage = function(newImageUrl, thumbnailElement) {
    const mainImage = document.getElementById('mainProductImage');
    if (mainImage) {
        mainImage.src = newImageUrl;
        const thumbnails = document.querySelectorAll('.thumbnail-img');
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        if (thumbnailElement) {
            thumbnailElement.classList.add('active');
        }
    }
}

function renderProductDetail(container, productId) {
    if (!container) return;
    container.innerHTML = '<p class="text-center text-gray-500 p-4">Cargando detalle del producto...</p>';
    container.className = "";
    const product = allProducts.find(p => p.ID_Producto == productId);
    if (product) {
        renderProductDetailContent(container, product);
    } else {
        fetch(`${API_URL}/api/productos/${productId}`)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.message || `Error ${response.status}`) });
                }
                return response.json();
            })
            .then(p => {
                if (!p || !p.ID_Producto) throw new Error('Producto no hallado en la respuesta.');
                p.precio_unitario = parseFloat(p.precio_unitario) || 0;
                p.cantidad = parseInt(p.cantidad) || 0;
                renderProductDetailContent(container, p);
            })
            .catch(error => {
                console.error("Error cargando detalle producto:", error);
                container.innerHTML = `<p class="text-red-600 text-center p-4">Error al cargar el producto (${error.message}).</p><div class="text-center mt-4"><button id="back-to-products-error" class="btn btn-gray">Volver a Productos</button></div>`;
                const btnErr = container.querySelector("#back-to-products-error");
                if (btnErr) { btnErr.addEventListener("click", () => showPageSection("products")); }
            });
    }
}

function renderCategories() {
    if (!categoryGridContainer) return;
    categoryGridContainer.innerHTML = "";
    categoriesData.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.setAttribute('data-category-id', cat.id);
        card.innerHTML = `<i class="${cat.icon}"></i><span>${cat.name}</span>`;
        categoryGridContainer.appendChild(card);
    });
}

// --- FUNCIONES DE CARGA DE DATOS ---
async function loadAndStorePublicProducts() {
    if (productsLoaded && allProducts.length > 0) return true;
    console.log("Cargando productos públicos...");
    try {
        const response = await fetch(`${API_URL}/api/productos`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        let products = await response.json();
        allProducts = products.map(p => ({ ...p, precio_unitario: parseFloat(p.precio_unitario) || 0, cantidad: parseInt(p.cantidad) || 0 }));
        productsLoaded = true;
        console.log(`Productos públicos cargados: ${allProducts.length}`);
        updateCartIcon();
        return true;
    } catch (error) {
        console.error("Error cargando productos públicos:", error);
        allProducts = [];
        productsLoaded = false;
        if (productsDisplayArea) productsDisplayArea.innerHTML = '<p class="col-span-full text-red-600 p-4 text-center">Error al cargar productos.</p>';
        if (featuredProductsContainer) featuredProductsContainer.innerHTML = '<p class="col-span-full text-red-600 p-4 text-center">Error al cargar destacados.</p>';
        return false;
    }
}

async function loadSiteSettings() {
    console.log("Cargando settings del sitio...");
    try {
        const headers = { 'x-admin-simulated': 'true' };
        const response = await fetch(`${API_URL}/api/admin/settings`, { headers });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.success && data.settings) {
            console.log("Settings cargados:", data.settings);
            currentSettings = data.settings;
            applySiteSettings();
            return true;
        } else {
            throw new Error(data.message || "Respuesta inválida al cargar settings.");
        }
    } catch (error) {
        console.error("Error loadSiteSettings:", error);
        currentSettings = {};
        applySiteSettings();
        return false;
    }
}

async function loadAdminProducts() {
    if (!adminProductsTableContainer) {
        console.error("Error: Contenedor tabla admin no encontrado.");
        return;
    }
    adminProductsTableContainer.innerHTML = '<p class="p-4 text-gray-500 text-center">Cargando productos (admin)...</p>';
    hideMessages(adminProductsMessageDiv);
    console.log("Cargando productos para admin...");
    try {
        const headers = { 'x-admin-simulated': 'true' };
        const response = await fetch(`${API_URL}/api/admin/products`, { headers });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
            throw new Error(errData.message || `Error ${response.status}`);
        }
        const products = await response.json();
        console.log(`Productos admin cargados: ${products?.length || 0}`);
        renderAdminProductTable(products);
    } catch (error) {
        console.error("Error loadAdminProducts:", error);
        showMessage(adminProductsMessageDiv, `Error carga admin: ${error.message}`, true);
        adminProductsTableContainer.innerHTML = '<p class="p-4 text-red-600 text-center">No se pudieron cargar los productos.</p>';
    }
}

async function loadCategoriesIntoSelect() {
    if (!adminCategorySelect) return;
    if (adminCategorySelect.options.length > 1 && !adminCategorySelect.querySelector('option[value="error"]')) {
        return;
    }
    console.log("Cargando categorías en select admin...");
    try {
        const response = await fetch(`${API_URL}/api/categories`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const categories = await response.json();
        adminCategorySelect.innerHTML = '<option value="">-- Selecciona Categoría --</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.ID_Categoria;
            option.textContent = cat.Nombre;
            adminCategorySelect.appendChild(option);
        });
        console.log("Categorías cargadas en select.");
    } catch (error) {
        console.error("Error loadCategoriesIntoSelect:", error);
        showMessage(adminProductFormMessageDiv, 'Error: No se pudieron cargar las categorías.', true);
        adminCategorySelect.innerHTML = '<option value="error">Error al cargar categorías</option>';
    }
}

// --- ADMIN PRODUCT STATS ---
async function loadAndRenderProductViews() {
    if (!adminProductViewsContainer) return;
    adminProductViewsContainer.innerHTML = '<p class="p-4 text-center text-gray-500">Cargando estadísticas de vistas...</p>';
    hideMessages(adminProductViewsMessageDiv);
    try {
        const response = await fetch(`${API_URL}/api/admin/analytics/product-views`, {
            headers: { 'x-admin-simulated': 'true' }
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Error ${response.status}`);
        }
        const viewsData = await response.json();
        if (!viewsData || viewsData.length === 0) {
            adminProductViewsContainer.innerHTML = '<p class="p-4 text-center text-gray-500">No hay datos de vistas de productos disponibles.</p>';
            return;
        }
        let tableHTML = `<table class="admin-table">
            <thead><tr><th>Producto</th><th>Total Vistas</th></tr></thead>
            <tbody>`;
        viewsData.forEach(view => {
            tableHTML += `<tr>
                <td>${view.Nombre || 'N/A'}</td>
                <td>${view.total_vistas}</td>
            </tr>`;
        });
        tableHTML += `</tbody></table>`;
        adminProductViewsContainer.innerHTML = tableHTML;
    } catch (error) {
        console.error("Error cargando vistas de productos para admin:", error);
        showMessage(adminProductViewsMessageDiv, `Error al cargar estadísticas: ${error.message}`, true);
        adminProductViewsContainer.innerHTML = '<p class="p-4 text-center text-red-600">Error al cargar datos.</p>';
    }
}

// --- ADMIN ORDER MANAGEMENT ---
async function loadAndRenderAdminOrders() {
    if (!adminOrdersListContainer) return;
    adminOrdersListContainer.innerHTML = '<p class="p-4 text-center text-gray-500">Cargando pedidos...</p>';
    if (adminOrderDetailContainer) adminOrderDetailContainer.style.display = 'none';
    if (adminOrderDetailContainer) adminOrderDetailContainer.innerHTML = '';
    hideMessages(adminOrdersMessageDiv);
    try {
        const response = await fetch(`${API_URL}/api/admin/orders`, {
            headers: { 'x-admin-simulated': 'true' }
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const orders = await response.json();
        if (orders.length === 0) {
            adminOrdersListContainer.innerHTML = '<p class="p-4 text-center text-gray-500">No hay pedidos registrados.</p>';
            return;
        }
        let tableHTML = `<table class="admin-table">
            <thead><tr>
                <th>ID Pedido</th><th>Fecha</th><th>Cliente</th><th>Total</th>
                <th>Método Pago</th><th>Referencia Pago</th><th>Estado</th><th>Acciones</th>
            </tr></thead><tbody>`;
        orders.forEach(order => {
            tableHTML += `<tr>
                <td>${order.ID_Pedido}</td>
                <td>${new Date(order.Fecha_Pedido).toLocaleDateString()}</td>
                <td>${order.Cliente_Nombre || 'N/A'} (${order.Cliente_Email || 'N/A'})</td>
                <td>${formatCOP(order.Total_Pedido)}</td>
                <td>${order.Metodo_Pago || 'N/A'}</td>
                <td>${order.Referencia_Pago || '-'}</td>
                <td>${order.Estado_Pedido}</td>
                <td><button class="admin-action-button view-order-btn btn-primary" data-order-id="${order.ID_Pedido}">Ver</button></td>
            </tr>`;
        });
        tableHTML += `</tbody></table>`;
        adminOrdersListContainer.innerHTML = tableHTML;
        adminOrdersListContainer.querySelectorAll('.view-order-btn').forEach(btn => {
            btn.addEventListener('click', (e) => loadAndRenderOrderDetail(e.target.dataset.orderId));
        });
    } catch (error) {
        console.error("Error cargando pedidos para admin:", error);
        showMessage(adminOrdersMessageDiv, `Error al cargar pedidos: ${error.message}`, true);
        adminOrdersListContainer.innerHTML = '<p class="p-4 text-center text-red-600">Error al cargar pedidos.</p>';
    }
}

async function loadAndRenderOrderDetail(orderId) {
    if (!adminOrderDetailContainer) return;
    adminOrderDetailContainer.innerHTML = '<p class="p-4 text-center text-gray-500">Cargando detalles del pedido...</p>';
    adminOrderDetailContainer.style.display = 'block';
    hideMessages(adminOrdersMessageDiv);
    try {
        const response = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
            headers: { 'x-admin-simulated': 'true' }
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const order = await response.json();
        let detailHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-2xl font-semibold">Detalle Pedido #${order.ID_Pedido}</h3>
                <button id="close-order-detail-btn" class="btn btn-sm btn-gray">Cerrar Detalle</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <p><strong>Fecha:</strong> ${new Date(order.Fecha_Pedido).toLocaleString()}</p>
                    <p><strong>Cliente (Registrado):</strong> ${order.ID_Usuario ? `${order.Cliente_Nombre} (ID: ${order.ID_Usuario})` : 'No registrado'}</p>
                    <p><strong>Email (Registrado):</strong> ${order.ID_Usuario ? order.Cliente_Email : 'N/A'}</p>
                    <p><strong>Total:</strong> ${formatCOP(order.Total_Pedido)}</p>
                    <p><strong>Método de Pago:</strong> ${order.Metodo_Pago || 'N/A'}</p>
                    <p><strong>Referencia Pago:</strong> ${order.Referencia_Pago || '-'}</p>
                </div>
                <div>
                    <h5 class="font-semibold text-gray-700">Información de Envío:</h5>
                    <p><strong>Nombre:</strong> ${order.Nombre_Cliente_Envio || 'N/A'}</p>
                    <p><strong>Email:</strong> ${order.Email_Cliente_Envio || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> ${order.Telefono_Cliente_Envio || 'N/A'}</p>
                    <p><strong>Departamento:</strong> ${order.Departamento_Envio || 'N/A'}</p>
                    <p><strong>Ciudad:</strong> ${order.Ciudad_Envio || 'N/A'}</p>
                    <p><strong>Dirección:</strong> ${order.Direccion_Envio || 'N/A'}</p>
                    <p><strong>Referencia:</strong> ${order.Punto_Referencia_Envio || 'Ninguno'}</p>
                </div>
            </div>
            <div class="mt-2">
                <strong>Estado Actual:</strong> <span id="current-order-status">${order.Estado_Pedido}</span>
                <select id="update-order-status-select" class="ml-2 border rounded p-1">
                    <option value="Pendiente de Pago" ${order.Estado_Pedido === 'Pendiente de Pago' ? 'selected' : ''}>Pendiente de Pago</option>
                    <option value="Pagado" ${order.Estado_Pedido === 'Pagado' ? 'selected' : ''}>Pagado</option>
                    <option value="Procesando" ${order.Estado_Pedido === 'Procesando' ? 'selected' : ''}>Procesando</option>
                    <option value="Enviado" ${order.Estado_Pedido === 'Enviado' ? 'selected' : ''}>Enviado</option>
                    <option value="Entregado" ${order.Estado_Pedido === 'Entregado' ? 'selected' : ''}>Entregado</option>
                    <option value="Cancelado" ${order.Estado_Pedido === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                    <option value="Pendiente de Confirmacion" ${order.Estado_Pedido === 'Pendiente de Confirmacion' ? 'selected' : ''}>Pendiente de Confirmacion (ContraEntrega)</option>
                </select>
                <button id="update-order-status-btn" data-order-id="${order.ID_Pedido}" class="btn btn-sm btn-primary ml-2">Actualizar Estado</button>
            </div>
            <h4 class="text-xl font-semibold mt-6 mb-2">Productos:</h4>
            <div class="space-y-2">`;
        order.detalles.forEach(item => {
            detailHTML += `
                <div class="flex items-center p-2 border rounded">
                    <img src="${item.Imagen_Producto || `https://placehold.co/50x50/e5e7eb/4b5563?text=NI`}" alt="${item.Nombre_Producto}" class="w-12 h-12 object-contain mr-3">
                    <div>
                        <p>${item.Nombre_Producto}</p>
                        <p>Cantidad: ${item.Cantidad} x ${formatCOP(item.Precio_Unitario_Compra)}</p>
                    </div>
                </div>`;
        });
        detailHTML += `</div>`;
        adminOrderDetailContainer.innerHTML = detailHTML;
        document.getElementById('close-order-detail-btn').addEventListener('click', () => {
            adminOrderDetailContainer.style.display = 'none';
            adminOrderDetailContainer.innerHTML = '';
        });
        document.getElementById('update-order-status-btn').addEventListener('click', async (e) => {
            const newStatus = document.getElementById('update-order-status-select').value;
            await updateOrderStatus(e.target.dataset.orderId, newStatus);
        });
    } catch (error) {
        console.error(`Error cargando detalle del pedido ${orderId}:`, error);
        showMessage(adminOrdersMessageDiv, `Error al cargar detalle: ${error.message}`, true);
        adminOrderDetailContainer.innerHTML = '<p class="p-4 text-center text-red-600">Error al cargar detalle del pedido.</p>';
    }
}

async function updateOrderStatus(orderId, newStatus) {
    const btn = document.getElementById('update-order-status-btn');
    if (btn) btn.disabled = true;
    try {
        const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-admin-simulated': 'true' },
            body: JSON.stringify({ nuevoEstado: newStatus })
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || `Error ${response.status}`);
        }
        showMessage(adminOrdersMessageDiv, 'Estado del pedido actualizado con éxito.', false);
        const currentStatusEl = document.getElementById('current-order-status');
        if (currentStatusEl) currentStatusEl.textContent = newStatus;
        checkNewOrders();
    } catch (error) {
        console.error(`Error actualizando estado del pedido ${orderId}:`, error);
        showMessage(adminOrdersMessageDiv, `Error al actualizar estado: ${error.message}`, true);
    } finally {
        if (btn) btn.disabled = false;
    }
}

// --- ADMIN ANALYTICS ---
async function loadAndRenderAnalytics() {
    hideMessages(adminAnalyticsMessageDiv);
    if (dailySalesChartInstance) dailySalesChartInstance.destroy();
    if (topProductsChartInstance) topProductsChartInstance.destroy();
    try {
        const response = await fetch(`${API_URL}/api/admin/analytics/sales-overview`, {
            headers: { 'x-admin-simulated': 'true' }
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const data = await response.json();
        const dailySalesCtx = document.getElementById('dailySalesChart')?.getContext('2d');
        if (dailySalesCtx && data.dailySales) {
            dailySalesChartInstance = new Chart(dailySalesCtx, {
                type: 'line',
                data: {
                    labels: data.dailySales.map(d => d.dia),
                    datasets: [{ label: 'Ventas Totales', data: data.dailySales.map(d => d.total_ventas), borderColor: 'var(--color-primary)', tension: 0.1 }]
                }
            });
        }
        const topProductsCtx = document.getElementById('topProductsChart')?.getContext('2d');
        if (topProductsCtx && data.topProducts) {
            topProductsChartInstance = new Chart(topProductsCtx, {
                type: 'bar',
                data: {
                    labels: data.topProducts.map(p => p.Nombre),
                    datasets: [{ label: 'Unidades Vendidas', data: data.topProducts.map(p => p.total_vendido), backgroundColor: 'var(--color-secondary)' }]
                },
                options: { indexAxis: 'y' }
            });
        }
    } catch (error) {
        console.error("Error cargando analíticas:", error);
        showMessage(adminAnalyticsMessageDiv, `Error al cargar analíticas: ${error.message}`, true);
    }
}

// --- ADMIN CUSTOMERS ---
async function loadAndRenderAdminCustomers() {
    if (!adminCustomersListContainer) return;
    adminCustomersListContainer.innerHTML = '<p class="p-4 text-center text-gray-500">Cargando clientes...</p>';
    hideMessages(adminCustomersMessageDiv);
    try {
        const response = await fetch(`${API_URL}/api/admin/users`, {
            headers: { 'x-admin-simulated': 'true' }
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const customers = await response.json();
        if (customers.length === 0) {
            adminCustomersListContainer.innerHTML = '<p class="p-4 text-center text-gray-500">No hay clientes registrados.</p>';
            return;
        }
        let tableHTML = `<table class="admin-table">
            <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Rol</th></tr></thead><tbody>`;
        customers.forEach(cust => {
            tableHTML += `<tr><td>${cust.id}</td><td>${cust.username}</td><td>${cust.email}</td><td>${cust.role}</td></tr>`;
        });
        tableHTML += `</tbody></table>`;
        adminCustomersListContainer.innerHTML = tableHTML;
    } catch (error) {
        console.error("Error cargando clientes:", error);
        showMessage(adminCustomersMessageDiv, `Error al cargar clientes: ${error.message}`, true);
        adminCustomersListContainer.innerHTML = '<p class="p-4 text-center text-red-600">Error al cargar clientes.</p>';
    }
}

// --- ADMIN ORDER NOTIFICATION POLLING ---
let lastPendingOrderCount = 0;
let orderCheckInterval = null;

function updateAdminOrderBadges(count) {
    const badges = [adminOrdersBadgeDesktop, adminOrdersBadgeMobile, adminOrdersBadgeSidebar];
    badges.forEach(badge => {
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    });
}

async function checkNewOrders() {
    if (!localStorage.getItem("userLoggedIn") || localStorage.getItem("userRole") !== 'admin') {
        updateAdminOrderBadges(0);
        return;
    }
    try {
        const response = await fetch(`${API_URL}/api/admin/orders/pending-count`, {
            headers: { 'x-admin-simulated': 'true' }
        });
        if (!response.ok) {
            console.warn("No se pudo obtener el conteo de pedidos pendientes.");
            return;
        }
        const data = await response.json();
        const pendingCount = data.pendingCount || 0;
        updateAdminOrderBadges(pendingCount);
        if (pendingCount > 0 && pendingCount > lastPendingOrderCount) {
            console.log(`¡Tienes ${pendingCount} nuevos pedidos pendientes!`);
        }
        lastPendingOrderCount = pendingCount;
    } catch (error) {
        console.error("Error verificando nuevos pedidos:", error);
    }
}

// --- FUNCIONES DE NAVEGACIÓN Y UI ---
async function showPageSection(sectionId, detailId = null) {
    console.log(`Nav -> ${sectionId}${detailId ? ` (${detailId})` : ''}`);
    hideMessages();
    const publicSections = ['home', 'products', 'contact', 'policies', 'cart', 'faq', 'purchase-history'];
    const adminSubSections = ['admin-dashboard', 'admin-products', 'admin-personalize', 'admin-orders', 'admin-product-stats', 'admin-analytics', 'admin-customers', 'admin-messages', 'admin-settings']; // Agregado admin-messages, admin-settings
    let needsPublicProducts = ['home', 'products', 'cart'].includes(sectionId) || (sectionId === 'products' && detailId);

    const allPageSections = document.querySelectorAll('#page-content > div[id$="-section"], #page-content > section[id$="-section"]');
    allPageSections.forEach(sec => { if (sec) sec.style.display = 'none'; });

    if (adminSectionContainer) adminSectionContainer.style.display = "none";
    if (adminDashboardWrapper) adminDashboardWrapper.style.display = "none";
    if (adminProductsSection) adminProductsSection.style.display = "none";
    if (adminPersonalizeSection) adminPersonalizeSection.style.display = "none";
    if (adminOrdersSection) adminOrdersSection.style.display = "none";
    if (adminProductStatsSection) adminProductStatsSection.style.display = "none";
    if (adminAnalyticsSection) adminAnalyticsSection.style.display = "none";
    if (adminCustomersSection) adminCustomersSection.style.display = "none";
    // Aquí faltarían los contenedores para admin-messages y admin-settings si los tuvieras definidos en el HTML.
    // Por ahora, asumimos que admin-personalize cubre "settings" y no hay sección "admin-messages".

    let productsOK = true;
    if (needsPublicProducts && !productsLoaded) {
        console.log(`Cargando productos públicos para ${sectionId}...`);
        productsOK = await loadAndStorePublicProducts();
    }
    if ((sectionId === 'admin-personalize' || sectionId === 'contact') && (!currentSettings || Object.keys(currentSettings).length === 0)) {
        console.log(`Cargando settings para ${sectionId}...`);
        await loadSiteSettings();
    }

    if (adminSubSections.includes(sectionId)) {
        if (adminSectionContainer) adminSectionContainer.style.display = "block";
        if (sectionId === 'admin-dashboard' && adminDashboardWrapper) {
            adminDashboardWrapper.style.display = 'flex'; // O 'block' según tu layout
             // Aquí podrías cargar datos para el dashboard si es necesario, ej. kpis_dashboard();
        } else if (sectionId === 'admin-products' && adminProductsSection) {
            adminProductsSection.style.display = 'block'; await loadAdminProducts(); showAdminProductList();
        } else if ((sectionId === 'admin-personalize' || sectionId === 'admin-settings') && adminPersonalizeSection) { // admin-settings usa la misma sección
            adminPersonalizeSection.style.display = 'block'; populatePersonalizeForm();
        } else if (sectionId === 'admin-orders' && adminOrdersSection) {
            adminOrdersSection.style.display = 'block'; await loadAndRenderAdminOrders(); checkNewOrders();
        } else if (sectionId === 'admin-product-stats' && adminProductStatsSection) {
            adminProductStatsSection.style.display = 'block'; await loadAndRenderProductViews();
        } else if (sectionId === 'admin-analytics' && adminAnalyticsSection) {
            adminAnalyticsSection.style.display = 'block'; await loadAndRenderAnalytics();
        } else if (sectionId === 'admin-customers' && adminCustomersSection) {
            adminCustomersSection.style.display = 'block'; await loadAndRenderAdminCustomers();
        } else if (sectionId === 'admin-messages') {
            // Lógica para mostrar sección de mensajes admin (necesitarías un contenedor HTML)
            console.warn("Sección admin-messages no implementada en el frontend (HTML).");
            // const adminMessagesSection = document.getElementById('admin-messages-section');
            // if(adminMessagesSection) adminMessagesSection.style.display = 'block';
            // await loadAdminContactMessages(); // Necesitarías esta función
        } else if (sectionId !== 'admin-dashboard' && sectionId !== 'admin-settings') { // Si no es dashboard ni settings (personalize)
            const specificAdminSection = document.getElementById(`${sectionId}-section`);
            if (specificAdminSection) specificAdminSection.style.display = 'block';
            else console.warn(`Contenedor para la subsección admin "${sectionId}" no encontrado.`);
        }
    } else if (publicSections.includes(sectionId)) {
        if (adminSectionContainer) adminSectionContainer.style.display = "none";
        const sectionToShow = document.getElementById(`${sectionId}-section`);
        if (sectionToShow) {
            sectionToShow.style.display = "block";
            console.log(`Public section shown: ${sectionId}`);
            if (productsOK || !needsPublicProducts) {
                switch (sectionId) {
                    case "home": renderFeaturedProducts(featuredProductsContainer); renderCategories(); applyTextSettings(currentSettings); break;
                    case "products":
                        if (detailId) { renderProductDetail(productsDisplayArea, detailId); }
                        else { productsDisplayArea.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"; renderProductGrid(productsDisplayArea); }
                        break;
                    case "cart": renderCartPage(); break;
                    case "contact": applyContactInfo(currentSettings); break;
                    case "purchase-history": showPurchaseHistoryPage(); break; // Llama a la función específica
                }
            } else {
                console.error(`Error loading products for public section ${sectionId}.`);
                const errorMsg = '<p class="col-span-full text-red-600 p-4 text-center">Error al cargar datos necesarios.</p>';
                if (sectionId === 'products' && productsDisplayArea) productsDisplayArea.innerHTML = errorMsg;
                if (sectionId === 'home' && featuredProductsContainer) featuredProductsContainer.innerHTML = errorMsg;
                if (sectionId === 'cart' && cartItemsContainer) cartItemsContainer.innerHTML = errorMsg;
            }
        } else { console.warn(`Public section ${sectionId} not found.`); showPageSection('home'); }
    } else { console.warn(`Unknown section ${sectionId}. Defaulting to home.`); showPageSection('home'); }

    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add("hidden");
        if (mobileMenuButton) {
            mobileMenuButton.setAttribute("aria-expanded", "false");
            const openIcon = mobileMenuButton.querySelector("svg.block");
            const closeIcon = mobileMenuButton.querySelector("svg.hidden");
            if (openIcon) openIcon.classList.remove("hidden");
            if (closeIcon) closeIcon.classList.add("hidden");
        }
    }
    if (adminMenuDesktopDropdown && !adminMenuDesktopDropdown.classList.contains('hidden')) {
        adminMenuDesktopDropdown.classList.add('hidden');
    }
    window.scrollTo(0, 0);
}

function updateUI(isLoggedIn) {
    console.log("Updating UI, LoggedIn:", isLoggedIn);
    const userRole = localStorage.getItem('userRole');
    const isAdmin = isLoggedIn && userRole === 'admin';
    if (isLoggedIn) {
        if (loginSection) loginSection.style.display = "none";
        if (registerSection) registerSection.style.display = "none";
        if (mainContent) mainContent.style.display = "block";
    } else {
        if (loginSection) loginSection.style.display = "block";
        if (registerSection) registerSection.style.display = "none";
        if (mainContent) mainContent.style.display = "none";
        console.log("UI: Clearing cart on logout.");
        localStorage.removeItem(CART_STORAGE_KEY);
        updateCartIcon();
    }
    if (adminMenuDesktopContainer) adminMenuDesktopContainer.style.display = isAdmin ? 'block' : 'none';
    if (adminMenuMobileContainer) adminMenuMobileContainer.style.display = isAdmin ? 'block' : 'none';
    if (isAdmin) {
        if (!orderCheckInterval) {
            checkNewOrders();
            orderCheckInterval = setInterval(checkNewOrders, 30000);
            console.log("Polling de pedidos iniciado para admin.");
        }
    } else {
        if (orderCheckInterval) {
            clearInterval(orderCheckInterval);
            orderCheckInterval = null;
            updateAdminOrderBadges(0);
            console.log("Polling de pedidos detenido.");
        }
    }
    updatePurchaseHistoryMenuVisibility();
    console.log("UI Updated.");
}

async function handleCheckout() {
    console.log(">>> [Checkout Wompi COP] Iniciando...");
    let generalPaymentMessageContainer = document.getElementById('payment-result-message') || cartMessageDiv;
    if (!configLoaded) {
        showMessage(generalPaymentMessageContainer, 'Error: Configuración de pago no cargada.', true);
        console.error("Checkout Wompi Error: Configuración no cargada.");
        return;
    }
    if (!wompiPublicKey || !frontendBaseUrl) {
        showMessage(generalPaymentMessageContainer, 'Error: Falta configuración de pago.', true);
        console.error("Checkout Wompi Error: Falta wompiPublicKey o frontendBaseUrl.");
        return;
    }
    const cart = getCart();
    if (cart.length === 0) {
        showMessage(cartMessageDiv, 'Tu carrito está vacío. Añade productos antes de proceder al pago.', true);
        return;
    }
    const { total } = calculateCartTotals();
    console.log(`[Checkout Wompi COP] Total calculado (debe ser COP): ${total}`);
    const reference = `ferremax_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const currency = 'COP';
    const totalInCents = Math.round(total * 100);
    const redirectUrl = `${frontendBaseUrl}/payment-status.html`;
    const wompiCheckoutBtn = document.getElementById('wompi-checkout-btn');
    showMessage(generalPaymentMessageContainer, 'Preparando checkout seguro con Wompi...', false);
    if (wompiCheckoutBtn) {
        wompiCheckoutBtn.disabled = true;
        wompiCheckoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Redirigiendo...';
    }
    try {
        const cartDataForBackend = cart.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.price }));
        console.log(">>> [Checkout Wompi COP] Enviando datos temporales a POST /api/wompi/temp-order");
        const tempResponse = await fetch(`${API_URL}/api/wompi/temp-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: reference, items: cartDataForBackend, total: total })
        });
        const tempData = await tempResponse.json();
        if (!tempResponse.ok || !tempData.success) {
            throw new Error(tempData.message || 'Error guardando orden temporal en backend.');
        }
        console.log(">>> [Checkout Wompi COP] Orden temporal guardada en backend para referencia:", reference);
        const checkout = new WidgetCheckout({ currency: currency, amountInCents: totalInCents, reference: reference, publicKey: wompiPublicKey, redirectUrl: redirectUrl });
        checkout.open(function (result) {
            console.log(">>> [Checkout Wompi COP] Widget cerrado o redirigido. Resultado:", result);
            if (wompiCheckoutBtn) {
                wompiCheckoutBtn.disabled = false;
                wompiCheckoutBtn.innerHTML = 'Pagar con Wompi (Tarjeta, PSE, etc.)';
                hideMessages(generalPaymentMessageContainer);
            }
            if (result.transaction && result.transaction.status === 'APPROVED') {
                showMessage(cartMessageDiv || generalPaymentMessageContainer, "¡Pago con Wompi procesado! Estamos confirmando tu pedido.", false);
                saveCart([]);
                renderCartPage();
                updateCartIcon();
            } else if (result.transaction) {
                showMessage(generalPaymentMessageContainer, `Estado de la transacción Wompi: ${result.transaction.status}. ${result.transaction.status_message || ''}`, true);
            }
        });
    } catch (error) {
        console.error(">>> [Checkout Wompi COP] Error:", error);
        showMessage(generalPaymentMessageContainer, `Error: ${error.message}. Intenta de nuevo.`, true);
        if (wompiCheckoutBtn) {
            wompiCheckoutBtn.disabled = false;
            wompiCheckoutBtn.innerHTML = 'Pagar con Wompi (Tarjeta, PSE, etc.)';
        }
    }
}

async function loadFrontendConfig() {
    console.log(">>> Cargando configuración del frontend desde el backend...");
    try {
        const response = await fetch(`${API_URL}/api/config`);
        if (!response.ok) {
            throw new Error(`Error ${response.status} al cargar configuración.`);
        }
        const configData = await response.json();
        if (configData.success && configData.wompiPublicKey && configData.frontendBaseUrl) {
            wompiPublicKey = configData.wompiPublicKey;
            frontendBaseUrl = configData.frontendBaseUrl;
            configLoaded = true;
            console.log(">>> Configuración cargada:", { wompiPublicKey: `pub...${wompiPublicKey.slice(-6)}`, frontendBaseUrl });
        } else {
            throw new Error(configData.message || "Respuesta de configuración inválida.");
        }
    } catch (error) {
        console.error("!!! ERROR CRÍTICO AL CARGAR CONFIGURACIÓN FRONTEND:", error);
        if (pageContent) {
            const configErrorDiv = document.createElement('div');
            configErrorDiv.className = 'message message-error p-4 text-center font-bold';
            configErrorDiv.textContent = 'Error crítico: No se pudo cargar la configuración de pago desde el servidor. El pago no funcionará.';
            configErrorDiv.style.display = 'block';
            pageContent.prepend(configErrorDiv);
        }
        configLoaded = false;
    }
}

// --- FUNCIONES DE ADMINISTRACIÓN ---
function renderAdminProductTable(products) {
    if (!adminProductsTableContainer) return;
    if (!products || products.length === 0) {
        adminProductsTableContainer.innerHTML = '<p class="p-4 text-gray-500 text-center">No hay productos registrados.</p>';
        return;
    }
    let tableHTML = `<table class="admin-table"><thead><tr><th>ID</th><th>Img</th><th>Nombre</th><th>Precio</th><th>Cant</th><th>Acciones</th></tr></thead><tbody>`;
    products.forEach(p => {
        const price = formatCOP(p.precio_unitario);
        const quantity = typeof p.cantidad === 'number' ? p.cantidad : 'N/A';
        const imageUrl = p.imagen_url || `https://placehold.co/50x50/e2e8f0/64748b?text=NI`;
        const imageError = `this.onerror=null;this.src='https://placehold.co/50x49/fecaca/b91c1c?text=E';`;
        tableHTML += `
            <tr>
                <td>${p.ID_Producto}</td>
                <td><img src="${imageUrl}" alt="${p.Nombre || ''}" class="product-thumbnail" onerror="${imageError}"></td>
                <td class="whitespace-nowrap">${p.Nombre || '-'}</td>
                <td>${price}</td>
                <td>${quantity}</td>
                <td class="whitespace-nowrap">
                    <button class="admin-action-button edit-button" data-product-id="${p.ID_Producto}" title="Editar"><i class="fas fa-edit pointer-events-none"></i></button>
                    <button class="admin-action-button delete-button" data-product-id="${p.ID_Producto}" title="Eliminar"><i class="fas fa-trash-alt pointer-events-none"></i></button>
                </td>
            </tr>`;
    });
    tableHTML += '</tbody></table>';
    adminProductsTableContainer.innerHTML = tableHTML;
    adminProductsTableContainer.querySelectorAll('.edit-button').forEach(button => button.addEventListener('click', (e) => handleEditProduct(e.currentTarget.dataset.productId)));
    adminProductsTableContainer.querySelectorAll('.delete-button').forEach(button => button.addEventListener('click', (e) => handleDeleteProduct(e.currentTarget.dataset.productId)));
    console.log("Admin product table rendered.");
}

function showAdminProductForm(product = null) {
    if (!adminProductFormContainer || !adminProductListContainer) {
        console.error("Admin form/list containers missing."); return;
    }
    adminProductListContainer.style.display = 'none';
    adminProductFormContainer.style.display = 'block';
    hideMessages(adminProductFormMessageDiv);
    loadCategoriesIntoSelect();
    if (product) {
        if (adminFormTitle) adminFormTitle.textContent = 'Editar Producto';
        if (adminSaveButton) adminSaveButton.textContent = 'Actualizar';
        if (adminProductIdInput) adminProductIdInput.value = product.ID_Producto;
        if (document.getElementById('admin-product-name')) document.getElementById('admin-product-name').value = product.Nombre || "";
        if (document.getElementById('admin-product-brand')) document.getElementById('admin-product-brand').value = product.Marca || "";
        if (document.getElementById('admin-product-price')) document.getElementById('admin-product-price').value = product.precio_unitario ?? "";
        if (document.getElementById('admin-product-quantity')) document.getElementById('admin-product-quantity').value = product.cantidad ?? "";
        if (document.getElementById('admin-product-description')) document.getElementById('admin-product-description').value = product.Descripcion || "";
        if (document.getElementById('admin-product-category')) document.getElementById('admin-product-category').value = product.ID_Categoria || "";
        if (document.getElementById('admin-product-barcode')) document.getElementById('admin-product-barcode').value = product.Codigo_Barras || "";
        if (document.getElementById('admin-product-image-url')) document.getElementById('admin-product-image-url').value = product.imagen_url || "";
        if (document.getElementById('admin-product-image-url-2')) document.getElementById('admin-product-image-url-2').value = product.imagen_url_2 || "";
        if (document.getElementById('admin-product-image-url-3')) document.getElementById('admin-product-image-url-3').value = product.imagen_url_3 || "";
        if (document.getElementById('admin-product-image-url-4')) document.getElementById('admin-product-image-url-4').value = product.imagen_url_4 || "";
        if (document.getElementById('admin-product-image-url-5')) document.getElementById('admin-product-image-url-5').value = product.imagen_url_5 || "";
        console.log("Admin form populated for edit ID:", product.ID_Producto);
    } else {
        if (adminFormTitle) adminFormTitle.textContent = 'Añadir Nuevo Producto';
        if (adminSaveButton) adminSaveButton.textContent = 'Guardar';
        if (adminProductForm) adminProductForm.reset();
        if (adminProductIdInput) adminProductIdInput.value = "";
        console.log("Admin form cleared for add.");
    }
}

async function handleEditProduct(productId) {
    console.log(`Requesting data for edit ID: ${productId}`);
    hideMessages(adminProductsMessageDiv);
    try {
        const headers = { 'x-admin-simulated': 'true' };
        const response = await fetch(`${API_URL}/api/admin/products/${productId}`, { headers });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Error ${response.status}`);
        }
        const product = await response.json();
        if (!product) throw new Error("Product data not found in response.");
        showAdminProductForm(product);
    } catch (error) {
        console.error("Error loading data for edit:", error);
        showMessage(adminProductsMessageDiv, `Error cargando datos para editar: ${error.message}`, true);
    }
}

function showAdminProductList() {
    if (adminProductFormContainer && adminProductListContainer) {
        adminProductFormContainer.style.display = 'none';
        adminProductListContainer.style.display = 'block';
        hideMessages(adminProductFormMessageDiv);
    }
}

async function handleDeleteProduct(productId) {
    if (!confirm(`¿Estás seguro de eliminar el producto con ID ${productId}? Esta acción no se puede deshacer.`)) {
        return;
    }
    hideMessages(adminProductsMessageDiv);
    console.log(`Attempting delete ID: ${productId}`);
    try {
        const headers = { 'x-admin-simulated': 'true' };
        const response = await fetch(`${API_URL}/api/admin/products/${productId}`, { method: 'DELETE', headers });
        const result = await response.json().catch(() => ({ message: "Respuesta no JSON" }));
        console.log(`DELETE Response (${response.status}):`, result);
        if (response.ok && result.success) {
            showMessage(adminProductsMessageDiv, '¡Producto eliminado exitosamente!', false);
            await loadAdminProducts();
            productsLoaded = false;
        } else {
            throw new Error(result.message || `Error ${response.status}`);
        }
    } catch (error) {
        console.error(`Error deleting ${productId}:`, error);
        showMessage(adminProductsMessageDiv, `Error al eliminar: ${error.message}`, true);
    }
}

function applySiteSettings() {
    console.log("Applying site settings...");
    applyColorSettings(currentSettings);
    applyTextSettings(currentSettings);
    applyContactInfo(currentSettings);
    if (adminPersonalizeSection && adminPersonalizeSection.style.display === 'block') {
        populatePersonalizeForm();
    }
}

function applyColorSettings(settings) {
    const root = document.documentElement;
    const primary = settings.colorPrimary || '#ea580c';
    const secondary = settings.colorSecondary || '#047857';
    const accent = settings.colorAccent || '#f1f5f9';
    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-primary-hover', darkenColor(primary, 15));
    root.style.setProperty('--color-primary-darker', darkenColor(primary, 25));
    root.style.setProperty('--color-secondary', secondary);
    root.style.setProperty('--color-secondary-hover', darkenColor(secondary, 10));
    root.style.setProperty('--color-secondary-darker', darkenColor(secondary, 20));
    root.style.setProperty('--color-accent', accent);
    root.style.setProperty('--color-price', secondary);
    console.log("Color settings applied.");
}

function applyTextSettings(settings) {
    if (mainWelcomeTitle) mainWelcomeTitle.textContent = settings.welcomeTitle || 'Bienvenido a Ferremax';
    if (mainPromoTitle) mainPromoTitle.textContent = settings.promoBannerTitle || '¡Ofertas Imperdibles!';
    if (mainPromoText) mainPromoText.textContent = settings.promoBannerText || 'Encuentra descuentos especiales en una amplia gama de herramientas y materiales de construcción.';
    console.log("Text settings applied.");
}

function applyContactInfo(settings) {
    if (contactAddressP) contactAddressP.textContent = settings.contactAddress || '[Dirección no disponible]';
    if (contactPhoneP) contactPhoneP.textContent = settings.contactPhone || '[Teléfono no disponible]';
    if (contactEmailP) contactEmailP.textContent = settings.contactEmail || '[Correo no disponible]';
    if (socialLinksContainer) {
        socialLinksContainer.innerHTML = '<h4 class="text-lg font-semibold text-gray-800 mb-4">Síguenos</h4>';
        let hasLinks = false;
        const socialPlatforms = [
            { key: 'socialFacebook', icon: 'fab fa-facebook-f', name: 'Facebook', color: 'bg-blue-600 hover:bg-blue-700' },
            { key: 'socialTwitter', icon: 'fab fa-twitter', name: 'Twitter', color: 'bg-sky-500 hover:bg-sky-600' },
            { key: 'socialInstagram', icon: 'fab fa-instagram', name: 'Instagram', color: 'bg-pink-600 hover:bg-pink-700' },
            { key: 'socialYoutube', icon: 'fab fa-youtube', name: 'YouTube', color: 'bg-red-600 hover:bg-red-700' }
        ];
        socialPlatforms.forEach(platform => {
            if (settings[platform.key]) {
                const link = document.createElement('a');
                link.href = settings[platform.key];
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.className = `inline-flex items-center justify-center w-10 h-10 rounded-full text-white transition duration-150 ease-in-out mr-2 last:mr-0 ${platform.color}`;
                link.innerHTML = `<i class="${platform.icon}"></i><span class="sr-only">${platform.name}</span>`;
                socialLinksContainer.appendChild(link);
                hasLinks = true;
            }
        });
        if (!hasLinks) {
            socialLinksContainer.innerHTML += '<p class="text-sm text-gray-500">[Redes sociales no configuradas]</p>';
        }
    }
    console.log("Contact/Social settings applied.");
}

function populatePersonalizeForm() {
    if (!currentSettings) return;
    if (colorPrimaryInput) colorPrimaryInput.value = currentSettings.colorPrimary || '#ea580c';
    if (colorSecondaryInput) colorSecondaryInput.value = currentSettings.colorSecondary || '#047857';
    if (colorAccentInput) colorAccentInput.value = currentSettings.colorAccent || '#f1f5f9';
    if (welcomeTitleInput) welcomeTitleInput.value = currentSettings.welcomeTitle || '';
    if (promoBannerTitleInput) promoBannerTitleInput.value = currentSettings.promoBannerTitle || '';
    if (promoBannerTextInput) promoBannerTextInput.value = currentSettings.promoBannerText || '';
    if (contactAddressInput) contactAddressInput.value = currentSettings.contactAddress || '';
    if (contactPhoneInput) contactPhoneInput.value = currentSettings.contactPhone || '';
    if (contactEmailInput) contactEmailInput.value = currentSettings.contactEmail || '';
    if (socialFacebookInput) socialFacebookInput.value = currentSettings.socialFacebook || '';
    if (socialTwitterInput) socialTwitterInput.value = currentSettings.socialTwitter || '';
    if (socialInstagramInput) socialInstagramInput.value = currentSettings.socialInstagram || '';
    if (socialYoutubeInput) socialYoutubeInput.value = currentSettings.socialYoutube || '';
    console.log("Personalize form populated with all settings.");
}

async function saveSiteSettings(settingsToSave, type = 'general') {
    hideMessages(adminPersonalizeMessageDiv);
    let button;
    if (type === 'colors') button = saveColorsButton;
    else if (type === 'texts') button = saveTextsButton;
    else if (type === 'contact') button = saveContactSocialButton;
    if (button) { button.disabled = true; button.textContent = 'Guardando...'; }
    console.log(`Saving ${type} settings:`, settingsToSave);
    try {
        const headers = { 'Content-Type': 'application/json', 'x-admin-simulated': 'true' };
        const response = await fetch(`${API_URL}/api/admin/settings`, { method: 'PUT', headers, body: JSON.stringify(settingsToSave) });
        const data = await response.json().catch(() => ({ message: "Respuesta no JSON" }));
        console.log(`Save Settings Response (${response.status}):`, data);
        if (response.ok && data.success) {
            console.log("Settings saved, updating local cache:", data.settings);
            currentSettings = { ...currentSettings, ...data.settings };
            applySiteSettings();
            showMessage(adminPersonalizeMessageDiv, '¡Configuración guardada exitosamente!', false);
        } else {
            throw new Error(data.message || `Error ${response.status}`);
        }
    } catch (error) {
        console.error("Error saving settings:", error);
        showMessage(adminPersonalizeMessageDiv, `Error al guardar: ${error.message}`, true);
    } finally {
        if (button) {
            button.disabled = false;
            if (type === 'colors') button.textContent = 'Guardar Colores';
            else if (type === 'texts') button.textContent = 'Guardar Textos';
            else if (type === 'contact') button.textContent = 'Guardar Contacto/Redes';
        }
    }
}

// --- MODAL DE IMAGEN ---
function openImageModal(imageUrl) {
    if (imageModal && modalImage) {
        modalImage.src = imageUrl;
        imageModal.style.display = "flex";
    }
}
function closeImageModal() {
    if (imageModal) {
        imageModal.style.display = "none";
        if (modalImage) modalImage.src = "";
    }
}
function closeImageModalOnClick(event) {
    if (event.target === imageModal) {
        closeImageModal();
    }
}

// --- MANEJADORES DE EVENTOS ---
function handleLogout() {
    localStorage.removeItem("userLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("ferremaxUser");
    updatePurchaseHistoryMenuVisibility();
    updateUI(false);
    console.log("User logged out.");
    showPageSection('login');
}

function handleCategoryClick(event) {
    const card = event.target.closest('.category-card');
    if (card) {
        const categoryId = card.getAttribute('data-category-id');
        console.log("Category click:", categoryId);
        showPageSection('products');
    }
}

function handleGridOrDetailClick(event) {
    const detailLink = event.target.closest(".product-detail-link");
    const addButton = event.target.closest(".add-to-cart-button");
    const imageClicked = event.target.matches(".product-detail-image");
    const thumbnailClicked = event.target.matches(".thumbnail-img");
    if (imageClicked || thumbnailClicked) { return; }
    else if (detailLink) {
        const productId = detailLink.dataset.productIdDetail;
        if (productId) {
            showPageSection("products", productId);
        }
    } else if (addButton) {
        const productId = addButton.dataset.productIdAdd;
        if (productId && !addButton.disabled) {
            addToCart(productId, 1, addButton);
        }
    }
}

// --- LÓGICA DE INICIALIZACIÓN DE LA APLICACIÓN ---
document.addEventListener("DOMContentLoaded", async () => {
    console.log(">>> DOM Cargado. Iniciando App Ferremax...");
    try {
        await loadFrontendConfig();
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
            localStorage.removeItem(CART_STORAGE_KEY);
        }

        const currentYearSpan = document.getElementById("current-year");
        if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

        const isLoggedIn = localStorage.getItem("userLoggedIn") === "true";
        console.log(">>> Estado Login Inicial:", isLoggedIn);
        console.log(">>> Cargando Settings del Sitio...");
        await loadSiteSettings();
        console.log(">>> Actualizando UI Base...");
        updateUI(isLoggedIn);
        console.log(">>> Actualizando Icono Carrito...");
        updateCartIcon();
        console.log(">>> Añadiendo Listeners...");

        if (loginForm) {
            loginForm.addEventListener("submit", async (event) => {
                event.preventDefault(); hideMessages(loginMessageDiv);
                const email = document.getElementById("login-email").value;
                const password = document.getElementById("login-password").value;
                const button = loginForm.querySelector('button[type="submit"]');
                if (!button) return; button.disabled = true; button.textContent = 'Ingresando...';
                try {
                    const response = await fetch(`${API_URL}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        localStorage.setItem("userLoggedIn", "true");
                        localStorage.setItem("userEmail", email);
                        localStorage.setItem("userRole", result.user?.role || 'cliente');
                        localStorage.setItem("ferremaxUser", JSON.stringify(result.user));
                        updatePurchaseHistoryMenuVisibility();
                        productsLoaded = false; await loadSiteSettings();
                        updateUI(true); await showPageSection("home");
                    } else { showMessage(loginMessageDiv, result.message || "Error en el login.", true); }
                } catch (error) { console.error("Error login fetch:", error); showMessage(loginMessageDiv, "No se pudo conectar con el servidor.", true);
                } finally { if (button) { button.disabled = false; button.textContent = 'Iniciar Sesión'; } }
            });
        }

        if (registerForm) {
            registerForm.addEventListener("submit", async (event) => {
                event.preventDefault(); hideMessages(registerMessageDiv);
                const username = document.getElementById("register-username").value;
                const email = document.getElementById("register-email").value;
                const password = document.getElementById("register-password").value;
                const button = registerForm.querySelector('button[type="submit"]');
                if (!button) return; if (password.length < 6) { showMessage(registerMessageDiv, "La contraseña debe tener al menos 6 caracteres.", true); return; }
                button.disabled = true; button.textContent = 'Registrando...';
                try {
                    const response = await fetch(`${API_URL}/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, email, password }) });
                    const result = await response.json();
                    if (response.ok && result.success) { showMessage(registerMessageDiv, "¡Registro exitoso! Ahora puedes iniciar sesión.", false);
                        setTimeout(() => { if (registerSection) registerSection.style.display = "none"; if (loginSection) loginSection.style.display = "block"; if (loginForm) loginForm.reset(); if (registerForm) registerForm.reset(); hideMessages(); }, 2500);
                    } else { showMessage(registerMessageDiv, result.message || "Error en el registro.", true); }
                } catch (error) { console.error("Error registro fetch:", error); showMessage(registerMessageDiv, "No se pudo conectar con el servidor.", true);
                } finally { if (button) { button.disabled = false; button.textContent = 'Registrarse'; } }
            });
        }
        
        if (contactForm) {
            contactForm.addEventListener("submit", async (event) => {
                event.preventDefault(); hideMessages(contactMessageResponseDiv);
                if (!contactSubmitButton) return; contactSubmitButton.disabled = true; contactSubmitButton.textContent = "Enviando...";
                const formData = new FormData(contactForm); const contactData = Object.fromEntries(formData.entries());
                if (!contactData.name || !contactData.email || !contactData.subject || !contactData.message) {
                    showMessage(contactMessageResponseDiv, "Por favor, completa todos los campos.", true); contactSubmitButton.disabled = false; contactSubmitButton.textContent = "Enviar Mensaje"; return;
                }
                try {
                    const response = await fetch(`${API_URL}/api/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(contactData) });
                    const result = await response.json();
                    if (response.ok && result.success) { showMessage(contactMessageResponseDiv, "¡Mensaje recibido! Gracias por contactarnos.", false); contactForm.reset();
                    } else { showMessage(contactMessageResponseDiv, result.message || "Error al enviar el mensaje.", true); }
                } catch (error) { console.error("Error contacto fetch:", error); showMessage(contactMessageResponseDiv, "Error de conexión al enviar el mensaje.", true);
                } finally { if (contactSubmitButton) { contactSubmitButton.disabled = false; contactSubmitButton.textContent = "Enviar Mensaje"; } }
            });
        }

        if (logoutButton) logoutButton.addEventListener("click", handleLogout);
        if (logoutButtonMobile) logoutButtonMobile.addEventListener("click", handleLogout);
        const adminLogoutBtn = document.getElementById('admin-logout-btn'); // For dashboard logout
        if (adminLogoutBtn) adminLogoutBtn.addEventListener("click", handleLogout);


        if (showRegisterLink) showRegisterLink.addEventListener("click", (event) => { event.preventDefault(); if (loginSection) loginSection.style.display = "none"; if (registerSection) registerSection.style.display = "block"; hideMessages(); });
        if (showLoginLink) showLoginLink.addEventListener("click", (event) => { event.preventDefault(); if (registerSection) registerSection.style.display = "none"; if (loginSection) loginSection.style.display = "block"; hideMessages(); });

        navLinks.forEach(link => link.addEventListener("click", (event) => { const sectionId = link.getAttribute("data-section"); if (sectionId) { event.preventDefault(); showPageSection(sectionId); } }));
        
        const promoBtn = document.querySelector('.promo-banner .cta-button'); if (promoBtn) promoBtn.addEventListener('click', (e) => { const sectionId = promoBtn.getAttribute('data-section'); if (sectionId) { e.preventDefault(); showPageSection(sectionId); } });

        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener("click", () => { const isExpanded = mobileMenuButton.getAttribute("aria-expanded") === "true"; mobileMenuButton.setAttribute("aria-expanded", !isExpanded); mobileMenu.classList.toggle("hidden"); const openIcon = mobileMenuButton.querySelector("svg.block"); const closeIcon = mobileMenuButton.querySelector("svg.hidden"); if (openIcon) openIcon.classList.toggle("hidden"); if (closeIcon) closeIcon.classList.toggle("hidden"); });
        }
        
        if (adminMenuDesktopButton && adminMenuDesktopDropdown) {
            adminMenuDesktopButton.addEventListener('click', (e) => { e.stopPropagation(); adminMenuDesktopDropdown.classList.toggle('hidden'); });
            document.addEventListener('click', (e) => {
                if (adminMenuDesktopContainer && !adminMenuDesktopContainer.contains(e.target) && !adminMenuDesktopDropdown.classList.contains('hidden')) {
                    adminMenuDesktopDropdown.classList.add('hidden');
                }
            });
        }

        if (pageContent) pageContent.addEventListener('click', handleGridOrDetailClick);

        if (cartItemsContainer) {
            cartItemsContainer.addEventListener('change', (e) => { if (e.target.matches('.cart-item-qty-input')) { updateCartQuantity(e.target.dataset.productIdQty, e.target.value); } });
            cartItemsContainer.addEventListener('click', (e) => { const removeButton = e.target.closest('.cart-item-remove-button'); if (removeButton) { removeFromCart(removeButton.dataset.productIdRemove); } });
        }
        
        if (categoryGridContainer) categoryGridContainer.addEventListener('click', handleCategoryClick);

        if (addProductButton) addProductButton.addEventListener('click', () => showAdminProductForm());
        if (adminCancelButton) adminCancelButton.addEventListener('click', showAdminProductList);

        if (adminProductForm) {
            adminProductForm.addEventListener('submit', async (event) => {
                event.preventDefault(); hideMessages(adminProductFormMessageDiv);
                if (!adminSaveButton || !adminProductIdInput) return;
                adminSaveButton.disabled = true;
                const productId = adminProductIdInput.value;
                adminSaveButton.textContent = productId ? 'Actualizando...' : 'Guardando...';
                const formData = new FormData(adminProductForm); const productData = Object.fromEntries(formData.entries());
                console.log("[Admin Form] Data to submit:", productData);
                if (!productData.Nombre || productData.precio_unitario === '' || productData.cantidad === '' || !productData.Marca) {
                    showMessage(adminProductFormMessageDiv, 'Completa todos los campos requeridos (*).', true); adminSaveButton.disabled = false; adminSaveButton.textContent = productId ? 'Actualizar' : 'Guardar'; return;
                }
                try {
                    productData.precio_unitario = parseFloat(productData.precio_unitario);
                    productData.cantidad = parseInt(productData.cantidad, 10);
                    if (isNaN(productData.precio_unitario) || productData.precio_unitario < 0) throw new Error("Precio inválido");
                    if (isNaN(productData.cantidad) || productData.cantidad < 0) throw new Error("Cantidad inválida");
                    if (productData.ID_Categoria) {
                        productData.ID_Categoria = parseInt(productData.ID_Categoria, 10);
                        if (isNaN(productData.ID_Categoria)) delete productData.ID_Categoria;
                    } else { delete productData.ID_Categoria; }
                } catch (validationError) {
                    showMessage(adminProductFormMessageDiv, `Error en datos: ${validationError.message}`, true); adminSaveButton.disabled = false; adminSaveButton.textContent = productId ? 'Actualizar' : 'Guardar'; return;
                }
                Object.keys(productData).forEach(key => {
                    if (productData[key] === "" || productData[key] === null) {
                        if (!(key === 'precio_unitario' && productData[key] === 0) && !(key === 'cantidad' && productData[key] === 0)) {
                            delete productData[key];
                        }
                    }
                });
                delete productData.productId;
                const method = productId ? 'PUT' : 'POST';
                const url = productId ? `${API_URL}/api/admin/products/${productId}` : `${API_URL}/api/admin/products`;
                console.log(`[Admin Form] ${method} ${url}`, productData);
                try {
                    const headers = { 'Content-Type': 'application/json', 'x-admin-simulated': 'true' };
                    const response = await fetch(url, { method, headers, body: JSON.stringify(productData) });
                    const result = await response.json().catch(() => ({ message: "Respuesta no JSON" }));
                    console.log(`[Admin Form] Response (${response.status}):`, result);
                    if (response.ok && result.success) {
                        showMessage(adminProductsMessageDiv, productId ? '¡Producto actualizado!' : '¡Producto añadido!', false);
                        showAdminProductList();
                        await loadAdminProducts();
                        productsLoaded = false;
                    } else {
                        throw new Error(result.message || `Error ${response.status}`);
                    }
                } catch (fetchError) {
                    console.error(`[Admin Form] Error ${method}:`, fetchError);
                    showMessage(adminProductFormMessageDiv, `Error al guardar: ${fetchError.message}`, true);
                } finally {
                    if (adminSaveButton) { adminSaveButton.disabled = false; adminSaveButton.textContent = productId ? 'Actualizar' : 'Guardar'; }
                }
            });
        }
        
        if (saveColorsButton) saveColorsButton.addEventListener('click', () => { const data = { colorPrimary: colorPrimaryInput.value, colorSecondary: colorSecondaryInput.value, colorAccent: colorAccentInput.value }; saveSiteSettings(data, 'colors'); });
        if (saveTextsButton) saveTextsButton.addEventListener('click', () => { const data = { welcomeTitle: welcomeTitleInput.value.trim(), promoBannerTitle: promoBannerTitleInput.value.trim(), promoBannerText: promoBannerTextInput.value.trim() }; saveSiteSettings(data, 'texts'); });
        if (saveContactSocialButton) {
            saveContactSocialButton.addEventListener('click', () => {
                const data = {
                    contactAddress: contactAddressInput.value.trim(), contactPhone: contactPhoneInput.value.trim(), contactEmail: contactEmailInput.value.trim(),
                    socialFacebook: socialFacebookInput.value.trim(), socialTwitter: socialTwitterInput.value.trim(), socialInstagram: socialInstagramInput.value.trim(),
                    socialYoutube: socialYoutubeInput.value.trim()
                };
                Object.keys(data).forEach(key => { if (!data[key]) delete data[key]; });
                saveSiteSettings(data, 'contact');
            });
        }

        if (faqAccordion) {
            faqAccordion.addEventListener('click', (e) => {
                const question = e.target.closest('.faq-question');
                if (question) {
                    const item = question.parentElement;
                    item.classList.toggle('active');
                }
            });
        }

        // --- ENLACES SIDEBAR ADMIN DASHBOARD ---
        const adminSidebarLinks = document.querySelectorAll('#admin-dashboard-wrapper aside [data-section]');
        if (adminSidebarLinks.length) {
            adminSidebarLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const section = link.getAttribute('data-section');
                    if (section) {
                        showPageSection(section);
                    }
                });
            });
        }
        // El listener para adminDashboardLink (el link principal al dashboard) ya está definido globalmente al inicio.

        // --- AI ASSISTANT ---
        const aiAssistantToggle = document.getElementById('ai-assistant-toggle');
        const aiAssistantChatbox = document.getElementById('ai-assistant-chatbox');
        const aiAssistantClose = document.getElementById('ai-assistant-close');
        const aiAssistantMessages = document.getElementById('ai-assistant-messages');
        const aiAssistantInput = document.getElementById('ai-assistant-input');
        const aiAssistantSend = document.getElementById('ai-assistant-send');
        let conversationHistory = []; 

        if (aiAssistantToggle && aiAssistantChatbox && aiAssistantClose) {
            aiAssistantToggle.addEventListener('click', () => {
                aiAssistantChatbox.classList.toggle('hidden');
                if (!aiAssistantChatbox.classList.contains('hidden')) {
                    aiAssistantInput.focus();
                }
            });
            aiAssistantClose.addEventListener('click', () => {
                aiAssistantChatbox.classList.add('hidden');
            });
        }

        function addMessageToChat(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('ai-message', `ai-message-${sender}`);
            const p = document.createElement('p');
            p.textContent = text;
            messageDiv.appendChild(p);
            aiAssistantMessages.appendChild(messageDiv);
            aiAssistantMessages.scrollTop = aiAssistantMessages.scrollHeight;
            return messageDiv; 
        }

        async function sendAiMessage() {
            const userMessageText = aiAssistantInput.value.trim();
            if (!userMessageText) return;

            addMessageToChat(userMessageText, 'user');
            aiAssistantInput.value = '';
            aiAssistantInput.disabled = true;
            aiAssistantSend.disabled = true;

            const thinkingMessageDiv = addMessageToChat('Ferremax IA está pensando', 'bot');
            thinkingMessageDiv.classList.add('thinking');

            try {
                const response = await fetch(`${API_URL}/api/ai-assistant/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userMessageText, history: conversationHistory }),
                });
                const data = await response.json();
                thinkingMessageDiv.remove();

                if (data.success && data.reply) {
                    addMessageToChat(data.reply, 'bot');
                    // conversationHistory.push({ role: "user", content: userMessageText });
                    // conversationHistory.push({ role: "assistant", content: data.reply });
                    // if (conversationHistory.length > 10) conversationHistory.splice(0, 2); 
                } else {
                    addMessageToChat(data.message || 'Hubo un error, intenta de nuevo.', 'bot');
                }
            } catch (error) {
                console.error("Error AI Assistant:", error);
                thinkingMessageDiv.remove();
                addMessageToChat('Error de conexión con el asistente. Intenta más tarde.', 'bot');
            } finally {
                aiAssistantInput.disabled = false;
                aiAssistantSend.disabled = false;
                aiAssistantInput.focus();
            }
        }

        if (aiAssistantSend) aiAssistantSend.addEventListener('click', sendAiMessage);
        if (aiAssistantInput) {
          aiAssistantInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                sendAiMessage();
            }
          });
        }
        // --- FIN AI ASSISTANT ---

        // Initial page display
        console.log(">>> Mostrando Sección Inicial...");
        if (isLoggedIn) {
            await showPageSection("home");
        } else {
            console.log(">>> Mostrando sección de Login (usuario no logueado).");
        }
        console.log(">>> INICIALIZACIÓN COMPLETA (Ferremax App) <<<");

    } catch (error) {
        console.error("!!! ERROR CRÍTICO DURANTE LA INICIALIZACIÓN !!!", error);
        document.body.innerHTML = `<div style="padding: 2rem; text-align: center; color: red; font-family: sans-serif; border: 2px solid red; margin: 2rem;"><h1>Error Crítico</h1><p>La aplicación no pudo iniciarse correctamente.</p><p>Por favor, revisa la consola del navegador (presiona F12) para más detalles.</p><p style="margin-top: 1rem; font-weight: bold;">Mensaje: ${error.message}</p></div>`;
    }
}); // Fin del DOMContentLoaded principal

// --- SCRIPT DEL NUEVO CARRUSEL (con imágenes clickables) ---
document.addEventListener('DOMContentLoaded', () => {
    const newCarouselSlidesContainer = document.getElementById("new-carousel-slides");
    const newIndicatorsContainer = document.getElementById("new-carousel-indicators");
    const newPrevBtn = document.getElementById("new-prevBtn");
    const newNextBtn = document.getElementById("new-nextBtn");

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

        document.querySelectorAll("#new-carousel-indicators .carousel-dot").forEach((dot, i) => {
            dot.classList.toggle("bg-gray-600", i === index);
            dot.classList.toggle("bg-gray-300", i !== index);
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

    if (newNextBtn) newNextBtn.addEventListener("click", () => { newShowNextSlide(); stopNewCarouselInterval(); startNewCarouselInterval(); });
    if (newPrevBtn) newPrevBtn.addEventListener("click", () => { newShowPrevSlide(); stopNewCarouselInterval(); startNewCarouselInterval(); });

    fetch(`${API_URL}/api/productos?limit=5`)
        .then(res => {
            if (!res.ok) throw new Error(`Error ${res.status} fetching products for carousel`);
            return res.json();
        })
        .then(productos => {
            if (!newCarouselSlidesContainer || !newIndicatorsContainer) {
                console.error("Carousel containers not found for new carousel."); return;
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
                const precioFormateado = typeof formatCOP === 'function' ? formatCOP(producto.precio_unitario) : '$' + producto.precio_unitario;
                slide.innerHTML = `
                    <img src="${imageUrl}" alt="${producto.Nombre}" class="rounded shadow mb-4 max-h-48 sm:max-h-64 object-contain cursor-pointer product-carousel-image" onerror="${imageOnError}" data-product-id="${producto.ID_Producto}">
                    <h3 class="text-lg sm:text-xl font-semibold text-gray-700 mt-2">${producto.Nombre}</h3>
                    <p class="text-gray-600 mt-1 text-sm truncate w-full max-w-xs">${producto.Descripcion ? producto.Descripcion.substring(0, 70) + '...' : "Excelente producto para tus proyectos."}</p>
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
                        } else {
                            console.error('showPageSection function is not available globally.');
                        }
                    });
                }
                const dot = document.createElement("span");
                dot.className = "carousel-dot w-3 h-3 bg-gray-300 rounded-full cursor-pointer";
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