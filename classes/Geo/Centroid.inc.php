<?php
/**
 * @file classes/Geo/Centroid.inc.php
 *
 * Copyright (c) 2026 KOMET project, OPTIMETA project, Daniel Nüst, Tom Niers
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * @class Centroid
 *
 * @brief Compute a bbox-centre point for a GeoJSON FeatureCollection,
 *        using brick/geo against the OJS DB when available, falling back
 *        to a pure-PHP bbox walk. Both paths return the envelope centre
 *        of the combined geometry.
 */

namespace geoMetadata\classes\Geo;

class Centroid
{
    /**
     * Compute the centroid of the combined geometry of a stored GeoJSON string.
     *
     * @param string $geoJson Stringified GeoJSON (typically a FeatureCollection).
     * @param \PDO|null $pdo  Optional PDO handle used by brick/geo's PdoEngine.
     *                        Pass null to always use the pure-PHP fallback.
     * @return array{0: float, 1: float}|null [lat, lon] or null if no coords found.
     */
    public static function fromGeoJson(string $geoJson, ?\PDO $pdo = null): ?array
    {
        if ($pdo !== null) {
            try {
                $reader    = new \Brick\Geo\IO\GeoJSONReader();
                $parsed    = $reader->read($geoJson);
                $geometry  = self::extractGeometry($parsed);
                if ($geometry !== null) {
                    $engine = new \Brick\Geo\Engine\PDOEngine($pdo);
                    // Envelope first so the centroid semantics match the pure-PHP fallback.
                    $point  = $engine->centroid($engine->envelope($geometry));
                    return [(float)$point->y(), (float)$point->x()];
                }
            } catch (\Throwable $e) {
                // Missing class, unsupported geometry, DB without ST_Centroid,
                // connection lost — any of these falls through to pure PHP.
                error_log('[geoMetadata] brick/geo centroid failed, using fallback: ' . $e->getMessage());
            }
        }

        $decoded = json_decode($geoJson);
        if ($decoded === null) {
            return null;
        }
        $bbox = self::bboxFromGeoJson($decoded);
        return $bbox ? self::fromBbox($bbox) : null;
    }

    /**
     * Reduce a GeoJSONReader result (Geometry, Feature, or FeatureCollection)
     * to a single Geometry; multi-feature input becomes a GeometryCollection.
     * Returns null when no geometry is present.
     */
    private static function extractGeometry(object $parsed): ?\Brick\Geo\Geometry
    {
        if ($parsed instanceof \Brick\Geo\Geometry) {
            return $parsed;
        }
        if ($parsed instanceof \Brick\Geo\IO\GeoJSON\Feature) {
            return $parsed->getGeometry();
        }
        if ($parsed instanceof \Brick\Geo\IO\GeoJSON\FeatureCollection) {
            $geometries = [];
            foreach ($parsed->getFeatures() as $feature) {
                $g = $feature->getGeometry();
                if ($g !== null) {
                    $geometries[] = $g;
                }
            }
            if (count($geometries) === 0) {
                return null;
            }
            if (count($geometries) === 1) {
                return $geometries[0];
            }
            return \Brick\Geo\GeometryCollection::of(...$geometries);
        }
        return null;
    }

    /**
     * Midpoint of a {north, south, east, west} bbox object (the shape used
     * throughout this plugin for stored admin-unit bounding boxes).
     *
     * @return array{0: float, 1: float} [lat, lon]
     */
    public static function fromBbox(object $bbox): array
    {
        return [
            (float)(($bbox->north + $bbox->south) / 2),
            (float)(($bbox->east  + $bbox->west)  / 2),
        ];
    }

    /**
     * Walk a decoded GeoJSON tree and return the envelope of every coordinate
     * pair found across all features / geometries, as a {north,south,east,west}
     * object. Returns null if no coordinates were found.
     */
    public static function bboxFromGeoJson($decoded): ?object
    {
        $bounds = ['n' => null, 's' => null, 'e' => null, 'w' => null];
        self::collectBounds($decoded, $bounds);
        if ($bounds['n'] === null) {
            return null;
        }
        return (object)[
            'north' => $bounds['n'],
            'south' => $bounds['s'],
            'east'  => $bounds['e'],
            'west'  => $bounds['w'],
        ];
    }

    /**
     * Recurse into a decoded GeoJSON node, walking into the `coordinates`
     * property of any {type, coordinates} geometry and descending through
     * FeatureCollection / Feature / GeometryCollection nodes.
     */
    private static function collectBounds($node, array &$bounds): void
    {
        if (is_object($node)) {
            if (isset($node->type, $node->coordinates)) {
                self::walkCoordinates($node->coordinates, $bounds);
                return;
            }
            foreach (get_object_vars($node) as $v) {
                self::collectBounds($v, $bounds);
            }
        } elseif (is_array($node)) {
            foreach ($node as $v) {
                self::collectBounds($v, $bounds);
            }
        }
    }

    /**
     * Recurse into a GeoJSON coordinates array. Leaves are `[lon, lat]` pairs
     * (optionally with an elevation at index 2), non-leaves are arrays of
     * sub-coordinate arrays (LineString, Polygon ring, MultiPolygon, …).
     */
    private static function walkCoordinates($coords, array &$bounds): void
    {
        if (!is_array($coords) || empty($coords)) {
            return;
        }
        if (is_numeric($coords[0]) && isset($coords[1]) && is_numeric($coords[1])) {
            self::addPoint((float)$coords[0], (float)$coords[1], $bounds);
            return;
        }
        foreach ($coords as $sub) {
            self::walkCoordinates($sub, $bounds);
        }
    }

    private static function addPoint(float $lon, float $lat, array &$bounds): void
    {
        $bounds['n'] = $bounds['n'] === null ? $lat : max($bounds['n'], $lat);
        $bounds['s'] = $bounds['s'] === null ? $lat : min($bounds['s'], $lat);
        $bounds['e'] = $bounds['e'] === null ? $lon : max($bounds['e'], $lon);
        $bounds['w'] = $bounds['w'] === null ? $lon : min($bounds['w'], $lon);
    }
}
