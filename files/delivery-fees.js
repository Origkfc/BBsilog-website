// Map proximity pricing. Distances are straight-line estimates, never road routes.
(function (root) {
  'use strict';
  const store = Object.freeze({ lat: 14.6418488, lng: 120.9749312 });
  const ranges = Object.freeze([
    { km: .5, fee: 20 }, { km: 1, fee: 40 },
    { km: 1.5, fee: 60 }, { km: 2.5, fee: 80 }
  ]);
  function distanceKm(point) {
    if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng) ||
        Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) return null;
    const rad = value => value * Math.PI / 180;
    const dLat = rad(point.lat - store.lat), dLng = rad(point.lng - store.lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(store.lat)) *
      Math.cos(rad(point.lat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function feeForDistance(km) {
    if (!Number.isFinite(km) || km < 0) return null;
    return ranges.find(range => km <= range.km + 1e-9)?.fee ?? null;
  }
  function quote(point) {
    const km = distanceKm(point), fee = feeForDistance(km);
    return { km, fee, eligible: fee !== null };
  }
  const api = Object.freeze({ store, ranges, distanceKm, feeForDistance, quote });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BBSILOGDeliveryFees = api;
})(typeof window === 'object' ? window : globalThis);
