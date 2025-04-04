const canvas = document.getElementById("imageView");
const ctx = canvas.getContext("2d");
const socket = io();
const MAX_HISTORY_STATES = 50; // Limit history size

let startPos = null;
let isDrawingShape = false;
let lastState = null; // For shape previewing

let drawing = false;
let history = [];
let step = -1;
let currentTool = 'pencil';
let currentColor = '#000000';
let lineWidth = 2;
let currentText = '';
let fontSize = 16;
let fontFamily = 'Arial';

// Canvas setup
function setupCanvas() {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  ctx.scale(scale, scale);
  
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = lineWidth;
  
  // Initial blank state
  saveState();
}

// Get precise cursor position
function getCursorPos(e) {
  const rect = canvas.getBoundingClientRect();
  const isTouch = e.touches && e.touches[0];
  const clientX = isTouch ? e.touches[0].clientX : e.clientX;
  const clientY = isTouch ? e.touches[0].clientY : e.clientY;
  
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
  };
}

// Save canvas state
function saveState() {
  step++;
  
  // Limit history size
  if (step >= MAX_HISTORY_STATES) {
    history.shift();
    step = MAX_HISTORY_STATES - 1;
  }
  
  // Remove any states after current step
  history = history.slice(0, step);
  history.push(canvas.toDataURL());
}

// Restore canvas state
function restoreState(index) {
  if (index < 0 || index >= history.length) return;
  
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = history[index];
}

// Drawing functions
function startDrawing(e) {
  e.preventDefault();
  drawing = true;
  const pos = getCursorPos(e);
  
  if (currentTool === 'pencil') {
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  } else if (currentTool === 'text') {
    // For text tool
    const textInput = prompt("Enter text:", "");
    if (textInput && textInput.trim() !== '') {
      currentText = textInput;
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.fillStyle = currentColor;
      ctx.fillText(currentText, pos.x, pos.y);
      
      // Emit text data to other clients
      socket.emit('text', {
        position: pos,
        text: currentText,
        color: currentColor,
        fontSize: fontSize,
        fontFamily: fontFamily
      });
      
      saveState();
    }
    drawing = false;
  } else {
    // For shape tools - remember start position and save current state
    isDrawingShape = true;
    startPos = pos;
    lastState = history[step]; // Store current state for shape preview
  }
}

function draw(e) {
  e.preventDefault();
  if (!drawing) return;

  const pos = getCursorPos(e);

  if (currentTool === 'pencil') {
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    socket.emit('drawing', { 
      x: pos.x, 
      y: pos.y, 
      tool: currentTool,
      color: currentColor,
      lineWidth: lineWidth
    });
  } else if (isDrawingShape && startPos) {
    // For shape preview, load the state from when we started drawing
    if (lastState) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Draw the current shape preview
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = lineWidth;
        
        switch(currentTool) {
          case 'rectangle':
            drawRectangle(ctx, startPos, pos);
            break;
          case 'circle':
            drawCircle(ctx, startPos, pos);
            break;
          case 'ellipse':
            drawEllipse(ctx, startPos, pos);
            break;
          case 'line':
            drawLine(ctx, startPos, pos);
            break;
        }
      };
      img.src = lastState;
    }
  }
}

function endDrawing(e) {
  if (!drawing) return;
  
  if (isDrawingShape && startPos) {
    const pos = getCursorPos(e);
    
    // Final shape drawing
    switch(currentTool) {
      case 'rectangle':
        drawRectangle(ctx, startPos, pos);
        break;
      case 'circle':
        drawCircle(ctx, startPos, pos);
        break;
      case 'ellipse':
        drawEllipse(ctx, startPos, pos);
        break;
      case 'line':
        drawLine(ctx, startPos, pos);
        break;
    }
    
    // Emit the shape data to other clients
    socket.emit('shape', {
      tool: currentTool,
      start: startPos,
      end: pos,
      color: currentColor,
      lineWidth: lineWidth
    });
    
    isDrawingShape = false;
    startPos = null;
    lastState = null;
    saveState();
  }
  
  drawing = false;
}

