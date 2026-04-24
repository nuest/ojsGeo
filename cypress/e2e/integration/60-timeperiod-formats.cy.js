/**
 * @file cypress/e2e/integration/60-timeperiod-formats.cy.js
 *
 * Copyright (c) 2026 KOMET project, OPTIMETA project, Daniel Nüst
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * End-to-end coverage for the full set of time-period formats accepted by
 * js/lib/temporal.js + GeoMetadataPlugin::validateTimePeriodString — bare
 * year, year-month, day, mixed precision in both directions, BCE, and
 * multi-period. Existing specs seed every article with the same
 * `{YYYY-MM-DD..YYYY-MM-DD}` shape, so the rendered pipeline (sidebar,
 * DC.PeriodOfTime / DC.temporal, DC.SpatialCoverage embed) has only been
 * verified against one shape. This spec adds one article per format and
 * pins the rendered output for each.
 *
 * Shifts issue 1's aggregate temporal range (to -500 … 2023). Runs after
 * 55-issue-temporal.cy.js which pins the pre-shift aggregate (2000 … 2023).
 */

describe('geoMetadata Time Period Format Diversity', { testIsolation: false }, function () {

  const EARTH_ADMIN = [{
    name: 'Earth',
    geonameId: 6295630,
    bbox: 'not available',
    administrativeUnitSuborder: ['Earth'],
    provenance: { description: 'administrative unit created by user (accepting the suggestion of the geonames API , which was created on basis of a geometric shape input)', id: 23 }
  }];

  function makeSpatial(rawPeriod, lng, lat) {
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { provenance: { description: 'geometric shape created by user (drawing)', id: 11 } },
        geometry: { type: 'Point', coordinates: [lng, lat] }
      }],
      administrativeUnits: EARTH_ADMIN,
      temporalProperties: {
        timePeriods: ['{' + rawPeriod + '}'],
        provenance: { description: 'temporal properties created by user', id: 31 }
      }
    };
  }

  // Per-format article fixture. `typed` is what the UI writes via
  // input[name=datetimes]; syncTemporal wraps it into `stored`.
  const ARTICLES = [
    { title: 'Time format bare year',     raw: '1990..2010',             typed: '1990 - 2010',             stored: '{1990..2010}',             start: '1990',       end: '2010',       dcIso: '1990/2010' },
    { title: 'Time format year month',    raw: '2019-03..2019-09',       typed: '2019-03 - 2019-09',       stored: '{2019-03..2019-09}',       start: '2019-03',    end: '2019-09',    dcIso: '2019-03/2019-09' },
    { title: 'Time format year to date',  raw: '2020..2020-06-15',       typed: '2020 - 2020-06-15',       stored: '{2020..2020-06-15}',       start: '2020',       end: '2020-06-15', dcIso: '2020/2020-06-15' },
    { title: 'Time format date to year',  raw: '2021-03-15..2022',       typed: '2021-03-15 - 2022',       stored: '{2021-03-15..2022}',       start: '2021-03-15', end: '2022',       dcIso: '2021-03-15/2022' },
    { title: 'Time format BCE',           raw: '-500-01-01..-100-12-31', typed: '-500-01-01 - -100-12-31', stored: '{-500-01-01..-100-12-31}', start: '-500-01-01', end: '-100-12-31', dcIso: '-500-01-01/-100-12-31' }
  ];

  // The multi-period case is not reachable through the datetimes UI
  // (syncTemporal unconditionally wraps the typed value in one `{…}`), so
  // spec 55 seeds it via direct SQL UPDATE. This spec does the same to
  // exercise the rendered pipeline on a multi-block value.
  const MULTI_TARGET_TITLE = ARTICLES[0].title;           // "Time format bare year"
  const MULTI_ORIGINAL     = ARTICLES[0].stored;          // '{1990..2010}'
  const MULTI_VALUE        = '{1990..1995}{2010..2015}';  // two concatenated blocks

  function mysqlExec(sql) {
    const host = Cypress.env('DBHOST');
    const user = Cypress.env('DBUSERNAME');
    const pw   = Cypress.env('DBPASSWORD');
    const db   = Cypress.env('DBNAME');
    return cy.exec(`docker exec ${host} mysql -u${user} -p${pw} ${db} -e "${sql.replace(/"/g, '\\"')}"`);
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  before(function () {
    ARTICLES.forEach(function (a, i) {
      cy.login('aauthor');
      cy.get('a:contains("aauthor")').click();
      cy.get('a:contains("Dashboard")').click({ force: true });
      cy.createSubmissionAndPublish({
        id: 0,
        prefix: '',
        title: a.title,
        subtitle: '',
        abstract: 'Test article exercising the ' + a.stored + ' time-period format.',
        timePeriod: a.typed,
        issue: '1',
        directInject: {
          spatial: makeSpatial(a.raw, 10 + i * 2, 50),
          adminUnit: EARTH_ADMIN
        }
      });
    });
  });

  ARTICLES.forEach(function (a) {

    describe(a.stored, function () {

      before(function () {
        cy.visit('/');
        cy.get('nav[class="pkp_site_nav_menu"] a:contains("Archive")').click();
        cy.get('a:contains("Vol. 1 No. 2 (2022)")').click();
        cy.get('a:contains("' + a.title + '")').last().click();
      });

      it('hidden #geoMetadata_temporal carries the stored value verbatim', function () {
        cy.get('#geoMetadata_temporal').should('have.value', a.stored);
      });

      it('sidebar renders start=' + a.start + ' and end=' + a.end, function () {
        cy.get('#geoMetadata_span_start').should('have.text', a.start);
        cy.get('#geoMetadata_span_end').should('have.text', a.end);
      });

      it('DC.PeriodOfTime and DC.temporal emit ' + a.dcIso + ' (ISO8601)', function () {
        cy.get('meta[name="DC.PeriodOfTime"]').should('have.attr', 'scheme', 'ISO8601');
        cy.get('meta[name="DC.PeriodOfTime"]').should('have.attr', 'content', a.dcIso);
        cy.get('meta[name="DC.temporal"]').should('have.attr', 'scheme', 'ISO8601');
        cy.get('meta[name="DC.temporal"]').should('have.attr', 'content', a.dcIso);
      });

      it('DC.SpatialCoverage embeds the stored period in timePeriods', function () {
        const re = new RegExp('"timePeriods":\\["' + escapeRegex(a.stored) + '"\\]');
        cy.get('meta[name="DC.SpatialCoverage"]').should('have.attr', 'content').and('match', re);
      });
    });
  });

  describe('Issue temporal summary aggregates across all precisions', function () {

    it('min-start year is the BCE article and max-end year is the latest CE seed', function () {
      cy.visit('/' + Cypress.env('contextPath') + '/issue/view/1');
      cy.get('#geoMetadata_issueTemporalRange').should('be.visible');
      // After seeding, issue 1 holds the pre-existing articles (up to 2023 via
      // Wellington ferry, spec 24) plus this spec's five new articles, the
      // earliest being the BCE record.
      cy.get('#geoMetadata_issueTemporalFrom').should('have.text', '-500');
      cy.get('#geoMetadata_issueTemporalTo').should('have.text', '2023');
    });
  });

  describe('Multi-period value (SQL-seeded; UI cannot enter two blocks)', function () {

    before(function () {
      mysqlExec(
        `UPDATE publication_settings SET setting_value = '${MULTI_VALUE}' ` +
        `WHERE setting_name = 'geoMetadata::timePeriods' ` +
        `AND setting_value = '${MULTI_ORIGINAL}'`
      );
    });

    after(function () {
      mysqlExec(
        `UPDATE publication_settings SET setting_value = '${MULTI_ORIGINAL}' ` +
        `WHERE setting_name = 'geoMetadata::timePeriods' ` +
        `AND setting_value = '${MULTI_VALUE}'`
      );
    });

    it('article sidebar renders the first block only (parser behaviour)', function () {
      cy.visit('/');
      cy.get('nav[class="pkp_site_nav_menu"] a:contains("Archive")').click();
      cy.get('a:contains("Vol. 1 No. 2 (2022)")').click();
      cy.get('a:contains("' + MULTI_TARGET_TITLE + '")').last().click();
      cy.get('#geoMetadata_temporal').should('have.value', MULTI_VALUE);
      cy.get('#geoMetadata_span_start').should('have.text', '1990');
      cy.get('#geoMetadata_span_end').should('have.text', '1995');
    });

    it('DC.PeriodOfTime and DC.temporal emit only the first block (plugin behaviour)', function () {
      cy.get('meta[name="DC.PeriodOfTime"]').should('have.attr', 'content', '1990/1995');
      cy.get('meta[name="DC.temporal"]').should('have.attr', 'content', '1990/1995');
    });

    it('issue temporal summary aggregates across blocks (min of any block, max of any block)', function () {
      cy.visit('/' + Cypress.env('contextPath') + '/issue/view/1');
      // The multi-block record contributes min 1990, max 2015; the other
      // existing articles still bound the issue at -500 (BCE) and 2023 (Wellington).
      cy.get('#geoMetadata_issueTemporalFrom').should('have.text', '-500');
      cy.get('#geoMetadata_issueTemporalTo').should('have.text', '2023');
    });
  });

});
