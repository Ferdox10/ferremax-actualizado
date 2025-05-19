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
    cartItemsContainer.innerHTML = ""; 

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Tu carrito está vacío.</p>';
        cartSummaryAndCheckout.style.display = 'none';
        if (paymentButtonContainer) paymentButtonContainer.innerHTML = '';
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
            <div id="payment-result-message-container" class="mt-4">
                 <p id="payment-result-message" class="message text-center"></p>
            </div>`;
        
        if (paymentButtonContainer) {
            paymentButtonContainer.innerHTML = '';
            paymentButtonContainer.appendChild(paymentOptionsDiv);
        } else {
            console.error("paymentButtonContainer no encontrado en el DOM");
            if (cartSummaryAndCheckout) cartSummaryAndCheckout.appendChild(paymentOptionsDiv);
        }

        document.getElementById('wompi-checkout-btn')?.addEventListener('click', handleCheckout);
        
        const codCheckoutBtn = document.getElementById('cod-checkout-btn');
        const codFormContainer = document.getElementById('cod-form-container');
        const codForm = document.getElementById('cod-form');

        codCheckoutBtn?.addEventListener('click', () => {
            if (codFormContainer) codFormContainer.style.display = 'block';
            if (codCheckoutBtn) codCheckoutBtn.style.display = 'none';
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
    hideMessages(cartMessageDiv);
    const paymentResultMessageEl = document.getElementById('payment-result-message');
    if(paymentResultMessageEl) hideMessages(paymentResultMessageEl);
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
        const tempResponse = await fetch(`${API_URL}/api/wompi/temp-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: reference, items: cartDataForBackend, total: total, userId: localStorage.getItem('userId'), customerData: { email: localStorage.getItem('userEmail') } })
        });
        const tempData = await tempResponse.json();
        if (!tempResponse.ok || !tempData.success) {
            throw new Error(tempData.message || 'Error guardando orden temporal en backend.');
        }

        const checkout = new WidgetCheckout({
            currency: currency,
            amountInCents: totalInCents,
            reference: reference,
            publicKey: wompiPublicKey,
            redirectUrl: redirectUrl,
        });

        checkout.open(function (result) {
            console.log(">>> [Checkout Wompi COP] Widget cerrado o redirigido. Resultado:", result);
            if (wompiCheckoutBtn) {
                wompiCheckoutBtn.disabled = false;
                wompiCheckoutBtn.innerHTML = 'Pagar con Wompi (Tarjeta, PSE, etc.)';
            }
            hideMessages(generalPaymentMessageContainer);

            if (result.transaction && result.transaction.status === 'APPROVED') {
                showMessage(cartMessageDiv || generalPaymentMessageContainer, "¡Pago con Wompi procesado! Estamos confirmando tu pedido.", false);
                saveCart([]);
                renderCartPage(); 
                updateCartIcon();
            } else if (result.transaction) {
                showMessage(generalPaymentMessageContainer, `Estado de la transacción Wompi: ${result.transaction.status}. ${result.transaction.status_message || ''}`, true);
            } else if (result.error) {
                 showMessage(generalPaymentMessageContainer, `Error con Wompi: ${result.error.type} - ${result.error.reason || ''}`, true);
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

async function handleCashOnDeliverySubmit(event) {
    event.preventDefault();
    const codMessageEl = document.getElementById('cod-message');
    if (codMessageEl) hideMessages(codMessageEl);

    const customerInfo = {
        name: document.getElementById('cod-name')?.value.trim(),
        department: document.getElementById('cod-department')?.value.trim(),
        city: document.getElementById('cod-city')?.value.trim(),
        address: document.getElementById('cod-address')?.value.trim(),
        referencePoint: document.getElementById('cod-reference-point')?.value.trim() || null,
        phone: document.getElementById('cod-phone')?.value.trim(),
        email: document.getElementById('cod-email')?.value.trim(),
        userId: localStorage.getItem('userId') || null
    };

    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address ||
        !customerInfo.department || !customerInfo.city || !customerInfo.email) {
        if (codMessageEl) showMessage(codMessageEl, "Por favor, completa todos los datos requeridos (*) para el envío.", true);
        return;
    }

    const cartForBackend = getCart().map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price, 
        name: item.name
    }));

    if (cartForBackend.length === 0) {
        if (codMessageEl) showMessage(codMessageEl, "Tu carrito está vacío.", true);
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
        
        const codFormEl = document.getElementById('cod-form');
        if(codFormEl) codFormEl.reset();
        const codFormContainerEl = document.getElementById('cod-form-container');
        if(codFormContainerEl) codFormContainerEl.style.display = 'none';
        
        saveCart([]); 
        renderCartPage(); 
        updateCartIcon();

    } catch (error) {
        console.error("Error al enviar pedido contra entrega:", error);
        if (codMessageEl) showMessage(codMessageEl, `Error al procesar tu pedido: ${error.message}`, true);
    } finally {
        if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Confirmar Pedido Contra Entrega'; }
    }
}

