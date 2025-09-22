// ==================== CONVERSIONS.JS - CREAMOS EDUCACIÓN ====================
// Archivo completo con todas las funcionalidades integradas
// Versión 4.0 - Sistema de Cupos Automatizado + Funcionalidades Existentes

(function() {
    'use strict';
    
    // ==================== CONFIGURACIÓN GLOBAL ====================
    const CONVERSIONS = {
        initialized: false,
        intervals: [],
        timeouts: [],
        version: '4.0-automated'
    };
    
    // ==================== CONFIGURACIÓN DE APIS ====================
    const API_CONFIG = {
        cupos: {
            url: 'https://script.google.com/macros/s/AKfycbwcDWon8ntQsu-r4rnofuaRJFSvdc9nz39x7zvBDwAMaYJz7RLwqyLCH0kETKciSeVN/exec',
            updateInterval: 300000, // 5 minutos
            timeout: 15000, // 15 segundos
            retries: 3
        }
    };
    
    // ==================== DATOS DE CUPOS (FALLBACK LOCAL) ====================
    const fallbackCuposData = {
        diario: {
            primaria: { 
                occupied: 22,
                total: 30,
                level_name: 'Primaria'
            },
            basicos: { 
                occupied: 18,
                total: 30,
                level_name: 'Básicos'
            },
            bachillerato: { 
                occupied: 30,
                total: 30,
                level_name: 'Bachillerato'
            }
        },
        domingo: {
            basicos: { 
                occupied: 15,
                total: 30,
                level_name: 'Básicos'
            },
            bachillerato: { 
                occupied: 25,
                total: 30,
                level_name: 'Bachillerato'
            }
        }
    };
    
    // ==================== ESTADO DEL SISTEMA ====================
    let cuposData = { ...fallbackCuposData };
    let lastCuposUpdate = null;
    let cuposUpdateTimer = null;
    let isOnlineMode = false;
    
    // ==================== INICIALIZACIÓN PRINCIPAL ====================
    function initConversions() {
        let retries = 0;
        const maxRetries = 10;
        
        function checkScriptReady() {
            retries++;
            
            if (typeof window.loadReviewsFromSheets === 'function' && 
                typeof window.escapeHtml === 'function') {
                
                console.log('✅ Script.js verificado - Iniciando conversions completo');
                startAllFeatures();
                return;
            }
            
            if (retries < maxRetries) {
                console.log(`⏳ Esperando script.js... intento ${retries}/${maxRetries}`);
                setTimeout(checkScriptReady, 500);
            } else {
                console.log('⚠️ Script.js no completamente detectado - Iniciando funciones básicas');
                startBasicFeatures();
            }
        }
        
        checkScriptReady();
    }
    
    // ==================== INICIALIZAR TODAS LAS FUNCIONALIDADES ====================
    function startAllFeatures() {
        if (CONVERSIONS.initialized) return;
        
        try {
            console.log('🚀 Iniciando todas las funcionalidades de conversión...');
            
            initUrgencyCountdown();
            initTrustIndicators();
            initAvailabilityTrackerAutomated(); // Sistema automatizado
            initConversionEvents();
            initFAQSection();
            initOptimizations();
            initTestimonials(); 
	    initPrequalification();
            CONVERSIONS.initialized = true;
            console.log('✅ Todas las funcionalidades iniciadas exitosamente');
            
        } catch (error) {
            console.error('❌ Error al iniciar funcionalidades:', error);
            startBasicFeatures();
        }
    }
    
    // ==================== FUNCIONALIDADES BÁSICAS (FALLBACK) ====================
    function startBasicFeatures() {
        try {
            console.log('🔧 Iniciando funcionalidades básicas...');
            initUrgencyCountdown();
            initAvailabilityTrackerLocal(); // Sistema local como fallback
            CONVERSIONS.initialized = true;
        } catch (error) {
            console.error('❌ Error en funcionalidades básicas:', error);
        }
    }
    
    // ==================== SISTEMA DE CUPOS AUTOMATIZADO ====================
    
    async function loadCuposFromSheets() {
        try {
            console.log('📡 Consultando cupos desde Google Sheets...');
            
            // Método 1: Fetch directo
            let data;
            try {
                const response = await fetch(API_CONFIG.cupos.url + '?t=' + Date.now(), {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache',
                    signal: AbortSignal.timeout(API_CONFIG.cupos.timeout)
                });
                
                if (response.ok) {
                    data = await response.json();
                    console.log('✅ Datos recibidos via fetch');
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (fetchError) {
                console.log('⚠️ Fetch falló, intentando JSONP...', fetchError.message);
                data = await loadCuposWithJSONP();
            }
            
            if (data && data.success) {
                cuposData = data.data;
                lastCuposUpdate = new Date().toISOString();
                isOnlineMode = true;
                
                console.log('✅ Cupos actualizados desde Google Sheets');
                updateAvailabilityDisplay(cuposData);
                
                return data.data;
            } else {
                throw new Error(data?.error || 'Datos no válidos recibidos');
            }
            
        } catch (error) {
            console.error('❌ Error cargando cupos:', error);
            
            if (!isOnlineMode) {
                console.log('📋 Usando datos locales de fallback');
                updateAvailabilityDisplay(fallbackCuposData);
            }
            
            return null;
        }
    }
    
    function loadCuposWithJSONP() {
        return new Promise((resolve, reject) => {
            const callbackName = 'cuposCallback_' + Date.now();
            const script = document.createElement('script');
            
            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('Timeout en conexión JSONP'));
            }, API_CONFIG.cupos.timeout);
            
            function cleanup() {
                clearTimeout(timeoutId);
                if (window[callbackName]) {
                    delete window[callbackName];
                }
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            }
            
            window[callbackName] = function(data) {
                cleanup();
                resolve(data);
            };
            
            script.onerror = function() {
                cleanup();
                reject(new Error('Error al cargar script JSONP'));
            };
            
            script.src = `${API_CONFIG.cupos.url}?callback=${callbackName}&t=${Date.now()}`;
            document.head.appendChild(script);
        });
    }
    
    function initAvailabilityTrackerAutomated() {
        try {
            console.log('📈 Iniciando sistema de cupos automatizado');
            
            // Carga inicial
            loadCuposFromSheets();
            
            // Actualización periódica
            cuposUpdateTimer = setInterval(() => {
                loadCuposFromSheets();
            }, API_CONFIG.cupos.updateInterval);
            
            CONVERSIONS.intervals.push(cuposUpdateTimer);
            
            console.log(`✅ Sistema automatizado iniciado (actualización cada ${API_CONFIG.cupos.updateInterval/1000/60} minutos)`);
            
        } catch (error) {
            console.error('❌ Error en sistema automatizado:', error);
            initAvailabilityTrackerLocal();
        }
    }
    
    function initAvailabilityTrackerLocal() {
        try {
            console.log('📋 Iniciando sistema de cupos local');
            updateAvailabilityDisplay(fallbackCuposData);
            
            const localInterval = setInterval(() => {
                updateAvailabilityDisplay(fallbackCuposData);
            }, 300000);
            
            CONVERSIONS.intervals.push(localInterval);
            
        } catch (error) {
            console.error('❌ Error en sistema local:', error);
        }
    }
    
    // ==================== PROCESAMIENTO DE DATOS ====================
    function processAvailabilityData(data) {
        const processedData = JSON.parse(JSON.stringify(data));
        
        Object.keys(processedData).forEach(plan => {
            Object.keys(processedData[plan]).forEach(level => {
                const info = processedData[plan][level];
                
                info.available = info.total - info.occupied;
                info.percentage = Math.round((info.available / info.total) * 100);
                
                if (info.available === 0) {
                    info.status = 'full';
                    info.message = 'COMPLETO';
                } else if (info.percentage <= 25) {
                    info.status = 'warning';
                    info.message = `${info.available} cupos restantes`;
                } else {
                    info.status = 'available';
                    info.message = `${info.available} cupos disponibles`;
                }
            });
        });
        
        return processedData;
    }
    
    function updateAvailabilityDisplay(data) {
        try {
            const processedData = processAvailabilityData(data);
            const availabilityElements = document.querySelectorAll('.availability-status');
            
            if (availabilityElements.length > 0) {
                availabilityElements.forEach((element, index) => {
                    const statusItems = element.querySelectorAll('.status-item');
                    
                    if (index === 0) { // Plan Diario
                        const diarioData = processedData.diario;
                        if (statusItems[0] && diarioData.primaria) {
                            updateStatusItem(statusItems[0], diarioData.primaria);
                        }
                        if (statusItems[1] && diarioData.basicos) {
                            updateStatusItem(statusItems[1], diarioData.basicos);
                        }
                        if (statusItems[2] && diarioData.bachillerato) {
                            updateStatusItem(statusItems[2], diarioData.bachillerato);
                        }
                    } else if (index === 1) { // Plan Domingo
                        const domingoData = processedData.domingo;
                        if (statusItems[0] && domingoData.basicos) {
                            updateStatusItem(statusItems[0], domingoData.basicos);
                        }
                        if (statusItems[1] && domingoData.bachillerato) {
                            updateStatusItem(statusItems[1], domingoData.bachillerato);
                        }
                    }
                });
            }
            
            displayConsoleSummary(processedData);
            
        } catch (error) {
            console.error('❌ Error al actualizar disponibilidad:', error);
        }
    }
    
    function updateStatusItem(statusElement, data) {
        try {
            const dot = statusElement.querySelector('.status-dot');
            if (dot) {
                dot.className = `status-dot ${data.status}`;
            }
            
            const textSpan = statusElement.querySelector('span:not(.status-dot)');
            if (textSpan) {
                const originalText = textSpan.textContent || '';
                const levelName = originalText.split(':')[0] || data.level_name;
                textSpan.innerHTML = `${levelName}: ${data.message} <small style="color: #7f8c8d; font-weight: normal;">(${data.occupied}/${data.total})</small>`;
            }
            
        } catch (error) {
            console.error('Error actualizando status item:', error);
        }
    }
    
    function displayConsoleSummary(processedData) {
        console.log('📊 RESUMEN DE CUPOS CREAMOS:');
        console.log('╔════════════════════════════════════╗');
        
        Object.keys(processedData).forEach(plan => {
            console.log(`\n🔹 PLAN ${plan.toUpperCase()}:`);
            Object.keys(processedData[plan]).forEach(level => {
                const info = processedData[plan][level];
                const icon = info.status === 'full' ? '🔴' : 
                            info.status === 'warning' ? '🟡' : '🟢';
                console.log(`  ${icon} ${info.level_name}: ${info.occupied}/${info.total} (${info.available} disponibles)`);
            });
        });
        
        console.log(`\n⏰ Última actualización: ${lastCuposUpdate || 'Local'}`);
        console.log(`🌐 Modo: ${isOnlineMode ? 'Online (Google Sheets)' : 'Local (Fallback)'}`);
    }
    
    // ==================== COUNTDOWN DE URGENCIA ====================
    function initUrgencyCountdown() {
        try {
            const banner = document.getElementById('urgencyBanner');
            const daysEl = document.getElementById('days');
            const hoursEl = document.getElementById('hours');
            const minutesEl = document.getElementById('minutes');
            
            if (!banner || !daysEl || !hoursEl || !minutesEl) {
                console.log('ℹ️ Elementos de countdown no encontrados');
                return;
            }
            
            console.log('🎯 Iniciando countdown de urgencia');
            
            const deadline = new Date('2025-10-15T23:59:59').getTime();
            
            function updateCountdown() {
                try {
                    const now = new Date().getTime();
                    const distance = deadline - now;
                    
                    if (distance > 0) {
                        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                        
                        daysEl.textContent = String(days).padStart(2, '0');
                        hoursEl.textContent = String(hours).padStart(2, '0');
                        minutesEl.textContent = String(minutes).padStart(2, '0');
                        
                        updateUrgencyStyles(banner, days);
                        
                    } else {
                        handleDeadlineReached(banner, daysEl, hoursEl, minutesEl);
                    }
                } catch (error) {
                    console.error('Error en countdown:', error);
                }
            }
            
            updateCountdown();
            const countdownInterval = setInterval(updateCountdown, 1000);
            CONVERSIONS.intervals.push(countdownInterval);
            
        } catch (error) {
            console.error('Error en countdown de urgencia:', error);
        }
    }
    
    function updateUrgencyStyles(banner, days) {
        banner.classList.remove('critical-urgency', 'high-urgency');
        
        if (days <= 1) {
            banner.classList.add('critical-urgency');
        } else if (days <= 3) {
            banner.classList.add('high-urgency');
        }
    }
    
    function handleDeadlineReached(banner, daysEl, hoursEl, minutesEl) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        
        const urgencyText = banner.querySelector('.urgency-text');
        if (urgencyText) {
            urgencyText.textContent = '⏰ Pre-inscripciones CERRADAS';
        }
        
        const urgencyCta = banner.querySelector('.urgency-cta');
        if (urgencyCta) {
            urgencyCta.textContent = 'Lista de Espera';
            urgencyCta.style.background = '#95a5a6';
        }
        
        banner.style.background = 'linear-gradient(135deg, #95a5a6, #7f8c8d)';
        banner.style.animation = 'none';
    }
    
    // ==================== INDICADORES DE CONFIANZA ====================
    function initTrustIndicators() {
        try {
            const trustCounters = document.querySelectorAll('.trust-counter');
            
            if (trustCounters.length === 0) {
                console.log('ℹ️ Indicadores de confianza no encontrados');
                return;
            }
            
            console.log('📊 Iniciando indicadores de confianza');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            trustCounters.forEach(counter => {
                observer.observe(counter);
            });
            
        } catch (error) {
            console.error('Error en indicadores de confianza:', error);
        }
    }
    
    function animateCounter(element) {
        try {
            let target = parseInt(element.getAttribute('data-target'));
            
            if (!target) {
                const currentText = element.textContent.replace(/[^\d]/g, '');
                target = parseInt(currentText) || 0;
            }
            
            if (target === 0) return;
            
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;
            
            const animationInterval = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(animationInterval);
                }
                
                const displayValue = Math.floor(current);
                element.textContent = displayValue >= target && target > 100 ? `+${displayValue}` : displayValue;
                
            }, 16);
            
            CONVERSIONS.intervals.push(animationInterval);
            
        } catch (error) {
            console.error('Error en animación de contador:', error);
        }
    }
    
    // ==================== EVENTOS DE CONVERSIÓN ====================
    function initConversionEvents() {
        try {
            console.log('🎯 Iniciando eventos de conversión');
            
            document.addEventListener('click', handleConversionClicks);
            document.addEventListener('scroll', throttle(handleScrollUrgency, 100));
            document.addEventListener('mouseleave', handleExitIntent);
            
        } catch (error) {
            console.error('Error en eventos de conversión:', error);
        }
    }
    
    function handleConversionClicks(e) {
        try {
            const target = e.target;
            
            if (target.classList.contains('urgency-cta')) {
                trackConversionEvent('urgency_banner_click');
                return;
            }
            
            if (target.classList.contains('btn-primary') && target.textContent.includes('servicios')) {
                trackConversionEvent('program_card_click');
                return;
            }
            
            if (target.closest('a[href*="wa.me"]')) {
                trackConversionEvent('whatsapp_click');
                return;
            }
            
        } catch (error) {
            console.error('Error en manejo de clicks:', error);
        }
    }
    
    function handleScrollUrgency() {
        try {
            const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            
            if (scrollPercent > 50 && !sessionStorage.getItem('urgency_shown')) {
                triggerScrollUrgency();
                sessionStorage.setItem('urgency_shown', 'true');
            }
            
        } catch (error) {
            console.error('Error en scroll urgency:', error);
        }
    }
    
    function handleExitIntent(e) {
        try {
            if (e.clientY <= 0 && !sessionStorage.getItem('exit_intent_shown')) {
                triggerExitIntent();
                sessionStorage.setItem('exit_intent_shown', 'true');
            }
            
        } catch (error) {
            console.error('Error en exit intent:', error);
        }
    }
    
    function triggerScrollUrgency() {
        const banner = document.getElementById('urgencyBanner');
        if (banner) {
            banner.style.animation = 'urgencyPulse 1s ease-in-out 3';
            trackConversionEvent('scroll_urgency_triggered');
        }
    }
    
    function triggerExitIntent() {
        const banner = document.getElementById('urgencyBanner');
        if (banner) {
            banner.style.animation = 'criticalPulse 0.5s ease-in-out 5';
            trackConversionEvent('exit_intent_triggered');
        }
    }
    
    // ==================== SECCIÓN FAQ ====================
    function initFAQSection() {
        try {
            const faqItems = document.querySelectorAll('.faq-item');
            
            if (faqItems.length === 0) {
                console.log('ℹ️ Sección FAQ no encontrada');
                return;
            }
            
            console.log('❓ Iniciando sección FAQ');
            
            faqItems.forEach(item => {
                const question = item.querySelector('.faq-question');
                const answer = item.querySelector('.faq-answer');
                
                if (question && answer) {
                    question.addEventListener('click', () => {
                        const isOpen = item.classList.contains('active');
                        
                        // Cerrar todas las otras FAQ
                        faqItems.forEach(otherItem => {
                            if (otherItem !== item) {
                                otherItem.classList.remove('active');
                            }
                        });
                        
                        // Toggle actual
                        item.classList.toggle('active', !isOpen);
                        
                        trackConversionEvent('faq_opened');
                    });
                }
            });
            
        } catch (error) {
            console.error('Error en sección FAQ:', error);
        }
    }
    
    // ==================== OPTIMIZACIONES ====================
    function initOptimizations() {
        try {
            console.log('⚡ Iniciando optimizaciones');
            
            // Lazy loading para imágenes
            const images = document.querySelectorAll('img[data-src]');
            if (images.length > 0) {
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    });
                });
                
                images.forEach(img => imageObserver.observe(img));
            }
            
            // Precarga de recursos críticos
            preloadCriticalResources();
            
        } catch (error) {
            console.error('Error en optimizaciones:', error);
        }
    }
    
    function preloadCriticalResources() {
        const criticalUrls = [
            'https://wa.me/50255709214',
            'https://wa.me/50244160597'
        ];
        
        criticalUrls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
        });
    }
    
    // ==================== FUNCIONES DE UTILIDAD ====================
    function trackConversionEvent(eventName) {
        try {
            console.log(`📊 Evento de conversión: ${eventName}`);
            
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, {
                    event_category: 'conversion',
                    event_label: 'creamos_education'
                });
            }
            
        } catch (error) {
            console.error('Error en tracking:', error);
        }
    }
    
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    function showNotification(message, type = 'info') {
        try {
            if (typeof window.showNotification === 'function') {
                window.showNotification(message, type);
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        } catch (error) {
            console.error('Error en notificación:', error);
        }
    }
    
    // ==================== FUNCIONES DE LIMPIEZA ====================
    function cleanup() {
        CONVERSIONS.intervals.forEach(interval => {
            clearInterval(interval);
        });
        
        CONVERSIONS.timeouts.forEach(timeout => {
            clearTimeout(timeout);
        });
        
        CONVERSIONS.intervals = [];
        CONVERSIONS.timeouts = [];
        CONVERSIONS.initialized = false;
        
        console.log('🧹 Conversions limpiado');
    }
    
    // ==================== FUNCIONES DE DEBUG Y CONTROL ====================
    function debug() {
        console.log('🔧 DEBUG CONVERSIONS CREAMOS v4.0:');
        console.log('📊 Config:', CONVERSIONS);
        console.log('✅ Inicializado:', CONVERSIONS.initialized);
        console.log('⏱️ Intervals activos:', CONVERSIONS.intervals.length);
        console.log('🔗 Script.js funcionando:', typeof window.loadReviewsFromSheets === 'function');
        console.log('🔧 EscapeHtml disponible:', typeof window.escapeHtml === 'function');
        console.log('🌐 Modo cupos:', isOnlineMode ? 'Online' : 'Local');
        console.log('⏰ Última actualización cupos:', lastCuposUpdate || 'N/A');
        
        const elements = ['urgencyBanner', 'days', 'hours', 'minutes'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            console.log(`📋 ${id}:`, el ? '✅ Encontrado' : '❌ No encontrado');
        });
        
        const availElements = document.querySelectorAll('.availability-status');
        console.log(`📈 Elementos disponibilidad: ${availElements.length}`);
    }
    
    function diagnostic() {
        console.log('🏥 DIAGNÓSTICO COMPLETO DEL SISTEMA:');
        console.log('════════════════════════════════════════');
        
        // Estado general
        console.log(`📊 Sistema inicializado: ${CONVERSIONS.initialized ? '✅' : '❌'}`);
        console.log(`🌐 Modo de cupos: ${isOnlineMode ? '✅ Online (Google Sheets)' : '📋 Local (Fallback)'}`);
        console.log(`⏰ Última actualización: ${lastCuposUpdate || 'N/A'}`);
        
        // APIs
        console.log(`\n🔗 APIs configuradas:`);
        console.log(`  📡 Cupos: ${API_CONFIG.cupos.url}`);
        console.log(`  ⏱️ Intervalo actualización: ${API_CONFIG.cupos.updateInterval/1000/60} minutos`);
        
        // Elementos DOM
        console.log(`\n📋 Elementos DOM:`);
        const criticalElements = [
            'urgencyBanner', 'days', 'hours', 'minutes',
            '.availability-status', '.faq-item'
        ];
        
        criticalElements.forEach(selector => {
            const elements = selector.startsWith('.') ? 
                document.querySelectorAll(selector) : 
                [document.getElementById(selector)];
            
            const count = selector.startsWith('.') ? elements.length : (elements[0] ? 1 : 0);
            console.log(`  ${selector}: ${count > 0 ? '✅' : '❌'} (${count} elementos)`);
        });
        
        // Datos actuales
        console.log(`\n📊 Datos de cupos actuales:`);
        displayConsoleSummary(cuposData);
        
        return {
            initialized: CONVERSIONS.initialized,
            onlineMode: isOnlineMode,
            lastUpdate: lastCuposUpdate,
            intervals: CONVERSIONS.intervals.length,
            data: cuposData
        };
    }
    
    // ==================== EXPORTACIÓN GLOBAL ====================
    window.CREAMOS_CONVERSIONS = {
        debug: debug,
        cleanup: cleanup,
        restart: () => {
            cleanup();
            setTimeout(initConversions, 1000);
        },
        showNotification: showNotification,
        trackEvent: trackConversionEvent,
        config: CONVERSIONS,
        diagnostic: diagnostic
    };
    
    window.CREAMOS_CUPOS_AUTO = {
        info: () => cuposData,
        refresh: loadCuposFromSheets,
        diagnostic: diagnostic,
        status: () => ({
            online: isOnlineMode,
            lastUpdate: lastCuposUpdate,
            updateInterval: API_CONFIG.cupos.updateInterval
        }),
        clearCache: () => {
            cuposData = { ...fallbackCuposData };
            lastCuposUpdate = null;
            isOnlineMode = false;
            updateAvailabilityDisplay(cuposData);
            console.log('🗑️ Cache de cupos limpiado');
        },
        forceLocal: () => {
            isOnlineMode = false;
            updateAvailabilityDisplay(fallbackCuposData);
            console.log('📋 Forzando modo local');
        },
        forceOnline: async () => {
            console.log('🌐 Forzando actualización online...');
            return await loadCuposFromSheets();
        }
    };
    
    // Mantener compatibilidad con sistema anterior
    window.CREAMOS_CUPOS = {
        info: () => {
            console.log('ℹ️ Usando CREAMOS_CUPOS_AUTO.info() - Sistema automatizado activo');
            return window.CREAMOS_CUPOS_AUTO.info();
        },
        data: () => cuposData,
        refresh: () => window.CREAMOS_CUPOS_AUTO.refresh(),
        update: (plan, level, occupied, total) => {
            console.log('⚠️ Función manual deshabilitada - Sistema automatizado activo');
            console.log('🔄 Para actualizar cupos, modifica el Google Sheet directamente');
            console.log(`📊 Datos solicitados: ${plan} ${level} - ${occupied}/${total}`);
        },
        reset: () => {
            console.log('🔄 Reseteando a datos locales...');
            window.CREAMOS_CUPOS_AUTO.clearCache();
        }
    };
    
    // ==================== FAQ CONTROLS ====================
    window.CREAMOS_FAQ = {
        openAll: () => {
            const faqItems = document.querySelectorAll('.faq-item');
            faqItems.forEach(item => item.classList.add('active'));
            console.log('📖 Todas las FAQ abiertas');
        },
        closeAll: () => {
            const faqItems = document.querySelectorAll('.faq-item');
            faqItems.forEach(item => item.classList.remove('active'));
            console.log('📕 Todas las FAQ cerradas');
        },
        toggle: (index) => {
            const faqItems = document.querySelectorAll('.faq-item');
            if (faqItems[index]) {
                faqItems[index].classList.toggle('active');
                console.log(`❓ FAQ ${index + 1} alternada`);
            }
        }
    };
    
    // ==================== INICIALIZACIÓN AUTOMÁTICA ====================
    window.addEventListener('beforeunload', cleanup);
    
    if (document.readyState === 'complete') {
        setTimeout(initConversions, 1000);
    } else {
        window.addEventListener('load', function() {
            setTimeout(initConversions, 1000);
        });
    }
    
    // ==================== LOG DE INICIO ====================
    console.log('🚀 CREAMOS Conversions v4.0 - Sistema Automatizado');
    console.log('══════════════════════════════════════════════════');
    console.log('🔧 Debug completo: CREAMOS_CONVERSIONS.debug()');
    console.log('📊 Cupos automáticos: CREAMOS_CUPOS_AUTO.info()');
    console.log('🏥 Diagnóstico: CREAMOS_CUPOS_AUTO.diagnostic()');
    console.log('❓ FAQ: CREAMOS_FAQ.openAll() / closeAll()');
    console.log('🌐 API Cupos:', API_CONFIG.cupos.url);
    console.log('⏱️ Actualización cada:', API_CONFIG.cupos.updateInterval/1000/60, 'minutos');
    console.log('══════════════════════════════════════════════════');

