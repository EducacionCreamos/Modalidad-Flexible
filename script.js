// Variables globales
let isAdminMode = false;
let reviewsData = [];
let lastUpdateTime = null;

// URL del Google Apps Script QUE YA FUNCIONA
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyw-RDRcuS_hmu0eiZiV9qeqbqnjVrQ3jcDpzkiJGYluwN6612k2bhYSaA9NqHlkr-i/exec';

// Configuración de actualización automática
const UPDATE_INTERVAL = 60000; // 1 minuto
let updateTimer;

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    initPageLoader();
    initNavbar();
    initDropdowns();
    initAdminMode();
    initScrollAnimations();
    initMobileMenu();
    initReviewsSystem();
}

// ==================== REVIEWS SYSTEM - MÉTODO SIMPLIFICADO (FUNCIONANDO) ====================
function initReviewsSystem() {
    console.log('🚀 Inicializando sistema de reseñas...');
    loadReviewsFromSheets();
    
    // Actualización automática cada minuto
    updateTimer = setInterval(() => {
        loadReviewsFromSheets(false);
    }, UPDATE_INTERVAL);
    
    console.log('✅ Sistema de reseñas inicializado');
}

async function loadReviewsFromSheets(showLoading = true) {
    const loadingEl = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        if (showLoading && loadingEl) {
            loadingEl.style.display = 'block';
        }
        if (errorMessage) errorMessage.style.display = 'none';
        
        console.log('📡 Intentando conectar con Google Sheets...');
        
        // Método 1: Intentar fetch directo
        let data;
        try {
            const response = await fetch(GOOGLE_SCRIPT_URL + '?t=' + Date.now(), {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                data = await response.json();
                console.log('✅ Conexión exitosa con fetch');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (fetchError) {
            console.log('⚠️ Fetch falló, intentando JSONP...', fetchError.message);
            
            // Método 2: Fallback a JSONP
            data = await loadWithJSONP();
        }
        
        // Verificar datos
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Verificar cambios
        const newUpdateTime = data.lastUpdated;
        if (lastUpdateTime === newUpdateTime && reviewsData.length > 0) {
            console.log('📋 No hay cambios en los datos');
            if (loadingEl) loadingEl.style.display = 'none';
            return;
        }
        
        // Actualizar datos
        reviewsData = data.reviews || [];
        lastUpdateTime = newUpdateTime;
        
        // Actualizar UI
        updateRatingSummary(data.summary);
        displayReviews(reviewsData);
        
        console.log(`✅ ${reviewsData.length} reseñas cargadas exitosamente`);
        
    } catch (error) {
        console.error('❌ Error al cargar reseñas:', error);
        handleLoadError(error);
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

function loadWithJSONP() {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonpCallback_' + Date.now();
        const script = document.createElement('script');
        
        // Timeout
        const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout en conexión JSONP'));
        }, 15000);
        
        function cleanup() {
            clearTimeout(timeoutId);
            if (window[callbackName]) {
                delete window[callbackName];
            }
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }
        
        // Callback global
        window[callbackName] = function(data) {
            cleanup();
            resolve(data);
        };
        
        script.onerror = function() {
            cleanup();
            reject(new Error('Error al cargar script JSONP'));
        };
        
        script.src = `${GOOGLE_SCRIPT_URL}?callback=${callbackName}&t=${Date.now()}`;
        document.head.appendChild(script);
    });
}

