import { DDDSuper } from "@haxtheweb/d-d-d/d-d-d.js";
import { LitElement, html, css } from "lit";
import { I18NMixin } from "@haxtheweb/i18n-manager/lib/I18NMixin.js";

class TodoList extends I18NMixin(DDDSuper(LitElement)) {
  static get tag() {
    return "todo-list";
  }

  static get properties() {
    return {
      ...super.properties,
      tasks: { type: Array },
    };
  }

  constructor() {
    super();
    this.tasks = [];
    this.t = {
      addTask: "Add Task",
      inputPlaceholder: "Enter a new task...",
      deleteTask: "Delete task",
      emptyMessage: "No tasks yet. Add one above!",
      taskCompleted: "Mark as incomplete",
      taskIncomplete: "Mark as complete",
    };
  }

  static get styles() {
    return [
      super.styles,
      css`
        :host {
          display: block;
          font-family: var(--ddd-font-primary);
          padding: var(--ddd-spacing-6);
          background: var(--ddd-theme-background);
          color: var(--ddd-theme-primary);
          max-width: 600px;
        }

        .input-area {
          display: flex;
          gap: var(--ddd-spacing-3);
          margin-bottom: var(--ddd-spacing-5);
        }

        .task-input {
          flex: 1;
          padding: var(--ddd-spacing-3) var(--ddd-spacing-4);
          font-family: var(--ddd-font-primary);
          font-size: var(--ddd-font-size-s);
          border: var(--ddd-border-sm) solid var(--ddd-theme-accent);
          border-radius: var(--ddd-radius-sm);
          background: var(--ddd-theme-background);
          color: var(--ddd-theme-primary);
          outline: none;
        }

        .task-input:focus {
          border-color: var(--ddd-theme-link);
          box-shadow: 0 0 0 var(--ddd-spacing-1) var(--ddd-theme-link-light);
        }

        .add-button {
          padding: var(--ddd-spacing-3) var(--ddd-spacing-5);
          font-family: var(--ddd-font-primary);
          font-size: var(--ddd-font-size-s);
          background: var(--ddd-theme-accent);
          color: var(--ddd-theme-background);
          border: none;
          border-radius: var(--ddd-radius-sm);
          cursor: pointer;
        }

        .add-button:hover {
          background: var(--ddd-theme-link);
        }

        .add-button:focus-visible {
          outline: var(--ddd-spacing-1) solid var(--ddd-theme-link);
          outline-offset: var(--ddd-spacing-1);
        }

        .task-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .task-item {
          display: flex;
          align-items: center;
          gap: var(--ddd-spacing-3);
          padding: var(--ddd-spacing-3) var(--ddd-spacing-4);
          margin-bottom: var(--ddd-spacing-2);
          background: var(--ddd-theme-background-secondary);
          border-radius: var(--ddd-radius-sm);
          border-left: var(--ddd-spacing-1) solid var(--ddd-theme-accent);
        }

        .task-checkbox {
          width: var(--ddd-spacing-5);
          height: var(--ddd-spacing-5);
          cursor: pointer;
          accent-color: var(--ddd-theme-accent);
          flex-shrink: 0;
        }

        .task-checkbox:focus-visible {
          outline: var(--ddd-spacing-1) solid var(--ddd-theme-link);
          outline-offset: var(--ddd-spacing-1);
        }

        .task-text {
          flex: 1;
          font-family: var(--ddd-font-primary);
          font-size: var(--ddd-font-size-s);
          color: var(--ddd-theme-primary);
        }

        .task-text.completed {
          text-decoration: line-through;
          color: var(--ddd-theme-disabled);
          opacity: var(--ddd-opacity-50);
        }

        .delete-button {
          padding: var(--ddd-spacing-1) var(--ddd-spacing-3);
          font-family: var(--ddd-font-primary);
          font-size: var(--ddd-font-size-xs);
          background: transparent;
          color: var(--ddd-theme-error);
          border: var(--ddd-border-sm) solid var(--ddd-theme-error);
          border-radius: var(--ddd-radius-sm);
          cursor: pointer;
          flex-shrink: 0;
        }

        .delete-button:hover {
          background: var(--ddd-theme-error);
          color: var(--ddd-theme-background);
        }

        .delete-button:focus-visible {
          outline: var(--ddd-spacing-1) solid var(--ddd-theme-error);
          outline-offset: var(--ddd-spacing-1);
        }

        .empty-message {
          text-align: center;
          padding: var(--ddd-spacing-8);
          color: var(--ddd-theme-disabled);
          font-family: var(--ddd-font-primary);
          font-size: var(--ddd-font-size-s);
          font-style: italic;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `,
    ];
  }

  render() {
    return html`
      <div class="input-area">
        <label for="task-input" class="sr-only">${this.t.addTask}</label>
        <input
          id="task-input"
          class="task-input"
          type="text"
          placeholder="${this.t.inputPlaceholder}"
          aria-label="${this.t.addTask}"
          @keydown="${this._handleInputKeydown}"
        />
        <button
          class="add-button"
          aria-label="${this.t.addTask}"
          @click="${this._handleAddClick}"
        >
          ${this.t.addTask}
        </button>
      </div>

      ${this.tasks.length === 0
        ? html`<p class="empty-message">${this.t.emptyMessage}</p>`
        : html`
            <ul class="task-list" aria-label="Task list">
              ${this.tasks.map((task) => this._renderTask(task))}
            </ul>
          `}
    `;
  }

  _renderTask(task) {
    return html`
      <li class="task-item" data-id="${task.id}">
        <input
          type="checkbox"
          class="task-checkbox"
          .checked="${task.completed}"
          aria-label="${task.completed
            ? this.t.taskCompleted
            : this.t.taskIncomplete}"
          aria-checked="${task.completed}"
          @change="${(e) =>
            this._handleToggleComplete(task.id, e.target.checked)}"
        />
        <span class="task-text ${task.completed ? "completed" : ""}"
          >${task.text}</span
        >
        <button
          class="delete-button"
          aria-label="${this.t.deleteTask}: ${task.text}"
          @click="${() => this._handleDelete(task.id)}"
        >
          ${this.t.deleteTask}
        </button>
      </li>
    `;
  }

  _handleInputKeydown(e) {
    if (e.key === "Enter") {
      this._addTask();
    }
  }

  _handleAddClick() {
    this._addTask();
  }

  _handleDelete(id) {
    this.tasks = this.tasks.filter((task) => task.id !== id);
  }

  _handleToggleComplete(id, checked) {
    this.tasks = this.tasks.map((task) =>
      task.id === id ? { ...task, completed: checked } : task,
    );
  }

  _addTask() {
    const input = this.shadowRoot.querySelector("#task-input");
    const text = input.value.trim();
    if (!text) return;
    const newTask = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now(),
      text,
      completed: false,
    };
    this.tasks = [...this.tasks, newTask];
    input.value = "";
    input.focus();
  }

  static get haxProperties() {
    return {
      canScale: false,
      canPosition: false,
      canEditSource: false,
      gizmo: {
        title: "Todo List",
        description: "A simple task management web component",
        icon: "icons:assignment",
        color: "blue",
        tags: ["Productivity", "Content"],
      },
      settings: {
        configure: [],
        advanced: [],
      },
    };
  }
}

globalThis.customElements.define(TodoList.tag, TodoList);
