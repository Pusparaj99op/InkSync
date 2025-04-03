const express = require("express");
const app = express();
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");
const os = require("os");

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = socketIo(server);

// MongoDB Schemas
const sessionSchema = new mongoose.Schema({
  title: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const drawingSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
  userId: String,
  type: String,
  data: Object,
  color: String,
  brushSize: Number,
  timestamp: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
  userId: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const Session = mongoose.model("Session", sessionSchema);
const Drawing = mongoose.model("Drawing", drawingSchema);
const Comment = mongoose.model("Comment", commentSchema);

// Socket.io Events
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("joinSession", async ({ sessionId, userId, username }) => {
    try {
      if (!sessionId || !userId) throw new Error("Missing sessionId or userId");
      socket.join(sessionId);
      socket.sessionId = sessionId;
      socket.userId = userId;
      socket.username = username;

      const drawings = await Drawing.find({ sessionId });
      const comments = await Comment.find({ sessionId }).sort({ timestamp: 1 });
      socket.emit("loadDrawings", drawings);
      socket.emit("loadComments", comments);
      io.to(sessionId).emit("userJoined", { userId, color: generateUserColor(userId), username });
    } catch (err) {
      console.error("Error in joinSession:", err.message);
      socket.emit("error", { message: "Failed to join session: " + err.message });
    }
  });

  socket.on("draw", async (drawing) => {
    try {
      if (!socket.sessionId) throw new Error("No session joined");
      const newDrawing = new Drawing({ ...drawing, sessionId: socket.sessionId });
      await newDrawing.save();
      io.to(socket.sessionId).emit("draw", newDrawing);
    } catch (err) {
      console.error("Error in draw:", err.message);
    }
  });

  socket.on("undo", async () => {
    try {
      if (!socket.sessionId) throw new Error("No session joined");
      const lastDrawing = await Drawing.findOne({ sessionId: socket.sessionId }).sort({ timestamp: -1 });
      if (lastDrawing) {
        await Drawing.findByIdAndDelete(lastDrawing._id);
        io.to(socket.sessionId).emit("removeDrawing", lastDrawing._id);
      }
    } catch (err) {
      console.error("Error in undo:", err.message);
    }
  });

  socket.on("clear", async ({ sessionId }) => {
    try {
      await Drawing.deleteMany({ sessionId });
      io.to(sessionId).emit("clear");
    } catch (err) {
      console.error("Error in clear:", err.message);
    }
  });

  socket.on("cursorMove", (position) => {
    try {
      if (!socket.sessionId) return;
      io.to(socket.sessionId).emit("cursorMove", {
        userId: socket.userId,
        position,
        color: generateUserColor(socket.userId)
      });
    } catch (err) {
      console.error("Error in cursorMove:", err.message);
    }
  });

  socket.on("comment", async ({ text }) => {
    try {
      if (!socket.sessionId) throw new Error("No session joined");
      if (!text) throw new Error("Comment text is empty");
      const comment = new Comment({
        sessionId: socket.sessionId,
        userId: socket.userId,
        text
      });
      await comment.save();
      io.to(socket.sessionId).emit("newComment", comment);
    } catch (err) {
      console.error("Error in comment:", err.message);
    }
  });

  socket.on("disconnect", () => {
    if (socket.sessionId) {
      io.to(socket.sessionId).emit("userLeft", socket.userId);
    }
  });
});

// Routes
app.get("/", async (req, res) => {
  try {
    const sessions = await Session.find();
    const localIP = getLocalIP();
    res.render("login", { sessions, localIP });
  } catch (err) {
    console.error("Error in GET /:", err.message);
    res.status(500).send("Server error");
  }
});

app.post("/create-session", async (req, res) => {
  try {
    const session = new Session({ title: req.body.title });
    await session.save();
    res.redirect(`/whiteboard?sessionId=${session._id}`);
  } catch (err) {
    console.error("Error in create-session:", err.message);
    res.status(500).send("Failed to create session");
  }
});

app.get("/whiteboard", (req, res) => {
  const localIP = getLocalIP();
  res.render("whiteboard", { sessionId: req.query.sessionId, localIP });
});

// Helper functions
function generateUserColor(userId) {
  const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `hsl(${hash % 360}, 70%, 50%)`;
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

mongoose.connect("mongodb://localhost/collabboard")
  .then(() => server.listen(8080, () => console.log("Server running on port 8080")))
  .catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });