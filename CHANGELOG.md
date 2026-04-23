# Changelog

All notable changes to the geoMetadata plugin are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0.0] - unreleased

Internationalisation, configurability, and HTML-head metadata — target release for [Milestone 7](https://github.com/TIBHannover/geoMetadata/milestone/7) (OJS 3.3; OJS 3.5 support tracked separately).

### Added

- Fullscreen button on all maps ([#61](https://github.com/TIBHannover/geoMetadata/issues/61)).
- `ICBM`, `geo.position`, and `geo.region` HTML meta tags ([#87](https://github.com/TIBHannover/geoMetadata/issues/87), [#88](https://github.com/TIBHannover/geoMetadata/issues/88)).
- Configurable base layer with reader-facing info on the external services in use ([#124](https://github.com/TIBHannover/geoMetadata/issues/124)).
- Admin toggles for article, issue, and journal map visibility ([#23](https://github.com/TIBHannover/geoMetadata/issues/23)).
- Admin toggles for the submission form, editorial workflow tab, HTML meta tags, and map geocoder ([#23](https://github.com/TIBHannover/geoMetadata/issues/23)).
- Admin toggle to show/hide the GeoJSON download button in the article sidebar ([#55](https://github.com/TIBHannover/geoMetadata/issues/55)).
- Cypress coverage for all admin toggles and for the time-period field in the HTML-head GeoJSON export ([#106](https://github.com/TIBHannover/geoMetadata/issues/106)).

### Changed

- Translated remaining Leaflet controls — zoom, geocoder, and draw toolbar ([#109](https://github.com/TIBHannover/geoMetadata/issues/109), [#111](https://github.com/TIBHannover/geoMetadata/issues/111), [#151](https://github.com/TIBHannover/geoMetadata/issues/151)).
- Cleaned up i18n antipatterns ([#152](https://github.com/TIBHannover/geoMetadata/issues/152)).
- Aligned msgid order across `en_US` / `de_DE` / `fr_FR` / `es_ES` locales and regenerated `messages.mo`.

### Fixed

- Locale switching in tests; restored `DC.PeriodOfTime` HTML meta emission.
- Removed dead `isEsriBaseLayerEnabled` helper.

## [1.0.1.0] - 2025-10-14

Bugfix and packaging release on the `stable-3_3_0` branch.

### Added

- Seeded `testData` dump with the `tobler` author/reviewer account and polyline sample.

### Fixed

- PHP 8.1+ compatibility.
- Re-editing of geospatial properties on existing submissions.
- Issue map: highlight all features of an article when any one is hovered.
- Journal and issue views when a submission has no geoMetadata.
- Journal map Smarty template breaking on apostrophes in titles.
- `submissionId` vs `publicationId` mix-up in journal-map article links.
- Fetch publication via `SubmissionDAO` to avoid stale previous-submission data.
- Font Awesome loaded via OJS to avoid version conflicts.

### Changed

- `testData` excluded from release archives.
- Removed the OptiMeta logo and discontinued-theme references from the README.
