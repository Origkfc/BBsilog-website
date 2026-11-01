const assert = require('node:assert/strict');
const { feeForDistance, quote, store } = require('../files/delivery-fees.js');
for (const [km, fee] of [[0,20],[.5,20],[.50001,40],[1,40],[1.00001,60],[1.5,60],[1.50001,80],[2.5,80],[2.50001,null],[-1,null],[NaN,null],[null,null]]) {
  assert.equal(feeForDistance(km),fee,'Boundary at '+km);
}
assert.equal(quote(store).fee,20);
assert.equal(quote({lat:14.655683,lng:120.984047}).fee,80,'Grand Central Parking map proximity is within coverage');
assert.equal(quote({lat:14.70,lng:120.98}).eligible,false);
assert.equal(quote({lat:Infinity,lng:120.98}).eligible,false);
console.log('PASS: delivery bands, exact boundaries, invalid coordinates, Grand Central coverage.');
