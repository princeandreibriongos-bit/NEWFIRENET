// Cloudinary Upload Configuration
const CLOUDINARY_CONFIG = {
  cloudName: 'dq80h0d4u',
  uploadPresets: {
    'AYALA': 'FRONTEND-AYALA',
    'POBLACION': 'FRONTEND-POBLACION',
    'PIO': 'FRONTEND-PIO',
    'LA PAZ': 'FRONTEND-LA-PAZ',
    'MCFS': 'FRONTEND-MCFS'
  }
};

// Make config globally accessible
window.CLOUDINARY_CONFIG = CLOUDINARY_CONFIG;
window.cloudinaryWidgets = window.cloudinaryWidgets || {};

// List of Cloudinary CDN URLs to try (in order of preference)
// Only using URLs that are whitelisted in Content Security Policy
const CLOUDINARY_URLS = [
  'https://upload-widget.cloudinary.com/latest/CloudinaryUploadWidget.min.js',
  'https://cdn.jsdelivr.net/npm/cloudinary@1.10.0/cloudinary.min.js',
  'https://unpkg.com/cloudinary@1.10.0/cloudinary.min.js'
];

// Dynamically load Cloudinary if not already loaded
function ensureCloudinaryLoaded(callback, urlIndex) {
  urlIndex = urlIndex || 0;

  if (isCloudinaryReady()) {
    console.log('Cloudinary already loaded');
    if (typeof callback === 'function') {
      callback(true);
    }
    return;
  }

  if (urlIndex >= CLOUDINARY_URLS.length) {
    console.error('All Cloudinary URLs failed to load');
    if (typeof callback === 'function') {
      callback(false);
    }
    return;
  }

  const url = CLOUDINARY_URLS[urlIndex];
  console.log('Attempting to load Cloudinary from URL ' + (urlIndex + 1) + ':', url);

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;
  script.async = true;

  script.onload = function() {
    console.log('Script loaded from:', url);
    setTimeout(function() {
      if (isCloudinaryReady()) {
        console.log('Cloudinary is now available');
        if (typeof callback === 'function') {
          callback(true);
        }
      } else {
        console.warn('Script loaded but cloudinary not available, trying next URL...');
        // Remove the script and try next
        script.remove();
        ensureCloudinaryLoaded(callback, urlIndex + 1);
      }
    }, 1000);
  };

  script.onerror = function() {
    console.error('Failed to load from:', url);
    script.remove();
    // Try next URL
    ensureCloudinaryLoaded(callback, urlIndex + 1);
  };

  document.head.appendChild(script);
}

// Helper function to check if Cloudinary is ready
function isCloudinaryReady() {
  return (typeof window.cloudinary !== 'undefined' && window.cloudinary !== null) ||
         (typeof window.CloudinaryUploadWidget !== 'undefined' && window.CloudinaryUploadWidget !== null);
}

// Wait for Cloudinary to load
function waitForCloudinary(callback, maxWait) {
  maxWait = maxWait || 15000; // 15 seconds max
  var startTime = Date.now();

  // First check if already loaded
  if (isCloudinaryReady()) {
    console.log('Cloudinary is ready!');
    if (typeof callback === 'function') {
      callback(true);
    }
    return;
  }

  // Try to ensure it's loaded
  console.log('Starting Cloudinary load attempt...');
  ensureCloudinaryLoaded(function(success) {
    if (success) {
      if (typeof callback === 'function') {
        callback(true);
      }
    } else {
      console.error('Cloudinary failed to load after trying all URLs');
      if (typeof callback === 'function') {
        callback(false);
      }
    }
  });
}

// Test if URLs are reachable
function testCloudinaryUrls() {
  console.log('Testing Cloudinary URL accessibility...');

  CLOUDINARY_URLS.forEach(function(url, index) {
    fetch(url, { method: 'HEAD', mode: 'no-cors' })
      .then(function() {
        console.log('URL ' + (index + 1) + ' is reachable:', url);
      })
      .catch(function(err) {
        console.error('URL ' + (index + 1) + ' is NOT reachable:', url, err);
      });
  });
}

// Ensure window.cloudinary exists (polyfill for different library versions)
function ensureCloudinaryNamespace() {
  if (typeof window.cloudinary === 'undefined' && typeof window.CloudinaryUploadWidget !== 'undefined') {
    window.cloudinary = window.CloudinaryUploadWidget;
    console.log('Polyfilled window.cloudinary from CloudinaryUploadWidget');
  }
}

// Run diagnostics
setTimeout(function() {
  if (!isCloudinaryReady()) {
    testCloudinaryUrls();
  } else {
    ensureCloudinaryNamespace();
  }
}, 2000);

// Initialize Cloudinary Upload Widget
function initCloudinaryUpload(stationName, containerId, onSuccessCallback) {
  const preset = CLOUDINARY_CONFIG.uploadPresets[stationName];

  if (!preset) {
    console.error('Unknown station:', stationName, 'Available stations:', Object.keys(CLOUDINARY_CONFIG.uploadPresets));
    return null;
  }

  console.log('Initializing Cloudinary for station:', stationName, 'with preset:', preset);

  // Create widget
  const myWidget = cloudinary.createUploadWidget(
    {
      cloudName: CLOUDINARY_CONFIG.cloudName,
      uploadPreset: preset,
      multiple: false,
      maxFileSize: 52428800, // 50MB
      resourceType: 'auto',
      folder: 'firenet/' + stationName,
      clientAllowedFormats: ['image', 'video', 'pdf', 'doc', 'docx', 'txt', 'xlsx', 'pptx']
    },
    function(error, result) {
      if (error) {
        console.error('Cloudinary widget error:', error);
      } else if (result && result.event === 'success') {
        console.log('File uploaded successfully:', result.info);
        if (typeof onSuccessCallback === 'function') {
          onSuccessCallback(result.info);
        }
      }
    }
  );

  return myWidget;
}

// Create upload button
function createUploadButton(stationName, containerId, onSuccessCallback) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Container not found:', containerId);
    return;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'primary-btn';
  button.textContent = 'Upload to Cloudinary';
  button.style.marginTop = '12px';

  const widget = initCloudinaryUpload(stationName, containerId, onSuccessCallback);

  // Store globally by station
  window.cloudinaryWidgets[stationName] = widget;
  window.cloudinaryUploadWidget = widget;

  button.addEventListener('click', function() {
    if (widget) {
      widget.open();
    }
  });

  container.appendChild(button);
}

// Get station name from page context
function getStationName() {
  // Try multiple ways to get station name
  const stationElement = document.querySelector('[data-station-name]');
  if (stationElement) {
    return stationElement.getAttribute('data-station-name');
  }

  // Try from context
  const contextElement = document.querySelector('[data-context]');
  if (contextElement) {
    try {
      const context = JSON.parse(contextElement.getAttribute('data-context'));
      return context.stationName;
    } catch (e) {
      console.warn('Could not parse context');
    }
  }

  // Fallback
  console.warn('Station name not found, defaulting to session value');
  return 'AYALA'; // Default
}

// Export functions to window for global access
window.isCloudinaryReady = isCloudinaryReady;
window.waitForCloudinary = waitForCloudinary;
window.ensureCloudinaryLoaded = ensureCloudinaryLoaded;
window.initCloudinaryUpload = initCloudinaryUpload;
window.createUploadButton = createUploadButton;
window.getStationName = getStationName;
