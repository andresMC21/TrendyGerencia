"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromGeoJson = exports.toGeoJson = void 0;
const toGeoJson = (p) => ({
    type: 'Point',
    coordinates: [p.lng, p.lat],
});
exports.toGeoJson = toGeoJson;
const fromGeoJson = (p) => ({
    lat: p.coordinates[1],
    lng: p.coordinates[0],
});
exports.fromGeoJson = fromGeoJson;
//# sourceMappingURL=geo.interface.js.map