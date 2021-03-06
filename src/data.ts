import { format } from "date-fns";
import { apiUrl } from "./config";
import { getAccessToken, logout } from "./authentication";
import {
  GraphicsLayer,
  Dimensions,
  Boundary,
  TileCoordinates
} from "@rapal/optimaze-viewer";

export async function getFloorGraphics(
  companyId: number,
  floorId: string,
  date: Date
) {
  const url =
    `${apiUrl}/${companyId}/floors/${floorId}/graphics` +
    `?date=${format(date, "YYYY-MM-DD")}`;
  return getJson<FloorGraphics>(url);
}

export async function getCapacityObjects(companyId: number, floorId: string, date: Date) {
  const url =
    `${apiUrl}/${companyId}/capacityobjects?floorId=${floorId}` +
    `&date=${format(date, "YYYY-MM-DD")}`;
  return getJson<List<CapacityObject>>(url);
}

export async function getTile(
  companyId: number,
  floorId: string,
  date: Date,
  layer: GraphicsLayer,
  coordinates: TileCoordinates
): Promise<string> {
  const url =
    `${apiUrl}/${companyId}/floors/${floorId}/tiles?` +
    `date=${format(date, "YYYY-MM-DD")}&layer=${layer}` +
    `&x=${coordinates.x}&y=${coordinates.y}&z=${coordinates.z}`;
  return getJson<string>(url);
}

/**
 * Authenticated JSON request.
 */
async function getJson<TData>(url: string): Promise<TData> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(url, {
      headers: [["Authorization", "Bearer " + accessToken]]
    });

    if (response.ok) {
      return response.json();
    } else {
      throw new Error(response.statusText);
    }
  } catch (e) {
    logout();
    throw e;
  }
}

interface FloorGraphics {
  dimensions: Dimensions;
  graphicsLayers: GraphicsLayer[];
  spaceGraphics: SpaceGraphics[];
  scale: number;
}

interface SpaceGraphics {
  id: string;
  boundaries: Boundary[];
}

interface List<TItem> {
  items: TItem[];
}

interface CapacityObject {
  id: number;
  x: number;
  y: number;
}