function initTestimonials() {
    try {
        console.log('🗣️ Iniciando sección de testimonios');
        
        // Intersection Observer para animaciones
        const testimonialCards = document.querySelectorAll('.testimonial-card');
        
        if (testimonialCards.length === 0) {
            console.log('ℹ️ No se encontraron tarjetas de testimonios');
            return;
        }
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    
                    // Track event
                    if (typeof trackConversionEvent === 'function') {
                        trackConversionEvent('testimonial_viewed');
                    }
                    
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        });
        
        testimonialCards.forEach(card => {
            observer.observe(card);
        });
        
        // Event tracking para CTA de testimonios
        const testimonialCTA = document.querySelector('.testimonials-cta .btn');
        if (testimonialCTA) {
            testimonialCTA.addEventListener('click', () => {
                if (typeof trackConversionEvent === 'function') {
                    trackConversionEvent('testimonial_cta_click');
                }
            });
        }
        
        console.log('✅ Testimonios inicializados exitosamente');
        
    } catch (error) {
        console.error('❌ Error en testimonios:', error);
    }
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'complete') {
    initTestimonials();
} else {
    window.addEventListener('load', initTestimonials);
}

// Agregar a la exportación global si existe
if (window.CREAMOS_CONVERSIONS) {
    window.CREAMOS_CONVERSIONS.initTestimonials = initTestimonials;
}