// --- FUNCIONES DE RENDERIZADO (PRODUCTOS, CATEGORÍAS, ETC.) ---
function renderProductCard(product) {
    const div = document.createElement("div");
    div.className = `product-card`; 
    const imageUrl = product.imagen_url || `https://placehold.co/300x200/e5e7eb/4b5563?text=NI`;
    const imageOnError = `this.onerror=null;this.src='https://placehold.co/300x199/fecaca/b91c1c?text=Err';this.alt='Imagen no disponible';`;
    const price = formatCOP(product.precio_unitario);
    const stock = product.cantidad ?? 0;
    const isOutOfStock = stock <= 0;

    div.innerHTML = `
        <div class="card-img-container product-detail-link cursor-pointer" data-product-id-detail="${product.ID_Producto}">
            <img src="${imageUrl}" class="card-img-top" alt="${product.Nombre || 'Producto'}" onerror="${imageOnError}">
        </div>
        <div class="p-4 flex flex-col flex-grow">
            <h5 class="text-lg font-semibold text-gray-800 truncate mb-1 product-detail-link cursor-pointer" title="${product.Nombre || ''}" data-product-id-detail="${product.ID_Producto}">${product.Nombre || 'N/A'}</h5>
            <p class="text-sm text-gray-500 mb-2 truncate">${product.Descripcion || 'Descripción no disponible'}</p>
            <p class="text-xl font-bold product-price mt-auto mb-3">${price}</p>
            <button class="add-to-cart-button mt-auto w-full btn ${isOutOfStock ? 'btn-gray cursor-not-allowed' : 'btn-primary'}" data-product-id-add="${product.ID_Producto}" ${isOutOfStock ? 'disabled title="Sin stock"' : ''}>
                ${isOutOfStock ? '<i class="fas fa-times-circle mr-2"></i>Sin Stock' : '<i class="fas fa-cart-plus mr-2"></i>Añadir al Carrito'}
            </button>
        </div>`;
    return div;
}

function renderProductGrid(container) {
    if (!container) { console.warn("Contenedor de productos no encontrado para renderProductGrid"); return; }
    container.innerHTML = "";
    if (!allProducts || allProducts.length === 0) {
        container.innerHTML = '<p class="col-span-full text-center text-gray-500 p-4">No hay productos disponibles.</p>';
        return;
    }
    allProducts.forEach(p => container.appendChild(renderProductCard(p)));
}

function renderFeaturedProducts(container) {
    if (!container) { console.warn("Contenedor de productos destacados no encontrado"); return; }
    container.innerHTML = "";
    if (!allProducts || allProducts.length === 0) {
        container.innerHTML = '<p class="col-span-full text-center text-gray-500 p-4">No hay productos destacados.</p>';
        return;
    }
    const featured = allProducts.slice(0, 3);
    featured.forEach(p => container.appendChild(renderProductCard(p)));
}

