(function () {
    const vscode = acquireVsCodeApi();

    // Get the initial state
    const initialState = vscode.getState();
    let currentData = initialState || { scratches: [] };

    // Update the webview content
    function updateContent() {
        const container = document.querySelector('.notes');
        if (!container) return;

        // Clear existing content except the add button
        const addButton = container.querySelector('.add-button');
        container.innerHTML = '';
        if (addButton) {
            container.appendChild(addButton);
        }

        // Add scratch items
        if (currentData.scratches && Array.isArray(currentData.scratches)) {
            currentData.scratches.forEach(scratch => {
                const scratchElement = document.createElement('div');
                scratchElement.className = 'scratch-item';
                scratchElement.innerHTML = `
                    <div class="scratch-content">
                        <span class="scratch-emoji">${scratch.text}</span>
                        <span class="scratch-text">Scratch created</span>
                        <span class="scratch-date">${new Date(scratch.created).toLocaleString()}</span>
                    </div>
                    <button class="delete-button" data-id="${scratch.id}">Delete</button>
                `;
                container.appendChild(scratchElement);
            });
        }

        // Add event listeners
        addEventListeners();
    }

    function addEventListeners() {
        // Add button
        const addButton = document.querySelector('.add-button button');
        if (addButton) {
            addButton.onclick = () => {
                vscode.postMessage({ type: 'add' });
            };
        }

        // Delete buttons
        document.querySelectorAll('.delete-button').forEach(button => {
            button.onclick = (e) => {
                const id = e.target.getAttribute('data-id');
                vscode.postMessage({ type: 'delete', id: id });
            };
        });
    }

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'update':
                currentData = JSON.parse(message.text);
                updateContent();
                vscode.setState(currentData);
                break;
        }
    });

    // Initialize
    updateContent();
})();