// ==================== SISTEMA DE PRE-CALIFICACIÓN CORREGIDO ====================
// Agregar al final de conversions.js (reemplazar la versión anterior)

// Variables del sistema de pre-calificación
let prequalificationData = {
    gender: null,
    education: null,
    availability: null
};

let currentStep = 1;
let prequalificationTimer = null;

// ==================== INICIALIZACIÓN ====================
function initPrequalification() {
    try {
        console.log('🎯 Iniciando sistema de pre-calificación');
        
        // Mostrar modal después de 30 segundos, solo una vez por sesión
        if (!sessionStorage.getItem('prequalification_shown')) {
            prequalificationTimer = setTimeout(() => {
                showPrequalification();
                sessionStorage.setItem('prequalification_shown', 'true');
            }, 30000); // 30 segundos
        }
        
        // Agregar event listeners para cerrar modal
        setupModalEventListeners();
        
        console.log('✅ Pre-calificación configurada');
        
    } catch (error) {
        console.error('❌ Error en pre-calificación:', error);
    }
}

function setupModalEventListeners() {
    // Event listener para cerrar con X
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('prequalification-close')) {
            closePrequalification();
        }
    });
    
    // Event listener para cerrar al hacer click fuera del modal
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('prequalification-overlay')) {
            closePrequalification();
        }
    });
    
    // Event listener para tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closePrequalification();
        }
    });
}

