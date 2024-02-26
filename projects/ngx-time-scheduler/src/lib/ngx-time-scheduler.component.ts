import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  ViewChildren,
  QueryList,
} from "@angular/core";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { NgxTimeSchedulerService } from "./ngx-time-scheduler.service";
import {
  HeaderDetails,
  Header,
  ItemMeta,
  Item,
  Period,
  SectionItem,
  Section,
  Text,
  Events,
  SortItem,
  SettingItem,
} from "./ngx-time-scheduler.model";
import { DateTime, Info, Settings } from "luxon";
import { Subscription } from "rxjs";
import { LoadingState } from "./ngx-time-scheduler.enums";
import { DEFAULT_SECTIONS } from "./ngx-time-scheduler.constants";
import { getDefaultItems } from "./ngx-time-scheduler.utils";

@Component({
  selector: "ngx-ts[items][periods][sections]",
  templateUrl: "./ngx-time-scheduler.component.html",
  styleUrls: ["./ngx-time-scheduler.component.css"],
  encapsulation: ViewEncapsulation.None,
})
export class NgxTimeSchedulerComponent implements OnInit, OnDestroy {
  @ViewChild("sectionTd") set SectionTd(elementRef: ElementRef) {
    this.SectionLeftMeasure = elementRef.nativeElement.clientWidth + "px";
    this.changeDetector.detectChanges();
  }
  @ViewChildren("sectionContainers", { read: ElementRef })
  sectionContainers: QueryList<ElementRef>;

  @Input() currentTimeFormat = "DD-MMM-YYYY HH:mm";
  @Input() showCurrentTime = true;
  @Input() showGoto = true;
  @Input() showToday = true;
  @Input() allowDragging = false;
  // @Input() allowResizing = false;
  @Input() locale = "";
  @Input() showBusinessDayOnly = false;
  @Input() headerFormat = "Do MMM YYYY";
  @Input() minRowHeight = 40;
  @Input() maxHeight: string = null;
  @Input() text = new Text();
  @Input() items: Item[] = [];
  @Input() sections: Section[];
  @Input() periods: Period[];
  @Input() events: Events = new Events();
  @Input() start = DateTime.now().startOf("day");
  @Input() timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone; // guessing user timezone
  @Input() sortItems: SortItem[] = [];
  @Input() btnClasses: string = "";
  @Input() periodActiveClass: string = "period-default-active";
  @Input() settingItems: SettingItem[] = [];
  @Input() startHour: number = 0;
  @Input() showHeader: boolean = true;
  @Input() headers: string[] = [];
  @Input() loadingState: LoadingState = LoadingState.NOT_LOADED;

  end = DateTime.now().endOf("day");
  showGotoModal = false;
  currentTimeIndicatorPosition: string;
  currentTimeVisibility = "visible";
  currentTimeTitle: string;
  ShowCurrentTimeHandle = null;
  SectionLeftMeasure = "0";
  currentPeriod: Period;
  currentPeriodMinuteDiff = 0;
  header: Header[] = [];
  sectionItems: SectionItem[] = [];
  subscription = new Subscription();
  formattedHeader: string;
  activePeriod: number = 0;
  draggedItemCache: ItemMeta;
  public LOADING_STATE = LoadingState;
  public DEFAULT_ITEMS: Item[] = [];
  public DEFAULT_SECTION_ITEMS: SectionItem[] = [];
  public DEFAULT_SECTIONS = DEFAULT_SECTIONS;

  public get SECTION_ITEMS(): SectionItem[] {
    if (this.loadingState !== LoadingState.LOADED)
      return this.DEFAULT_SECTION_ITEMS;
    return this.sectionItems;
  }

  constructor(
    private changeDetector: ChangeDetectorRef,
    private service: NgxTimeSchedulerService
  ) {
    Settings.defaultLocale = this.locale;
  }

