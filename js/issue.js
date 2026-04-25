/**
 * js/issue.js
 *
 * Copyright (c) 2025 KOMET project, OPTIMETA project, Daniel Nüst, Tom Niers
 * Distributed under the GNU GPL v3. For full terms see the file LICENSE.
 *
 * @brief Display spatio-temporal metadata in the issue view.
 */

var geoMetadata_issueMapEnabled = !!document.getElementById('mapdiv');
var map, articleLocations, geoMetadata_iconStyle, geoMetadata_iconStyleHighlight;

if (geoMetadata_issueMapEnabled) {
    // Seed view; fitBounds() below overrides it once articles load.
    var mapView = "0, 0, 1".split(",");
    map = L.map('mapdiv', { zoomControl: false, worldCopyJump: true }).setView([mapView[0], mapView[1]], mapView[2]);

    // translated zoom control (issue #151)
    L.control.zoom({
        zoomInTitle:  geoMetadata_zoomInTitle,
        zoomOutTitle: geoMetadata_zoomOutTitle
    }).addTo(map);

    var osmlayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(map);

    var baseLayers = {
        "OpenStreetMap": osmlayer
    };
    if (geoMetadata_showEsriBaseLayer) {
        baseLayers["Esri World Imagery"] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 18
        });
    }

    L.control.scale({ position: 'bottomright' }).addTo(map);

    L.control.fullscreen({
        position: 'topleft',
        title: geoMetadata_fullscreenTitle,
        titleCancel: geoMetadata_fullscreenTitleCancel
    }).addTo(map);

    articleLocations = new L.FeatureGroup();
    map.addLayer(articleLocations);

    var overlayMaps = {
        [geoMetadata_layerName]: articleLocations,
    };

    L.control.layers(baseLayers, overlayMaps).addTo(map);

    geoMetadata_iconStyle          = L.icon(geoMetadata_iconStyleConfig);
    geoMetadata_iconStyleHighlight = L.icon(geoMetadata_iconStyleHighlightConfig);
}

// highlighting features based on https://leafletjs.com/examples/choropleth/
function highlightFeature(layer, feature) {
    if (feature && feature.geometry.type === "Point" && layer.options.icon) { // only setIcon on a layer that already has one
        layer.setIcon(geoMetadata_iconStyleHighlight);
    } else {
        layer.setStyle(geoMetadata_mapLayerStyleHighlight);
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }
}

function resetHighlightFeature(layer, feature) {
    if (feature && feature.geometry.type === "Point" && layer.options.icon) {
        layer.setIcon(geoMetadata_iconStyle);
    } else {
        layer.setStyle(geoMetadata_mapLayerStyleHighlight);
        // layer.resetStyle(); // e's layers is a geoJSON layer, so maybe access that function here somehow?
        layer.setStyle(geoMetadata_mapLayerStyle);
    }
}

function highlightArticleFeatures(articleId) {
    let layers = articleLayersMap.get(articleId) || [];
    layers.forEach(layer => {
        highlightFeature(layer, layer.feature);
    });
}

function resetHighlightArticleFeatures(articleId) {
    let layers = articleLayersMap.get(articleId) || [];
    layers.forEach(layer => {
        resetHighlightFeature(layer, layer.feature);
    });
}

// Resolve the article-summary wrapper for a given articleId via the shared
// theme resolver (js/lib/theme_resolvers.js); cache DOM refs in articleWrapperMap
// so we don't re-walk on every hover event.
var articleWrapperMap = new Map();
function geoMetadata_wrapperFor(articleId) {
    if (articleWrapperMap.has(articleId)) return articleWrapperMap.get(articleId);
    var input = document.querySelector('.geoMetadata_data.articleId[value="' + articleId + '"]');
    var resolved = typeof geoMetadata_resolveArticleAnchor === 'function'
        ? geoMetadata_resolveArticleAnchor(input)
        : null;
    articleWrapperMap.set(articleId, resolved);
    return resolved;
}

function highlightArticle(articleId) {
    var r = geoMetadata_wrapperFor(articleId);
    if (r) r.wrapper.classList.add('geoMetadata_title_hover');
}

function resetHighlightArticle(articleId) {
    var r = geoMetadata_wrapperFor(articleId);
    if (r) r.wrapper.classList.remove('geoMetadata_title_hover');
}

// Remembers which icon opened the currently-visible popup so focus can return
// there when the popup closes (Esc / outside click / programmatic close).
var geoMetadata_lastPopupOpener = null;

function geoMetadata_openArticlePopup(articleId) {
    var layers = articleLayersMap.get(articleId) || [];
    if (!layers.length) return;
    var mapEl = document.getElementById('mapdiv');
    if (mapEl && mapEl.scrollIntoView) mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // openPopup after the scroll kicks off; Leaflet positions the popup at render
    // time, so the map's new viewport is already the reference.
    layers[0].openPopup();
}

