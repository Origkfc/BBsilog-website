/* Loaded cheaply with the page; Leaflet and map tiles load only for delivery. */
(() => {
  'use strict';
  const fees = BBSILOGDeliveryFees;
  let point = null, map, marker, routeLine, loading;
  let addressForPin = '', mapReady = false;
  const byId = id => document.getElementById(id);
  function currentQuote() { return point ? fees.quote(point) : null; }
  function validation() {
    if (!point) return 'Place your delivery pin on the map first.';
    if (!currentQuote().eligible) return 'This pin is beyond 2.5 km. Please choose pickup.';
    return null;
  }
  function changed() {
    invalidateCopiedOrder();
    renderQuote();
    refreshWizardControls();
  }
  function selectPoint(next) {
    if (fees.distanceKm(next) === null) return;
    point = { lat: next.lat, lng: next.lng };
    addressForPin = byId('address').value.trim();
    const location = [point.lat, point.lng];
    if (map) {
      if (!marker) {
        marker = L.marker(location, {
          draggable: true, icon: L.divIcon({ className: 'delivery-destination-marker', html: '<span>●</span>', iconSize: [32, 32], iconAnchor: [16, 16] }),
          title: 'Delivery destination. Drag to adjust.', alt: 'Delivery destination'
        }).addTo(map);
        marker.on('dragend', () => { const p = marker.getLatLng(); selectPoint({ lat: p.lat, lng: p.lng }); });
      } else marker.setLatLng(location);
      if (routeLine) routeLine.setLatLngs([[fees.store.lat, fees.store.lng], location]);
      else routeLine = L.polyline([[fees.store.lat, fees.store.lng], location], { color: '#743607', weight: 2, dashArray: '6 7' }).addTo(map);
    }
    byId('deliveryPinConfirmed').checked = false;
    changed();
  }
  function renderQuote() {
    const quote = currentQuote(), host = byId('deliveryQuote');
    if (!host) return;
    byId('deliveryMapAddress').textContent = byId('address').value.trim();
    host.classList.toggle('outside', !!quote && !quote.eligible);
    byId('deliveryDistance').textContent = quote ? (quote.km < .01 ? 'Less than 0.01 km' : quote.km.toFixed(2) + ' km') : 'Select a pin';
    byId('deliveryFee').textContent = quote ? (quote.eligible ? '₱' + quote.fee : 'Pickup only') : '—';
    byId('deliveryMapTotal').textContent = quote?.eligible ? '₱' + (subtotal() + quote.fee) + (hasUnpricedExtras() ? ' + unpriced items' : '') : '—';
    byId('deliveryMapStatus').textContent = !quote ? 'Tap your destination on the map, or move the map and choose its centre.' : !quote.eligible ? 'Beyond our 2.5 km proximity limit. Go back and choose pickup.' : 'Estimated fee based on map proximity. Staff will verify your address and final total in Messenger.';
    byId('deliveryPinConfirmation').hidden = !quote?.eligible;
    byId('deliveryPinLink').hidden = !point;
    if (point) byId('deliveryPinLink').href = 'https://www.google.com/maps/search/?api=1&query=' + point.lat.toFixed(6) + ',' + point.lng.toFixed(6);
  }
  function library() {
    if (window.L && document.getElementById('leafletStyles')?.sheet) return Promise.resolve();
    if (loading) return loading;
    const cssReady = new Promise((resolve, reject) => {
      let css = document.getElementById('leafletStyles');
      if (css?.sheet) return resolve();
      if (!css) { css = document.createElement('link'); css.id = 'leafletStyles'; css.rel = 'stylesheet'; css.href = '/files/vendor/leaflet/leaflet.css'; }
      css.onload = resolve;
      css.onerror = () => { css.remove(); reject(Error('Map styles could not load. Check your connection and retry.')); };
      if (!css.isConnected) document.head.append(css);
    });
    const scriptReady = window.L ? Promise.resolve() : new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = '/files/vendor/leaflet/leaflet.js';
      script.onload = resolve;
      script.onerror = () => { script.remove(); reject(Error('Map could not load. Check your connection and retry.')); };
      document.head.append(script);
    });
    loading = Promise.all([cssReady, scriptReady]).catch(error => { loading = null; throw error; });
    return loading;
  }
  async function open() {
    if (point && addressForPin !== byId('address').value.trim()) reset();
    renderQuote();
    byId('deliveryMapLoading').hidden = mapReady;
    try {
      await library();
      if (!map) {
        map = L.map('deliveryMap', { scrollWheelZoom: false, zoomControl: true }).setView([fees.store.lat + .006, fees.store.lng + .004], 14);
        const tiles = L.tileLayer(window.BBSILOG_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, updateWhenIdle: true, keepBuffer: 1,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
        }).addTo(map);
        let loadedTile = false;
        tiles.on('tileload', () => { loadedTile = true; byId('deliveryMapError').hidden = true; });
        tiles.on('tileerror', () => { if (!loadedTile) { byId('deliveryMapError').textContent = 'Map tiles are unavailable. Check your connection and retry before placing your pin.'; byId('deliveryMapError').hidden = false; } });
        for (const { km, fee } of [...fees.ranges].reverse()) {
          L.circle([fees.store.lat, fees.store.lng], { radius: km * 1000, color: '#b66a07', weight: 1, fillColor: '#ffc42a', fillOpacity: .06, interactive: false }).addTo(map);
        }
        L.marker([fees.store.lat, fees.store.lng], {
          icon: L.divIcon({ className: 'delivery-store-marker', html: '<span>BBSILOG</span>', iconSize: [74, 27], iconAnchor: [37, 14] }),
          title: 'BBSILOG · Silanganan corner Purification', keyboard: false
        }).addTo(map);
        map.on('click', event => selectPoint({ lat: event.latlng.lat, lng: event.latlng.lng }));
        mapReady = true;
      }
      map.invalidateSize();
      byId('deliveryMapLoading').hidden = true;
    } catch (error) {
      byId('deliveryMapLoading').hidden = true;
      byId('deliveryMapError').hidden = false;
      byId('deliveryMapError').textContent = error.message;
    }
  }
  function reset() {
    point = null; addressForPin = '';
    if (marker) { marker.remove(); marker = null; }
    if (routeLine) { routeLine.remove(); routeLine = null; }
    if (byId('deliveryPinConfirmed')) byId('deliveryPinConfirmed').checked = false;
    invalidateCopiedOrder(); renderQuote();
  }
  function mount() {
    const step = document.createElement('div'); step.id = 'orderStepMap'; step.className = 'wizard-step'; step.hidden = true;
    step.innerHTML = `<h2>Your delivery location</h2>
      <p class="muted">Tap the map to place your pin. The rings show estimated delivery fees from BBSILOG.</p>
      <p class="delivery-map-address" id="deliveryMapAddress"></p>
      <div class="delivery-map-shell"><div id="deliveryMap" role="region" aria-label="Delivery destination map"></div><p id="deliveryMapLoading">Loading delivery map…</p></div>
      <div class="delivery-map-tools"><button type="button" id="deliveryUseCenter">Use map centre</button><button type="button" id="deliveryLocate">Use my location</button><button type="button" id="deliveryMapRetry">Retry map</button></div>
      <p id="deliveryMapError" class="wizard-details-note" role="status" hidden></p>
      <div class="delivery-fee-ranges"><span>≤ 0.5 km · ₱20</span><span>0.5–1 km · ₱40</span><span>1–1.5 km · ₱60</span><span>1.5–2.5 km · ₱80</span></div>
      <div id="deliveryQuote" class="delivery-quote" aria-live="polite"><div><span>Map proximity</span><b id="deliveryDistance">Select a pin</b></div><div><span>Delivery fee estimate</span><b id="deliveryFee">—</b></div><div class="delivery-quote-total"><span>Food + delivery estimate</span><b id="deliveryMapTotal">—</b></div><p id="deliveryMapStatus"></p></div>
      <p class="demo-note">Straight-line map distance, not driving distance. Delivery is only within South Caloocan near Maypajo. A pin inside a ring does not guarantee address eligibility.</p>
      <label id="deliveryPinConfirmation" class="coverage-confirmation" hidden><input type="checkbox" id="deliveryPinConfirmed">This pin matches my delivery address. I understand this fee is an estimate, subject to staff confirmation.</label>
      <a id="deliveryPinLink" class="view" target="_blank" rel="noopener" hidden>Check my pin in Google Maps ↗</a>`;
    byId('orderStep4').before(step);
    byId('deliveryUseCenter').onclick = () => { if (mapReady) { const p = map.getCenter(); selectPoint({ lat: p.lat, lng: p.lng }); } };
    byId('deliveryMapRetry').onclick = () => { if (map) map.eachLayer(layer => { if (layer instanceof L.TileLayer) layer.redraw(); }); open(); };
    byId('deliveryLocate').onclick = () => {
      if (!mapReady || !navigator.geolocation) { toast('Use the map to choose your destination.'); return; }
      const button = byId('deliveryLocate'); button.disabled = true;
      navigator.geolocation.getCurrentPosition(position => {
        button.disabled = false;
        const p = { lat: position.coords.latitude, lng: position.coords.longitude };
        map.setView([p.lat, p.lng], 16); selectPoint(p);
        toast('Location found. Adjust the pin if needed before confirming.');
      }, () => { button.disabled = false; toast('Location unavailable. Tap the map or use its centre instead.'); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
    };
    byId('deliveryPinConfirmed').addEventListener('change', changed);
    byId('address').addEventListener('input', reset);
    byId('fulfillment').addEventListener('change', () => { if (byId('fulfillment').value !== 'Delivery') reset(); });
  }
  window.BBSILOGDeliveryMap = { mount, open, validation, quote: currentQuote, point: () => point, refresh: renderQuote };
})();
