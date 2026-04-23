/**
 * js/lib/temporal.js
 *
 * Copyright (c) 2025 KOMET project, OPTIMETA project, Daniel Nüst, Tom Niers
 * Distributed under the GNU GPL v3. For full terms see the file LICENSE.
 *
 * @brief Shared parser and aggregator for stored time-period strings.
 *
 * Stored format is `{YYYY-MM-DD..YYYY-MM-DD}`; a value may contain multiple
 * concatenated ranges to allow future multi-period entries (issue #57).
 * Year is any integer (negative allowed for BCE, any width for deep history);
 * comparison is numeric so mixed widths sort chronologically.
 */

(function (global) {
    var RANGE_RE = /\{\s*(-?\d+-\d{2}-\d{2})\s*\.\.\s*(-?\d+-\d{2}-\d{2})\s*\}/g;
    var DATE_RE = /^(-?\d+)-(\d{2})-(\d{2})$/;

    function parseDate(s) {
        var m = DATE_RE.exec(s);
        if (!m) return null;
        var mo = +m[2], d = +m[3];
        if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
        return { year: +m[1], month: mo, day: d, raw: s };
    }

    function cmp(a, b) {
        if (a.year !== b.year) return a.year < b.year ? -1 : 1;
        if (a.month !== b.month) return a.month < b.month ? -1 : 1;
        if (a.day !== b.day) return a.day < b.day ? -1 : 1;
        return 0;
    }

    function warn(msg, arg) {
        if (typeof console !== 'undefined' && console.warn) console.warn(msg, arg);
    }

    function parseTimePeriods(raw) {
        if (raw == null || raw === '' || raw === 'no data') return [];
        var out = [];
        var m;
        RANGE_RE.lastIndex = 0;
        while ((m = RANGE_RE.exec(raw)) !== null) {
            var startD = parseDate(m[1]);
            var endD   = parseDate(m[2]);
            if (!startD || !endD) {
                warn('geoMetadata: skipped malformed time period', m[0]);
                continue;
            }
            if (cmp(startD, endD) > 0) { var t = startD; startD = endD; endD = t; }
            out.push({ start: startD.raw, end: endD.raw });
        }
        if (out.length === 0 && raw.length > 0 && raw !== 'no data') {
            warn('geoMetadata: no parseable time period in value', raw);
        }
        return out;
    }

    function aggregateRange(rawValues) {
        var minD = null, maxD = null;
        for (var i = 0; i < rawValues.length; i++) {
            var ranges = parseTimePeriods(rawValues[i]);
            for (var j = 0; j < ranges.length; j++) {
                var s = parseDate(ranges[j].start);
                var e = parseDate(ranges[j].end);
                if (minD === null || cmp(s, minD) < 0) minD = s;
                if (maxD === null || cmp(e, maxD) > 0) maxD = e;
            }
        }
        if (minD === null || maxD === null) return null;
        return { minStart: minD.raw, maxEnd: maxD.raw };
    }

    function yearOf(s) {
        var m = DATE_RE.exec(s);
        return m ? m[1] : '';
    }

    global.geoMetadataTemporal = {
        parseTimePeriods: parseTimePeriods,
        aggregateRange: aggregateRange,
        yearOf: yearOf
    };
})(window);
