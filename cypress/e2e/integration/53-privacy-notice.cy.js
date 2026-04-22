/**
 * @file cypress/tests/integration/53-privacy-notice.cy.js
 *
 * Copyright (c) 2025 KOMET project, OPTIMETA project, Daniel Nüst, Tom Niers
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * @brief Issue #124: the short "map data privacy" notice must render under every
 *        rendered map in the reader's UI locale. Depends on 50-locales.cy.js
 *        having enabled de_DE as a UI locale earlier in the run.
 */

describe('geoMetadata Map Privacy Notice', function () {

  const noticeSelector = 'p.geoMetadata_privacyNotice';

  const enText = 'Map tiles are loaded from third-party servers. See the journal\'s privacy policy for details.';
  const deText = 'Kartenkacheln werden von Drittanbieter-Servern geladen. Einzelheiten finden Sie in der Datenschutzerklärung des Journals.';

  const visitHanover = () => {
    cy.visit('/');
    cy.get('nav[class="pkp_site_nav_menu"] a:contains("Archive"), nav[class="pkp_site_nav_menu"] a:contains("Archiv")').click();
    cy.get('a:contains("Vol. 1 No. 2 (2022)")').click();
    cy.get('a:contains("Hanover is nice")').last().click();
  };

  it('shows the English privacy notice under the article map by default', function () {
    visitHanover();
    cy.get('#mapdiv').should('exist');
    cy.get(noticeSelector).should('be.visible').and('contain.text', enText);
  });

  it('shows the English privacy notice on the journal map page by default', function () {
    cy.visit('/' + Cypress.env('contextPath') + '/map');
    cy.get('#mapdiv').should('exist');
    cy.get(noticeSelector).should('be.visible').and('contain.text', enText);
  });

  it('switches the notice text when the user picks Deutsch from the top-right menu', function () {
    cy.login('aauthor');
    cy.get('a:contains("aauthor")').click();
    cy.get('a:contains("Dashboard"), a:contains("Panel de control"), a:contains("Tableau de bord")').click();
    cy.get('.pkpDropdown > .pkpButton').click();
    cy.get('a:contains("Deutsch")').click();

    visitHanover();
    cy.get(noticeSelector).should('be.visible').and('contain.text', deText);

    cy.get('a:contains("aauthor")').click();
    cy.get('a:contains("Dashboard"), a:contains("Panel de control"), a:contains("Tableau de bord")').click();
    cy.get('.pkpDropdown > .pkpButton').click();
    cy.get('a:contains("English")').click();
    cy.logout();
  });

});
