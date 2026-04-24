/**
 * @file cypress/e2e/integration/37-submission-outside-of-nowhere.cy.js
 *
 * Copyright (c) 2026 KOMET project, OPTIMETA project, Daniel Nüst, Tom Niers
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * @brief Publishes "Outside of nowhere" — a test record with no geoMetadata
 *        at all: no spatial features, no temporal range, no administrative
 *        unit. Used by later specs to assert the plugin degrades cleanly for
 *        articles without geo information (e.g. the issue-TOC map icon must
 *        not render for this article — issue #158).
 */

describe('geoMetadata Submission Without Any Geo Metadata', function () {

  var submission;

  before(function () {
    submission = {
      id: 0,
      prefix: '',
      title: 'Outside of nowhere',
      subtitle: 'A test record with no geoMetadata',
      abstract: 'No spatial, temporal, or administrative-unit information.',
      issue: '1',
      // spatial: null → suppresses the default-polyline drawing in
      // createSubmissionAndPublish; no directInject, no adminUnit.
      spatial: null
    };
  });

  it('Publishes an article with no geoMetadata of any kind', function () {
    cy.login('aauthor');
    cy.get('a:contains("aauthor")').click();
    cy.get('a:contains("Dashboard")').click({ force: true });

    cy.createSubmissionAndPublish(submission);

    cy.visit('/');
    cy.get('nav[class="pkp_site_nav_menu"] a:contains("Archive")').click();
    cy.get('a:contains("Vol. 1 No. 2 (2022)")').click();
    cy.get('.pkp_structure_main').should('contain', 'Outside of nowhere');
  });

});
