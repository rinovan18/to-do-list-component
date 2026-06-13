// Entry point untuk combined bundle: todo-list + explode-quiz
// todo-list diinstall sebagai local dep agar rollup resolve dari node_modules yang sama
import '@haxtheweb/todo-list/todo-list.js';
import './explode-quiz.js';
