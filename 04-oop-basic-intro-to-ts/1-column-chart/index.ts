import { createElement } from "../../shared/utils/create-element";

interface Options {
  data?: number[];
  label?: string;
  value?: number;
  link?: string | null;
  formatHeading?: (value: number) => string | number;
}

export default class ColumnChart {
  private data: number[];
  private label: string;
  private value: number;
  private link: string | null;
  private formatHeading: Function;
  public element: HTMLElement;
  public chartHeight = 50;

  constructor({ data = [], label = '', value = 0, link = null, formatHeading = (v: number) => v }: Options = {}) {
    this.data = data;
    this.label = label;
    this.value = value;
    this.link = link;
    this.formatHeading = formatHeading;
    this.element = createElement(this.template);
  }

  private get template() {
    return `
      <div class="column-chart ${!this.data.length ? 'column-chart_loading' : ''}" style="--chart-height: ${this.chartHeight}">
        ${this.titleTemplate}
        <div class="column-chart__container">
            <div data-element="header" class="column-chart__header">${this.formatHeading(this.value)}</div>
            <div data-element="body" class="column-chart__chart">
                ${this.itemsTemplate}
            </div>
        </div>
      </div>
    `;
  }

  private get itemsTemplate() {
    if (!this.data.length) return '';

    const maxValue = Math.max(...this.data);
    const scale = maxValue ? this.chartHeight / maxValue : 0;
    return this.data?.map(item => {
      return `<div style="--value: ${Math.floor(item * scale)}" data-tooltip="${(item / maxValue * 100).toFixed(0)}%"></div>`
    }).join('');
  }

  private get titleTemplate() {
    const link = this?.link ? `<a href="${this.link}" class="column-chart__link">View all</a>` : '';
    return `
      <div class="column-chart__title">
        ${this.label}
        ${link}
      </div>
    `;
  }

  update(data: number[]) {
    this.data = data;
    const items = this.element.querySelector('[data-element="body"]');
    if (items) {
      items.innerHTML = this.itemsTemplate;
    }
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