// ==================== FUNCIONES DE CONTROL ====================
function showPrequalification() {
    const modal = document.getElementById('prequalificationModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Reset al paso 1
        currentStep = 1;
        resetQuizState();
        
        // Track event
        if (typeof trackConversionEvent === 'function') {
            trackConversionEvent('prequalification_opened');
        }
        
        console.log('🎯 Modal de pre-calificación abierto');
    } else {
        console.error('❌ Modal de pre-calificación no encontrado en HTML');
    }
}

function closePrequalification() {
    const modal = document.getElementById('prequalificationModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Track event
        if (typeof trackConversionEvent === 'function') {
            trackConversionEvent('prequalification_closed');
        }
        
        console.log('❌ Modal de pre-calificación cerrado');
    }
}

function resetQuizState() {
    // Reset data
    prequalificationData = {
        gender: null,
        education: null,
        availability: null
    };
    
    currentStep = 1;
    
    // Reset UI
    document.querySelectorAll('.question-step').forEach(step => {
        step.classList.remove('active');
    });
    
    document.querySelectorAll('.progress-step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Mostrar primer paso
    const step1 = document.getElementById('step1');
    if (step1) {
        step1.classList.add('active');
    }
    
    const progress1 = document.querySelector('[data-step="1"]');
    if (progress1) {
        progress1.classList.add('active');
    }
}

// ==================== FUNCIONES DE NAVEGACIÓN ====================
function selectAnswer(question, value, displayText) {
    try {
        console.log(`📝 Respuesta seleccionada: ${question} = ${value}`);
        
        // Guardar respuesta
        prequalificationData[question] = value;
        
        // Marcar opción seleccionada
        const currentStepEl = document.getElementById(`step${currentStep}`);
        if (currentStepEl) {
            const buttons = currentStepEl.querySelectorAll('.option-btn');
            buttons.forEach(btn => btn.classList.remove('selected'));
            
            // Buscar el botón clickeado
            const clickedButton = event.target.closest('.option-btn');
            if (clickedButton) {
                clickedButton.classList.add('selected');
            }
        }
        
        // Track event
        if (typeof trackConversionEvent === 'function') {
            trackConversionEvent(`prequalification_${question}_${value}`);
        }
        
        // Avanzar al siguiente paso después de un delay
        setTimeout(() => {
            nextStep();
        }, 800);
        
    } catch (error) {
        console.error('❌ Error seleccionando respuesta:', error);
    }
}

function nextStep() {
    try {
        console.log(`🚀 Avanzando del paso ${currentStep} al ${currentStep + 1}`);
        
        // Ocultar paso actual
        const currentStepEl = document.getElementById(`step${currentStep}`);
        if (currentStepEl) {
            currentStepEl.classList.remove('active');
        }
        
        // Marcar progreso como completado
        const progressStep = document.querySelector(`[data-step="${currentStep}"]`);
        if (progressStep) {
            progressStep.classList.remove('active');
            progressStep.classList.add('completed');
        }
        
        // Avanzar paso
        currentStep++;
        
        if (currentStep <= 3) {
            // Mostrar siguiente pregunta
            const nextStepEl = document.getElementById(`step${currentStep}`);
            if (nextStepEl) {
                nextStepEl.classList.add('active');
            }
            
            // Activar indicador de progreso
            const nextProgressStep = document.querySelector(`[data-step="${currentStep}"]`);
            if (nextProgressStep) {
                nextProgressStep.classList.add('active');
            }
        } else {
            // Mostrar resultado
            showRecommendation();
        }
        
    } catch (error) {
        console.error('❌ Error avanzando paso:', error);
    }
}

function showRecommendation() {
    try {
        console.log('🎯 Mostrando recomendación final');
        
        // Mostrar paso de resultado
        const resultStep = document.getElementById('result');
        if (resultStep) {
            resultStep.classList.add('active');
        }
        
        // Activar indicador final
        const resultProgress = document.querySelector(`[data-step="result"]`);
        if (resultProgress) {
            resultProgress.classList.add('active');
        }
        
        // Generar recomendación
        const recommendation = generateRecommendation();
        
        // Mostrar recomendación
        displayRecommendation(recommendation);
        
        // Track event
        if (typeof trackConversionEvent === 'function') {
            trackConversionEvent('prequalification_recommendation_shown');
        }
        
    } catch (error) {
        console.error('❌ Error mostrando recomendación:', error);
    }
}

// ==================== LÓGICA DE RECOMENDACIÓN ====================
function generateRecommendation() {
    const { gender, education, availability } = prequalificationData;
    
    console.log('📊 Generando recomendación con datos:', prequalificationData);
    
    let recommendation = {
        plan: '',
        whatsapp: '',
        details: [],
        suitable: true,
        message: ''
    };
    
    // Lógica de recomendación
    if (gender === 'female') {
        // Mujeres → Plan Diario
        recommendation.plan = 'Plan Diario';
        recommendation.whatsapp = '50255709214';
        recommendation.details = [
            { icon: '📅', text: 'Lunes a Jueves según tu grado' },
            { icon: '🕐', text: 'Horario: 8:15 AM - 3:30 PM' },
            { icon: '👶', text: 'Servicio de cuidado infantil incluido' },
            { icon: '👩‍🎓', text: 'Ambiente diseñado para mujeres' }
        ];
        
        if (education === 'none') {
            recommendation.details.push({ icon: '📖', text: 'Comenzarás con primaria acelerada' });
        } else if (education === 'primary') {
            recommendation.details.push({ icon: '📚', text: 'Comenzarás con básicos acelerados' });
        } else if (education === 'basic') {
            recommendation.details.push({ icon: '🎓', text: 'Comenzarás con bachillerato acelerado' });
        }
        
    } else if (gender === 'male') {
        // Hombres → Plan Domingo
        recommendation.plan = 'Plan Domingo';
        recommendation.whatsapp = '50244160597';
        recommendation.details = [
            { icon: '🗓️', text: 'Solo los domingos' },
            { icon: '🕐', text: 'Horario: 8:15 AM - 3:30 PM' },
            { icon: '👨‍💼', text: 'Ideal para trabajadores' },
            { icon: '🤝', text: 'Ambiente colaborativo masculino' }
        ];
        
        if (education === 'none' || education === 'primary') {
            recommendation.details.push({ icon: '📚', text: 'Comenzarás con básicos acelerados' });
        } else if (education === 'basic') {
            recommendation.details.push({ icon: '🎓', text: 'Comenzarás con bachillerato acelerado' });
        }
    }
    
    // Verificar disponibilidad
    if (availability === 'weekdays' && gender === 'male') {
        recommendation.message = 'Aunque prefieres días de semana, el Plan Domingo podría adaptarse mejor a tu perfil. ¡Muchos trabajadores encuentran este horario muy conveniente!';
    } else if (availability === 'weekends' && gender === 'female') {
        recommendation.message = 'Aunque prefieres fines de semana, el Plan Diario incluye servicios especiales como cuidado infantil que podrían beneficiarte.';
    }
    
    return recommendation;
}

function displayRecommendation(recommendation) {
    try {
        console.log('🎨 Mostrando recomendación:', recommendation);
        
        // Actualizar título del plan
        const planNameEl = document.getElementById('planName');
        if (planNameEl) {
            planNameEl.textContent = recommendation.plan;
        }
        
        // Actualizar detalles
        const detailsContainer = document.getElementById('planDetails');
        if (detailsContainer) {
            detailsContainer.innerHTML = recommendation.details.map(detail => 
                `<div class="plan-detail-item">
                    <span class="plan-detail-icon">${detail.icon}</span>
                    <span>${detail.text}</span>
                </div>`
            ).join('');
            
            // Agregar mensaje adicional si existe
            if (recommendation.message) {
                detailsContainer.innerHTML += `
                    <div class="plan-detail-item" style="margin-top: 1rem; padding: 1rem; background: rgba(241, 196, 15, 0.1); border-radius: 8px;">
                        <span class="plan-detail-icon">💡</span>
                        <span style="color: #f39c12; font-weight: 600;">${recommendation.message}</span>
                    </div>
                `;
            }
        }
        
        // Actualizar enlaces de WhatsApp
        const whatsappContainer = document.getElementById('whatsappLinks');
        if (whatsappContainer) {
            whatsappContainer.innerHTML = `
                <a href="https://wa.me/${recommendation.whatsapp}?text=Hola,%20el%20sistema%20de%20pre-calificación%20me%20recomendó%20el%20${recommendation.plan}.%20Me%20gustaría%20obtener%20más%20información." 
                   class="whatsapp-link" target="_blank">
                    📱 WhatsApp ${recommendation.plan}
                </a>
            `;
        }
        
        // Configurar botón de inscripción
        const enrollBtn = document.getElementById('enrollBtn');
        if (enrollBtn) {
            enrollBtn.onclick = () => proceedToEnrollment(recommendation.plan);
        }
        
    } catch (error) {
        console.error('❌ Error mostrando recomendación:', error);
    }
}

// ==================== FUNCIONES AUXILIARES ====================
function proceedToEnrollment(planName) {
    // Track event
    if (typeof trackConversionEvent === 'function') {
        trackConversionEvent('prequalification_enrollment_clicked');
    }
    
    // Cerrar modal
    closePrequalification();
    
    // Abrir modal de inscripciones
    setTimeout(() => {
        if (typeof showInscripcionesModal === 'function') {
            showInscripcionesModal();
        }
    }, 500);
}

function restartQuiz() {
    try {
        console.log('🔄 Reiniciando quiz');
        resetQuizState();
        
        // Track event
        if (typeof trackConversionEvent === 'function') {
            trackConversionEvent('prequalification_restarted');
        }
        
    } catch (error) {
        console.error('❌ Error reiniciando quiz:', error);
    }
}

// ==================== FUNCIONES GLOBALES ====================
// Exportar funciones al contexto global
window.selectAnswer = selectAnswer;
window.closePrequalification = closePrequalification;
window.proceedToEnrollment = proceedToEnrollment;
window.restartQuiz = restartQuiz;
window.showPrequalificationManual = function() {
    sessionStorage.removeItem('prequalification_shown');
    showPrequalification();
};

// ==================== INICIALIZACIÓN AUTOMÁTICA ====================
// Limpiar timer al cerrar página
window.addEventListener('beforeunload', function() {
    if (prequalificationTimer) {
        clearTimeout(prequalificationTimer);
    }
});

// Auto-inicializar
if (document.readyState === 'complete') {
    setTimeout(initPrequalification, 1000);
} else {
    window.addEventListener('load', function() {
        setTimeout(initPrequalification, 1000);
    });
}

// Agregar a exportaciones existentes
if (window.CREAMOS_CONVERSIONS) {
    window.CREAMOS_CONVERSIONS.initPrequalification = initPrequalification;
    window.CREAMOS_CONVERSIONS.showPrequalification = showPrequalificationManual;
    window.CREAMOS_CONVERSIONS.selectAnswer = selectAnswer;
}

console.log('🎯 Sistema de pre-calificación v2.0 cargado');
console.log('🔧 Debug manual: showPrequalificationManual()');
console.log('📊 Funciones globales: selectAnswer, closePrequalification, restartQuiz');





    
// ==================== JAVASCRIPT EQUIPO DOCENTE ====================
// Agregar al final de conversions.js

function initTeamSection() {
    try {
        console.log('👥 Iniciando sección de equipo docente');
        
        const teamMembers = document.querySelectorAll('.team-member');
        
        if (teamMembers.length === 0) {
            console.log('ℹ️ No se encontraron miembros del equipo');
            return;
        }
        
        // Intersection Observer para animaciones de entrada
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        });
        
        teamMembers.forEach(member => {
            observer.observe(member);
        });
        
        // Click events para móvil
        teamMembers.forEach(member => {
            member.addEventListener('click', function(e) {
                // Solo en dispositivos móviles
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    
                    // Remover active de otros miembros
                    teamMembers.forEach(otherMember => {
                        if (otherMember !== member) {
                            otherMember.classList.remove('active');
                        }
                    });
                    
                    // Toggle active en el actual
                    member.classList.toggle('active');
                    
                    // Track event
                    if (typeof trackConversionEvent === 'function') {
                        const memberNumber = member.getAttribute('data-member');
                        trackConversionEvent(`team_member_${memberNumber}_clicked`);
                    }
                }
            });
            
            // Hover events para desktop
            member.addEventListener('mouseenter', function() {
                if (window.innerWidth > 768) {
                    if (typeof trackConversionEvent === 'function') {
                        const memberNumber = member.getAttribute('data-member');
                        trackConversionEvent(`team_member_${memberNumber}_hovered`);
                    }
                }
            });
        });
        
        // Cerrar overlays al hacer click fuera (móvil)
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.team-member') && window.innerWidth <= 768) {
                teamMembers.forEach(member => {
                    member.classList.remove('active');
                });
            }
        });
        
        console.log('✅ Equipo docente inicializado exitosamente');
        
    } catch (error) {
        console.error('❌ Error en equipo docente:', error);
    }
}

