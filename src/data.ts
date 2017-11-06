import { apiUrl } from "./config";
import { getAccessToken, showLoginButton } from "./authentication";
import {
  Viewer,
  Space,
  Element,
  GraphicsLayer,
  Dimensions,
  Boundary,
  TileCoordinates,
  FunctionalTileLayer
} from "@rapal/optimaze-viewer";

/**
 * Authenticated JSON request
 */
async function getJson<TData>(url: string): Promise<TData> {
  const accessToken = await getAccessToken();

  const response = await fetch(url, {
    headers: [["Authorization", "Bearer " + accessToken]]
  });

  if (response.ok) {
    return response.json();
  } else {
    throw new Error(response.statusText);
  }
}

export async function getFloorGraphics(companyId: number, floorId: string) {
  const url = `${apiUrl}/${companyId}/floors/${floorId}/graphics`;
  return getJson<FloorGraphics>(url);
}

export async function getSeats(companyId: number, floorId: string) {
  const url = `${apiUrl}/${companyId}/seats?floorId=${floorId}`;
  return getJson<List<Seat>>(url);
}

export async function getTile(
  companyId: number,
  floorId: string,
  layer: GraphicsLayer,
  coordinates: TileCoordinates
): Promise<string> {
  const url =
    `${apiUrl}/${companyId}/floors/${floorId}/tiles?` +
    `layer=${layer}&x=${coordinates.x}&y=${coordinates.y}&z=${coordinates.z}`;
  return getJson<string>(url);
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

interface Seat {
  id: number;
  x: number;
  y: number;
}