  ngOnInit(): void {
    this.setActivePeriodButton(this.activePeriod);
    this.setTimezone();
    this.DEFAULT_ITEMS = getDefaultItems(this.start);
    this.setStartHour();
    this.setSectionsInSectionItems();
    this.changePeriod(this.periods[0], false);
    this.itemPush();
    this.itemPop();
    this.itemRemove();
    this.sectionPush();
    this.sectionPop();
    this.sectionRemove();
    this.refresh();
  }

  setActivePeriodButton(idx: number) {
    this.activePeriod = idx;
    this.periods = this.periods.map((period, index) => ({
      ...period,
      isClicked: index === this.activePeriod ? true : false,
    }));
  }

  refreshView() {
    this.setSectionsInSectionItems();
    this.changePeriod(this.currentPeriod, false);
  }

  trackByFn(index, item) {
    return index;
  }

  setTimezone() {
    // set timezone to browser default if invalid input is provided
    if (!Info.isValidIANAZone(this.timezone))
      this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    Settings.defaultZone = this.timezone;

    // set timezone to both start and end
    this.start = this.start.setZone(this.timezone).startOf("day");
    this.end = this.end.setZone(this.timezone).startOf("day");
  }

  setStartHour() {
    this.start = this.start.plus({ hour: this.startHour });
    this.end = this.end.plus({ hour: this.startHour });
  }

  setSectionsInSectionItems() {
    this.DEFAULT_SECTION_ITEMS = new Array<SectionItem>();
    DEFAULT_SECTIONS.forEach((section) => {
      const perSectionItem = new SectionItem();
      perSectionItem.section = section;
      perSectionItem.minRowHeight = this.minRowHeight;
      this.DEFAULT_SECTION_ITEMS.push(perSectionItem);
    });

    this.sectionItems = new Array<SectionItem>();
    this.sections.forEach((section) => {
      const perSectionItem = new SectionItem();
      perSectionItem.section = section;
      perSectionItem.minRowHeight = this.minRowHeight;
      this.sectionItems.push(perSectionItem);
    });
  }

  setItemsInSectionItems() {
    const _itemMetas = new Array<ItemMeta>();

    this.DEFAULT_SECTION_ITEMS.forEach((ele) => {
      ele.itemMetas = new Array<ItemMeta>();
      ele.minRowHeight = this.minRowHeight;

      this.DEFAULT_ITEMS.filter((i) => {
        let itemMeta = new ItemMeta();

        if (i.sectionID === ele.section.id) {
          itemMeta.item = i;
          if (
            itemMeta.item.start <= this.end &&
            itemMeta.item.end >= this.start
          ) {
            itemMeta = this.itemMetaCal(itemMeta);
            ele.itemMetas.push(itemMeta);
            _itemMetas.push(itemMeta);
          }
        }
      });
    });

    const sortedDefaultItems = _itemMetas.reduce(
      (sortItems: {}, itemMeta: ItemMeta) => {
        const index = this.DEFAULT_SECTION_ITEMS.findIndex(
          (sectionItem) => sectionItem.section.id === itemMeta.item.sectionID
        );
        if (!sortItems[index]) {
          sortItems[index] = [];
        }
        sortItems[index].push(itemMeta);
        return sortItems;
      },
      {}
    );

    // NOTE: call method to add space to top of conflicting block
    this.calCssTop(sortedDefaultItems);

    const itemMetas = new Array<ItemMeta>();

    this.sectionItems.forEach((ele) => {
      ele.itemMetas = new Array<ItemMeta>();
      ele.minRowHeight = this.minRowHeight;

      this.items.filter((i) => {
        let itemMeta = new ItemMeta();

        if (i.sectionID === ele.section.id) {
          itemMeta.item = i;
          if (
            itemMeta.item.start <= this.end &&
            itemMeta.item.end >= this.start
          ) {
            itemMeta = this.itemMetaCal(itemMeta);
            ele.itemMetas.push(itemMeta);
            itemMetas.push(itemMeta);
          }
        }
      });
    });

    const sortedItems = itemMetas.reduce(
      (sortItems: {}, itemMeta: ItemMeta) => {
        const index = this.sectionItems.findIndex(
          (sectionItem) => sectionItem.section.id === itemMeta.item.sectionID
        );
        if (!sortItems[index]) {
          sortItems[index] = [];
        }
        sortItems[index].push(itemMeta);
        return sortItems;
      },
      {}
    );

    // NOTE: call method to add space to top of conflicting block
    this.calCssTop(sortedItems);
  }

