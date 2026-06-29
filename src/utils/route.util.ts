import axios from "axios";

interface Coordinate {
  latitude: number;
  longitude: number;
}

export class RouteUtility {
  static async calculateTotalDistance(
    origin: Coordinate,
    stops: Coordinate[],
  ): Promise<number> {
    if (stops.length === 0) return 0;
    let totalKm = 0;
    let currentOrigin = origin;
    for (const stop of stops) {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${currentOrigin.latitude},${currentOrigin.longitude}&destinations=${stop.latitude},${stop.longitude}&key=${process.env.GOOGLE_API_KEY}`;
      const response = await axios.get(url);
      if (
        response.data.status === "OK" &&
        response.data.rows[0].elements[0].status === "OK"
      ) {
        const distanceBytes = response.data.rows[0].elements[0].distance.value;
        totalKm += distanceBytes / 1000;
      } else {
        totalKm += 5.0;
      }
      currentOrigin = stop;
    }
    return totalKm;
  }
}