function renderProductDetailContent(container, product) {
    if (!container) { console.warn("Contenedor de detalle de producto no encontrado"); return; }
    container.innerHTML = "";
    const detailDiv = document.createElement("div");
    detailDiv.className = "product-detail-container";

    const imageURLs = [product.imagen_url, product.imagen_url_2, product.imagen_url_3, product.imagen_url_4, product.imagen_url_5].filter(url => url);
    const mainImageUrl = imageURLs.length > 0 ? imageURLs[0] : `https://placehold.co/600x400/e5e7eb/4b5563?text=NI`;
    const imageOnError = `this.onerror=null;this.src='https://placehold.co/600x399/fecaca/b91c1c?text=Err';this.alt='Imagen no disponible';`;
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
                <img id="mainProductImage" src="${mainImageUrl}" class="product-detail-image" alt="${product.Nombre || 'Producto'}" onerror="${imageOnError}" title="Haz clic para ampliar">
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
            const isHidden = descriptionText.style.display === 'none' || descriptionText.style.display === '';
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
    if (!container) { console.warn("Contenedor de detalle de producto no encontrado para renderProductDetail"); return; }
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
    if (!categoryGridContainer) { console.warn("Contenedor de categorías no encontrado"); return; }
    categoryGridContainer.innerHTML = "";
    categoriesData.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.setAttribute('data-category-id', cat.id);
        card.innerHTML = `<i class="${cat.icon}"></i><span>${cat.name}</span>`;
        categoryGridContainer.appendChild(card);
    });
}

// --- NUEVAS FUNCIONES PARA HISTORIAL DE PEDIDOS DEL USUARIO ---
async function loadAndRenderUserOrders() {
    if (!orderHistoryListContainer || !orderHistorySection) return;
    
    orderHistoryListContainer.innerHTML = '<p class="p-4 text-center text-gray-500">Cargando historial de pedidos...</p>';
    if (orderDetailViewContainer) orderDetailViewContainer.style.display = 'none';
    if (orderHistoryMessageDiv) hideMessages(orderHistoryMessageDiv);

    const userId = localStorage.getItem('userId');
    if (!userId) {
        if(orderHistoryMessageDiv) showMessage(orderHistoryMessageDiv, 'Error: No se pudo identificar al usuario. Por favor, inicia sesión.', true);
        orderHistoryListContainer.innerHTML = '<p class="p-4 text-center text-red-600">No se pudo cargar el historial. Intente iniciar sesión de nuevo.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/user/orders?userId=${userId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || `Error ${response.status} al obtener pedidos.`);
        }

        if (data.orders.length === 0) {
            orderHistoryListContainer.innerHTML = '<p class="p-4 text-center text-gray-500">No tienes pedidos anteriores.</p>';
            return;
        }
        renderUserOrdersTable(data.orders);
    } catch (error) {
        console.error("Error cargando historial de pedidos del usuario:", error);
        if(orderHistoryMessageDiv) showMessage(orderHistoryMessageDiv, `Error al cargar historial: ${error.message}`, true);
        orderHistoryListContainer.innerHTML = `<p class="p-4 text-center text-red-600">Error al cargar el historial: ${error.message}</p>`;
    }
}

function renderUserOrdersTable(orders) {
    if(!orderHistoryListContainer) return;
    let tableHTML = `
        <table class="admin-table w-full">
            <thead>
                <tr>
                    <th class="px-4 py-2 text-left">ID Pedido</th>
                    <th class="px-4 py-2 text-left">Fecha</th>
                    <th class="px-4 py-2 text-left">Total</th>
                    <th class="px-4 py-2 text-left">Estado</th>
                    <th class="px-4 py-2 text-left">Acciones</th>
                </tr>
            </thead>
            <tbody>`;

    orders.forEach(order => {
        tableHTML += `
            <tr>
                <td class="border px-4 py-2">${order.ID_Pedido}</td>
                <td class="border px-4 py-2">${new Date(order.Fecha_Pedido).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                <td class="border px-4 py-2">${formatCOP(order.Total_Pedido)}</td>
                <td class="border px-4 py-2">${order.Estado_Pedido || 'N/A'}</td>
                <td class="border px-4 py-2">
                    <button class="btn btn-secondary btn-sm view-user-order-details-btn" data-order-id="${order.ID_Pedido}">Ver Detalles</button>
                </td>
            </tr>`;
    });
    tableHTML += `</tbody></table>`;
    orderHistoryListContainer.innerHTML = tableHTML;

    orderHistoryListContainer.querySelectorAll('.view-user-order-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.target.dataset.orderId;
            loadAndRenderUserOrderDetail(orderId);
        });
    });
}
        