function geoMetadata_injectIcon(articleIdInput) {
    var resolved = geoMetadata_resolveArticleAnchor(articleIdInput);
    if (!resolved) return null;
    var articleId = articleIdInput.value;
    var title     = articleIdInput.getAttribute('data-title') || '';
    var srLabel   = articleIdInput.getAttribute('data-sr-label') || '';

    var link = document.createElement('a');
    link.className = 'geoMetadata_issue_mapIcon';
    link.href = '#mapdiv';
    link.setAttribute('data-article-id', articleId);
    link.setAttribute('aria-label', geoMetadata_issueMapIconAria);
    link.setAttribute('title', geoMetadata_issueMapIconAria);

    var iconEl = document.createElement('i');
    iconEl.className = 'fa fa-map';
    iconEl.setAttribute('aria-hidden', 'true');
    link.appendChild(iconEl);

    if (srLabel) {
        var sr = document.createElement('span');
        sr.className = 'pkp_screen_reader';
        sr.textContent = srLabel;
        link.appendChild(sr);
    }

    resolved.titleAnchor.insertAdjacentElement('afterend', link);
    return link;
}

var articleLayersMap = new Map();

// load spatial data
$(function () {
    if (!geoMetadata_issueMapEnabled) {
        return;
    }

    // load properties for each article from issue_details.tpl
    var spatialInputs = $('.geoMetadata_data.spatial').toArray().map(input => {
        if (!input.value) return { features: [] };
        try { return JSON.parse(input.value); }
        catch (e) { return { features: [] }; }
    });
    var articleIdInputs = $('.geoMetadata_data.articleId').toArray().map(input => {
        return (input.value);
    });
    var popupInputs = $('.geoMetadata_data.popup').toArray().map(input => {
        return (input.value);
    });

    var spatialInputsAvailable = false;

    spatialInputs.forEach((spatialProperty, index) => {
        let articleId = articleIdInputs[index];
        var features = [];

        if(spatialProperty.features.length !== 0) {
            spatialInputsAvailable = true;
            spatialProperty.features = geoMetadata_prepareFeaturesForDisplay(spatialProperty.features);

            // Array to store all layers for this article
            if (!articleLayersMap.has(articleId)) {
                articleLayersMap.set(articleId, []);
            }

            let layer = L.geoJSON(spatialProperty, {
                pointToLayer: (feature, latlng) => L.marker(latlng, { icon: geoMetadata_iconStyle }),
                onEachFeature: (feature, layer) => {
                    layer.bindPopup(popupInputs[index]);
                    feature.properties['articleId'] = articleId;

                    // Store layer reference for this article
                    articleLayersMap.get(articleId).push(layer);

                    if (geoMetadata_enableSyncedHighlight) {
                        layer.on({
                            mouseover: (e) => {
                                highlightArticleFeatures(articleId);
                                highlightArticle(feature.properties.articleId);
                            },
                            mouseout: (e) => {
                                resetHighlightArticleFeatures(articleId);
                                resetHighlightArticle(feature.properties.articleId);
                            }
                        });
                    }
                    features.push(feature);
                },
                style: geoMetadata_mapLayerStyle
            });

            articleLocations.addLayer(layer);
            map.fitBounds(articleLocations.getBounds());

            if (geoMetadata_showIssueMapIcon) {
                let input = document.querySelector('.geoMetadata_data.articleId[value="' + articleId + '"]');
                let link  = input ? geoMetadata_injectIcon(input) : null;
                if (link) {
                    link.addEventListener('mouseenter', () => {
                        if (geoMetadata_enableSyncedHighlight) highlightArticleFeatures(articleId);
                    });
                    link.addEventListener('mouseleave', () => {
                        if (geoMetadata_enableSyncedHighlight) resetHighlightArticleFeatures(articleId);
                    });
                    link.addEventListener('focus', () => {
                        if (geoMetadata_enableSyncedHighlight) highlightArticleFeatures(articleId);
                    });
                    link.addEventListener('blur', () => {
                        if (geoMetadata_enableSyncedHighlight) resetHighlightArticleFeatures(articleId);
                    });
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        geoMetadata_lastPopupOpener = link;
                        geoMetadata_openArticlePopup(articleId);
                    });
                }
            }
        }
    });

    // Return focus to the icon that opened the popup when the popup closes.
    map.on('popupclose', function () {
        if (geoMetadata_lastPopupOpener) {
            var opener = geoMetadata_lastPopupOpener;
            geoMetadata_lastPopupOpener = null;
            opener.focus();
        }
    });

    if (!spatialInputsAvailable) {
        $("#mapdiv").hide();
        return;
    }

    setTimeout(function () {
        L.control.geoMetadataResetView({ position: 'topleft', title: geoMetadata_resetViewTitle }).addTo(map);
    }, 0);
});

// aggregate time periods across articles and render the appropriate sentence
$(function () {
    var rangeEl = document.getElementById('geoMetadata_issueTemporalRange');
    var singleEl = document.getElementById('geoMetadata_issueTemporalSingle');
    if (!rangeEl || !singleEl) {
        return;
    }

    var rawValues = $('.geoMetadata_data.temporal').toArray().map(function (input) {
        return input.value;
    });
    var aggregate = window.geoMetadataTemporal.aggregateRange(rawValues);
    if (!aggregate) {
        return;
    }

    var fromYear = window.geoMetadataTemporal.yearOf(aggregate.minStart);
    var toYear = window.geoMetadataTemporal.yearOf(aggregate.maxEnd);

    if (fromYear === toYear) {
        document.getElementById('geoMetadata_issueTemporalYear').textContent = fromYear;
        singleEl.style.display = '';
    } else {
        document.getElementById('geoMetadata_issueTemporalFrom').textContent = fromYear;
        document.getElementById('geoMetadata_issueTemporalTo').textContent = toYear;
        rangeEl.style.display = '';
    }
});
