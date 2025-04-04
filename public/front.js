const canvas = document.getElementById("imageView");
        const ctx = canvas.getContext("2d");
        let drawing = false;
        let history = [];
        let step = -1;
        const socket = io();

        function saveStep() {
            step++;
            history = history.slice(0, step);
            history.push(canvas.toDataURL());
        }

        canvas.addEventListener("mousedown", (e) => {
            drawing = true;
            ctx.beginPath();
            ctx.moveTo(e.offsetX, e.offsetY);
        });

        canvas.addEventListener("mousemove", (e) => {
            if (!drawing) return;
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
            socket.emit("draw", { x: e.offsetX, y: e.offsetY });
        });

        canvas.addEventListener("mouseup", () => {
            drawing = false;
            saveStep();
        });

        document.getElementById("undo").addEventListener("click", () => {
            if (step > 0) {
                step--;
                let img = new Image();
                img.src = history[step];
                img.onload = () => ctx.drawImage(img, 0, 0);
            }
        });

        document.getElementById("redo").addEventListener("click", () => {
            if (step < history.length - 1) {
                step++;
                let img = new Image();
                img.src = history[step];
                img.onload = () => ctx.drawImage(img, 0, 0);
            }
        });

        document.getElementById("save").addEventListener("click", () => {
            const link = document.createElement("a");
            link.download = "doodle.png";
            link.href = canvas.toDataURL();
            link.click();
        });

        document.getElementById("clear").addEventListener("click", () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            saveStep();
        });

        socket.on("draw", (data) => {
            ctx.lineTo(data.x, data.y);
            ctx.stroke();
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