// Shape drawing functions - improved for cursor following
function drawRectangle(context, start, end) {
  context.beginPath();
  const width = end.x - start.x;
  const height = end.y - start.y;
  context.rect(start.x, start.y, width, height);
  context.stroke();
}

function drawCircle(context, start, end) {
  context.beginPath();
  const radius = Math.sqrt(
    Math.pow(end.x - start.x, 2) + 
    Math.pow(end.y - start.y, 2)
  );
  context.arc(start.x, start.y, radius, 0, 2 * Math.PI);
  context.stroke();
}

function drawEllipse(context, start, end) {
  context.beginPath();
  const radiusX = Math.abs(end.x - start.x);
  const radiusY = Math.abs(end.y - start.y);
  context.ellipse(
    start.x, 
    start.y, 
    radiusX, 
    radiusY, 
    0, 
    0, 
    2 * Math.PI
  );
  context.stroke();
}

function drawLine(context, start, end) {
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
}

// Socket events
socket.on('drawing', (data) => {
  ctx.strokeStyle = data.color || currentColor;
  ctx.lineWidth = data.lineWidth || lineWidth;
  ctx.lineTo(data.x, data.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(data.x, data.y);
});

socket.on('shape', (data) => {
  ctx.strokeStyle = data.color;
  ctx.lineWidth = data.lineWidth;

  switch(data.tool) {
    case 'rectangle':
      drawRectangle(ctx, data.start, data.end);
      break;
    case 'circle':
      drawCircle(ctx, data.start, data.end);
      break;
    case 'ellipse':
      drawEllipse(ctx, data.start, data.end);
      break;
    case 'line':
      drawLine(ctx, data.start, data.end);
      break;
  }
  
  // Reset to current user's style
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = lineWidth;
});

socket.on('text', (data) => {
  ctx.font = `${data.fontSize}px ${data.fontFamily}`;
  ctx.fillStyle = data.color;
  ctx.fillText(data.text, data.position.x, data.position.y);
  ctx.fillStyle = currentColor;
});

socket.on('clear', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  saveState();
});

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDrawing);
canvas.addEventListener('mouseleave', endDrawing);

// Touch support
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', endDrawing);

// Tool controls
function setTool(tool) {
  currentTool = tool;
  
  // Update UI to show active tool
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const toolButton = document.getElementById(`${tool}-button`);
  if (toolButton) {
    toolButton.classList.add('active');
  }
  
  // Update cursor based on tool
  if (tool === 'text') {
    canvas.style.cursor = 'text';
  } else {
    canvas.style.cursor = 'url(../img/pen.png), crosshair'; // Use default pen cursor
  }
}

function setColor(color) {
  currentColor = color;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  
  // Update UI if there's a color indicator
  const curColorElement = document.getElementById('currentColor');
  if (curColorElement) {
    curColorElement.style.backgroundColor = color;
  }
}

function setLineWidth(width) {
  lineWidth = parseInt(width);
  ctx.lineWidth = width;
}

function setFontSize(size) {
  fontSize = parseInt(size);
}

function setFontFamily(family) {
  fontFamily = family;
}

// Undo/redo
function undo() {
  if (step > 0) {
    step--;
    restoreState(step);
  }
}

function redo() {
  if (step < history.length - 1) {
    step++;
    restoreState(step);
  }
}

// Clear canvas
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  saveState();
  socket.emit('clear', {});
}

// Save drawing
function saveDrawing() {
  const link = document.createElement('a');
  link.download = 'drawing-' + new Date().toISOString().slice(0, 10) + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Initialize
setupCanvas();
window.addEventListener('resize', setupCanvas);

// Expose functions to UI
window.canvasControls = {
  setTool,
  setColor,
  setLineWidth,
  setFontSize,
  setFontFamily,
  undo,
  redo,
  clearCanvas,
  saveDrawing
};