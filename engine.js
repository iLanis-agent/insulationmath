/* InsulationMath engine - honest attic insulation math. UMD: browser global + Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.InsulationMath = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var up = function (x) { return Math.ceil(x - 1e-9); };

  // R-value per inch by material.
  var R_PER_IN = { batt: 3.2, blownfg: 2.5, cellulose: 3.5, none: 0 };

  // DOE attic targets by climate band.
  var TARGET_R = { south: 38, mid: 49, north: 60 };

  // Blown cellulose coverage (sq ft per bag) by R added - the chart on the bag.
  var COVERAGE = [
    { r: 13, sqft: 40.6 }, { r: 19, sqft: 29.7 }, { r: 30, sqft: 18.4 },
    { r: 38, sqft: 14.7 }, { r: 49, sqft: 11.3 }, { r: 60, sqft: 9.2 }
  ];

  function currentR(material, depthIn) {
    var rate = R_PER_IN[material] != null ? R_PER_IN[material] : 0;
    return Math.round(rate * depthIn * 10) / 10;
  }

  function addR(material, depthIn, band) {
    var target = TARGET_R[band] || 49;
    return Math.max(0, Math.round((target - currentR(material, depthIn)) * 10) / 10);
  }

  function addInches(addedR) {
    return Math.round(addedR / R_PER_IN.cellulose * 10) / 10;
  }

  function bracketFor(addedR) {
    for (var i = 0; i < COVERAGE.length; i++) {
      if (addedR <= COVERAGE[i].r + 1e-9) return COVERAGE[i];
    }
    return COVERAGE[COVERAGE.length - 1];
  }

  function bagsNeeded(areaSqFt, addedR) {
    if (addedR <= 0) return 0;
    return up(areaSqFt / bracketFor(addedR).sqft);
  }

  // The rental truth: the blower is free once you buy enough bags.
  function blowerFree(bags) { return bags >= 20; }

  function estimate(opts) {
    var area = opts.areaSqFt;
    var material = opts.material || 'none';
    var depth = opts.depthIn || 0;
    var band = opts.band || 'mid';
    var bagPrice = opts.bagPrice != null ? opts.bagPrice : 15;

    var cur = currentR(material, depth);
    var target = TARGET_R[band];
    var add = addR(material, depth, band);
    var inches = addInches(add);
    var bags = bagsNeeded(area, add);
    var cost = Math.round(bags * bagPrice * 100) / 100;
    return {
      currentR: cur, targetR: target, addR: add, addInches: inches,
      bags: bags, bagCost: cost, blowerFree: blowerFree(bags),
      bracket: add > 0 ? bracketFor(add).r : 0
    };
  }

  function advice(est, material) {
    if (est.addR <= 0) {
      return 'You are already at target - rare. Spend the weekend on air sealing instead; the leaks around lights and hatches matter more than another inch now.';
    }
    if (material === 'none') {
      return 'A bare attic is the best payback in the whole house - but seal the floor first. Every gap around a light, wire, or hatch leaks more heat than the missing R-value, and you cannot seal after the blow.';
    }
    if (est.currentR <= 10) {
      return 'Under R-10 you are heating the sky. Air-seal the attic floor before blowing - around lights, hatches, and every wire penetration - because you cannot find the leaks under 11 new inches of cellulose.';
    }
    if (!est.blowerFree) {
      return 'Under 20 bags the blower rental is not free - split the order with a neighbor doing the same job, or pay the rental and count it honestly in the total.';
    }
    return 'Keep the new depth 3 inches clear of soffit vents and use baffles - a blocked eave vent trades your heat bill for a mold bill. And mark the depth on the rafters before you start.';
  }

  return {
    R_PER_IN: R_PER_IN, TARGET_R: TARGET_R, COVERAGE: COVERAGE,
    currentR: currentR, addR: addR, addInches: addInches,
    bracketFor: bracketFor, bagsNeeded: bagsNeeded, blowerFree: blowerFree,
    estimate: estimate, advice: advice
  };
});
