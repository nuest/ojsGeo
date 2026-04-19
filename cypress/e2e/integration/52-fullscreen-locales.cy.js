/**
 * @file cypress/tests/integration/52-fullscreen-locales.cy.js
 *
 * Copyright (c) 2025 KOMET project, OPTIMETA project, Daniel Nüst, Tom Niers
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * @brief Verifies that the fullscreen control's title attribute uses the user's
 *        display language after switching it via the user menu in the top right
 *        corner. Mirrors the flow in 50-locales.cy.js: log in as aauthor, open
 *        the .pkpDropdown language menu, click the localized language label,
 *        then navigate to a page with a map and assert the title strings.
 *
 *        Depends on 50-locales.cy.js having enabled de_DE / es_ES / fr_FR as UI
 *        locales for the journal before this spec runs.
 */

describe('geoMetadata Fullscreen Control — localized titles (via user menu)', function () {

  const fsBtnSelector = '#mapdiv a.leaflet-control-zoom-fullscreen';

  // Label = name shown in the .pkpDropdown menu for each locale
  // enter / exit = locale.po entries for plugins.generic.geoMetadata.map.fullscreen.{title,titleCancel}
  const localized = {
    de_DE: { label: 'Deutsch',  enter: 'Vollbild anzeigen',       exit: 'Vollbild verlassen' },
    es_ES: { label: 'Español',  enter: 'Ver a pantalla completa', exit: 'Salir de pantalla completa' },
    fr_FR: { label: 'Français', enter: 'Afficher en plein écran', exit: 'Quitter le plein écran' },
  };

  beforeEach(() => {
    cy.login('aauthor');
    cy.get('a:contains("aauthor")').click();
    cy.get('a:contains("Dashboard"), a:contains("Panel de control"), a:contains("Tableau de bord")').click();
  });

  afterEach(() => {
    // mirror 50-locales.cy.js teardown: go back to Dashboard (label is localized),
    // switch language back to English, log out — leaves no session locale behind.
    cy.get('a:contains("aauthor")').click();
    cy.get('a:contains("Dashboard"), a:contains("Panel de control"), a:contains("Tableau de bord")').click();
    cy.get('.pkpDropdown > .pkpButton').click();
    cy.get('a:contains("English")').click();
    cy.logout();
  });

  Object.entries(localized).forEach(([locale, strings]) => {
    it(`${locale}: user picks "${strings.label}" from the top-right menu and the fullscreen button title becomes "${strings.enter}"`, function () {
      // switch display language via the user-menu dropdown (same DOM path as 50-locales)
      cy.get('.pkpDropdown > .pkpButton').click();
      cy.get(`a:contains("${strings.label}")`).click();

      // navigate to the homepage — current-issue map is always rendered here
      cy.visit('/');
      cy.get('#mapdiv').should('exist');
      cy.get(fsBtnSelector).as('fsBtn');

      // title reflects the user's display language (loaded via Smarty {translate} in the template)
      cy.get('@fsBtn')
        .should('have.attr', 'title', strings.enter)
        .and('not.have.class', 'leaflet-fullscreen-on');

      cy.get('@fsBtn').click();
      cy.get('@fsBtn')
        .should('have.class', 'leaflet-fullscreen-on')
        .and('have.attr', 'title', strings.exit);

      cy.get('@fsBtn').click();
      cy.get('@fsBtn')
        .should('not.have.class', 'leaflet-fullscreen-on')
        .and('have.attr', 'title', strings.enter);
    });
  });

});
