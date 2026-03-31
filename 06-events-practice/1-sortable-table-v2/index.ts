import { createElement } from "../../shared/utils/create-element";

type SortOrder = 'asc' | 'desc';

type SortableTableData = Record<string, string | number>;

type SortableTableSort = {
  id: string;
  order: SortOrder;
};

interface SortableTableHeader {
  id: string;
  title: string;
  sortable?: boolean;
  sortType?: 'string' | 'number' | 'custom';
  template?: (value: string | number) => string;
  customSorting?: (a: SortableTableData, b: SortableTableData) => number;
}

interface Options {
  data?: SortableTableData[];
  sorted?: SortableTableSort;
  isSortLocally?: boolean;
}

export default class SortableTable {
  element: HTMLElement;
  data: SortableTableData[];
  isSortLocally: boolean;
  sorted?: SortableTableSort;
  headersConfig: SortableTableHeader[];

  constructor(headersConfig: SortableTableHeader[] = [], {
    data = [],
    sorted,
    isSortLocally = true
  }: Options = {}) {
    this.headersConfig = headersConfig;
    this.data = data;
    this.isSortLocally = isSortLocally;
    this.sorted = sorted;

    this.sort();

    this.element = createElement(this.template);

    const header = this.element.querySelector('[data-element="header"]');
    header?.addEventListener('pointerdown', this.sortByClick);
  }

  private sortByClick = (event: Event)=> {
    const target = event.target as HTMLElement;
    const cell = target?.closest<HTMLElement>('.sortable-table__cell');
    if (!cell?.dataset.id || !cell.hasAttribute('data-sortable')) return;

    if (!this.sorted || cell.dataset.id !== this.sorted.id) {
      this.sorted = {
        id: cell.dataset.id,
        order: 'desc',
      }
    } else {
      this.sorted.order = this.sorted.order === 'asc' ? 'desc' : 'asc';
    }

    this.sort();

    const body = this.element.querySelector('.sortable-table__body') as HTMLElement;
    if (body) {
      body.innerHTML = this.getRows();
    }

    const header = event.currentTarget as HTMLElement;
    const cells = header?.querySelectorAll<HTMLElement>('[data-id]');
    cells?.forEach(cell => {
      if (cell.dataset.id === this.sorted?.id) {
        cell.dataset.order = this.sorted?.order;
        const arrow = cell.querySelector('[data-element="arrow"]') as HTMLElement;
        if (!arrow) {
          cell.append(createElement(this.arrow));
        }
      } else {
        cell.removeAttribute('data-order');
        const arrow = cell.querySelector('[data-element="arrow"]') as HTMLElement;
        if (arrow) arrow.remove();
      }
    })
  }

  private get template() {
    return `
      <div data-element="productsContainer" class="products-list__container">
        <div class="sortable-table">
            ${this.headerTemplate}
            ${this.bodyTemplate}
        </div>
      </div>
    `;
  }

  private get headerTemplate() {
    if (!this.headersConfig?.length) return '';

    const headerCols = this.headersConfig.map((header) => {
      let datasetAttrs = [];
      if (header.sortable) {
        datasetAttrs.push('data-sortable="true"');
      }
      if (this.sorted?.id === header.id) {
        datasetAttrs.push('data-order="' + this.sorted.order + '"');
      }
      return `
        <div class="sortable-table__cell" data-id="${header.id}" ${datasetAttrs.join(' ')}>
            <span>${header.title}</span>
            ${this.sorted?.id === header.id ? this.arrow : ''}
        </div>
      `;
    }).join('');

    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${headerCols}
      </div>
    `;
  }

  private get arrow() {
    return `
        <span data-element="arrow" class="sortable-table__sort-arrow">
          <span class="sort-arrow"></span>
        </span>
    `;
  }

  private get bodyTemplate() {
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

  sort(): void {
    if (!this.sorted?.id) return;

    if (this.isSortLocally) {
      this.sortOnClient();
    }
  }

  private sortOnClient() {
    if(!this.sorted?.id) return;

    const sortHeader = this.headersConfig.find(headerConfig => headerConfig.id === this.sorted?.id);
    if (!sortHeader) return;

    const { id, sortType, customSorting } = sortHeader;
    const direction = this.sorted?.order === 'asc' ? 1 : -1;

    let compare;
    if (sortType === 'custom' && customSorting) {
      compare = customSorting;
    } else {
      compare = (a: SortableTableData, b: SortableTableData) => {
        if (sortType === 'string') {
          return String(a[id]).localeCompare(String(b[id]),  ['ru', 'en'], { caseFirst: 'upper' });
        }
        return (a[id] as number) - (b[id] as number);
      };
    }
    this.data.sort((a, b) => compare(a, b) * direction);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    const header = this.element.querySelector('[data-element="header"]');
    header?.removeEventListener('pointerdown', this.sortByClick);

    this.remove();
  }
}
