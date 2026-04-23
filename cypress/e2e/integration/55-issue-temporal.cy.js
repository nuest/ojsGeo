/**
 * @file cypress/e2e/integration/55-issue-temporal.cy.js
 *
 * Copyright (c) 2025 KOMET project, OPTIMETA project, Daniel Nüst, Tom Niers
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * @brief Issue #105: the issue TOC page shows a one-sentence summary of the
 *        overall time period spanned by its articles.
 *
 * Relies on the baseline state left by earlier specs in issue 1:
 *   - Vancouver is cool  — {2021-01-01..2021-12-31}
 *   - Hanover is nice    — {2022-01-01..2022-12-31}
 *   - Editors saves the day — {2022-01-01..2022-12-31}
 *   - Timeless Isle / Atlas of Saxony — no time period
 * Aggregate: years 2021 → 2022.
 */

describe('geoMetadata Issue Temporal Summary', function () {

  const issuePath = '/' + Cypress.env('contextPath') + '/issue/view/1';
  const VANCOUVER_PERIOD = '{2021-01-01..2021-12-31}';
  const MULTI_PERIOD     = '{1990-01-01..1990-12-31}{2020-01-01..2020-06-30}';

  // cypress runs on the host, the MySQL container is named after OJS_DB_HOST ("db")
  // per cypress/docker-compose-mysql.yml, so we can reach it via docker exec.
  function mysqlExec(sql) {
    const host = Cypress.env('DBHOST');
    const user = Cypress.env('DBUSERNAME');
    const pw   = Cypress.env('DBPASSWORD');
    const db   = Cypress.env('DBNAME');
    const escaped = sql.replace(/"/g, '\\"');
    return cy.exec(`docker exec ${host} mysql -u${user} -p${pw} ${db} -e "${escaped}"`);
  }

  it('renders the range sentence spanning the min-start and max-end years', function () {
    cy.visit(issuePath);
    cy.get('#geoMetadata_issueTemporalRange').should('be.visible');
    cy.get('#geoMetadata_issueTemporalFrom').should('have.text', '2021');
    cy.get('#geoMetadata_issueTemporalTo').should('have.text', '2022');
    cy.get('#geoMetadata_issueTemporalSingle').should('not.be.visible');
  });

  it('renders the same summary above the journal-wide map', function () {
    cy.visit('/' + Cypress.env('contextPath') + '/map');
    cy.get('#geoMetadata_journalTemporalRange').should('be.visible');
    // Journal map aggregates every published article across every issue;
    // the full set from specs 21/32/33 spans 2021 (Vancouver) to 2022
    // (Hanover, Münster, Editors).
    cy.get('#geoMetadata_journalTemporalFrom').should('have.text', '2021');
    cy.get('#geoMetadata_journalTemporalTo').should('have.text', '2022');
    cy.get('#geoMetadata_journalTemporalSingle').should('not.be.visible');
  });

  it('aggregates multiple periods within one publication (SQL-seeded)', function () {
    mysqlExec(
      `UPDATE publication_settings SET setting_value = '${MULTI_PERIOD}' ` +
      `WHERE setting_name = 'geoMetadata::timePeriods' ` +
      `AND setting_value = '${VANCOUVER_PERIOD}'`
    );
    cy.visit(issuePath);
    cy.get('#geoMetadata_issueTemporalRange').should('be.visible');
    cy.get('#geoMetadata_issueTemporalFrom').should('have.text', '1990');
    cy.get('#geoMetadata_issueTemporalTo').should('have.text', '2022');
    mysqlExec(
      `UPDATE publication_settings SET setting_value = '${VANCOUVER_PERIOD}' ` +
      `WHERE setting_name = 'geoMetadata::timePeriods' ` +
      `AND setting_value = '${MULTI_PERIOD}'`
    );
  });

  it('aggregates a single-year set via the shared helper', function () {
    cy.visit(issuePath);
    cy.window().then(win => {
      const agg = win.geoMetadataTemporal.aggregateRange([
        '{2024-01-01..2024-03-31}',
        '{2024-07-01..2024-09-30}'
      ]);
      expect(agg).to.deep.equal({ minStart: '2024-01-01', maxEnd: '2024-09-30' });
      expect(agg.minStart.slice(0, 4)).to.equal(agg.maxEnd.slice(0, 4));
    });
  });

  it('drops malformed, legacy-epoch, and no-data values silently', function () {
    cy.visit(issuePath);
    cy.window().then(win => {
      const agg = win.geoMetadataTemporal.aggregateRange([
        'no data',
        '',
        null,
        '{1609459200..1640995199}',
        '{garbage}',
        '[2020-01-01..2020-12-31]',
        '{2020-01-01..2023-06-30}'
      ]);
      expect(agg).to.deep.equal({ minStart: '2020-01-01', maxEnd: '2023-06-30' });

      const none = win.geoMetadataTemporal.aggregateRange(['no data', '', null]);
      expect(none).to.be.null;
    });
  });

  it('auto-swaps when a single range has start > end', function () {
    cy.visit(issuePath);
    cy.window().then(win => {
      const parsed = win.geoMetadataTemporal.parseTimePeriods('{2024-06-30..2024-01-01}');
      expect(parsed).to.deep.equal([{ start: '2024-01-01', end: '2024-06-30' }]);
    });
  });

  it('handles BCE / deep-history years via numeric comparison', function () {
    cy.visit(issuePath);
    cy.window().then(win => {
      const T = win.geoMetadataTemporal;

      // Negative years of wildly different widths: string compare would
      // mis-order these; numeric compare puts -100000 BCE before -1124 BCE.
      const agg = T.aggregateRange([
        '{-100000-01-01..-100000-12-31}',
        '{-1124-06-15..-1124-12-31}',
        '{2020-01-01..2020-12-31}'
      ]);
      expect(agg).to.deep.equal({ minStart: '-100000-01-01', maxEnd: '2020-12-31' });
      expect(T.yearOf(agg.minStart)).to.equal('-100000');
      expect(T.yearOf(agg.maxEnd)).to.equal('2020');

      // Same-year check still works across the sign boundary.
      const single = T.aggregateRange(['{-1124-01-01..-1124-12-31}']);
      expect(T.yearOf(single.minStart)).to.equal(T.yearOf(single.maxEnd));
      expect(T.yearOf(single.minStart)).to.equal('-1124');
    });
  });

  it('rejects textual / B.C. / geological-epoch notation without breaking', function () {
    cy.visit(issuePath);
    cy.window().then(win => {
      const T = win.geoMetadataTemporal;

      expect(T.parseTimePeriods('{1124 B.C...1124 B.C.}')).to.deep.equal([]);
      expect(T.parseTimePeriods('Precambrian')).to.deep.equal([]);
      expect(T.parseTimePeriods('{Paleolithic era}')).to.deep.equal([]);
      expect(T.parseTimePeriods('{Holocene..Present}')).to.deep.equal([]);
      expect(T.parseTimePeriods('10000 BP')).to.deep.equal([]);

      // Junk mixed with valid values: pipeline still aggregates the valid ones.
      const agg = T.aggregateRange([
        '{2020-01-01..2020-12-31}',
        'Precambrian',
        '{1124 B.C...1124 B.C.}',
        null
      ]);
      expect(agg).to.deep.equal({ minStart: '2020-01-01', maxEnd: '2020-12-31' });
    });
  });

});
