/**
 * 📊 Gandxo Analytics Tracker v2.0
 * https://analytics-sepia-beta.vercel.app
 */

(function() {
  'use strict';
  
  var script = document.currentScript || document.querySelector('script[data-site]');
  
  if (!script) {
    console.error('[Gandxo] Script non trouvé');
    return;
  }
  
  var siteId = script.getAttribute('data-site');
  
  if (!siteId) {
    console.error('[Gandxo] Attribut data-site manquant');
    console.info('[Gandxo] Usage: <script src="tracker.js" data-site="gx_xxxxx"></script>');
    return;
  }
  
  var firebaseConfig = {
    apiKey: "AIzaSyDHCqPBzhWNnXuBrLvfa4NqCFeOdIRy6UI",
    authDomain: "gandxo-analytics.firebaseapp.com",
    projectId: "gandxo-analytics",
    storageBucket: "gandxo-analytics.firebasestorage.app",
    messagingSenderId: "660347922907",
    appId: "1:660347922907:web:652a37718edae658561ffe"
  };
  
  function trackVisit() {
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
    
    console.log('[Gandxo] 📡 Tracking...', siteId);
    
    Promise.all([
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js')
    ]).then(function(modules) {
      var initializeApp = modules[0].initializeApp;
      var getFirestore = modules[1].getFirestore;
      var collection = modules[1].collection;
      var addDoc = modules[1].addDoc;
      
      var app = initializeApp(firebaseConfig);
      var db = getFirestore(app);
      
      return addDoc(collection(db, "visits"), visitData);
    }).then(function(docRef) {
      console.log('[Gandxo] ✅ Visite enregistrée:', docRef.id);
      
      if (window.dispatchEvent) {
        var event;
        try {
          event = new CustomEvent('gandxo-tracked', { 
            detail: { visitId: docRef.id, siteId: siteId }
          });
        } catch (e) {
          event = document.createEvent('CustomEvent');
          event.initCustomEvent('gandxo-tracked', true, true, { 
            visitId: docRef.id, 
            siteId: siteId 
          });
        }
        window.dispatchEvent(event);
      }
    }).catch(function(error) {
      console.error('[Gandxo] ❌ Erreur:', error.message);
    });
  }
  
  function initTracking() {
    if (document.hidden || document.visibilityState === 'hidden') {
      console.log('[Gandxo] ⏸️ Page cachée, attente...');
      
      var handleVisibility = function() {
        if (!document.hidden) {
          document.removeEventListener('visibilitychange', handleVisibility);
          trackVisit();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return;
    }
    
    trackVisit();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
  
  window.GandxoAnalytics = {
    version: '2.0.0',
    siteId: siteId,
    trackEvent: function(eventName, eventData) {
      console.log('[Gandxo] 🎯 Event:', eventName, eventData);
    },
    getSiteId: function() {
      return siteId;
    }
  };
  
  console.log('[Gandxo] 🚀 Initialisé:', siteId);
  
})();