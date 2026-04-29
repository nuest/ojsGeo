/**
 * @file cypress/e2e/integration/62-reset-view.cy.js
 *
 * Copyright (c) 2026 KOMET project, OPTIMETA project, Daniel Nüst, Tom Niers
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * @brief Reset-view button appears next to the fullscreen control on every
 *        map (article, issue, journal, submission) and snaps the map back
 *        to the view it was at once the plugin's init handler finished.
 */

describe('geoMetadata Reset View Button', function () {

  const resetBtn = '.leaflet-control-geoMetadataResetView';

  // map.panBy takes a pixel offset; 400,200 is well outside the original
  // viewport's feature bounds on every test fixture, so the centre shift
  // after panning is unambiguous.
  const panOffset = [400, 200];
  const tolerance = 0.5; // degrees; centre must return within this of origin

  const captureCentre = () => cy.window().then((win) => win.map.getCenter());

  const assertResetLandsBackAtOrigin = () => {
    cy.get(resetBtn, { timeout: 20000 }).should('exist').and('have.attr', 'title', 'Reset view');
    let origin;
    captureCentre().then((c) => { origin = { lat: c.lat, lng: c.lng }; });
    cy.window().then((win) => win.map.panBy(panOffset));
    captureCentre().then((after) => {
      // Sanity: the pan actually moved the centre (otherwise the test is a no-op).
      expect(Math.abs(after.lat - origin.lat) + Math.abs(after.lng - origin.lng)).to.be.greaterThan(tolerance);
    });
    cy.get(resetBtn).click();
    captureCentre().then((restored) => {
      expect(Math.abs(restored.lat - origin.lat), 'lat returned').to.be.lessThan(tolerance);
      expect(Math.abs(restored.lng - origin.lng), 'lng returned').to.be.lessThan(tolerance);
    });
  };

  it('on the issue page', function () {
    cy.visit('/' + Cypress.env('contexts').primary.path + '/');
    cy.get('nav[class="pkp_site_nav_menu"] a:contains("Archive")').click();
    cy.get('a:contains("Vol. 1 No. 2 (2022)")').click();
    cy.get('#mapdiv', { timeout: 20000 }).should('be.visible');
    assertResetLandsBackAtOrigin();
  });

  it('on the article page', function () {
    cy.visit('/' + Cypress.env('contexts').primary.path + '/');
    cy.get('nav[class="pkp_site_nav_menu"] a:contains("Archive")').click();
    cy.get('a:contains("Vol. 1 No. 2 (2022)")').click();
    cy.openArticleByTitle('Hanover is nice');
    cy.get('#mapdiv', { timeout: 20000 }).should('be.visible');
    assertResetLandsBackAtOrigin();
  });

  it('on the journal map page', function () {
    cy.visit('/' + Cypress.env('contexts').primary.path + '/map');
    cy.get('#mapdiv', { timeout: 20000 }).should('be.visible');
    assertResetLandsBackAtOrigin();
  });

  it('on the submission map', function () {
    cy.login('tobler', 'tobler', Cypress.env('contexts').primary.path);
    cy.visit('/' + Cypress.env('contexts').primary.path + '/submission/wizard');
    cy.get('#mapdiv', { timeout: 20000 }).should('be.visible');
    assertResetLandsBackAtOrigin();
  });

});
