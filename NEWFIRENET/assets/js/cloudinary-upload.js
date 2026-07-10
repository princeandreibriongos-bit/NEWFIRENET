// Legacy Cloudinary upload helpers removed — storage now uses Cloudflare R2.
// Keep no-op exports so older page scripts do not throw if referenced.

window.CLOUDINARY_CONFIG = window.CLOUDINARY_CONFIG || { cloudName: '', uploadPresets: {} };
window.cloudinaryWidgets = window.cloudinaryWidgets || {};

function isCloudinaryReady() {
  return false;
}

function waitForCloudinary(callback) {
  if (typeof callback === 'function') {
    callback(false);
  }
}

function ensureCloudinaryLoaded(callback) {
  if (typeof callback === 'function') {
    callback(false);
  }
}

function initCloudinaryUpload() {
  return null;
}

function createUploadButton() {
  // Intentionally no-op.
}

function getStationName() {
  return '';
}

window.isCloudinaryReady = isCloudinaryReady;
window.waitForCloudinary = waitForCloudinary;
window.ensureCloudinaryLoaded = ensureCloudinaryLoaded;
window.initCloudinaryUpload = initCloudinaryUpload;
window.createUploadButton = createUploadButton;
window.getStationName = getStationName;
