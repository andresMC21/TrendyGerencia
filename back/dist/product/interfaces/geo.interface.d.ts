export interface GeoPoint {
    lat: number;
    lng: number;
}
export interface GeoJsonPoint {
    type: 'Point';
    coordinates: [number, number];
}
export declare const toGeoJson: (p: GeoPoint) => GeoJsonPoint;
export declare const fromGeoJson: (p: GeoJsonPoint) => GeoPoint;
