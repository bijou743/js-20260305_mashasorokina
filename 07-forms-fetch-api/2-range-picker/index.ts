import { createElement } from "../../shared/utils/create-element";

interface Options {
  from?: Date;
  to?: Date;
}

export default class RangePicker {
  from: Date;
  to: Date;
  element: HTMLElement;
  private input?: HTMLElement;
  private selector?: HTMLElement;
  private rangeFrom: Date;
  private rangeTo: Date;
  private selectedCells?: Array<Date> = [];

  constructor({ from = new Date(), to = new Date() }: Options = {}) {
    this.from = from;
    this.to = to;

    this.rangeFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    this.rangeTo = new Date(this.rangeFrom);
    this.rangeTo.setMonth(this.rangeTo.getMonth() + 1);

    this.element = createElement(this.template);
    this.input = this.element.querySelector('[data-element="input"]') as HTMLElement;
    this.selector = this.element.querySelector('[data-elem="selector"]') as HTMLElement;

    this.input.addEventListener('click', this.toggleSelector);
    document.addEventListener('click', this.closeSelectorOnClickOutside);
    this.selector.addEventListener('click', this.initSelectorEventListeners);
  }

  private initSelectorEventListeners = (event: Event) => {
    const target = event.target as HTMLElement;

    const isLeftControl = target.classList.contains('rangepicker__selector-control-left');
    const isRightControl = target.classList.contains('rangepicker__selector-control-right');
    const isCell = target.classList.contains('rangepicker__cell');
    if (isLeftControl || isRightControl) {
      this.rangeFrom.setMonth(this.rangeFrom.getMonth() + (isLeftControl ? -1 : 1));
      this.rangeTo.setMonth(this.rangeTo.getMonth() + (isLeftControl ? -1 : 1));
      this.updateCalendars();
      return;
    } else if (isCell) {
      this.updateSelectedCells(target);
    }
  }

  private updateSelectedCells(cell: HTMLElement) {
    const date = this.normalizeDate(new Date(String(cell.dataset.value)));
    this.selectedCells!.push(date);

    const allCells: NodeListOf<HTMLElement> = this.selector!.querySelectorAll('.rangepicker__cell');

    const clearClasses = (el: HTMLElement) => {
      el.classList.remove(
        'rangepicker__selected-from',
        'rangepicker__selected-to',
        'rangepicker__selected-between'
      );
    };

    if (this.selectedCells!.length === 1) {
      allCells.forEach(c => {
        clearClasses(c);
        if (c.dataset.value === cell.dataset.value) {
          c.classList.add('rangepicker__selected-from');
        }
      });
      return;
    }

    if (this.selectedCells!.length === 2) {
      const [from, to] = this.selectedCells!
        .sort((a, b) => a.getTime() - b.getTime());

      this.from = from;
      this.to = to;
      this.selectedCells = [];

      this.input!.querySelector('[data-element="from"]')!.innerHTML = this.formatDate(this.from);
      this.input!.querySelector('[data-element="to"]')!.innerHTML = this.formatDate(this.to);

      allCells.forEach(el => {
        clearClasses(el);
        const cellDate = this.normalizeDate(new Date(String(el.dataset.value)));

        if (cellDate.getTime() === this.from.getTime()) {
          el.classList.add('rangepicker__selected-from');
        } else if (cellDate.getTime() === this.to.getTime()) {
          el.classList.add('rangepicker__selected-to');
        } else if (this.isDateInRange(cellDate)) {
          el.classList.add('rangepicker__selected-between');
        }
      });

      this.closeSelector();
    }
  }

  private updateCalendars = () => {
    const calendars = this.selector?.querySelectorAll('.rangepicker__calendar');
    calendars!.item(0).outerHTML = this.rangePickerTemplate(this.rangeFrom);
    calendars!.item(1).outerHTML = this.rangePickerTemplate(this.rangeTo);
  }

  private get template(): string {
    return `
      <div class="rangepicker">
        <div class="rangepicker__input" data-element="input">
          <span data-element="from">${this.formatDate(this.from)}</span> -
          <span data-element="to">${this.formatDate(this.to)}</span>
        </div>
        <div class="rangepicker__selector" data-elem="selector"></div>
      </div>
    `;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat(['ru']).format(date);
  }

  private closeSelector = () => {
    this.element!.classList.remove('rangepicker_open');
  }

  private closeSelectorOnClickOutside = (event: Event)=> {
    const target = event.target as HTMLElement;
    if (!target.closest('.rangepicker')) {
      this.closeSelector();
    }
  }

  private toggleSelector = (event: Event) => {
    if (!this.selector!.innerHTML.trim()) {
      this.selector!.innerHTML = this.selectorTemplate;
    }
    this.element.classList.toggle('rangepicker_open');
  }

  private get selectorTemplate(): string {
    return `
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left"></div>
      <div class="rangepicker__selector-control-right"></div>
      ${this.rangePickerTemplate(this.rangeFrom)}
      ${this.rangePickerTemplate(this.rangeTo)}
    `;
  }

  private rangePickerTemplate = (date: Date): string => {
    const month = this.getMonthName(date);

    return `
      <div class="rangepicker__calendar">
        <div class="rangepicker__month-indicator">
          <time datetime="${month}">${month}</time>
        </div>
        ${this.daysOfWeekTemplate}
        ${this.monthTemplate(date)}
      </div>
    `;
  }

  private monthTemplate = (date: Date): string => {
    const startDate = new Date(date);
    startDate.setDate(1);

    const days = [];
    for (let i = 0; i < this.daysInMonth(startDate.getFullYear(), startDate.getMonth()); i++) {
      const dayIfMonth = new Date(startDate);
      dayIfMonth.setDate(startDate.getDate() + i);
      const normalizedDay = this.normalizeDate(dayIfMonth);

      let className = 'rangepicker__cell';
      if (this.selectedCells?.length === 1) {
        if (this.selectedCells[0].getTime() === normalizedDay.getTime()) {
          className += ' rangepicker__selected-from';
        }
      } else {
        if (this.isDateInRange(normalizedDay)) {
          className += ' rangepicker__selected-between';
        }
        if (this.from.getTime() === normalizedDay.getTime()) {
          className += ' rangepicker__selected-from';
        }
        if (this.to.getTime() === normalizedDay.getTime()) {
          className += ' rangepicker__selected-to';
        }
      }
      days.push(`
        <button type="button" class="${className}"
                ${i === 0 ? `style="--start-from: ${normalizedDay.getDay()}"` : ''}
                data-value="${normalizedDay.toISOString()}" >
          ${i + 1}
        </button>
      `);
    }
    return `<div class="rangepicker__date-grid">${days.join('')}</div>`;
  }

  private isDateInRange(date: Date): boolean {
    const current = this.normalizeDate(date);
    const from = this.normalizeDate(this.from);
    const to = this.normalizeDate(this.to);
    return from.getTime() < current.getTime() && to.getTime() > current.getTime();
  }

  private daysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  private get daysOfWeekTemplate (): string {
    return `
      <div class="rangepicker__day-of-week">
        <div>Пн</div>
        <div>Вт</div>
        <div>Ср</div>
        <div>Чт</div>
        <div>Пт</div>
        <div>Сб</div>
        <div>Вс</div>
      </div>
    `;
  }

  private getMonthName(date: Date) {
    return new Intl.DateTimeFormat(['ru'], { month: 'long' }).format(date);
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  remove() {
    this.input?.removeEventListener('click', this.toggleSelector);
    document.removeEventListener('click', this.closeSelectorOnClickOutside);
    this.selector?.removeEventListener('click', this.initSelectorEventListeners);
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