function handleLoadError(error) {
    const errorMessage = document.getElementById('errorMessage');
    const noReviews = document.getElementById('noReviews');
    
    if (errorMessage) {
        errorMessage.style.display = 'block';
        errorMessage.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p>⚠️ No se pudieron cargar las reseñas: ${error.message}</p>
                <button onclick="loadReviewsFromSheets(true)" class="btn btn-secondary" style="margin-top: 1rem;">
                    🔄 Intentar de nuevo
                </button>
                <p style="font-size: 0.9rem; color: #7f8c8d; margin-top: 1rem;">
                    Si el problema persiste, verifica que el Google Apps Script esté correctamente configurado.
                </p>
            </div>
        `;
    }
    
    if (reviewsData.length === 0 && noReviews) {
        noReviews.style.display = 'block';
    }
}

function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    const noReviews = document.getElementById('noReviews');
    
    if (!reviewsList) return;
    
    if (!reviews || reviews.length === 0) {
        reviewsList.innerHTML = '';
        if (noReviews) noReviews.style.display = 'block';
        return;
    }
    
    if (noReviews) noReviews.style.display = 'none';
    
    const reviewsHTML = reviews.map(review => createReviewHTML(review)).join('');
    reviewsList.innerHTML = reviewsHTML;
    
    // Animaciones
    setTimeout(() => {
        const reviewElements = reviewsList.querySelectorAll('.review-item');
        reviewElements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('review-visible');
            }, index * 100);
        });
    }, 100);
}

function createReviewHTML(review) {
    const stars = generateStarsHTML(review.rating);
    const safeComment = escapeHtml(review.comment);
    const safeName = escapeHtml(review.name);
    
    return `
        <div class="review-item" data-review-id="${review.id}">
            <div class="review-header">
                <div>
                    <div class="review-name">${safeName}</div>
                    <div class="review-date">${review.date}</div>
                </div>
                <div class="review-rating">${stars}</div>
            </div>
            <div class="review-comment">${safeComment}</div>
        </div>
    `;
}

function generateStarsHTML(rating) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHTML += '<span class="star filled">★</span>';
        } else {
            starsHTML += '<span class="star">☆</span>';
        }
    }
    return starsHTML;
}

function updateRatingSummary(summary) {
    const averageRatingEl = document.getElementById('averageRating');
    const averageStarsEl = document.getElementById('averageStars');
    const totalReviewsEl = document.getElementById('totalReviews');
    
    if (!summary) {
        summary = { average: 0, total: 0 };
    }
    
    if (averageRatingEl) {
        averageRatingEl.textContent = summary.average.toFixed(1);
    }
    
    if (totalReviewsEl) {
        totalReviewsEl.textContent = summary.total;
    }
    
    if (averageStarsEl) {
        const fullStars = Math.floor(summary.average);
        const hasHalfStar = summary.average % 1 >= 0.5;
        
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                starsHTML += '<span class="star filled">★</span>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                starsHTML += '<span class="star filled">★</span>';
            } else {
                starsHTML += '<span class="star">☆</span>';
            }
        }
        averageStarsEl.innerHTML = starsHTML;
    }
}

// ==================== PAGE LOADER ====================
function initPageLoader() {
    window.addEventListener('load', function() {
        setTimeout(() => {
            const pageLoader = document.getElementById('pageLoader');
            if (pageLoader) {
                pageLoader.classList.add('hidden');
            }
        }, 1500);
    });
}

// ==================== NAVBAR ====================
function initNavbar() {
    window.addEventListener('scroll', function() {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });
}

// ==================== DROPDOWNS ====================
function initDropdowns() {
    const quickAccessDropdowns = document.querySelectorAll('.dropdown');
    
    quickAccessDropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('button');
        const content = dropdown.querySelector('.dropdown-content');
        
        if (button && content) {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                
                quickAccessDropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        const otherContent = otherDropdown.querySelector('.dropdown-content');
                        if (otherContent) {
                            otherContent.style.display = 'none';
                        }
                    }
                });
                
                content.style.display = content.style.display === 'block' ? 'none' : 'block';
            });
        }
    });
    
    document.addEventListener('click', function(e) {
        quickAccessDropdowns.forEach(dropdown => {
            const content = dropdown.querySelector('.dropdown-content');
            if (content && !dropdown.contains(e.target)) {
                content.style.display = 'none';
            }
        });
    });
}

// ==================== MOBILE MENU ====================
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        });
    }
}

// ==================== MODAL INSCRIPCIONES ====================
function showInscripcionesModal() {
    const modal = document.getElementById('inscripcionesModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        document.body.style.overflow = 'hidden';
    }
}

function closeInscripcionesModal() {
    const modal = document.getElementById('inscripcionesModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

function openFormulario() {
    closeInscripcionesModal();
    
    setTimeout(() => {
        const modal = document.getElementById('formularioModal');
        if (modal) {
            const embedUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeFZdSWzURjpBqSzrpt_SEPI76CkNze6pAR_DCwFUEtXDb-Zw/viewform?embedded=true';
            
            const iframe = modal.querySelector('iframe');
            if (iframe) {
                iframe.src = embedUrl;
            }
            
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
            document.body.style.overflow = 'hidden';
        }
    }, 300);
}

function closeFormularioModal() {
    const modal = document.getElementById('formularioModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        if (e.target.id === 'inscripcionesModal') {
            closeInscripcionesModal();
        } else if (e.target.id === 'formularioModal') {
            closeFormularioModal();
        }
    }
});

// ==================== NAVIGATION FUNCTIONS ====================
function showHome() {
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('servicesSection').classList.remove('active');
    document.getElementById('programSection').classList.remove('active');
    window.scrollTo(0, 0);
}

function showServices(plan) {
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('programSection').classList.remove('active');
    
    const servicesSection = document.getElementById('servicesSection');
    const servicesTitle = document.getElementById('servicesTitle');
    const notasLink = document.getElementById('notasLink');
    const tareasLink = document.getElementById('tareasLink');
    
    if (servicesTitle) servicesTitle.textContent = `Servicios del Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
    
    if (plan === 'diario') {
        if (notasLink) notasLink.href = 'https://maestrocreamos.github.io/NOTASPLANDIARIO.github.io/';
        if (tareasLink) tareasLink.href = 'https://maestrocreamos.github.io/TAREASDIARIO.github.io/';
    } else if (plan === 'domingo') {
        if (notasLink) notasLink.href = 'https://maestrocreamos.github.io/NOTASDOMINGO.github.io/';
        if (tareasLink) tareasLink.href = 'https://maestrocreamos.github.io/TAREADOMINGO.github.io/';
    }
    
    if (servicesSection) {
        servicesSection.classList.add('active');
        window.scrollTo(0, 0);
    }
}

function showProgram() {
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('servicesSection').classList.remove('active');
    document.getElementById('programSection').classList.add('active');
    window.scrollTo(0, 0);
}

// ==================== GALERÍA DE FOTOS (FUNCIÓN RESTAURADA) ====================
function showPhotos(plan) {
    // URLs de las galerías de fotos
    const photoUrls = {
        'diario': 'https://creamos-educacion.infinityfreeapp.com/?i=2',  // URL real del Plan Diario
        'domingo': ''  // Plan Domingo aún en desarrollo
    };
    
    if (plan === 'diario' && photoUrls.diario) {
        // Abrir galería del Plan Diario
        window.open(photoUrls.diario, '_blank');
        showNotification('Abriendo galería del Plan Diario', 'success');
    } else if (plan === 'domingo') {
        if (photoUrls.domingo) {
            // Si en el futuro se agrega la URL del Plan Domingo
            window.open(photoUrls.domingo, '_blank');
            showNotification('Abriendo galería del Plan Domingo', 'success');
        } else {
            // Mensaje temporal para Plan Domingo
            showNotification('Galería del Plan Domingo próximamente disponible', 'info');
        }
    } else {
        // Mensaje genérico
        showNotification(`Galería del Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} próximamente disponible`, 'info');
    }
}

function showComingSoon(service) {
    alert(`${service}\n\nEsta sección estará disponible próximamente. Por favor mantente atento a nuestras actualizaciones.\n\nPara más información, contáctanos por WhatsApp.`);
}

// ==================== ADMIN MODE ====================
function initAdminMode() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            toggleAdminMode();
        }
    });
}

