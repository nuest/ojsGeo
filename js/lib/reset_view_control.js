/**
 * js/lib/reset_view_control.js
 *
 * Copyright (c) 2026 KOMET project, OPTIMETA project, Daniel Nüst, Tom Niers
 * Distributed under the GNU GPL v3. For full terms see the file LICENSE.
 *
 * @brief Leaflet control that snapshots the map's {center, zoom} the first
 *        time it is added and restores that view on click. Call-site pattern:
 *
 *            map.whenReady(function () {
 *                setTimeout(function () {
 *                    L.control.geoMetadataResetView({
 *                        position: 'topleft',
 *                        title: geoMetadata_resetViewTitle
 *                    }).addTo(map);
 *                }, 0);
 *            });
 *
 *        The setTimeout(0) defers past the plugin's $(function(){...}) handler
 *        so any fitBounds() issued during init is reflected in the snapshot.
 *        The snapshot is taken once in onAdd; later programmatic fitBounds
 *        calls (admin-unit overlay, draw handlers, …) do not refresh it —
 *        the button's contract is "back to the initial view of this page",
 *        not "refit to current work".
 */

L.Control.GeoMetadataResetView = L.Control.extend({
    options: {
        position: 'topleft',
        title: 'Reset view'
    },
    onAdd: function (map) {
        this._initialCenter = map.getCenter();
        this._initialZoom   = map.getZoom();
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        var link      = L.DomUtil.create('a', 'leaflet-control-geoMetadataResetView', container);
        link.href  = '#';
        link.title = this.options.title;
        link.setAttribute('aria-label', this.options.title);
        link.innerHTML = '<i class="fa fa-home" aria-hidden="true"></i>';
        var self = this;
        L.DomEvent.on(link, 'click', function (e) {
            L.DomEvent.preventDefault(e);
            L.DomEvent.stopPropagation(e);
            map.setView(self._initialCenter, self._initialZoom);
        });
        L.DomEvent.disableClickPropagation(container);
        return container;
    }
});

L.control.geoMetadataResetView = function (opts) {
    return new L.Control.GeoMetadataResetView(opts);
};
