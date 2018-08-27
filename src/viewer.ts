import * as L from "leaflet";
import {
  Viewer,
  Space,
  Element,
  GraphicsLayer,
  FunctionalTileLayer,
  FixedCircle
} from "@rapal/optimaze-viewer";
import { getFloorGraphics, getSeats, getTile } from "./data";

export async function loadViewer(
  companyId: number,
  floorId: string,
  date: Date
) {
  const values = await Promise.all([
    getFloorGraphics(companyId, floorId, date),
    getSeats(companyId, floorId, date)
  ]);

  const floor = values[0];
  const seats = values[1].items;

  const viewer = new Viewer("viewer", floor.dimensions);

  function addLayer(layer: GraphicsLayer) {
    if (floor.graphicsLayers.filter(l => l === layer).length > 0) {
      const architectLayer = new FunctionalTileLayer(
        coordinates => getTile(companyId, floorId, date, layer, coordinates),
        viewer.dimensions
      );
      viewer.addLayer(architectLayer);
    }
  }

  // Add architect and furniture layers if available
  addLayer(GraphicsLayer.Architect);
  addLayer(GraphicsLayer.Furniture);

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
    // Use FixedCircle instead of L.Circle to prevent radius rounding bug
    const circle = new FixedCircle(L.latLng(s.y, s.x), {
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
}
