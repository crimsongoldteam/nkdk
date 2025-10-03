(function () {
    const vscode = acquireVsCodeApi();

    let canvas;
    let ctx;
    let isDrawing = false;
    let currentColor = 'black';
    let currentStroke = [];

    function init() {
        canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;

        document.querySelector('.drawing-canvas').appendChild(canvas);

        // Set up event listeners
        setupEventListeners();
        setupColorButtons();

        // Notify extension that we're ready
        vscode.postMessage({ type: 'ready' });
    }

    function setupEventListeners() {
        // Mouse events
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        // Touch events for mobile
        canvas.addEventListener('touchstart', handleTouch);
        canvas.addEventListener('touchmove', handleTouch);
        canvas.addEventListener('touchend', stopDrawing);

        // Resize
        window.addEventListener('resize', resizeCanvas);
    }

    function setupColorButtons() {
        document.querySelectorAll('.drawing-controls button').forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                document.querySelectorAll('.drawing-controls button').forEach(btn => {
                    btn.classList.remove('active');
                });

                // Add active class to clicked button
                button.classList.add('active');

                // Set current color
                currentColor = button.getAttribute('data-color');
            });
        });
    }

    function handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' :
            e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }

    function startDrawing(e) {
        isDrawing = true;
        currentStroke = [];
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        currentStroke.push([x, y]);
    }

    function draw(e) {
        if (!isDrawing) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.strokeStyle = currentColor;
        ctx.lineTo(x, y);
        ctx.stroke();

        currentStroke.push([x, y]);
    }

    function stopDrawing() {
        if (!isDrawing) return;

        isDrawing = false;

        if (currentStroke.length > 0) {
            // Send stroke to extension
            vscode.postMessage({
                type: 'stroke',
                color: currentColor,
                stroke: currentStroke
            });
        }
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'init':
                if (message.untitled) {
                    // New document
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                } else if (message.value) {
                    // Load existing document
                    loadImageData(message.value);
                }
                break;

            case 'update':
                if (message.content) {
                    loadImageData(message.content);
                }
                if (message.edits) {
                    redrawStrokes(message.edits);
                }
                break;
        }
    });

    function loadImageData(data) {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = URL.createObjectURL(new Blob([data]));
    }

    function redrawStrokes(edits) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        edits.forEach(edit => {
            if (edit.stroke && edit.stroke.length > 0) {
                ctx.strokeStyle = edit.color;
                ctx.beginPath();
                ctx.moveTo(edit.stroke[0][0], edit.stroke[0][1]);
                for (let i = 1; i < edit.stroke.length; i++) {
                    ctx.lineTo(edit.stroke[i][0], edit.stroke[i][1]);
                }
                ctx.stroke();
            }
        });
    }

    // Get file data for saving
    function getFileData() {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const arrayBuffer = reader.result;
                    const uint8Array = new Uint8Array(arrayBuffer);
                    resolve(Array.from(uint8Array));
                };
                reader.readAsArrayBuffer(blob);
            }, 'image/png');
        });
    }

    // Expose getFileData globally for the extension
    window.getFileData = getFileData;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