  itemMetaCal(itemMeta: ItemMeta) {
    const foundStart = DateTime.max(itemMeta.item.start, this.start);
    const foundEnd = DateTime.min(itemMeta.item.end, this.end);

    let widthMinuteDiff = Math.abs(
      foundStart.diff(foundEnd, ["minutes"]).toObject().minutes
    );
    let leftMinuteDiff = foundStart
      .diff(this.start, ["minutes"])
      .toObject().minutes;
    if (this.showBusinessDayOnly) {
      // create new reference to datetime
      widthMinuteDiff -=
        this.getNumberOfWeekendDays(
          DateTime.fromMillis(foundStart.toMillis()),
          DateTime.fromMillis(foundEnd.toMillis())
        ) * this.currentPeriod.timeFramePeriod;
      leftMinuteDiff -=
        this.getNumberOfWeekendDays(
          DateTime.fromMillis(this.start.toMillis()),
          DateTime.fromMillis(foundStart.toMillis())
        ) * this.currentPeriod.timeFramePeriod;
    }

    itemMeta.cssLeft = (leftMinuteDiff / this.currentPeriodMinuteDiff) * 100;
    itemMeta.cssWidth = (widthMinuteDiff / this.currentPeriodMinuteDiff) * 100;

    if (itemMeta.item.start >= this.start) {
      itemMeta.isStart = true;
    }
    if (itemMeta.item.end <= this.end) {
      itemMeta.isEnd = true;
    }

    return itemMeta;
  }

  calCssTop(sortedItems) {
    for (const prop of Object.keys(sortedItems)) {
      for (let i = 0; i < sortedItems[prop].length; i++) {
        let elemBottom;
        const elem = sortedItems[prop][i];

        for (let prev = 0; prev < i; prev++) {
          const prevElem = sortedItems[prop][prev];
          const prevElemBottom = prevElem.cssTop + this.minRowHeight;
          elemBottom = elem.cssTop + this.minRowHeight;

          if (
            ((prevElem.item.start <= elem.item.start &&
              elem.item.start <= prevElem.item.end) ||
              (prevElem.item.start <= elem.item.end &&
                elem.item.end <= prevElem.item.end) ||
              (prevElem.item.start >= elem.item.start &&
                elem.item.end >= prevElem.item.end)) &&
            ((prevElem.cssTop <= elem.cssTop &&
              elem.cssTop <= prevElemBottom) ||
              (prevElem.cssTop <= elemBottom && elemBottom <= prevElemBottom))
          ) {
            elem.cssTop = prevElemBottom + 1;
            prev = 0;
          }
        }

        elemBottom = elem.cssTop + this.minRowHeight + 1;
        if (
          this.sectionItems[Number(prop)] &&
          elemBottom > this.sectionItems[Number(prop)].minRowHeight
        ) {
          this.sectionItems[Number(prop)].minRowHeight = elemBottom;
        }
      }
    }
  }

