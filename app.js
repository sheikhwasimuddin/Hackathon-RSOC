const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3001;

app.use(express.static(__dirname + '/public'));

// Initialize undo and redo stacks
let undoStack = [];
let redoStack = [];

function onConnection(socket) {
  // Listen to drawing events and add to the undo stack
  socket.on('drawing', function (data) {
    undoStack.push({ type: 'drawing', data: data });
    redoStack = []; // Clear the redo stack whenever a new action is taken
    socket.broadcast.emit('drawing', data);
    console.log(data);
  });

  socket.on('rectangle', function (data) {
    undoStack.push({ type: 'rectangle', data: data });
    redoStack = [];
    socket.broadcast.emit('rectangle', data);
    console.log(data);
  });

  socket.on('linedraw', function (data) {
    undoStack.push({ type: 'linedraw', data: data });
    redoStack = [];
    socket.broadcast.emit('linedraw', data);
    console.log(data);
  });

  socket.on('circledraw', function (data) {
    undoStack.push({ type: 'circledraw', data: data });
    redoStack = [];
    socket.broadcast.emit('circledraw', data);
    console.log(data);
  });

  socket.on('ellipsedraw', function (data) {
    undoStack.push({ type: 'ellipsedraw', data: data });
    redoStack = [];
    socket.broadcast.emit('ellipsedraw', data);
    console.log(data);
  });

  socket.on('textdraw', function (data) {
    undoStack.push({ type: 'textdraw', data: data });
    redoStack = [];
    socket.broadcast.emit('textdraw', data);
    console.log(data);
  });

  socket.on('copyCanvas', function (data) {
    undoStack.push({ type: 'copyCanvas', data: data });
    redoStack = [];
    socket.broadcast.emit('copyCanvas', data);
    console.log(data);
  });

  socket.on('Clearboard', function (data) {
    undoStack.push({ type: 'Clearboard', data: data });
    redoStack = [];
    socket.broadcast.emit('Clearboard', data);
    console.log(data);
  });

  // Undo event: Move the last action from undoStack to redoStack
  socket.on('undo', function () {
    if (undoStack.length > 0) {
      const lastAction = undoStack.pop();
      redoStack.push(lastAction);
      socket.broadcast.emit('undo', lastAction);
      console.log('Undo:', lastAction);
    }
  });

  // Redo event: Move the last undone action from redoStack to undoStack
  socket.on('redo', function () {
    if (redoStack.length > 0) {
      const lastUndoneAction = redoStack.pop();
      undoStack.push(lastUndoneAction);
      socket.broadcast.emit('redo', lastUndoneAction);
      console.log('Redo:', lastUndoneAction);
    }
  });
}

io.on('connection', onConnection);

http.listen(port, () => console.log('listening on port ' + port));
