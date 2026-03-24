import { createElement } from "../../shared/utils/create-element";

interface Options {
  duration?: number;
  type?: 'success' | 'error';
}

export default class NotificationMessage {
  static activeNotification: NotificationMessage;
  public element: HTMLElement;
  private message: string;
  private duration: number;
  private type: 'success' | 'error';
  private timeoutId?: number;

  constructor(message: string, {duration = 2000, type = 'success'}: Options = {}) {
    if (NotificationMessage.activeNotification) {
      NotificationMessage.activeNotification.remove();
    }

    this.message = message;
    this.duration = duration;
    this.type = type;
    this.element = createElement(this.template);

    NotificationMessage.activeNotification = this;
  }

  private get template() {
    return `
      <div class="notification ${this.type}" style="--value: ${this.duration / 1000}s">
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">${this.type}</div>
          <div class="notification-body">
            ${this.message}
          </div>
        </div>
      </div>
    `;
  }

  show(target: HTMLElement) {
    target ? target.append(this.element) : document.body.append(this.element);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.remove();
    }, this.duration);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
