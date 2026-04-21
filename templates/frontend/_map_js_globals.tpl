{**
 * templates/frontend/_map_js_globals.tpl
 *
 * Copyright (c) 2025 KOMET project, OPTIMETA project, Daniel Nüst, Tom Niers
 * Distributed under the GNU GPL v3. For full terms see the file LICENSE.
 *
 * @brief Shared JS globals for every map rendered by the plugin.
 *
 * Include once per page that renders a #mapdiv, BEFORE the main plugin JS.
 * Centralises all `const geoMetadata_*` declarations so translations and
 * style constants live in a single place (was duplicated across 5 templates).
 *
 * Template-specific variables (e.g. $geoMetadata_markerBaseUrl,
 * $geoMetadata_articleBaseUrl) stay in the calling template because they
 * are populated from per-request Smarty context, not from {translate}.
 *
 * Translations come in via `$geoMetadata_i18n` (assigned in GeoMetadataPlugin::display).
 * Each value is piped through |escape:'javascript' so a translation containing a
 * literal apostrophe (e.g. fr_FR "Annuler l'édition, …") cannot close the surrounding
 * JS string literal. We cannot chain modifiers off `{translate key="…"}` directly
 * because `{translate}` is a Smarty function tag, not a variable — the modifier would
 * bind to the `key` parameter instead of the output.
 *}
<script type="text/javascript">
// map style (shared by article_details.js, issue.js, journal.js)
const geoMetadata_mapLayerStyle = {
    weight: 5,
    color: '#1E6292',
    dashArray: '',
    fillOpacity: 0.6
};
const geoMetadata_mapLayerStyleHighlight = {
    weight: 5,
    color: 'red',
    dashArray: '',
    fillOpacity: 0.6
};

// layer switcher labels
const geoMetadata_articleLayerName = '{$geoMetadata_i18n.articleLayerName|escape:'javascript'}';
const geoMetadata_layerName        = geoMetadata_articleLayerName; // legacy alias used by issue.js / journal.js
const geoMetadata_adminLayerName   = '{$geoMetadata_i18n.adminLayerName|escape:'javascript'}';
const geoMetadata_overlayGeometry  = '{$geoMetadata_i18n.overlayGeometry|escape:'javascript'}';
const geoMetadata_overlayAdminUnit = '{$geoMetadata_i18n.overlayAdminUnit|escape:'javascript'}';

// fullscreen control (issue #61)
const geoMetadata_fullscreenTitle       = '{$geoMetadata_i18n.fullscreenTitle|escape:'javascript'}';
const geoMetadata_fullscreenTitleCancel = '{$geoMetadata_i18n.fullscreenTitleCancel|escape:'javascript'}';

// zoom control tooltips (issue #151)
const geoMetadata_zoomInTitle  = '{$geoMetadata_i18n.zoomInTitle|escape:'javascript'}';
const geoMetadata_zoomOutTitle = '{$geoMetadata_i18n.zoomOutTitle|escape:'javascript'}';

// geocoder (issue #151)
const geoMetadata_geocoderPlaceholder = '{$geoMetadata_i18n.geocoderPlaceholder|escape:'javascript'}';
const geoMetadata_geocoderError       = '{$geoMetadata_i18n.geocoderError|escape:'javascript'}';
const geoMetadata_geocoderButtonTitle = '{$geoMetadata_i18n.geocoderButtonTitle|escape:'javascript'}';

// Leaflet.Draw toolbar (issue #111) — deep-merged into L.drawLocal at runtime
const geoMetadata_drawLocal = {
    draw: {
        toolbar: {
            actions: {
                title: '{$geoMetadata_i18n.drawActionCancelTitle|escape:'javascript'}',
                text:  '{$geoMetadata_i18n.drawActionCancel|escape:'javascript'}'
            },
            finish: {
                title: '{$geoMetadata_i18n.drawFinishTitle|escape:'javascript'}',
                text:  '{$geoMetadata_i18n.drawFinish|escape:'javascript'}'
            },
            undo: {
                title: '{$geoMetadata_i18n.drawUndoTitle|escape:'javascript'}',
                text:  '{$geoMetadata_i18n.drawUndo|escape:'javascript'}'
            },
            buttons: {
                polyline:  '{$geoMetadata_i18n.drawPolyline|escape:'javascript'}',
                polygon:   '{$geoMetadata_i18n.drawPolygon|escape:'javascript'}',
                rectangle: '{$geoMetadata_i18n.drawRectangle|escape:'javascript'}',
                marker:    '{$geoMetadata_i18n.drawMarker|escape:'javascript'}'
            }
        },
        handlers: {
            marker:    { tooltip: { start: '{$geoMetadata_i18n.drawMarkerTipStart|escape:'javascript'}' } },
            polygon:   { tooltip: {
                start: '{$geoMetadata_i18n.drawPolygonTipStart|escape:'javascript'}',
                cont:  '{$geoMetadata_i18n.drawPolygonTipCont|escape:'javascript'}',
                end:   '{$geoMetadata_i18n.drawPolygonTipEnd|escape:'javascript'}'
            } },
            polyline:  { tooltip: {
                start: '{$geoMetadata_i18n.drawPolylineTipStart|escape:'javascript'}',
                cont:  '{$geoMetadata_i18n.drawPolylineTipCont|escape:'javascript'}',
                end:   '{$geoMetadata_i18n.drawPolylineTipEnd|escape:'javascript'}'
            } },
            rectangle: { tooltip: { start: '{$geoMetadata_i18n.drawRectangleTipStart|escape:'javascript'}' } },
            simpleshape: { tooltip: { end: '{$geoMetadata_i18n.drawSimpleshapeTipEnd|escape:'javascript'}' } }
        }
    },
    edit: {
        toolbar: {
            actions: {
                save: {
                    title: '{$geoMetadata_i18n.editSaveTitle|escape:'javascript'}',
                    text:  '{$geoMetadata_i18n.editSave|escape:'javascript'}'
                },
                cancel: {
                    title: '{$geoMetadata_i18n.editCancelTitle|escape:'javascript'}',
                    text:  '{$geoMetadata_i18n.editCancel|escape:'javascript'}'
                },
                clearAll: {
                    title: '{$geoMetadata_i18n.editClearAllTitle|escape:'javascript'}',
                    text:  '{$geoMetadata_i18n.editClearAll|escape:'javascript'}'
                }
            },
            buttons: {
                edit:           '{$geoMetadata_i18n.editEdit|escape:'javascript'}',
                editDisabled:   '{$geoMetadata_i18n.editEditDisabled|escape:'javascript'}',
                remove:         '{$geoMetadata_i18n.editRemove|escape:'javascript'}',
                removeDisabled: '{$geoMetadata_i18n.editRemoveDisabled|escape:'javascript'}'
            }
        },
        handlers: {
            edit:   { tooltip: {
                text:    '{$geoMetadata_i18n.editHandlerText|escape:'javascript'}',
                subtext: '{$geoMetadata_i18n.editHandlerSubtext|escape:'javascript'}'
            } },
            remove: { tooltip: { text: '{$geoMetadata_i18n.editRemoveHandlerText|escape:'javascript'}' } }
        }
    }
};
</script>
