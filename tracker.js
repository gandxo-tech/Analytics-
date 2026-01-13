/**
 * Gandxo Analytics Tracker v2.0
 * Script de suivi des visites - Production Ready
 */

(function() {
  'use strict';
  
  // Récupération de l'ID du site depuis l'attribut data-site
  var script = document.currentScript || document.querySelector('script[data-site]');
  
  if (!script) {
    console.error('[Gandxo Analytics] Erreur: Script non trouvé');
    return;
  }
  
  var siteId = script.getAttribute('data-site');
  
  if (!siteId) {
    console.error('[Gandxo Analytics] Erreur: attribut data-site manquant');
    console.error('[Gandxo Analytics] Usage: <script src="tracker.js" data-site="gx_xxxxx"></script>');
    return;
  }
  
  // Configuration Firebase (public - côté client)
  var firebaseConfig = {
    apiKey: "AIzaSyDHCqPBzhWNnXuBrLvfa4NqCFeOdIRy6UI",
    authDomain: "gandxo-analytics.firebaseapp.com",
    projectId: "gandxo-analytics",
    storageBucket: "gandxo-analytics.firebasestorage.app",
    messagingSenderId: "660347922907",
    appId: "1:660347922907:web:652a37718edae658561ffe"
  };
  
  // Fonction principale de tracking
  function trackVisit() {
    
    // Collecte des données de la visite
    var visitData = {
      siteId: siteId,
      timestamp: Date.now(),
      page: window.location.href,
      referrer: document.referrer || 'Direct',
      device: navigator.userAgent,
      screen: screen.width + 'x' + screen.height,
      language: navigator.language || navigator.userLanguage || 'unknown',
      platform: navigator.platform || 'unknown',
      viewport: window.innerWidth + 'x' + window.innerHeight
    };
    
    console.log('[Gandxo Analytics] Préparation de l\'envoi...', {
      site: siteId,
      page: visitData.page
    });
    
    // Import dynamique de Firebase
    Promise.all([
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js')
    ]).then(function(modules) {
      
      var initializeApp = modules[0].initializeApp;
      var getFirestore = modules[1].getFirestore;
      var collection = modules[1].collection;
      var addDoc = modules[1].addDoc;
      
      // Initialisation Firebase
      var app = initializeApp(firebaseConfig);
      var db = getFirestore(app);
      
      // Envoi des données vers Firestore
      return addDoc(collection(db, "visits"), visitData);
      
    }).then(function(docRef) {
      
      console.log('[Gandxo Analytics] ✅ Visite enregistrée avec succès!');
      console.log('[Gandxo Analytics] ID de visite:', docRef.id);
      
      // Événement personnalisé pour notifier l'application
      if (window.dispatchEvent) {
        var event = new CustomEvent('gandxo-tracked', { 
          detail: { 
            visitId: docRef.id, 
            siteId: siteId 
          } 
        });
        window.dispatchEvent(event);
      }
      
    }).catch(function(error) {
      
      console.error('[Gandxo Analytics] ❌ Erreur lors de l\'enregistrement:', error.message);
      console.error('[Gandxo Analytics] Code:', error.code);
      
      // Tentative de fallback avec une image pixel (tracking alternatif)
      tryPixelFallback(visitData);
      
    });
  }
  
  // Méthode de fallback avec image pixel
  function tryPixelFallback(data) {
    try {
      var params = new URLSearchParams({
        site: data.siteId,
        page: data.page,
        ref: data.referrer,
        t: data.timestamp
      });
      
      var img = new Image(1, 1);
      img.src = 'https://gandxo-analytics.web.app/pixel.gif?' + params.toString();
      
      console.log('[Gandxo Analytics] Fallback pixel activé');
    } catch (e) {
      console.error('[Gandxo Analytics] Fallback échoué:', e.message);
    }
  }
  
  // Détection du moment idéal pour tracker
  function initTracking() {
    
    // Vérifier si la page est visible (pas en arrière-plan)
    if (document.hidden || document.visibilityState === 'hidden') {
      console.log('[Gandxo Analytics] Page cachée, attente de visibilité...');
      
      document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
          trackVisit();
        }
      }, { once: true });
      
      return;
    }
    
    // Tracker immédiatement
    trackVisit();
  }
  
  // Démarrage du tracking selon l'état du DOM
  if (document.readyState === 'loading') {
    // DOM pas encore chargé
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    // DOM déjà chargé
    initTracking();
  }
  
  // Tracking des changements de page (SPA - Single Page Application)
  var lastPath = window.location.pathname;
  
  function checkPathChange() {
    var currentPath = window.location.pathname;
    
    if (currentPath !== lastPath) {
      console.log('[Gandxo Analytics] Changement de page détecté:', currentPath);
      lastPath = currentPath;
      trackVisit();
    }
  }
  
  // Écoute des changements d'historique (pour les SPAs)
  if (window.history && window.history.pushState) {
    
    var originalPushState = window.history.pushState;
    
    window.history.pushState = function() {
      originalPushState.apply(window.history, arguments);
      setTimeout(checkPathChange, 100);
    };
    
    window.addEventListener('popstate', function() {
      setTimeout(checkPathChange, 100);
    });
  }
  
  // Exposition d'une API publique (optionnelle)
  window.GandxoAnalytics = {
    version: '2.0.0',
    siteId: siteId,
    trackEvent: function(eventName, eventData) {
      console.log('[Gandxo Analytics] Événement personnalisé:', eventName, eventData);
      // Peut être étendu pour tracker des événements custom
    },
    getSiteId: function() {
      return siteId;
    }
  };
  
  console.log('[Gandxo Analytics] Initialisé pour le site:', siteId);
  
})();