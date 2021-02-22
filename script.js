const CACHE_NAME = "audioCache";
const FILE_NAME = 'https://docs.google.com/uc?export=download&id=1J7ChpmgS0pwsOYK_qZbPPeoL55Z2SgbV';


// Find DOM elements
const status = document.getElementById("js-status");
const cacheButton = document.getElementById("js-cache-btn");
const removeCacheButton = document.getElementById("js-remove-cache-btn");

// Hook up event listeners
cacheButton.addEventListener('click', addToCache);
removeCacheButton.addEventListener('click', removeFromCache);

(function main(){
  updateStatus();
})();

// Update the status field
function updateStatus() {
  isCached().then(value => {
    status.innerText = '' + value;
  });
}

function isCached() {
  return window.caches.open(CACHE_NAME)
    .then(cache => cache.match(FILE_NAME))
    .then(Boolean);
}

function addToCache() {
  window.caches.open(CACHE_NAME)
    .then(cache => cache.add(FILE_NAME))
    .then(() => console.log('cached audio file'))
    .catch(e => console.error('failed to cache file', e))
    .finally(updateStatus); // This only works in chrome/ff at the time of writing
}

function removeFromCache() {
  window.caches.open(CACHE_NAME)
    .then(cache => cache.delete(FILE_NAME))
    .then(() => console.log('removed cached file'))
    .catch(e => console.error('failed to remove cached file', e))
    .finally(updateStatus); // This only works in chrome/ff at the time of writing
}