  changePeriod(period: Period, userTrigger: boolean = true) {
    this.currentPeriod = period;
    const _start = this.start;
    this.end = DateTime.fromMillis(_start.toMillis()).plus({
      minutes: this.currentPeriod.timeFrameOverall,
    });
    this.currentPeriodMinuteDiff = Math.abs(
      this.start.diff(this.end, ["minutes"]).toObject().minutes
    );

    if (userTrigger && this.events.PeriodChange) {
      let _end = DateTime.fromMillis(this.end.toMillis());
      /**
       * end date is one day ahead at midnight (hour == 0)
       * which gives out two date period in 24 hr period (e.g start = 8/9 12:00 AM, end = 9/9 12:00 AM)
       */
      if (_end.hour === 0) _end = _end.minus({ day: 1 });
      this.events.PeriodChange(this.start, _end);
    }

    if (this.showBusinessDayOnly) {
      this.currentPeriodMinuteDiff -=
        this.getNumberOfWeekendDays(
          DateTime.fromMillis(this.start.toMillis()),
          DateTime.fromMillis(this.end.toMillis())
        ) * this.currentPeriod.timeFramePeriod;
    }

    this.header = new Array<Header>();
    this.currentPeriod.timeFrameHeaders.forEach(
      (ele: string, index: number) => {
        this.header.push(this.getDatesBetweenTwoDates(ele, index));
      }
    );

    this.setItemsInSectionItems();
    this.showCurrentTimeIndicator();
    this.formatHeader();
  }

  showCurrentTimeIndicator = () => {
    if (this.ShowCurrentTimeHandle) {
      clearTimeout(this.ShowCurrentTimeHandle);
    }

    const currentTime = DateTime.now();
    if (currentTime >= this.start && currentTime <= this.end) {
      this.currentTimeVisibility = "visible";
      this.currentTimeIndicatorPosition =
        (Math.abs(
          this.start.diff(currentTime, ["minutes"]).toObject().minutes
        ) /
          this.currentPeriodMinuteDiff) *
          100 +
        "%";
      this.currentTimeTitle = currentTime.toFormat(this.currentTimeFormat);
    } else {
      this.currentTimeVisibility = "hidden";
    }
    this.ShowCurrentTimeHandle = setTimeout(
      this.showCurrentTimeIndicator,
      30000
    );
  };

  gotoToday() {
    this.start = DateTime.now().startOf("day");
    this.changePeriod(this.currentPeriod);
  }

  nextPeriod() {
    this.start = this.start.plus({
      minutes: this.currentPeriod.timeFrameOverall,
    });
    this.changePeriod(this.currentPeriod);
  }

  previousPeriod() {
    this.start = this.start.minus({
      minutes: this.currentPeriod.timeFrameOverall,
    });
    this.changePeriod(this.currentPeriod);
  }

  // NOTE: event is string with comma separated iso timestamps e.g. start, end
  gotoDate(event: string) {
    this.showGotoModal = false;
    const timestamps = event.split(",");
    this.start = DateTime.fromISO(timestamps[0], { setZone: true });
    this.changePeriod(this.currentPeriod);
  }

  getDatesBetweenTwoDates(format: string, index: number): Header {
    let now = DateTime.fromMillis(this.start.toMillis());
    const dates = new Header();
    let prev: string;
    let colspan = 0;

    while (now.toMillis() < this.end.toMillis()) {
      if (!this.showBusinessDayOnly || now.day < 6) {
        const headerDetails = new HeaderDetails();
        headerDetails.name = now.setLocale(this.locale).toFormat(format);
        if (prev && prev !== headerDetails.name) {
          colspan = 1;
        } else {
          colspan++;
          dates.headerDetails.pop();
        }
        prev = headerDetails.name;
        headerDetails.colspan = colspan;
        headerDetails.tooltip =
          this.currentPeriod.timeFrameHeadersTooltip &&
          this.currentPeriod.timeFrameHeadersTooltip[index]
            ? now
                .setLocale(this.locale)
                .toFormat(this.currentPeriod.timeFrameHeadersTooltip[index])
            : "";
        dates.headerDetails.push(headerDetails);
      }
      now = now.plus({ minutes: this.currentPeriod.timeFramePeriod });
    }
    return dates;
  }

