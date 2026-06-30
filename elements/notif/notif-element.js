/* @lit-element notification component for HAXCMS integration */

// Check if customElements is available
if (typeof customElements !== 'undefined') {
  // Define the notification element
  class NotifElement extends HTMLElement {
    static get observedAttributes() {
      return ['message', 'type', 'duration', 'visible'];
    }

    constructor() {
      super();
      this._shadow = this.attachShadow({ mode: 'open' });
      this._message = '';
      this._type = 'info';
      this._duration = 5000;
      this._visible = false;
      this._timeoutId = null;
      
      this.render();
      this._setupEventListeners();
    }

    // Getters and setters for attributes
    get message() {
      return this._message;
    }

    set message(value) {
      this._message = value || '';
      this._renderContent();
      this.setAttribute('message', this._message);
    }

    get type() {
      return this._type;
    }

    set type(value) {
      this._type = value || 'info';
      this._renderContent();
      this.setAttribute('type', this._type);
    }

    get duration() {
      return this._duration;
    }

    set duration(value) {
      this._duration = parseInt(value) || 5000;
      this.setAttribute('duration', this._duration.toString());
    }

    get visible() {
      return this._visible;
    }

    set visible(value) {
      this._visible = value === true || value === 'true' || value === '';
      this._updateVisibility();
      this.setAttribute('visible', this._visible ? '' : 'false');
    }

    // Lifecycle methods
    connectedCallback() {
      this._updateVisibility();
    }

    disconnectedCallback() {
      this._clearTimeout();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      
      switch (name) {
        case 'message':
          this.message = newValue;
          break;
        case 'type':
          this.type = newValue;
          break;
        case 'duration':
          this.duration = newValue;
          break;
        case 'visible':
          this.visible = newValue;
          break;
      }
    }

    // Private methods
    _setupEventListeners() {
      // Add click to close handler
      this._shadow.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-btn')) {
          this.hide();
        }
      });
    }

    _renderContent() {
      const typeClasses = {
        'info': 'notif-info',
        'success': 'notif-success',
        'warning': 'notif-warning',
        'error': 'notif-error'
      };
      
      const typeClass = typeClasses[this._type] || 'notif-info';
      
      this._shadow.innerHTML = `
        <style>
          :host {
            display: block;
            position: relative;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          }
          .notification {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-radius: 4px;
            margin: 8px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateY(-10px);
            max-width: 100%;
          }
          .notification.show {
            opacity: 1;
            transform: translateY(0);
          }
          .notification.info { background-color: #e3f2fd; color: #1565c0; }
          .notification.success { background-color: #e8f5e9; color: #2e7d32; }
          .notification.warning { background-color: #fff8e1; color: #f57c00; }
          .notification.error { background-color: #ffebee; color: #c62828; }
          .notification-content {
            flex: 1;
            margin-right: 12px;
            line-height: 1.4;
          }
          .close-btn {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            font-size: 18px;
            padding: 4px;
            border-radius: 4px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .close-btn:hover {
            background-color: rgba(0,0,0,0.05);
          }
          .close-btn:active {
            transform: scale(0.95);
          }
          @media (prefers-reduced-motion: reduce) {
            .notification {
              transition: none;
            }
          }
        </style>
        <div class="notification ${typeClass} ${this._visible ? 'show' : ''}">
          <div class="notification-content">${this._message || 'Notification message'}</div>
          <button class="close-btn" aria-label="Close notification">×</button>
        </div>
      `;
    }

    _updateVisibility() {
      const notification = this._shadow.querySelector('.notification');
      if (notification) {
        notification.classList.toggle('show', this._visible);
      }
      
      if (this._visible && this._timeoutId === null && this._duration > 0) {
        this._timeoutId = setTimeout(() => {
          this.hide();
        }, this._duration);
      }
    }

    _clearTimeout() {
      if (this._timeoutId) {
        clearTimeout(this._timeoutId);
        this._timeoutId = null;
      }
    }

    // Public API methods
    show() {
      this._clearTimeout();
      this._visible = true;
      this._updateVisibility();
      
      if (this._duration > 0) {
        this._timeoutId = setTimeout(() => {
          this.hide();
        }, this._duration);
      }
      
      this.dispatchEvent(new CustomEvent('notif-show', {
        bubbles: true,
        composed: true,
        detail: { message: this._message, type: this._type }
      }));
    }

    hide() {
      this._clearTimeout();
      this._visible = false;
      this._updateVisibility();
      
      this.dispatchEvent(new CustomEvent('notif-hide', {
        bubbles: true,
        composed: true,
        detail: { message: this._message, type: this._type }
      }));
    }

    // Render the initial content
    render() {
      this._renderContent();
    }
  }

  // Define the custom element
  customElements.define('notif-element', NotifElement);
}