// Auto-inicializar
if (document.readyState === 'complete') {
    initTeamSection();
} else {
    window.addEventListener('load', initTeamSection);
}

// Exportar función
if (window.CREAMOS_CONVERSIONS) {
    window.CREAMOS_CONVERSIONS.initTeamSection = initTeamSection;
}

console.log('👥 Sistema de equipo docente cargado');

// ==================== JAVASCRIPT FALTANTE PARA FAQ Y TESTIMONIOS ====================
// Agregar al final de conversions.js

// ==================== FAQ MEJORADO ====================
function initFAQSection() {
    try {
        const faqItems = document.querySelectorAll('.faq-item');
        
        if (faqItems.length === 0) {
            console.log('ℹ️ Sección FAQ no encontrada');
            return;
        }
        
        console.log('❓ Iniciando sección FAQ');
        
        faqItems.forEach((item, index) => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            if (question && answer) {
                question.addEventListener('click', () => {
                    const isOpen = item.classList.contains('active');
                    
                    // Cerrar todas las otras FAQ
                    faqItems.forEach(otherItem => {
                        if (otherItem !== item) {
                            otherItem.classList.remove('active');
                        }
                    });
                    
                    // Toggle actual
                    item.classList.toggle('active', !isOpen);
                    
                    // Track event
                    if (typeof trackConversionEvent === 'function') {
                        trackConversionEvent(`faq_opened_${index + 1}`);
                    }
                });
                
                // Agregar animación de entrada con delay
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
        
        // Estilo inicial para animación
        faqItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            item.style.transition = 'all 0.6s ease';
        });
        
        console.log('✅ FAQ inicializado exitosamente');
        
    } catch (error) {
        console.error('❌ Error en sección FAQ:', error);
    }
}