  getNumberOfWeekendDays(startDate: DateTime, endDate: DateTime): number {
    let count = 0;
    while (
      startDate.toMillis() < endDate.toMillis() ||
      startDate.equals(endDate)
    ) {
      if (startDate.weekday >= 6) {
        // >= 6 days are the weekends
        count++;
      }
      startDate = startDate.plus({
        minutes: this.currentPeriod.timeFramePeriod,
      });
    }
    return count;
  }

  drop(event: CdkDragDrop<Section>) {
    this.events.ItemDropped(
      event.item.data,
      event.container,
      event.previousContainer
    );

    // NOTE: only for items from the scheduler
    if (event.previousContainer.data instanceof Section) {
      event.item.data.sectionID = event.container.data.id;
      this.refreshView();
    }
  }

  itemPush() {
    this.subscription.add(
      this.service.itemAdd.asObservable().subscribe((item: Item) => {
        this.items.push(item);
        this.refreshView();
      })
    );
  }

  itemPop() {
    this.subscription.add(
      this.service.item.asObservable().subscribe(() => {
        this.items.pop();
        this.refreshView();
      })
    );
  }

  itemRemove() {
    this.subscription.add(
      this.service.itemId.asObservable().subscribe((itemId: number) => {
        this.items.splice(
          this.items.findIndex((item) => {
            return item.id === itemId;
          }),
          1
        );
        this.refreshView();
      })
    );
  }

  sectionPush() {
    this.subscription.add(
      this.service.sectionAdd.asObservable().subscribe((section: Section) => {
        this.sections.push(section);
        this.refreshView();
      })
    );
  }

  sectionPop() {
    this.subscription.add(
      this.service.section.asObservable().subscribe(() => {
        this.sections.pop();
        this.refreshView();
      })
    );
  }

  sectionRemove() {
    this.subscription.add(
      this.service.sectionId.asObservable().subscribe((sectionId: number) => {
        this.sections.splice(
          this.sections.findIndex((section) => {
            return section.id === sectionId;
          }),
          1
        );
        this.refreshView();
      })
    );
  }

  refresh() {
    this.subscription.add(
      this.service.refreshView.asObservable().subscribe(() => {
        this.refreshView();
      })
    );
  }

  formatHeader() {
    /**
     * end date is one day ahead at midnight (hour == 0)
     * which gives out two date period in 24 hr period (e.g start = 8/9 12:00 AM, end = 9/9 12:00 AM)
     */
    let _end = DateTime.fromMillis(this.end.toMillis());
    if (_end.hour === 0) _end = _end.minus({ day: 1 });

    const start = this.start.setLocale(this.locale).toFormat(this.headerFormat);
    const end = _end.toFormat(this.headerFormat);

    if (start === end) {
      this.formattedHeader = start;
      return;
    }

    this.formattedHeader = `${start} - ${end}`;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  resize(
    sectionContainer: HTMLElement,
    itemMeta: ItemMeta,
    e: CdkDragDrop<any>,
    handle: "left" | "right"
  ) {
    const distanceMoved = e.distance.x; // unit: px
    const containerWidth = sectionContainer.clientWidth; // unit: px
    const rawPctDiff = (distanceMoved / containerWidth) * 100; // unit: %

    if (handle === "left") {
      itemMeta.cssLeft = this.draggedItemCache.cssLeft + rawPctDiff;
      itemMeta.cssWidth = this.draggedItemCache.cssWidth - rawPctDiff;
    } else {
      itemMeta.cssWidth = this.draggedItemCache.cssWidth + rawPctDiff;
    }
  }

  onDragStart(itemMeta: ItemMeta) {
    this.draggedItemCache = new ItemMeta();
    this.draggedItemCache.cssLeft = itemMeta.cssLeft;
    this.draggedItemCache.cssWidth = itemMeta.cssWidth;
  }

  onDragReleased() {
    this.draggedItemCache = new ItemMeta();
  }
}
