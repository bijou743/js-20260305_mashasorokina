import { createElement } from "../../shared/utils/create-element";

type SortOrder = 'asc' | 'desc';

type SortableTableData = Record<string, string | number>;

interface SortableTableHeader {
  id: string;
  title: string;
  sortable?: boolean;
  sortType?: 'string' | 'number';
  template?: (value: string | number) => string;
}

export default class SortableTable {
  element: HTMLElement;
  headersConfig: SortableTableHeader[];
  data: SortableTableData[];

  constructor(headersConfig: SortableTableHeader[] = [], data: SortableTableData[] = []) {
    this.headersConfig = headersConfig;
    this.data = data;
    this.element = createElement(this.template);
  }

  private get template() {
    return `
      <div class="sortable-table">
        ${this.headers}
        ${this.body}
      </div>
    `;
  }

  private get headers() {
    if (!this.headersConfig?.length) return '';

    const headerCols = this.headersConfig.map((header) => `
      <div class="sortable-table__cell" data-id="${header.id}">
          <span>${header.title}</span>
      </div>
    `).join('');

    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${headerCols}
      </div>
    `;
  }

  private get body() {
    if (!this.data?.length || !this.headersConfig?.length) return '';
    return `
      <div data-element="body" class="sortable-table__body">
        ${this.getRows()}
      </div>
    `;
  }

  private getRows() {
    return this.data.map((item) => {
      const cols = this.headersConfig.map((header) =>
        this.cellTemplate(item, header)
      );

      return `<a href="/products/${item.id}" class="sortable-table__row">${cols.join('')}</a>`;
    }).join('');
  }

  private cellTemplate(item: SortableTableData, header: SortableTableHeader) {
    if (header.template) {
      return header.template(item[header.id]);
    }
    return `<div class="sortable-table__cell">${item[header.id]}</div>`;
  }

  sort(field: string, order: SortOrder) {
    const sortHeader = this.headersConfig.find(headerConfig => headerConfig.id === field);
    if (!sortHeader) return;

    const { id, sortType } = sortHeader;
    const orderDir = order === 'asc' ? 1 : -1;
    const compare = (a: SortableTableData, b: SortableTableData) => {
      if (sortType === 'number') {
        return (a[id] as number) - (b[id] as number);
      }
      return String(a[id]).localeCompare(String(b[id]),  ['ru', 'en'], { caseFirst: 'upper' });
    };
    this.data.sort((a, b) => compare(a, b) * orderDir);

    const body = this.element.querySelector('.sortable-table__body') as HTMLElement;
    if (body) {
      body.innerHTML = this.getRows();
    }

    const header = this.element.querySelector('[data-element="header"]') as HTMLElement;
    if (!header) {
      return;
    }

    const cells = header.querySelectorAll<HTMLElement>('[data-id]');
    cells.forEach(cell => {
      if (cell.dataset.id === field) {
        cell.dataset.order = order;
        const arrow = cell.querySelector('[data-element="arrow"]') as HTMLElement;
        if (!arrow) {
          cell.append(createElement(this.arrow));
        }
      } else {
        cell.removeAttribute('data-order');
        const arrow = cell.querySelector('[data-element="arrow"]') as HTMLElement;
        if (arrow) arrow.remove();
      }
    });
  }

  private get arrow() {
    return `
        <span data-element="arrow" class="sortable-table__sort-arrow">
          <span class="sort-arrow"></span>
        </span>
    `;
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
