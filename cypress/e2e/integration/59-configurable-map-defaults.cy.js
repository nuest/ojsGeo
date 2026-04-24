/**
 * @file cypress/tests/integration/59-configurable-map-defaults.cy.js
 *
 * Copyright (c) 2025 KOMET project, OPTIMETA project, Daniel Nüst, Tom Niers
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * @brief Issues #39, #73, #145 — the plugin settings expose:
 *          - default lat/lng/zoom used by the submission map
 *          - hex colours for article geometry and its hover-highlight
 *          - hex colour + fill opacity for the administrative-unit overlay
 *
 *        Must restore every value to its default in the final block so later
 *        specs see the same baseline.
 */

describe('geoMetadata Configurable Map Defaults', function () {

  const submitBtnSelector = 'form[id="geoMetadataSettings"] button[id^="submitFormButton"]';

  const DEFAULT_LAT  = '0';
  const DEFAULT_LNG  = '0';
  const DEFAULT_ZOOM = '2';
  const DEFAULT_FEATURE_COLOR   = '#1e6292';
  const DEFAULT_HIGHLIGHT_COLOR = '#ff0000';
  const DEFAULT_OVERLAY_COLOR   = '#000000';
  const DEFAULT_OVERLAY_OPACITY = '0.15';
  const DEFAULT_MARKER_HUE           = '0';
  const DEFAULT_MARKER_HUE_HIGHLIGHT = '150';

  const syncedHighlightCheckbox = 'form[id="geoMetadataSettings"] input[name="geoMetadata_enableSyncedHighlight"]';

  const setToggle = (selector, checked) => {
    openSettings();
    if (checked) { cy.get(selector).check(); } else { cy.get(selector).uncheck(); }
    saveSettings();
  };

  const openSettings = () => {
    cy.login('admin', 'admin', Cypress.env('contextPath'));
    cy.get('nav[class="app__nav"] a:contains("Website")').click();
    cy.get('button[id="plugins-button"]').click();
    cy.get('tr[id="component-grid-settings-plugins-settingsplugingrid-category-generic-row-geometadataplugin"] a[class="show_extras"]').click();
    cy.get('a[id^="component-grid-settings-plugins-settingsplugingrid-category-generic-row-geometadataplugin-settings-button"]').click();
  };

  const saveSettings = () => {
    cy.get(submitBtnSelector).click();
    cy.wait(1000);
  };

  const setSubmissionDefaultView = (lat, lng, zoom) => {
    openSettings();
    cy.get('#geoMetadata_defaultMapViewPreview').should('be.visible');
    cy.window().then((win) => {
      expect(win.geoMetadata_settingsMiniMap, 'mini-map exposed on window').to.exist;
      win.geoMetadata_settingsMiniMap.setView([lat, lng], zoom);
      // moveend is what writes the hidden inputs; force it to fire synchronously.
      win.geoMetadata_settingsMiniMap.fire('moveend');
    });
    cy.get('#geoMetadata_submissionMapDefaultLat').should('have.value', String(lat.toFixed(6)));
    cy.get('#geoMetadata_submissionMapDefaultLng').should('have.value', String(lng.toFixed(6)));
    cy.get('#geoMetadata_submissionMapDefaultZoom').should('have.value', String(zoom));
    saveSettings();
  };

  const setColor = (inputId, value) => {
    openSettings();
    cy.get('#' + inputId).invoke('val', value).trigger('input').trigger('change');
    saveSettings();
  };

  const setSlider = (inputId, value) => {
    openSettings();
    cy.get('#' + inputId).invoke('val', value).trigger('input').trigger('change');
    saveSettings();
  };

  const visitSaxony = () => {
    cy.visit('/');
    cy.get('nav[class="pkp_site_nav_menu"] a:contains("Archive")').click();
    cy.get('a:contains("Atlas of Saxony")').last().click();
  };

  const visitCurrentIssue = () => {
    cy.visit('/');
    cy.get('nav[class="pkp_site_nav_menu"] a:contains("Archive")').click();
    cy.get('a:contains("Vol. 1 No. 2 (2022)")').click();
  };

  it('exposes the Map Appearance section in plugin settings', function () {
    openSettings();
    cy.contains('form[id="geoMetadataSettings"]', 'Map appearance').should('exist');
    cy.get('#geoMetadata_submissionMapDefaultLat').should('exist');
    cy.get('#geoMetadata_submissionMapDefaultLng').should('exist');
    cy.get('#geoMetadata_submissionMapDefaultZoom').should('exist');
    cy.get('#geoMetadata_mapFeatureColor').should('have.attr', 'type', 'color');
    cy.get('#geoMetadata_mapFeatureColorHighlight').should('have.attr', 'type', 'color');
    cy.get('#geoMetadata_adminUnitOverlayColor').should('have.attr', 'type', 'color');
    cy.get('#geoMetadata_adminUnitOverlayFillOpacity').should('have.attr', 'type', 'number');
    cy.get('#geoMetadata_markerHueRotation').should('have.attr', 'type', 'range');
    cy.get('#geoMetadata_markerHueRotationHighlight').should('have.attr', 'type', 'range');
    cy.get('#geoMetadata_markerHueRotation_preview').should('exist');
    cy.get('#geoMetadata_markerHueRotationHighlight_preview').should('exist');
  });

  it('ships the configured defaults (issue #39/#145)', function () {
    openSettings();
    cy.get('#geoMetadata_submissionMapDefaultLat').should('have.value', DEFAULT_LAT);
    cy.get('#geoMetadata_submissionMapDefaultLng').should('have.value', DEFAULT_LNG);
    cy.get('#geoMetadata_submissionMapDefaultZoom').should('have.value', DEFAULT_ZOOM);
    cy.get('#geoMetadata_mapFeatureColor').should('have.value', DEFAULT_FEATURE_COLOR);
    cy.get('#geoMetadata_mapFeatureColorHighlight').should('have.value', DEFAULT_HIGHLIGHT_COLOR);
    cy.get('#geoMetadata_adminUnitOverlayColor').should('have.value', DEFAULT_OVERLAY_COLOR);
    cy.get('#geoMetadata_adminUnitOverlayFillOpacity').should('have.value', DEFAULT_OVERLAY_OPACITY);
    cy.get('#geoMetadata_markerHueRotation').should('have.value', DEFAULT_MARKER_HUE);
    cy.get('#geoMetadata_markerHueRotationHighlight').should('have.value', DEFAULT_MARKER_HUE_HIGHLIGHT);
  });

  it('slider updates the readout and preview marker filter live', function () {
    openSettings();
    cy.get('#geoMetadata_markerHueRotation').invoke('val', 75).trigger('input');
    cy.get('#geoMetadata_markerHueRotation_value').should('have.text', '75°');
    cy.get('#geoMetadata_markerHueRotation_preview')
      .should('have.attr', 'style')
      .and('include', 'hue-rotate(75deg)');
  });

  it('mini-map writes lat/lng/zoom into the hidden inputs on moveend', function () {
    openSettings();
    cy.window().then((win) => {
      win.geoMetadata_settingsMiniMap.setView([51, 10], 5);
      win.geoMetadata_settingsMiniMap.fire('moveend');
    });
    cy.get('#geoMetadata_submissionMapDefaultLat').should('have.value', '51.000000');
    cy.get('#geoMetadata_submissionMapDefaultLng').should('have.value', '10.000000');
    cy.get('#geoMetadata_submissionMapDefaultZoom').should('have.value', '5');
  });

  it('submission map opens at the configured centre and zoom', function () {
    setSubmissionDefaultView(51.0, 10.0, 5);

    cy.login('tobler', 'tobler', Cypress.env('contextPath'));
    cy.visit('/' + Cypress.env('contextPath') + '/submission/wizard');
    cy.get('#mapdiv', { timeout: 20000 }).should('be.visible');
    cy.window().should('have.property', 'map');
    cy.window().then((win) => {
      const center = win.map.getCenter();
      expect(center.lat, 'submission map lat').to.be.closeTo(51.0, 0.01);
      expect(center.lng, 'submission map lng').to.be.closeTo(10.0, 0.01);
      expect(win.map.getZoom(), 'submission map zoom').to.equal(5);
    });
  });

  it('article map uses the configured geometry colour', function () {
    setColor('geoMetadata_mapFeatureColor', '#00ff00');

    cy.visit('/');
    cy.get('nav[class="pkp_site_nav_menu"] a:contains("Archive")').click();
    cy.get('a:contains("Hanover is nice")').last().click();
    cy.get('#mapdiv path.leaflet-interactive').first().should('have.attr', 'stroke', '#00ff00');
  });

  it('point-geometry marker picks up the configured hue rotation', function () {
    setSlider('geoMetadata_markerHueRotation', 90);

    // "Vancouver is cool" has a Point geometry.
    cy.visit('/');
    cy.get('nav[class="pkp_site_nav_menu"] a:contains("Archive")').click();
    cy.get('a:contains("Vancouver is cool")').last().click();
    cy.get('#mapdiv img.leaflet-marker-icon.geoMetadata_marker_default')
      .should('have.length.at.least', 1);
    cy.document().its('styleSheets').then(() => {
      cy.get('head style').invoke('text').should('include', 'hue-rotate(90deg)');
    });
  });

  it('.geoMetadata_title_hover border follows the configured highlight colour', function () {
    setColor('geoMetadata_mapFeatureColorHighlight', '#00ff00');

    visitCurrentIssue();
    cy.get('head style').invoke('text').then((css) => {
      expect(css).to.include('.geoMetadata_title_hover');
      expect(css).to.include('border-left-color: #00ff00');
      expect(css).to.include('rgba(0, 255, 0, 0.15)');
    });
  });

  it('synced-highlight toggle off skips the hover wiring; on by default', function () {
    visitCurrentIssue();
    cy.window().its('geoMetadata_enableSyncedHighlight').should('eq', true);

    setToggle(syncedHighlightCheckbox, false);
    visitCurrentIssue();
    cy.window().its('geoMetadata_enableSyncedHighlight').should('eq', false);

    setToggle(syncedHighlightCheckbox, true);
  });

  it('admin-unit overlay uses the configured colour and fill opacity', function () {
    setColor('geoMetadata_adminUnitOverlayColor', '#123456');
    openSettings();
    cy.get('#geoMetadata_adminUnitOverlayFillOpacity').clear().type('0.4');
    saveSettings();

    visitSaxony();
    cy.get('#mapdiv path.leaflet-interactive')
      .should('have.attr', 'stroke', '#123456')
      .and('have.attr', 'fill-opacity', '0.4');
  });

  it('restores every Map Appearance setting to its default', function () {
    setSubmissionDefaultView(parseFloat(DEFAULT_LAT), parseFloat(DEFAULT_LNG), parseInt(DEFAULT_ZOOM, 10));
    setColor('geoMetadata_mapFeatureColor',          DEFAULT_FEATURE_COLOR);
    setColor('geoMetadata_mapFeatureColorHighlight', DEFAULT_HIGHLIGHT_COLOR);
    setColor('geoMetadata_adminUnitOverlayColor',    DEFAULT_OVERLAY_COLOR);
    setSlider('geoMetadata_markerHueRotation',          DEFAULT_MARKER_HUE);
    setSlider('geoMetadata_markerHueRotationHighlight', DEFAULT_MARKER_HUE_HIGHLIGHT);
    setToggle(syncedHighlightCheckbox, true);

    openSettings();
    cy.get('#geoMetadata_adminUnitOverlayFillOpacity').clear().type(DEFAULT_OVERLAY_OPACITY);
    saveSettings();

    openSettings();
    cy.get('#geoMetadata_mapFeatureColor').should('have.value', DEFAULT_FEATURE_COLOR);
    cy.get('#geoMetadata_mapFeatureColorHighlight').should('have.value', DEFAULT_HIGHLIGHT_COLOR);
    cy.get('#geoMetadata_adminUnitOverlayColor').should('have.value', DEFAULT_OVERLAY_COLOR);
    cy.get('#geoMetadata_adminUnitOverlayFillOpacity').should('have.value', DEFAULT_OVERLAY_OPACITY);
    cy.get('#geoMetadata_markerHueRotation').should('have.value', DEFAULT_MARKER_HUE);
    cy.get('#geoMetadata_markerHueRotationHighlight').should('have.value', DEFAULT_MARKER_HUE_HIGHLIGHT);
  });
});
