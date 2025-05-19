"use strict";

// --- CONFIGURACIÓN GLOBAL ---
const API_URL = "https://ferremax-actualizado.onrender.com"; // Asegúrate que esta sea tu URL de backend
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
const navLinks = document.querySelectorAll(".admin-nav-item"); // Usar .admin-nav-item para todos los enlaces
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
const adminProductViewsContainer = document.getElementById('product-views-container'); // Asegúrate que este ID exista
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
function showMessage(element, message, isError = true) {
    if (!element) { console.warn("showMessage: Elemento nulo."); return; }
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
    if (cartSection && cartSection.style.display !== 'none') { // Solo re-renderizar si la página del carrito está visible
        renderCartPage();
    }
}
function addToCart(productId, quantity = 1, buttonElement = null) {
    console.log(`[Cart] Add: ${productId} Qty: ${quantity}`);
    if (!allProducts || allProducts.length === 0) {
        console.error("Cart Error: Products not loaded.");
        const msgContainer = cartMessageDiv || pageContent.querySelector('.message') || pageContent;
        showMessage(msgContainer, 'Error: Información del producto no disponible.', true);
        return;
    }
    let cart = getCart();
    const product = allProducts.find(p => p.ID_Producto == productId);
    if (!product) {
        console.error("Cart Error: Product not found:", productId);
        const msgContainer = cartMessageDiv || pageContent.querySelector('.message') || pageContent;
        showMessage(msgContainer, 'Error: Producto no encontrado.', true);
        return;
    }
    const stock = product.cantidad ?? 0;
    const existingItemIndex = cart.findIndex(item => item.productId == productId);

    const msgContainer = cartMessageDiv || pageContent.querySelector('.message') || pageContent;

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
    if (existingItemIndex > -1) { // El producto ya está en el carrito
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
    } else { // El producto no está en el carrito
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
        renderCartPage(); // Re-render para restaurar valor o mostrar error
        return;
    }
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.productId == productId);
    if (itemIndex > -1) {
        const stock = cart[itemIndex].stock || 0; // Obtener el stock del item en el carrito
        if (quantityNum === 0) {
            removeFromCart(productId);
        } else if (quantityNum > stock) {
            cart[itemIndex].quantity = stock; // No permitir más que el stock
            saveCart(cart);
            showMessage(cartMessageDiv, `Stock máximo (${stock}) para "${cart[itemIndex].name}".`, true);
        } else {
            cart[itemIndex].quantity = quantityNum;
            saveCart(cart);
            hideMessages(cartMessageDiv); // Ocultar mensajes si la actualización es válida
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
    return { subtotal, total: subtotal }; // Asumimos que el total es igual al subtotal por ahora
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
        if(pageContent) pageContent.innerHTML = '<p class="text-red-600 text-center p-4">Error interno al mostrar el carrito.</p>';
        return;
    }

    const cart = getCart();
    cartItemsContainer.innerHTML = ""; // Limpiar antes de renderizar

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Tu carrito está vacío.</p>';
        cartSummaryAndCheckout.style.display = 'none';
        if (paymentButtonContainer) paymentButtonContainer.innerHTML = ''; // Limpiar botones de pago
    } else {
        const { subtotal, total } = calculateCartTotals();
        cart.forEach(item => {
            if (!item || typeof item.productId === 'undefined' || item.productId === null) {
                console.warn("[Cart Render] Ignorando item inválido:", item); return;
            }
            const imageUrl = item.imageUrl || `https://placehold.co/60x60/e5e7eb/4b5563?text=NI`;
            const imageOnError = `this.onerror=null;this.src='https://placehold.co/60x59/fecaca/b91c1c?text=Err';this.alt='Imagen no disponible';`;
            const priceF = formatCOP(item.price);
            const itemTotalF = formatCOP((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0));
            const stock = item.stock || 0;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item flex items-center justify-between border-b py-4 last:border-b-0 flex-wrap gap-2';
            itemDiv.innerHTML = `
                <div class="flex items-center flex-grow min-w-[200px]">
                    <img src="${imageUrl}" alt="${item.name || 'Producto'}" onerror="${imageOnError}" class="w-16 h-16 object-contain mr-4 border rounded">
                    <div>
                        <h4 class="font-semibold text-gray-800">${item.name || 'N/A'}</h4>
                        <p class="text-sm text-gray-600">Precio: ${priceF}</p>
                        <p class="text-xs text-gray-500 mt-1">Stock: ${stock}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2 sm:space-x-3">
                    <label for="qty-${item.productId}" class="sr-only">Cantidad</label>
                    <input type="number" id="qty-${item.productId}" value="${item.quantity}" min="0" max="${stock}" data-product-id-qty="${item.productId}" class="border rounded px-1 py-1 w-14 sm:w-16 text-center cart-item-qty-input" aria-label="Cantidad">
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

        // Lógica para botones de pago
        const paymentOptionsDiv = document.createElement('div');
        paymentOptionsDiv.className = 'mt-6 border-t pt-6';
        paymentOptionsDiv.innerHTML = `
            <h4 class="text-lg font-semibold mb-3">Selecciona tu método de pago:</h4>
            <div class="space-y-3">
                <button id="wompi-checkout-btn" class="btn btn-primary btn-full">Pagar con Wompi (Tarjeta, PSE, etc.)</button>
                <button id="cod-checkout-btn" class="btn btn-secondary btn-full">Pago Contra Entrega</button>
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
                    <button type="submit" class="btn btn-success btn-full">Confirmar Pedido Contra Entrega</button>
                </form>
                <div id="cod-message" class="message mt-3"></div>
            </div>
            <div id="payment-result-message-container" class="mt-4"> <!-- Contenedor para mensajes de Wompi -->
                 <p id="payment-result-message" class="message text-center"></p>
            </div>`;
        
        if (paymentButtonContainer) {
            paymentButtonContainer.innerHTML = ''; // Limpiar antes de añadir
            paymentButtonContainer.appendChild(paymentOptionsDiv);
        } else {
            console.error("paymentButtonContainer no encontrado en el DOM");
            cartSummaryAndCheckout.appendChild(paymentOptionsDiv); // Fallback
        }

        document.getElementById('wompi-checkout-btn')?.addEventListener('click', handleCheckout);
        
        const codCheckoutBtn = document.getElementById('cod-checkout-btn');
        const codFormContainer = document.getElementById('cod-form-container');
        const codForm = document.getElementById('cod-form');

        codCheckoutBtn?.addEventListener('click', () => {
            if (codFormContainer) codFormContainer.style.display = 'block';
            codCheckoutBtn.style.display = 'none';
            const wompiBtn = document.getElementById('wompi-checkout-btn');
            if (wompiBtn) wompiBtn.style.display = 'none';

            const loggedInEmail = localStorage.getItem('userEmail');
            const codEmailField = document.getElementById('cod-email');
            if (loggedInEmail && codEmailField) {
                codEmailField.value = loggedInEmail;
            }
        });
        codForm?.addEventListener('submit', handleCashOnDeliverySubmit);
    }
    hideMessages(cartMessageDiv); // Ocultar mensajes generales del carrito
    const paymentResultMessageEl = document.getElementById('payment-result-message');
    if(paymentResultMessageEl) hideMessages(paymentResultMessageEl); // Ocultar mensajes de pago anteriores
}
async function handleCheckout() { /* ... Código completo de handleCheckout ... */ }
async function handleCashOnDeliverySubmit(event) { /* ... Código completo de handleCashOnDeliverySubmit ... */ }

// --- FUNCIONES DE RENDERIZADO (PRODUCTOS, CATEGORÍAS, ETC.) ---
function renderProductCard(product) { /* ... Código completo de renderProductCard ... */ }
function renderProductGrid(container) { /* ... Código completo de renderProductGrid ... */ }
function renderFeaturedProducts(container) { /* ... Código completo de renderFeaturedProducts ... */ }
function renderProductDetailContent(container, product) { /* ... Código completo de renderProductDetailContent ... */ }
function renderProductDetail(container, productId) { /* ... Código completo de renderProductDetail ... */ }
function renderCategories() { /* ... Código completo de renderCategories ... */ }

// --- NUEVAS FUNCIONES PARA HISTORIAL DE PEDIDOS DEL USUARIO ---
async function loadAndRenderUserOrders() { /* ... Código completo de loadAndRenderUserOrders ... */ }
function renderUserOrdersTable(orders) { /* ... Código completo de renderUserOrdersTable ... */ }
async function loadAndRenderUserOrderDetail(orderId) { /* ... Código completo de loadAndRenderUserOrderDetail ... */ }
function renderUserOrderDetailContent(order) { /* ... Código completo de renderUserOrderDetailContent ... */ }
        
// --- FUNCIONES DE CARGA DE DATOS ---
async function loadFrontendConfig() { /* ... Código completo de loadFrontendConfig ... */ }
async function loadAndStorePublicProducts() { /* ... Código completo de loadAndStorePublicProducts ... */ }
async function loadSiteSettings() { /* ... Código completo de loadSiteSettings ... */ }

// --- FUNCIONES DE ADMINISTRACIÓN ---
async function loadAdminProducts() { /* ... Código completo de loadAdminProducts ... */ }
function renderAdminProductTable(products) { /* ... Código completo de renderAdminProductTable ... */ }
function showAdminProductForm(product = null) { /* ... Código completo de showAdminProductForm ... */ }
async function handleEditProduct(productId) { /* ... Código completo de handleEditProduct ... */ }
function showAdminProductList() { /* ... Código completo de showAdminProductList ... */ }
async function handleDeleteProduct(productId) { /* ... Código completo de handleDeleteProduct ... */ }
async function loadCategoriesIntoSelect() { /* ... Código completo de loadCategoriesIntoSelect ... */ }
async function loadAndRenderProductViews() { /* ... Código completo de loadAndRenderProductViews ... */ }
async function loadAndRenderAdminOrders() { /* ... Código completo de loadAndRenderAdminOrders ... */ }
async function loadAndRenderOrderDetail(orderId) { /* ... Código completo de loadAndRenderOrderDetail (admin) ... */ }
async function updateOrderStatus(orderId, newStatus) { /* ... Código completo de updateOrderStatus (admin) ... */ }
async function loadAndRenderAnalytics() { /* ... Código completo de loadAndRenderAnalytics ... */ }
async function loadAndRenderAdminCustomers() { /* ... Código completo de loadAndRenderAdminCustomers ... */ }
let lastPendingOrderCount = 0; 
let orderCheckInterval = null;
function updateAdminOrderBadges(count) { /* ... Código completo de updateAdminOrderBadges ... */ }
async function checkNewOrders() { /* ... Código completo de checkNewOrders ... */ }

// --- FUNCIONES DE NAVEGACIÓN Y UI ---
function applySiteSettings() { /* ... Código completo de applySiteSettings ... */ }
function applyColorSettings(settings) { /* ... Código completo de applyColorSettings ... */ }
function applyTextSettings(settings) { /* ... Código completo de applyTextSettings ... */ }
function applyContactInfo(settings) { /* ... Código completo de applyContactInfo ... */ }
function populatePersonalizeForm() { /* ... Código completo de populatePersonalizeForm ... */ }
async function saveSiteSettings(settingsToSave, type = 'general') { /* ... Código completo de saveSiteSettings ... */ }
function openImageModal(imageUrl) { /* ... Código completo de openImageModal ... */ }
function closeImageModal() { /* ... Código completo de closeImageModal ... */ }
function closeImageModalOnClick(event) { /* ... Código completo de closeImageModalOnClick ... */ }
function updateUI(isLoggedIn) { /* ... Código completo de updateUI ... */ }
async function showPageSection(sectionId, detailId = null) { /* ... Código completo de showPageSection ... */ }

// --- MANEJADORES DE EVENTOS ---
function handleLogout() { /* ... Código completo de handleLogout ... */ }
function handleCategoryClick(event) { /* ... Código completo de handleCategoryClick ... */ }
function handleGridOrDetailClick(event) { /* ... Código completo de handleGridOrDetailClick ... */ }

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
        
        updateUI(isLoggedIn); 
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
                    const response = await fetch(`${API_URL}/login`, { 
                        method: "POST", 
                        headers: { "Content-Type": "application/json" }, 
                        body: JSON.stringify({ email, password }) 
                    });
                    const result = await response.json();
                    if (response.ok && result.success && result.user) {
                        localStorage.setItem("userLoggedIn", "true");
                        localStorage.setItem("userEmail", result.user.email);
                        localStorage.setItem("userRole", result.user.role || 'cliente');
                        localStorage.setItem("userId", result.user.id); // GUARDAR userId
                        productsLoaded = false; await loadSiteSettings(); 
                        updateUI(true); await showPageSection("home");
                    } else { 
                        showMessage(loginMessageDiv, result.message || "Error en el login.", true); 
                    }
                } catch (error) { 
                    console.error("Error login fetch:", error); 
                    showMessage(loginMessageDiv, "No se pudo conectar con el servidor.", true); 
                } finally { 
                    if (button) { button.disabled = false; button.textContent = 'Iniciar Sesión'; } 
                }
            });
        }

        if (registerForm) { /* ... (código listener registerForm) ... */ }
        if (contactForm) { /* ... (código listener contactForm) ... */ }

        if (logoutButton) logoutButton.addEventListener("click", handleLogout);
        if (logoutButtonMobile) logoutButtonMobile.addEventListener("click", handleLogout);
        
        if (showRegisterLink) showRegisterLink.addEventListener("click", (event) => { /* ... */ });
        if (showLoginLink) showLoginLink.addEventListener("click", (event) => { /* ... */ });

        navLinks.forEach(link => link.addEventListener("click", (event) => { /* ... */ }));
        
        const promoBtn = document.querySelector('.promo-banner .cta-button'); 
        if (promoBtn) promoBtn.addEventListener('click', (e) => { /* ... */ });
        
        if (mobileMenuButton && mobileMenu) { /* ... (código listener mobileMenuButton) ... */ }
        if (adminMenuDesktopButton && adminMenuDesktopDropdown) { /* ... (código listener adminMenuDesktopButton y document) ... */ }
        
        if (pageContent) pageContent.addEventListener('click', handleGridOrDetailClick);
        if (cartItemsContainer) { /* ... (código listeners cartItemsContainer) ... */ }
        if (categoryGridContainer) categoryGridContainer.addEventListener('click', handleCategoryClick);
        
        if (addProductButton) addProductButton.addEventListener('click', () => showAdminProductForm());
        if (adminCancelButton) adminCancelButton.addEventListener('click', showAdminProductList);
        if (adminProductForm) { /* ... (código listener adminProductForm submit) ... */ }

        if (saveColorsButton) saveColorsButton.addEventListener('click', () => { /* ... */ });
        if (saveTextsButton) saveTextsButton.addEventListener('click', () => { /* ... */ });
        if (saveContactSocialButton) saveContactSocialButton.addEventListener('click', () => { /* ... */ });
        
        if (faqAccordion) { /* ... (código listener faqAccordion) ... */ }

        console.log(">>> Mostrando Sección Inicial...");
        if (isLoggedIn) {
            await showPageSection("home");
        } else {
            console.log(">>> Mostrando sección de Login (usuario no logueado).");
            // updateUI(false) ya debería haber mostrado la sección de login.
        }
        console.log(">>> INICIALIZACIÓN COMPLETA (Ferremax App) <<<");
    } catch (error) {
        console.error("!!! ERROR CRÍTICO DURANTE LA INICIALIZACIÓN !!!", error);
        document.body.innerHTML = `<div style="padding: 2rem; text-align: center; color: red; font-family: sans-serif; border: 2px solid red; margin: 2rem;"><h1>Error Crítico</h1><p>La aplicación no pudo iniciarse correctamente.</p><p>Por favor, revisa la consola del navegador (presiona F12) para más detalles.</p><p style="margin-top: 1rem; font-weight: bold;">Mensaje: ${error.message}</p></div>`;
    }
});

// --- SCRIPT DEL NUEVO CARRUSEL ---
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
            dot.classList.toggle("bg-gray-600", i === index); // Color activo
            dot.classList.toggle("bg-gray-300", i !== index); // Color inactivo
        });
        newCurrentIndex = index;
    }

    function newShowNextSlide() {
        let nextIndex = (newCurrentIndex + 1) % newTotalSlides;
        updateNewCarousel(nextIndex);
    }

    function newShowPrevSlide() {
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

    fetch(`${API_URL}/api/productos?limit=5`) // Cargar hasta 5 productos para el carrusel
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
                return;
            }

            productos.forEach((producto, i) => {
                const slide = document.createElement("div");
                slide.className = "w-full flex-shrink-0 bg-white p-6 flex flex-col items-center justify-center text-center min-h-[300px]";
                const imageOnError = `this.onerror=null;this.src='https://placehold.co/400x249/fecaca/b91c1c?text=Err';this.alt='Imagen no disponible';`;
                const imageUrl = producto.imagen_url || `https://placehold.co/400x250/e2e8f0/64748b?text=Producto`;
                const precioFormateado = typeof formatCOP === 'function' ? formatCOP(producto.precio_unitario) : '$' + producto.precio_unitario;
                
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
                dot.className = "carousel-dot"; // Los estilos de color se aplican en updateNewCarousel
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
