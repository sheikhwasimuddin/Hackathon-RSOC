'use strict';

(function() {
  var socket = io();
  var canvas = document.getElementsByClassName('whiteboard')[0];
  var context = canvas.getContext('2d');
  var colors = document.getElementsByClassName('color');
  
  var current = {
    color: 'black',
    lineWidth: 2,
    font: '20px Arial'
  };
  var drawing = false;
  var history = [];
  var future = [];
  var currentShape = 'line'; // Default shape is line
  var startX, startY;
  var textInput;

  // Set up event listeners
  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

  // Color selection
  for (var i = 0; i < colors.length; i++) {
    colors[i].addEventListener('click', onColorUpdate, false);
  }

  // Button setup
  setupControls();
  
  // Socket events
  socket.on('drawing', onDrawingEvent);
  socket.on('initialDraw', onInitialDraw);
  socket.on('clear', onClearEvent);
  
  // Handle window resize
  window.addEventListener('resize', onResize, false);
  onResize();

  function setupControls() {
    // Get all control elements
    var controls = {
      undoBtn: document.getElementById('undoBtn'),
      redoBtn: document.getElementById('redoBtn'),
      lineWidth: document.getElementById('lineWidth'),
      clearBtn: document.getElementById('clearBtn'),
      rectangleBtn: document.getElementById('rectangleBtn'),
      ellipseBtn: document.getElementById('ellipseBtn'),
      circleBtn: document.getElementById('circleBtn'),
      lineBtn: document.getElementById('lineBtn'),
      textBtn: document.getElementById('textBtn'),
      fontInput: document.getElementById('fontInput')
    };
    
    // Set up event listeners only if elements exist
    if (controls.undoBtn) {
      controls.undoBtn.addEventListener('click', onUndo, false);
    }
    if (controls.redoBtn) {
      controls.redoBtn.addEventListener('click', onRedo, false);
    }
    if (controls.lineWidth) {
      controls.lineWidth.addEventListener('change', onLineWidthChange, false);
    }
    if (controls.clearBtn) {
      controls.clearBtn.addEventListener('click', onClear, false);
    }
    if (controls.rectangleBtn) {
      controls.rectangleBtn.addEventListener('click', function() {
        setCurrentShape('rectangle');
      });
    }
    if (controls.ellipseBtn) {
      controls.ellipseBtn.addEventListener('click', function() {
        setCurrentShape('ellipse');
      });
    }
    if (controls.circleBtn) {
      controls.circleBtn.addEventListener('click', function() {
        setCurrentShape('circle');
      });
    }
    if (controls.lineBtn) {
      controls.lineBtn.addEventListener('click', function() {
        setCurrentShape('line');
      });
    }
    if (controls.textBtn) {
      controls.textBtn.addEventListener('click', function() {
        setCurrentShape('text');
      });
    }
    if (controls.fontInput) {
      controls.fontInput.addEventListener('change', onFontChange, false);
    }
  }

  function setCurrentShape(shape) {
    currentShape = shape;
    console.log('Current shape set to:', shape);
    
    // Update UI to show active shape
    var buttons = document.querySelectorAll('.shape-btn');
    buttons.forEach(function(btn) {
      btn.classList.remove('active');
    });
    
    var activeBtn = document.getElementById(shape + 'Btn');
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }

  function drawLine(x0, y0, x1, y1, color, lineWidth, emit) {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.lineCap = 'round';
    context.stroke();
    context.closePath();

    if (!emit) {
      return;
    }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
      type: 'line',
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color,
      lineWidth: lineWidth
    });
  }

  function drawRectangle(x, y, width, height, color, lineWidth, emit) {
    context.beginPath();
    context.rect(x, y, width, height);
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.stroke();
    context.closePath();

    if (!emit) {
      return;
    }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
      type: 'rectangle',
      x: x / w,
      y: y / h,
      width: width / w,
      height: height / h,
      color: color,
      lineWidth: lineWidth
    });
  }

  function drawEllipse(x, y, radiusX, radiusY, color, lineWidth, emit) {
    context.beginPath();
    context.ellipse(x, y, radiusX, radiusY, 0, 0, 2 * Math.PI);
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.stroke();
    context.closePath();

    if (!emit) {
      return;
    }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
      type: 'ellipse',
      x: x / w,
      y: y / h,
      radiusX: radiusX / w,
      radiusY: radiusY / h,
      color: color,
      lineWidth: lineWidth
    });
  }

  function drawCircle(x, y, radius, color, lineWidth, emit) {
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.stroke();
    context.closePath();

    if (!emit) {
      return;
    }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
      type: 'circle',
      x: x / w,
      y: y / h,
      radius: radius / w,
      color: color,
      lineWidth: lineWidth
    });
  }

  function drawText(text, x, y, color, font, emit) {
    context.fillStyle = color;
    context.font = font;
    context.fillText(text, x, y);

    if (!emit) {
      return;
    }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
      type: 'text',
      text: text,
      x: x / w,
      y: y / h,
      color: color,
      font: font
    });
  }

  function onMouseDown(e) {
    drawing = true;
    
    var rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    
    if (currentShape === 'line') {
      context.beginPath();
      context.moveTo(startX, startY);
    } else if (currentShape === 'text') {
      // Create text input for text tool
      textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.style.position = 'absolute';
      textInput.style.left = (e.clientX) + 'px';
      textInput.style.top = (e.clientY) + 'px';
      textInput.style.zIndex = '1000';
      document.body.appendChild(textInput);
      textInput.focus();

      textInput.addEventListener('blur', onTextBlur);
      textInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          textInput.blur();
        }
      });
      
      drawing = false; // Stop drawing while inputting text
    }
  }

  function onTextBlur() {
    var text = textInput.value;
    if (text) {
      var rect = canvas.getBoundingClientRect();
      drawText(text, startX, startY, current.color, current.font, true);
      
      // Add to history
      var w = canvas.width;
      var h = canvas.height;
      history.push({
        type: 'text',
        text: text,
        x: startX / w,
        y: startY / h,
        color: current.color,
        font: current.font
      });
      future = []; // Clear redo stack
    }
    
    document.body.removeChild(textInput);
    textInput = null;
  }

  function onMouseUp(e) {
    if (!drawing) return;
    
    drawing = false;
    var rect = canvas.getBoundingClientRect();
    var endX = e.clientX - rect.left;
    var endY = e.clientY - rect.top;
    
    // Save the shape to history based on current tool
    var w = canvas.width;
    var h = canvas.height;
    
    if (currentShape === 'line') {
      drawLine(startX, startY, endX, endY, current.color, current.lineWidth, true);
      history.push({
        type: 'line',
        x0: startX / w,
        y0: startY / h,
        x1: endX / w,
        y1: endY / h,
        color: current.color,
        lineWidth: current.lineWidth
      });
    } else if (currentShape === 'rectangle') {
      var width = endX - startX;
      var height = endY - startY;
      drawRectangle(startX, startY, width, height, current.color, current.lineWidth, true);
      history.push({
        type: 'rectangle',
        x: startX / w,
        y: startY / h,
        width: width / w,
        height: height / h,
        color: current.color,
        lineWidth: current.lineWidth
      });
    } else if (currentShape === 'ellipse') {
      var radiusX = Math.abs(endX - startX) / 2;
      var radiusY = Math.abs(endY - startY) / 2;
      var centerX = startX + (endX - startX) / 2;
      var centerY = startY + (endY - startY) / 2;
      drawEllipse(centerX, centerY, radiusX, radiusY, current.color, current.lineWidth, true);
      history.push({
        type: 'ellipse',
        x: centerX / w,
        y: centerY / h,
        radiusX: radiusX / w,
        radiusY: radiusY / h,
        color: current.color,
        lineWidth: current.lineWidth
      });
    } else if (currentShape === 'circle') {
      var radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      drawCircle(startX, startY, radius, current.color, current.lineWidth, true);
      history.push({
        type: 'circle',
        x: startX / w,
        y: startY / h,
        radius: radius / w,
        color: current.color,
        lineWidth: current.lineWidth
      });
    }
    
    future = []; // Clear redo stack after a new action
  }

  function onMouseMove(e) {
    if (!drawing) return;
    
    var rect = canvas.getBoundingClientRect();
    var currentX = e.clientX - rect.left;
    var currentY = e.clientY - rect.top;
    
    if (currentShape === 'line') {
      drawLine(startX, startY, currentX, currentY, current.color, current.lineWidth, false);
    } else {
      // For shapes, redraw everything to show preview
      redraw();
      
      if (currentShape === 'rectangle') {
        var width = currentX - startX;
        var height = currentY - startY;
        drawRectangle(startX, startY, width, height, current.color, current.lineWidth, false);
      } else if (currentShape === 'ellipse') {
        var radiusX = Math.abs(currentX - startX) / 2;
        var radiusY = Math.abs(currentY - startY) / 2;
        var centerX = startX + (currentX - startX) / 2;
        var centerY = startY + (currentY - startY) / 2;
        drawEllipse(centerX, centerY, radiusX, radiusY, current.color, current.lineWidth, false);
      } else if (currentShape === 'circle') {
        var radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
        drawCircle(startX, startY, radius, current.color, current.lineWidth, false);
      }
    }
  }

  function onColorUpdate(e) {
    current.color = e.target.className.split(' ')[1];
  }

  function onLineWidthChange(e) {
    current.lineWidth = parseInt(e.target.value);
  }

  function onFontChange(e) {
    current.font = e.target.value;
  }

  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();
      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onDrawingEvent(data) {
    var w = canvas.width;
    var h = canvas.height;
    
    switch (data.type) {
      case 'line':
        drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.lineWidth, false);
        break;
      case 'rectangle':
        drawRectangle(data.x * w, data.y * h, data.width * w, data.height * h, data.color, data.lineWidth, false);
        break;
      case 'ellipse':
        drawEllipse(data.x * w, data.y * h, data.radiusX * w, data.radiusY * h, data.color, data.lineWidth, false);
        break;
      case 'circle':
        drawCircle(data.x * w, data.y * h, data.radius * w, data.color, data.lineWidth, false);
        break;
      case 'text':
        drawText(data.text, data.x * w, data.y * h, data.color, data.font, false);
        break;
    }
  }

  function onInitialDraw(dataArray) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    history = JSON.parse(JSON.stringify(dataArray)); // Deep copy
    redraw();
  }

  function onClearEvent() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    history = [];
    future = [];
  }
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redraw();
  }

  function onUndo() {
    if (history.length > 0) {
      future.push(history.pop());
      redraw();
      socket.emit('undo');
    }
  }

  function onRedo() {
    if (future.length > 0) {
      history.push(future.pop());
      redraw();
      socket.emit('syncCanvas', history);
    }
  }

  function onClear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    history = [];
    future = [];
    socket.emit('clear');
  }

  function redraw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    history.forEach(function(item) {
      var w = canvas.width;
      var h = canvas.height;
      
      switch (item.type) {
        case 'line':
          drawLine(item.x0 * w, item.y0 * h, item.x1 * w, item.y1 * h, item.color, item.lineWidth, false);
          break;
        case 'rectangle':
          drawRectangle(item.x * w, item.y * h, item.width * w, item.height * h, item.color, item.lineWidth, false);
          break;
        case 'ellipse':
          drawEllipse(item.x * w, item.y * h, item.radiusX * w, item.radiusY * h, item.color, item.lineWidth, false);
          break;
        case 'circle':
          drawCircle(item.x * w, item.y * h, item.radius * w, item.color, item.lineWidth, false);
          break;
        case 'text':
          drawText(item.text, item.x * w, item.y * h, item.color, item.font, false);
          break;
      }
    });
  }
})();