import * as L from "leaflet";
import * as Q from "q";
import {
  Viewer,
  Space,
  Element,
  GraphicsLayer,
  IDimensions,
  IBoundary,
  ICoordinate
} from "@rapal/optimaze-viewer";

export default function loadViewer(apiUrl: string, companyId: number, floorId: string, accessToken: string) {

  const graphicsUrl = `${apiUrl}/${companyId}/floors/${floorId}/graphics`;
  const seatsUrl = `${apiUrl}/${companyId}/seats?floorId=${floorId}`;

  function getTileUrlTemplate(layer: GraphicsLayer) {
    return `${apiUrl}/${companyId}/floors/${floorId}/tiles?layer=${layer}&x={x}&y={y}&z={z}`;
  }

  function getJson<TData>(url: string) {
    return fetch(url, {
      headers: {
        authorization: "Bearer " + accessToken
      }
    }).then<TData>(r => r.json());
  }

  Q.all([
    getJson<IFloorGraphics>(graphicsUrl),
    getJson<IList<ISeat>>(seatsUrl)
  ]).then(values => {
    const floor = values[0];
    const seats = values[1].items;

    const viewer = new Viewer("viewer", floor.dimensions);

    // Add all available tile layers
    // floor.graphicsLayers.forEach(l =>
    //     viewer.addTileLayer(getTileUrlTemplate(l))
    // );

    // Or add specific tile layer
    viewer.addTileLayer(getTileUrlTemplate(GraphicsLayer.Architect));

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

  interface IFloorGraphics {
    dimensions: IDimensions;
    graphicsLayers: GraphicsLayer[];
    spaceGraphics: ISpaceGraphics[];
    scale: number;
  }

  interface ISpaceGraphics {
    id: string;
    boundaries: IBoundary[];
  }

  interface IList<TItem> {
    items: TItem[];
  }

  interface ISeat {
    id: number;
    x: number;
    y: number;
  }
}