// Función para toggle individual de FAQ
function toggleFAQ(questionElement) {
    const faqItem = questionElement.closest('.faq-item');
    if (faqItem) {
        const isOpen = faqItem.classList.contains('active');
        
        // Cerrar todas las otras FAQ
        const allFaqItems = document.querySelectorAll('.faq-item');
        allFaqItems.forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('active');
            }
        });
        
        // Toggle actual
        faqItem.classList.toggle('active', !isOpen);
        
        // Track event
        if (typeof trackConversionEvent === 'function') {
            const questionText = questionElement.textContent.substring(0, 30);
            trackConversionEvent(`faq_clicked_${questionText}`);
        }
    }
}

// ==================== TESTIMONIOS MEJORADO ====================
function initTestimonials() {
    try {
        console.log('🗣️ Iniciando sección de testimonios');
        
        // Intersection Observer para animaciones
        const testimonialCards = document.querySelectorAll('.testimonial-card');
        
        if (testimonialCards.length === 0) {
            console.log('ℹ️ No se encontraron tarjetas de testimonios');
            return;
        }
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    
                    // Track event
                    if (typeof trackConversionEvent === 'function') {
                        trackConversionEvent('testimonial_viewed');
                    }
                    
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        });
        
        testimonialCards.forEach((card, index) => {
            observer.observe(card);
            
            // Agregar delay escalonado para mejor efecto visual
            card.style.animationDelay = `${index * 0.1}s`;
        });
        
        // Event tracking para CTA de testimonios
        const testimonialCTA = document.querySelector('.testimonials-cta .btn');
        if (testimonialCTA) {
            testimonialCTA.addEventListener('click', () => {
                if (typeof trackConversionEvent === 'function') {
                    trackConversionEvent('testimonial_cta_click');
                }
            });
        }
        
        // Manejar imágenes de testimonios placeholder
        const testimonialPhotos = document.querySelectorAll('.student-photo');
        testimonialPhotos.forEach((photo, index) => {
            photo.addEventListener('error', function() {
                // Si la imagen no carga, mostrar placeholder
                this.style.background = 'linear-gradient(135deg, #ecf0f1, #bdc3c7)';
                this.style.display = 'flex';
                this.style.alignItems = 'center';
                this.style.justifyContent = 'center';
                this.style.color = '#7f8c8d';
                this.style.fontSize = '0.8rem';
                this.innerHTML = '👤';
            });
        });
        
        console.log('✅ Testimonios inicializados exitosamente');
        
    } catch (error) {
        console.error('❌ Error en testimonios:', error);
    }
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'complete') {
    initTestimonials();
    initFAQSection();
} else {
    window.addEventListener('load', function() {
        initTestimonials();
        initFAQSection();
    });
}

