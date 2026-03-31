import { createElement } from "../../shared/utils/create-element";

export default class Tooltip {
  element: HTMLElement | null = null;
  static instance: Tooltip;

  constructor() {
    if (Tooltip.instance) {
      return Tooltip.instance;
    }
    Tooltip.instance = this;
  }

  initialize() {
    document.addEventListener('pointerover', this.showTooltip);
    document.addEventListener('pointerout', this.hideTooltip);
  }

  private showTooltip = (event: Event)=> {
    const target = event.target as HTMLElement;
    const tooltip = target.closest<HTMLElement>('[data-tooltip]');
    if (!tooltip || !tooltip.dataset?.tooltip) return;

    this.render(tooltip.dataset.tooltip);
  }

  private hideTooltip = (event: Event) => {
    this.remove();
  }

  render(html: string) {
    this.remove();
    this.element = createElement(`<div class="tooltip">${html}</div>`);
    document.body.append(this.element);
  }

  remove() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  destroy() {
    document.removeEventListener('pointerover', this.showTooltip);
    document.removeEventListener('pointerout', this.hideTooltip);
    this.remove();
  }
}
