/**
 * @file cypress/e2e/integration/38-submission-lower-saxony.cy.js
 *
 * Copyright (c) 2026 KOMET project, OPTIMETA project, Daniel Nüst, Tom Niers
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * @brief Publishes "Lower Saxony details" — a Polygon over Hanover that
 *        overlaps the "Hanover is nice" LineString endpoint, giving spec 66
 *        a realistic two-article overlap to exercise the multi-article picker.
 */

describe('geoMetadata Submission Of Overlapping Polygon', function () {

  var submission;

  before(function () {
    submission = {
      id: 0,
      prefix: '',
      title: 'Lower Saxony details',
      subtitle: 'A polygon overlapping Hanover',
      abstract: 'Polygon centred on the Hanover area, used to exercise the overlap picker.',
      issue: '1',
      directInject: {
        spatial: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: { provenance: { description: 'Direct test injection (38-submission-lower-saxony.cy.js)', id: 99 } },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [8.0, 52.0],
                [9.0, 52.0],
                [9.0, 52.7],
                [8.0, 52.7],
                [8.0, 52.0]
              ]]
            }
          }],
          administrativeUnits: [],
          temporalProperties: {
            timePeriods: [],
            provenance: { description: 'not available', id: 'not available' }
          }
        },
        adminUnit: []
      }
    };
  });

  it('Publishes a polygon-only article overlapping Hanover', function () {
    cy.login('aauthor');
    cy.get('a:contains("aauthor")').click();
    cy.get('a:contains("Dashboard")').click({ force: true });

    cy.createSubmissionAndPublish(submission);

    cy.visit('/');
    cy.get('nav[class="pkp_site_nav_menu"] a:contains("Archive")').click();
    cy.get('a:contains("Vol. 1 No. 2 (2022)")').click();
    cy.get('.pkp_structure_main').should('contain', 'Lower Saxony details');
  });

});
