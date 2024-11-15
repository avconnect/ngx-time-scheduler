import { CdkDropList } from "@angular/cdk/drag-drop";
import { DateTime } from "luxon";

export class Period {
  name: string;
  classes: string;
  timeFramePeriod: number;
  timeFrameOverall: number;
  timeFrameHeaders: string[];
  timeFrameHeadersTooltip?: string[];
  tooltip?: string;
}

export class Item {
  id: number;
  name: string;
  start: DateTime;
  end: DateTime;
  classes: string;
  sectionID: number;
  tooltip?: string;
  metadata?: any;
  isDraggable: boolean;
  isResizable: boolean;
  type?: "block" | "charge" | "full-charged" | "detected";
}

export class Section {
  id: number;
  name: string;
  tooltip?: string;
  icon?: Icon;
  backgroundColor?: string;
  data?: (string | number)[];

  constructor() {
    this.backgroundColor = "transparent";
  }
}

export class Text {
  NextButton: string;
  PrevButton: string;
  TodayButton: string;
  GotoButton: string;
  SectionTitle: string;

  constructor() {
    this.NextButton = "Next";
    this.PrevButton = "Prev";
    this.TodayButton = "Today";
    this.GotoButton = "Go to";
    this.SectionTitle = "BUS";
  }
}

export class Events {
  // ItemResized: (item: Item, start: any, end: any) => void;
  // ItemMovement: (item: Item, start: any, end: any) => void;
  // ItemMovementStart: (item: Item, start: any, end: any) => void;
  // ItemMovementEnd: (item: Item, start: any, end: any) => void;
  ItemDropped: (
    item: Item,
    currContainer: CdkDropList,
    prevContainer: CdkDropList
  ) => void;
  ItemClicked: (item: Item) => void;
  ItemContextMenu: (item: Item, event: MouseEvent) => void;
  SectionClickEvent: (section: Section) => void;
  SectionContextMenuEvent: (section: Section, event: MouseEvent) => void;
  PeriodChange: (start: DateTime, end: DateTime) => void;
  SortItemClicked: (item: SortItem) => void;
  SettingItemClicked: (item: SettingItem) => void;
}

export class SectionItem {
  section: Section;
  minRowHeight: number;
  itemMetas: ItemMeta[];

  constructor() {
    this.itemMetas = new Array<ItemMeta>();
  }
}

export class ItemMeta {
  item: Item;
  isStart: boolean;
  isEnd: boolean;
  cssTop: number;
  cssLeft: number;
  cssWidth: number;

  constructor() {
    this.cssTop = 0;
    this.cssLeft = 0;
    this.cssWidth = 0;
  }
}

export class Header {
  headerDetails: HeaderDetails[];

  constructor() {
    this.headerDetails = new Array<HeaderDetails>();
  }
}

export class HeaderDetails {
  name: string;
  colspan: number;
  tooltip?: string;
}

export class SortItem {
  text: string;
  prop: string;
}

export class SettingItem {
  text: string;
  id: string;
}

export class Icon {
  name: string;
  tooltip?: string;
  classes?: string;
  color?: string = "";
}