async function loadAndRenderUserOrderDetail(orderId) {
    if (!orderDetailViewContainer) return;
    orderDetailViewContainer.innerHTML = '<p class="p-4 text-center text-gray-500">Cargando detalles del pedido...</p>';
    orderDetailViewContainer.style.display = 'block';
    window.scrollTo({ top: orderDetailViewContainer.offsetTop - 80, behavior: 'smooth' });

    const userId = localStorage.getItem('userId');
    if (!userId) {
        orderDetailViewContainer.innerHTML = '<p class="p-4 text-center text-red-600">Error: Usuario no identificado para cargar detalles.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/user/orders/${orderId}?userId=${userId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || `Error ${response.status} al obtener detalles del pedido.`);
        }
        renderUserOrderDetailContent(data.order);
    } catch (error) {
        console.error(`Error cargando detalle del pedido ${orderId}:`, error);
        orderDetailViewContainer.innerHTML = `<p class="p-4 text-center text-red-600">Error al cargar detalles: ${error.message}</p>`;
    }
}

function renderUserOrderDetailContent(order) {
    if(!orderDetailViewContainer) return;
    let detailsHtml = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-2xl font-semibold text-gray-800">Detalle del Pedido #${order.ID_Pedido}</h3>
            <button id="close-user-order-detail-btn" class="btn btn-sm btn-gray">Cerrar Detalles</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <p><strong>Fecha:</strong> ${new Date(order.Fecha_Pedido).toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' })}</p>
                <p><strong>Total Pagado:</strong> ${formatCOP(order.Total_Pedido)}</p>
                <p><strong>Estado:</strong> ${order.Estado_Pedido || 'N/A'}</p>
                <p><strong>Método de Pago:</strong> ${order.Metodo_Pago || 'N/A'}</p>
                ${order.Referencia_Pago ? `<p><strong>Referencia de Pago:</strong> ${order.Referencia_Pago}</p>` : ''}
            </div>
            <div>
                <h4 class="font-semibold text-lg mb-2 text-gray-700">Información de Envío</h4>
                <p><strong>Nombre:</strong> ${order.Nombre_Cliente_Envio || 'N/A'}</p>
                <p><strong>Email:</strong> ${order.Email_Cliente_Envio || 'N/A'}</p>
                <p><strong>Teléfono:</strong> ${order.Telefono_Cliente_Envio || 'N/A'}</p>
                <p><strong>Dirección:</strong> ${order.Direccion_Envio || 'N/A'}</p>
                <p><strong>Ciudad:</strong> ${order.Ciudad_Envio || 'N/A'}, ${order.Departamento_Envio || 'N/A'}</p>
                ${order.Punto_Referencia_Envio ? `<p><strong>Referencia Adicional:</strong> ${order.Punto_Referencia_Envio}</p>` : ''}
            </div>
        </div>
        <h4 class="font-semibold text-lg mb-3 mt-6 text-gray-700">Productos Comprados</h4>
        <div class="space-y-3">`;

    if (order.detalles && order.detalles.length > 0) {
        order.detalles.forEach(item => {
            const imageUrl = item.Imagen_Producto || `https://placehold.co/60x60/e5e7eb/4b5563?text=NI`;
            const imageOnError = `this.onerror=null;this.src='https://placehold.co/60x59/fecaca/b91c1c?text=Err';this.alt='Imagen no disponible';`;
            detailsHtml += `
                <div class="cart-item flex items-center p-3 border rounded-md bg-gray-50 shadow-sm">
                    <img src="${imageUrl}" alt="${item.Nombre_Producto || 'Producto'}" class="w-16 h-16 object-contain mr-4 border rounded" onerror="${imageOnError}">
                    <div class="flex-grow">
                        <p class="font-semibold text-gray-800">${item.Nombre_Producto || 'Producto sin nombre'}</p>
                        <p class="text-sm text-gray-600">Cantidad: ${item.Cantidad}</p>
                        <p class="text-sm text-gray-600">Precio Unitario: ${formatCOP(item.Precio_Unitario_Compra)}</p>
                    </div>
                    <p class="font-semibold text-lg text-gray-800">${formatCOP(item.Cantidad * item.Precio_Unitario_Compra)}</p>
                </div>`;
        });
    } else {
        detailsHtml += '<p class="text-gray-600">No se encontraron detalles de productos para este pedido.</p>';
    }

    detailsHtml += `</div>`;
    orderDetailViewContainer.innerHTML = detailsHtml;

    document.getElementById('close-user-order-detail-btn')?.addEventListener('click', () => {
        if(orderDetailViewContainer) {
            orderDetailViewContainer.style.display = 'none';
            orderDetailViewContainer.innerHTML = '';
        }
    });
}
        