// Agregar a la exportación global si existe
if (window.CREAMOS_CONVERSIONS) {
    window.CREAMOS_CONVERSIONS.initTestimonials = initTestimonials;
    window.CREAMOS_CONVERSIONS.initFAQSection = initFAQSection;
    window.CREAMOS_CONVERSIONS.toggleFAQ = toggleFAQ;
}

// ==================== FAQ CONTROLS MEJORADOS ====================
window.CREAMOS_FAQ = {
    openAll: () => {
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => item.classList.add('active'));
        console.log('📖 Todas las FAQ abiertas');
        
        if (typeof trackConversionEvent === 'function') {
            trackConversionEvent('faq_open_all');
        }
    },
    closeAll: () => {
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => item.classList.remove('active'));
        console.log('📕 Todas las FAQ cerradas');
        
        if (typeof trackConversionEvent === 'function') {
            trackConversionEvent('faq_close_all');
        }
    },
    toggle: (index) => {
        const faqItems = document.querySelectorAll('.faq-item');
        if (faqItems[index]) {
            faqItems[index].classList.toggle('active');
            console.log(`❓ FAQ ${index + 1} alternada`);
            
            if (typeof trackConversionEvent === 'function') {
                trackConversionEvent(`faq_toggle_${index + 1}`);
            }
        }
    },
    getStatus: () => {
        const faqItems = document.querySelectorAll('.faq-item');
        const openItems = document.querySelectorAll('.faq-item.active');
        console.log(`📊 FAQ Status: ${openItems.length}/${faqItems.length} abiertas`);
        return {
            total: faqItems.length,
            open: openItems.length,
            closed: faqItems.length - openItems.length
        };
    }
};

// ==================== TESTIMONIALS CONTROLS ====================
window.CREAMOS_TESTIMONIALS = {
    info: () => {
        const testimonialCards = document.querySelectorAll('.testimonial-card');
        const animatedCards = document.querySelectorAll('.testimonial-card.animate-in');
        console.log(`🗣️ Testimonios: ${testimonialCards.length} total, ${animatedCards.length} animados`);
        return {
            total: testimonialCards.length,
            animated: animatedCards.length
        };
    },
    animateAll: () => {
        const testimonialCards = document.querySelectorAll('.testimonial-card');
        testimonialCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 100);
        });
        console.log('✨ Todos los testimonios animados');
    },
    resetAnimation: () => {
        const testimonialCards = document.querySelectorAll('.testimonial-card');
        testimonialCards.forEach(card => {
            card.classList.remove('animate-in');
        });
        console.log('🔄 Animaciones de testimonios reseteadas');
    }
};

// ==================== FUNCIONES DE UTILIDAD ====================
function enhanceUserExperience() {
    // Smooth scroll para enlaces internos FAQ
    const faqLinks = document.querySelectorAll('a[href^="#faq"]');
    faqLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                if (typeof trackConversionEvent === 'function') {
                    trackConversionEvent('faq_scroll_to');
                }
            }
        });
    });
    
    // Lazy loading mejorado para imágenes de testimonios
    const testimonialImages = document.querySelectorAll('.student-photo[data-src]');
    if (testimonialImages.length > 0) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        testimonialImages.forEach(img => imageObserver.observe(img));
    }
}

// Auto-inicializar mejoras de experiencia
document.addEventListener('DOMContentLoaded', enhanceUserExperience);

console.log('🎯 FAQ y Testimonios - Sistema completo cargado');
console.log('📖 Comandos FAQ: CREAMOS_FAQ.openAll(), CREAMOS_FAQ.closeAll(), CREAMOS_FAQ.toggle(index)');
console.log('🗣️ Comandos Testimonios: CREAMOS_TESTIMONIALS.info(), CREAMOS_TESTIMONIALS.animateAll()');


