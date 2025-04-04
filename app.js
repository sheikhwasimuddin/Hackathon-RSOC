const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3001;

app.use(express.static(__dirname + '/public'));

// Store drawing state to send to new connections
let drawingHistory = [];
// Add this to your existing socket events in app.js
socket.on('shape', function(data) {
  if (!validateDrawingData(data)) {
    console.warn('Invalid shape data received');
    return;
  }
  
  const roomId = socket.handshake.query.roomId || 'default';
  const room = getRoom(roomId);
  
  room.redoStack = [];
  room.undoStack.push({ type: 'shape', data: data });
  
  socket.to(roomId).emit('shape', data);
  console.log(`[${roomId}] Shape drawn: ${data.tool}`);
});
function onConnection(socket) {
  console.log('New client connected');
  
  // Send existing drawing history to the new client
  socket.emit('initialDraw', drawingHistory);

  // Listen to drawing events
  socket.on('drawing', function (data) {
    drawingHistory.push(data);
    socket.broadcast.emit('drawing', data);
  });

  // Clear event
  socket.on('clear', function () {
    drawingHistory = [];
    socket.broadcast.emit('clear');
  });

  // Undo event
  socket.on('undo', function () {
    if (drawingHistory.length > 0) {
      drawingHistory.pop();
      // Send the entire history for simplicity
      io.emit('initialDraw', drawingHistory);
    }
  });

  // Sync canvas
  socket.on('syncCanvas', function (history) {
    drawingHistory = history;
    socket.broadcast.emit('initialDraw', drawingHistory);
  });
}

io.on('connection', onConnection);

http.listen(port, () => console.log('listening on port ' + port));