// scripts/logger.js

export default class Logger {
    constructor(logListElement) {
        this.logList = logListElement;
    }

    add(message, isError = false) {
        const listItem = document.createElement('li');
        listItem.textContent = message;
        if (isError) {
            listItem.style.color = '#ff0000'; // Red for errors
        }
        this.logList.appendChild(listItem);
        // Auto-scroll to the latest log entry
        this.logList.scrollTop = this.logList.scrollHeight;
    }
}