// ==================== FAQ JAVASCRIPT CORREGIDO ==================== 
// Agregar al final de conversions.js

// ==================== FAQ MEJORADO CON EVENT LISTENERS ====================
function initFAQSection() {
    try {
        console.log('❓ Iniciando sección FAQ');
        
        const faqItems = document.querySelectorAll('.faq-item');
        
        if (faqItems.length === 0) {
            console.log('ℹ️ Sección FAQ no encontrada');
            return;
        }
        
        faqItems.forEach((item, index) => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            const toggle = item.querySelector('.faq-toggle');
            
            if (question && answer) {
                // Función para manejar el toggle
                function handleFAQToggle() {
                    const isOpen = item.classList.contains('active');
                    
                    // Cerrar todas las otras FAQ
                    faqItems.forEach(otherItem => {
                        if (otherItem !== item) {
                            otherItem.classList.remove('active');
                            const otherToggle = otherItem.querySelector('.faq-toggle');
                            if (otherToggle) otherToggle.textContent = '+';
                        }
                    });
                    
                    // Toggle actual
                    item.classList.toggle('active', !isOpen);
                    
                    // Cambiar el icono
                    if (toggle) {
                        toggle.textContent = !isOpen ? '−' : '+';
                    }
                    
                    // Track event
                    if (typeof trackConversionEvent === 'function') {
                        trackConversionEvent(`faq_opened_${index + 1}`);
                    }
                    
                    console.log(`❓ FAQ ${index + 1} ${!isOpen ? 'abierta' : 'cerrada'}`);
                }
                
                // Agregar event listener
                question.addEventListener('click', handleFAQToggle);
                
                // Agregar animación de entrada con delay
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
        
        // Estilo inicial para animación
        faqItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            item.style.transition = 'all 0.6s ease';
        });
        
        console.log(`✅ FAQ inicializado exitosamente - ${faqItems.length} preguntas`);
        
    } catch (error) {
        console.error('❌ Error en sección FAQ:', error);
    }
}

// Función legacy para compatibilidad (por si acaso)
function toggleFAQ(questionElement) {
    console.log('⚠️ toggleFAQ legacy llamada');
    const faqItem = questionElement.closest('.faq-item');
    if (faqItem) {
        const isOpen = faqItem.classList.contains('active');
        
        // Cerrar todas las otras FAQ
        const allFaqItems = document.querySelectorAll('.faq-item');
        allFaqItems.forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('active');
                const toggle = item.querySelector('.faq-toggle');
                if (toggle) toggle.textContent = '+';
            }
        });
        
        // Toggle actual
        faqItem.classList.toggle('active', !isOpen);
        
        // Cambiar icono
        const toggle = faqItem.querySelector('.faq-toggle');
        if (toggle) {
            toggle.textContent = !isOpen ? '−' : '+';
        }
        
        // Track event
        if (typeof trackConversionEvent === 'function') {
            const questionText = questionElement.textContent.substring(0, 30);
            trackConversionEvent(`faq_clicked_${questionText}`);
        }
    }
}

// ==================== ASEGURAR INICIALIZACIÓN ====================
// Múltiples métodos para asegurar que se inicialice

// Método 1: DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOMContentLoaded - Iniciando FAQ');
    setTimeout(initFAQSection, 100);
});

// Método 2: Window Load
window.addEventListener('load', function() {
    console.log('🎯 Window Load - Verificando FAQ');
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
        setTimeout(initFAQSection, 200);
    }
});

// Método 3: Auto-ejecución con retry
(function initFAQWithRetry() {
    let attempts = 0;
    const maxAttempts = 10;
    
    function tryInit() {
        attempts++;
        const faqItems = document.querySelectorAll('.faq-item');
        
        if (faqItems.length > 0) {
            console.log(`🎯 FAQ encontrado en intento ${attempts}`);
            initFAQSection();
        } else if (attempts < maxAttempts) {
            console.log(`⏳ FAQ no encontrado, reintentando... (${attempts}/${maxAttempts})`);
            setTimeout(tryInit, 500);
        } else {
            console.log('⚠️ FAQ no encontrado después de múltiples intentos');
        }
    }
    
    // Iniciar después de un delay
    setTimeout(tryInit, 1000);
})();

// ==================== EXPORTAR FUNCIONES ====================
// Exportar a contexto global para compatibilidad
window.toggleFAQ = toggleFAQ;
window.initFAQSection = initFAQSection;

// Agregar a la exportación CREAMOS si existe
if (window.CREAMOS_CONVERSIONS) {
    window.CREAMOS_CONVERSIONS.initFAQSection = initFAQSection;
    window.CREAMOS_CONVERSIONS.toggleFAQ = toggleFAQ;
}

// ==================== FAQ CONTROLS MEJORADOS ====================
window.CREAMOS_FAQ = {
    openAll: () => {
        const faqItems = document.querySelectorAll('.faq-item');
        const toggles = document.querySelectorAll('.faq-toggle');
        
        faqItems.forEach(item => item.classList.add('active'));
        toggles.forEach(toggle => toggle.textContent = '−');
        
        console.log('📖 Todas las FAQ abiertas');
        
        if (typeof trackConversionEvent === 'function') {
            trackConversionEvent('faq_open_all');
        }
    },
    
    closeAll: () => {
        const faqItems = document.querySelectorAll('.faq-item');
        const toggles = document.querySelectorAll('.faq-toggle');
        
        faqItems.forEach(item => item.classList.remove('active'));
        toggles.forEach(toggle => toggle.textContent = '+');
        
        console.log('📕 Todas las FAQ cerradas');
        
        if (typeof trackConversionEvent === 'function') {
            trackConversionEvent('faq_close_all');
        }
    },
    
    toggle: (index) => {
        const faqItems = document.querySelectorAll('.faq-item');
        if (faqItems[index]) {
            const item = faqItems[index];
            const toggle = item.querySelector('.faq-toggle');
            const isOpen = item.classList.contains('active');
            
            item.classList.toggle('active');
            if (toggle) {
                toggle.textContent = isOpen ? '+' : '−';
            }
            
            console.log(`❓ FAQ ${index + 1} alternada`);
            
            if (typeof trackConversionEvent === 'function') {
                trackConversionEvent(`faq_toggle_${index + 1}`);
            }
        }
    },
    
    getStatus: () => {
        const faqItems = document.querySelectorAll('.faq-item');
        const openItems = document.querySelectorAll('.faq-item.active');
        const status = {
            total: faqItems.length,
            open: openItems.length,
            closed: faqItems.length - openItems.length
        };
        
        console.log(`📊 FAQ Status: ${status.open}/${status.total} abiertas`);
        return status;
    },
    
    init: () => {
        console.log('🔄 Reinicializando FAQ manualmente');
        initFAQSection();
    }
};

console.log('❓ FAQ System v2.0 - Event Listeners Mode');
console.log('📖 Comandos: CREAMOS_FAQ.openAll(), CREAMOS_FAQ.closeAll(), CREAMOS_FAQ.getStatus()');
console.log('🔧 Debug: CREAMOS_FAQ.init() para reinicializar');

})();