import * as L from "leaflet";
import * as Q from "q";
import {
  Viewer,
  Space,
  Element,
  GraphicsLayer,
  Dimensions,
  Boundary,
  TileCoordinates
} from "@rapal/optimaze-viewer";

export default function loadViewer(
  apiUrl: string,
  companyId: number,
  floorId: string,
  accessToken: string
) {
  // Authenticated JSON request
  function getJson<TData>(url: string) {
    return fetch(url, {
      headers: {
        authorization: "Bearer " + accessToken
      }
    }).then<TData>(r => r.json());
  }

  function getFloorGraphics() {
    const url = `${apiUrl}/${companyId}/floors/${floorId}/graphics`;
    return getJson<FloorGraphics>(url);
  }

  function getSeats() {
    const url = `${apiUrl}/${companyId}/seats?floorId=${floorId}`;
    return getJson<List<Seat>>(url);
  }

  const tileCache: { [url: string]: string } = {};

  function getTile(
    layer: GraphicsLayer,
    coordinates: TileCoordinates
  ): Promise<string> {
    const url =
      `${apiUrl}/${companyId}/floors/${floorId}/tiles?` +
      `layer=${layer}&x=${coordinates.x}&y=${coordinates.y}&z=${coordinates.z}`;

    return getJson<string>(url).then(data => (tileCache[url] = data));
  }

  Q.all([getFloorGraphics(), getSeats()]).then(values => {
    const floor = values[0];
    const seats = values[1].items;

    const viewer = new Viewer("viewer", floor.dimensions);

    // Add architect layer if available
    if (floor.graphicsLayers.filter(l => l === GraphicsLayer.Architect)) {
      viewer.addTileLayer(coordinates =>
        getTile(GraphicsLayer.Architect, coordinates)
      );
    }

    // Add furniture layer if available
    if (floor.graphicsLayers.filter(l => l === GraphicsLayer.Furniture)) {
      viewer.addTileLayer(coordinates =>
        getTile(GraphicsLayer.Furniture, coordinates)
      );
    }

    // Creating custom panes is not neccessary, but makes sure
    // that elements of the same type are shown at the same z-index
    viewer.createPane("spaces").style.zIndex = "405";
    viewer.createPane("seats").style.zIndex = "410";

    // Create selectable space layers
    const spaceLayers = floor.spaceGraphics.map(s => {
      return new Space(
        s.id,
        s.boundaries,
        { pane: "spaces" },
        { selectable: true }
      );
    });

    spaceLayers.forEach(space => {
      // Add to map
      viewer.addLayer(space);

      // Deselect other spaces and log space id when selected
      space.on("select", e => {
        const id = e.target.id;
        spaceLayers.filter(s => s.id !== id).forEach(s => (s.selected = false));
        console.log("select space " + id);
      });

      // Log space id when deselected
      space.on("deselect", e => {
        const id = e.target.id;
        console.log("deselect space " + id);
      });
    });

    // Create selectable seat layer
    // Seats are shown as circles with 500mm radius
    // Seat styles are specified using the style function
    const seatLayers = seats.map(s => {
      const circle = L.circle(L.latLng(s.y, s.x), {
        radius: 500,
        pane: "seats"
      });
      return new Element(s.id.toString(), [circle], {
        selectable: true,
        styleFunction: e => ({
          color: e.selected ? "#f00" : "#666",
          weight: e.selected ? 2 : 1,
          opacity: 1,
          fillColor: e.selected ? "#faa" : "#ccc",
          fillOpacity: 1,
          pane: "seats"
        })
      });
    });

    seatLayers.forEach(seat => {
      // Add to map
      viewer.addLayer(seat);

      // Deselect other seats and log seat id when selected
      seat.on("select", e => {
        const id = e.target.id;
        seatLayers.filter(s => s.id !== id).forEach(s => (s.selected = false));
        console.log("select seat " + id);
      });

      // Log seat id when deselected
      seat.on("deselect", e => {
        const id = e.target.id;
        console.log("deselect seat " + id);
      });
    });
  });

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
}