function toggleAdminMode() {
    isAdminMode = !isAdminMode;
    
    if (isAdminMode) {
        showNotification('🔧 Modo Administrador Activado', 'success');
        
        const reviewsDisplay = document.querySelector('.reviews-display');
        if (reviewsDisplay && !document.getElementById('adminControls')) {
            const adminControls = document.createElement('div');
            adminControls.id = 'adminControls';
            adminControls.style.cssText = 'text-align: center; margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px;';
            adminControls.innerHTML = `
                <p style="margin-bottom: 1rem; color: #e74c3c; font-weight: bold;">🔧 MODO ADMINISTRADOR</p>
                <button onclick="loadReviewsFromSheets(true)" class="btn btn-primary" style="margin-right: 1rem;">
                    🔄 Recargar Reseñas
                </button>
                <button onclick="testConnection()" class="btn btn-secondary" style="margin-right: 1rem;">
                    🧪 Probar Conexión
                </button>
                <button onclick="toggleAdminMode()" class="btn btn-secondary">
                    ❌ Salir
                </button>
            `;
            reviewsDisplay.insertBefore(adminControls, reviewsDisplay.firstChild);
        }
    } else {
        showNotification('👤 Modo Usuario Normal', 'info');
        
        const adminControls = document.getElementById('adminControls');
        if (adminControls) {
            adminControls.remove();
        }
    }
}

function testConnection() {
    console.log('🧪 Probando conexión...');
    showNotification('Probando conexión con Google Sheets...', 'info');
    loadReviewsFromSheets(true);
}

// ==================== NOTIFICATIONS ====================
function showNotification(message, type = 'success') {
    const notification = document.getElementById('successNotification');
    const messageEl = document.getElementById('successMessage');
    
    if (!notification || !messageEl) return;
    
    messageEl.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    const notification = document.getElementById('successNotification');
    if (notification) {
        notification.classList.remove('show');
    }
}

// ==================== SCROLL ANIMATIONS ====================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.service-card, .program-card, .feature-item, .review-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// ==================== SMOOTH SCROLLING ====================
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});



// ==================== CLEANUP ====================
window.addEventListener('beforeunload', function() {
    if (updateTimer) {
        clearInterval(updateTimer);
    }
    document.body.style.overflow = 'auto';
});

// ==================== DEBUG FUNCTIONS ====================
window.debugReviews = function() {
    console.log('🐛 DEBUG:');
    console.log('📊 Datos:', reviewsData);
    console.log('🔗 URL:', GOOGLE_SCRIPT_URL);
    console.log('🔧 Admin:', isAdminMode);
};

console.log('🚀 Script CREAMOS v3.3 - Completo con galería de fotos');
console.log('💡 Usa "debugReviews()" para debug');
console.log('🔧 Ctrl+Alt+D para modo admin');
console.log('📸 Galería Plan Diario: FUNCIONANDO');
console.log('📸 Galería Plan Domingo: En desarrollo');

function escapeHtml(text) {
    if (typeof text !== 'string') {
        return text;
    }
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { 
        return map[m]; 
    });
}

// ==================== VERIFICACIÓN ADICIONAL ====================
// También agregar esta verificación para evitar errores futuros
if (typeof window.escapeHtml === 'undefined') {
    window.escapeHtml = escapeHtml;
}

console.log('✅ Función escapeHtml agregada correctamente');