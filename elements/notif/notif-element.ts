import { html, css, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

/**
 * A notification element that displays messages with different severity levels.
 *
 * @slot - Default slot for notification content
 * @fires notification-closed - Fired when the notification is closed
 */
@customElement('notif-element')
export class NotifElement extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0.5rem 0;
      border-radius: 4px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
      position: relative;
      max-width: 400px;
    }

    :host([type='info']) {
      background-color: #e6f7ff;
      border: 1px solid #91d5ff;
      color: #1890ff;
    }

    :host([type='success']) {
      background-color: #f6ffed;
      border: 1px solid #b7eb8f;
      color: #52c418;
    }

    :host([type='warning']) {
      background-color: #fffbe6;
      border: 1px solid #ffe58f;
      color: #faad14;
    }

    :host([type='error']) {
      background-color: #fff1f0;
      border: 1px solid #ffa39e;
      color: #f5222d;
    }

    .close-button {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: inherit;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .close-button:hover {
      opacity: 1;
    }

    .content {
      margin-right: 1.5rem;
    }

    :host([closable='false']) .close-button {
      display: none;
    }
  `;

  /**
   * The type of notification (info, success, warning, error)
   */
  @property({ type: String })
  type: 'info' | 'success' | 'warning' | 'error' = 'info';

  /**
   * Whether the notification is closable
   */
  @property({ type: Boolean, reflect: true })
  closable = true;

  /**
   * Whether the notification is currently visible
   */
  @property({ type: Boolean, reflect: true })
  open = true;

  /**
   * The duration in milliseconds before auto-closing (0 for no auto-close)
   */
  @property({ type: Number })
  duration = 0;

  private _timeoutId: number | null = null;

  @query('.close-button')
  private closeButton!: HTMLButtonElement;

  connectedCallback() {
    super.connectedCallback();
    if (this.duration > 0 && this.open) {
      this._timeoutId = window.setTimeout(() => {
        this.close();
      }, this.duration);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timeoutId !== null) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
  }

  /**
   * Close the notification
   */
  close() {
    if (!this.open) return;
    
    this.open = false;
    this.dispatchEvent(new CustomEvent('notification-closed', {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <div class="content">
        <slot></slot>
      </div>
      ${this.closable ? html`
        <button 
          class="close-button" 
          @click=${this.close}
          aria-label="Close notification"
        >
          ×
        </button>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'notif-element': NotifElement;
  }
}
