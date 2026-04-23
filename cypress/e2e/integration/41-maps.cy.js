/**
 * @file cypress/tests/integration/html_head.cy.js
 *
 * Copyright (c) 2025 KOMET project, OPTIMETA project, Daniel Nüst, Tom Niers
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 */

describe('geoMetadata Maps', function () {

  // Find Hanover's / Editors's LineString (both directInject from (8.43, 52.37));
  // order of layers on the issue map is not stable, so don't rely on features[0].
  const checkFeatures = (features => {
    const lineString = features.find(f => f.geometry.type === 'LineString');
    expect(lineString, 'a LineString feature').to.exist;
    expect(lineString.geometry.coordinates.length).to.equal(2);
    expect(lineString.geometry.coordinates[0][0] - 8.43).to.be.lessThan(0.01);
    expect(lineString.geometry.coordinates[0][1] - 52.37).to.be.lessThan(0.01);
  });

  // 1 from Vancouver is cool (Point), 1 from Hanover is nice (LineString),
  // 1 from Editors saves the day (LineString). Interactive markers added by
  // spec 33 tests 5+6 don't land (those tests are out of scope) so the issue
  // map renders exactly the directInject-seeded features.
  const geometriesCount = 3;

  it('The map on the current issue page has the papers\' geometries', function () {
    cy.visit('/');
    // 1 from "Hanover is nice", 3 from "Editors save the day"
    cy.mapHasFeatures(geometriesCount);
    cy.window().wait(200).then(({ map }) => {
      var features = [];
      map.eachLayer(function (layer) {
        if (layer.hasOwnProperty('feature')) {
          features.push(layer.feature);
        }
      });
      checkFeatures(features);
    });
  });

  it('The map on the issue page in the archive has the papers\' geometries', function () {
    cy.visit('/');
    cy.get('nav[class="pkp_site_nav_menu"] a:contains("Archive")').click();
    cy.get('a:contains("Vol. 1 No. 2 (2022)")').click();

    cy.get('.pkp_structure_main').should('contain', 'Times & Locations');
    cy.get('#mapdiv').should('exist');

    cy.mapHasFeatures(geometriesCount);
    cy.window().wait(200).then(({ map }) => {
      var features = [];
      map.eachLayer(function (layer) {
        if (layer.hasOwnProperty('feature')) {
          features.push(layer.feature);
        }
      });
      checkFeatures(features);
    });
  });

  it('The article page has the paper\'s geometry and the administrative units', function () {
    cy.visit('/');
    cy.get('nav[class="pkp_site_nav_menu"] a:contains("Archive")').click();
    cy.get('a:contains("Vol. 1 No. 2 (2022)")').click();
    cy.get('a:contains("Hanover is nice")').last().click();

    cy.get('.pkp_structure_main').should('contain', 'Time and Location');
    cy.get('#mapdiv').should('exist');

    cy.mapHasFeatures(1);
    cy.window().wait(200).then(({ map }) => {
      var features = [];
      map.eachLayer(function (layer) {
        if (layer.hasOwnProperty('feature')) {
          features.push(layer.feature);
        }
      });
      checkFeatures(features);
    });

    cy.window().wait(200).then(({ map }) => {
      var foundAdminLayerBasedOnColor = false;
      map.eachLayer(function (layer) {
        if (layer.options.hasOwnProperty('color') && layer.options.color === 'black') {
          foundAdminLayerBasedOnColor = true;
          expect(layer.options.fillOpacity).to.equal(0.15);
          expect(layer._latlngs[0]).to.have.lengthOf(4);
        }
      });
      expect(foundAdminLayerBasedOnColor).to.be.true;
    });
  });

  it('The article page has the administrative units in a text', function () {
    cy.visit('/');
    cy.get('nav[class="pkp_site_nav_menu"] a:contains("Archive")').click();
    cy.get('a:contains("Vol. 1 No. 2 (2022)")').click();
    cy.get('a:contains("Hanover is nice")').last().click();

    cy.get('#geoMetadata_article_administrativeUnit').should('contain', 'Earth, Europe, Federal Republic of Germany');
  });

  it('Shows the published paper on the journal map', function () {
    cy.visit('/' + Cypress.env('contextPath') + '/map');
    cy.get('.pkp_structure_main').should('contain', 'Times & Locations');
    cy.get('#mapdiv').should('exist');
  });

  it('Does not show an article from an unpublished issue on the journal map', function () {
    this.skip(); // TODO fix journal map in tests

    cy.login('aauthor');
    cy.get('a:contains("aauthor")').click();
    cy.get('a:contains("Dashboard")').click({ force: true });

    cy.createSubmissionAndPublish(submission2);

    // TODO
  });
});