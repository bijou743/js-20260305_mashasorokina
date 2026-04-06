import { createElement } from "../../shared/utils/create-element";

type DoubleSliderSelected = {
  from: number;
  to: number;
};

interface Options {
  min?: number;
  max?: number;
  formatValue?: (value: number) => string;
  selected?: DoubleSliderSelected;
}

export default class DoubleSlider {
  min: number;
  max: number;
  formatValue?: (value: number) => string;
  selected?: DoubleSliderSelected;
  element: HTMLElement;
  private thumb?: HTMLElement;
  private leftSlider: HTMLElement;
  private rightSlider: HTMLElement;
  private leftBoundary: HTMLElement;
  private rightBoundary: HTMLElement;
  private progress: HTMLElement;

  constructor({min = 0, max = 1000, formatValue, selected }: Options = {}) {
    this.min = min;
    this.max = max;
    this.formatValue = formatValue;

    this.selected = selected;
    if (!this.selected?.from || !this.selected?.to) {
      this.selected = {
        from: this.selected?.from || this.min,
        to: this.selected?.to || this.max,
      }
    }

    this.element = createElement(this.template);

    this.leftSlider = this.element.querySelector<HTMLElement>('.range-slider__thumb-left')!;
    this.rightSlider = this.element.querySelector<HTMLElement>('.range-slider__thumb-right')!;
    this.leftBoundary = this.element.querySelector<HTMLElement>('span[data-element="from"]')!;
    this.rightBoundary = this.element.querySelector<HTMLElement>('span[data-element="to"]')!;
    this.progress = this.element.querySelector<HTMLElement>('.range-slider__progress')!;

    document.addEventListener('pointerdown', this.pointerdown);
  }

  private pointerdown = (event: PointerEvent)=> {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('range-slider__thumb-left') && !target.classList.contains('range-slider__thumb-right')) {
      return;
    }

    this.thumb = target;

    document.addEventListener('pointermove', this.pointermove);
    document.addEventListener('pointerup', this.pointerup);
  }

  private pointermove = (event: PointerEvent)=> {
    const inner = this.element.querySelector<HTMLElement>('.range-slider__inner');
    if (!inner) return;

    const rect = inner.getBoundingClientRect();

    let percent = (event.clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));

    let value = Math.round(this.percentToValue(percent));

    const type =  this.thumb!.classList.contains('range-slider__thumb-left') ? 'left' : 'right';

    const maxValue = this.selected?.to || this.max;
    const minValue = this.selected?.from || this.min;

    if (type === "left") {
      value = Math.min(value, maxValue);
    } else {
      value = Math.max(value, minValue);
    }

    this.selected = {
      from: type === "left" ? value : minValue,
      to: type === "right" ? value : maxValue
    };

    this.updateInterface(type, value);
  }

  private updateInterface = (type: 'left' | 'right', value: number) => {
    const percent = this.valueToPercent(value);

    if (type === 'left') {
      this.leftSlider.style.setProperty('left', `${percent}%`);
      this.leftBoundary.innerHTML = this.getFormattedValue(value);
      this.progress.style.setProperty('left', `${percent}%`);
    } else {
      this.rightSlider.style.setProperty('right', `${100 - percent}%`);
      this.rightBoundary.innerHTML = this.getFormattedValue(value);
      this.progress.style.setProperty('right', `${100 - percent}%`);
    }
  }

  private pointerup = ()=> {
    this.element.dispatchEvent(new CustomEvent('range-select', {
      detail: {
        from: this.selected?.from,
        to: this.selected?.to
      }
    }));
    document.removeEventListener('pointermove', this.pointermove);
    document.removeEventListener('pointerup', this.pointerup);
  }

  private getFormattedValue(value: number): string {
    return this.formatValue ? this.formatValue(value) : value.toString();
  }

  private valueToPercent(value: number) {
    return ((value - this.min) / (this.max - this.min)) * 100;
  }

  private percentToValue(percent: number) {
    return this.min + percent * (this.max - this.min);
  }

  private get template() {
    const left = this.valueToPercent(this.selected!.from).toFixed(0);
    const right = (100 - this.valueToPercent(this.selected!.to)).toFixed(0);

    return `
      <div class="range-slider">
        <span data-element="from">${this.getFormattedValue(this.selected!.from)}</span>
        <div class="range-slider__inner">
          <span class="range-slider__progress" style="left: ${left}%; right: ${right}%"></span>
          <span class="range-slider__thumb-left" style="left: ${left}%"></span>
          <span class="range-slider__thumb-right" style="right: ${right}%"></span>
        </div>
        <span data-element="to">${this.getFormattedValue(this.selected!.to)}</span>
      </div>
    `;
  }

  destroy() {
    document.removeEventListener('pointerdown', this.pointerdown);
    document.removeEventListener('pointermove', this.pointermove);
    document.removeEventListener('pointerup', this.pointerup);
    this.element.remove();
  }
}
