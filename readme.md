# Doodle Dash - Real-Time Collaborative Whiteboard 🎨


![Doodle Dash Screenshot](https://i.ibb.co/vvQ8Zt0F/doodle-dash.jpg)

Doodle Dash is a feature-rich, real-time collaborative whiteboard application built for the RSOC Hackathon. It enables multiple users to draw simultaneously with various tools, shapes, and text in a shared digital workspace.

## 🌟 Features

- **Real-time collaboration** using Socket.IO
- **Multiple drawing tools**:
  - ✏️ Freehand pencil
  - ⬛ Rectangle
  - ⚪ Circle/Ellipse
  - ➖ Line
  - 🔤 Text with customizable fonts
- **Color palette** with custom color picker
- **Adjustable line width**
- **Undo/Redo functionality**
- **Canvas clearing**
- **Save drawings** as PNG images
- **Responsive design** works on desktop and mobile
- **Touch support** for mobile devices

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/sheikhwasimuddin/Hackathon-RSOC.git
   cd Hackathon-RSOC
2. Install dependencies
    ```
    npm install
3. Start the server
   ```
   node app.js
4. Open in browser
   ```
   http://localhost:3001

🛠️ Tech Stack
Frontend:

HTML5 Canvas

Vanilla JavaScript (ES6+)

Socket.IO client

Bootstrap 5

Font Awesome icons

Backend:

Node.js

Express.js

Socket.IO

📂 Project Structure
Copy
Hackathon-RSOC/
├── public/            # Static files
│   ├── css/           # Stylesheets
│   └── js/            # JavaScript files
├── app.js             # Main server file
├── canvas.js          # Canvas drawing logic
├── front.js           # Frontend event handling
├── main.js            # Additional drawing functionality
├── text-tool.js       # Text tool implementation
├── package.json       # Project dependencies
└── README.md          # Project documentation

🎨 How to Use
Select a tool from the toolbar

Choose a color from the palette or custom picker

Adjust line width as needed

Start drawing on the canvas

Share the room URL with collaborators

Save your artwork when finished

🧑‍💻 Development
To contribute to the project:

Fork the repository

Create a new branch (git checkout -b feature/your-feature)

Commit your changes (git commit -m 'Add some feature')

Push to the branch (git push origin feature/your-feature)

Open a Pull Request

👥 Team Byte Busters
Arpit Dhumane

Sheikh Wasimuddin

Tanmay Patil

Tejas Kalbande
🙏 Acknowledgments
Socket.IO documentation

HTML5 Canvas API

Bootstrap framework

Font Awesome icons
   