// --- FUNCIONES DE CARGA DE DATOS ---
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

async function loadAndStorePublicProducts() {
    if (productsLoaded && allProducts.length > 0) return true;
    console.log("Cargando productos públicos...");
    if(productsDisplayArea) productsDisplayArea.innerHTML = '<p class="col-span-full text-center text-gray-500 p-4">Cargando productos...</p>';
    if(featuredProductsContainer) featuredProductsContainer.innerHTML = '<p class="col-span-full text-center text-gray-500 p-4">Cargando destacados...</p>';

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
        const headers = { 'x-admin-simulated': 'true' }; // Simular admin para obtener todos los settings
        const response = await fetch(`${API_URL}/api/admin/settings`, { headers });
        if (!response.ok) throw new Error(`HTTP ${response.status} al cargar settings.`);
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
        currentSettings = {}; // Usar defaults si falla
        applySiteSettings(); // Aplicar defaults
        return false;
    }
}

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
// let lastPendingOrderCount = 0; // Ya definido
// let orderCheckInterval = null; // Ya definido
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
function updateUI(isLoggedIn) { /* ... (código completo) ... */ }
async function showPageSection(sectionId, detailId = null) { /* ... (código completo) ... */ }
        
// --- MANEJADORES DE EVENTOS ---
function handleLogout() { /* ... (código completo) ... */ }
function handleCategoryClick(event) { /* ... (código completo) ... */ }
function handleGridOrDetailClick(event) { /* ... (código completo) ... */ }

// --- LÓGICA DE INICIALIZACIÓN DE LA APLICACIÓN ---
document.addEventListener("DOMContentLoaded", async () => {
    console.log(">>> DOM Cargado. Iniciando App Ferremax..."); // script.js:430 (aproximado)
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
            console.warn("Error al parsear carrito, limpiando...", e);
            localStorage.removeItem(CART_STORAGE_KEY);
        }

        const currentYearSpan = document.getElementById("current-year");
        if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
        
        const isLoggedIn = localStorage.getItem("userLoggedIn") === "true";
        console.log(">>> Estado Login Inicial:", isLoggedIn); // script.js:456
        
        console.log(">>> Cargando Settings del Sitio..."); // script.js:458
        await loadSiteSettings(); 
        
        console.log(">>> Añadiendo Listeners..."); // script.js:464
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
                    const result = await response.json(); // Intenta parsear como JSON
                    console.log("Respuesta del backend para /api/login:", result); 

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
                    } else if (error instanceof SyntaxError) { 
                        showMessage(loginMessageDiv, "Respuesta inesperada del servidor. Intenta de nuevo.", true);
                        console.error("El servidor no devolvió JSON válido. Error original:", error); 
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
                    console.log("Respuesta del backend para /api/register:", result);

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
                    } else if (error instanceof SyntaxError) {
                        showMessage(registerMessageDiv, "Respuesta inesperada del servidor al registrar.", true);
                    }
                     else {
                        showMessage(registerMessageDiv, "Error al intentar registrar. Intenta de nuevo.", true);
                    }
                } finally { 
                    if (button) { button.disabled = false; button.textContent = 'Registrarse'; } 
                }
            });
        }
        
        updateUI(isLoggedIn); 
        
        console.log(">>> Mostrando Sección Inicial..."); // script.js:706
        if (isLoggedIn) {
            await showPageSection("home");
        } else {
            console.log(">>> Mostrando sección de Login (usuario no logueado).");
            if(loginSection) showPageSection("login"); // Mostrar login explícitamente si no está logueado
            else await showPageSection("home"); // Fallback si no hay loginSection
        }
        console.log(">>> INICIALIZACIÓN COMPLETA (Ferremax App) <<<"); // script.js:714
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
    
    if (!newCarouselSlidesContainer || !newIndicatorsContainer || !newPrevBtn || !newNextBtn) { // script.js:732
        console.warn("Carousel containers not found for new carousel. El carrusel no se inicializará.");
        return; 
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