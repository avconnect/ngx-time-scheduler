import { DateTime } from "luxon";
import { Item } from "./ngx-time-scheduler.model";

export function getDefaultItems(datetime: DateTime): Item[] {
  return [
    {
      id: 1,
      sectionID: 1,
      name: "Item 1",
      start: datetime.startOf("day"),
      end: datetime.startOf("day").plus({ hour: 6 }),
      classes: "block",
      isDraggable: false,
      isResizable: false,
    },
    {
      id: 2,
      sectionID: 2,
      name: "Item 2",
      start: datetime.startOf("day"),
      end: datetime.startOf("day").plus({ hour: 8 }),
      classes: "block",
      isDraggable: false,
      isResizable: false,
    },
    {
      id: 3,
      sectionID: 3,
      name: "Item 3",
      start: datetime.startOf("day"),
      end: datetime.startOf("day").plus({ hour: 10 }),
      classes: "block",
      isDraggable: false,
      isResizable: false,
    },
    {
      id: 4,
      sectionID: 4,
      name: "Item 4",
      start: datetime.startOf("day"),
      end: datetime.startOf("day").plus({ hour: 12 }),
      classes: "block",
      isDraggable: false,
      isResizable: false,
    },
    {
      id: 5,
      sectionID: 5,
      name: "Item 5",
      start: datetime.startOf("day"),
      end: datetime.startOf("day").plus({ hour: 14 }),
      classes: "block",
      isDraggable: false,
      isResizable: false,
    },
  ];
}
