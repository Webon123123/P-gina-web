const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const { MONGO_URI, JWT_SECRET } = require("./config");

const User = require("./models/User");
const Message = require("./models/Message");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api/", apiLimiter);

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.error("Error al conectar MongoDB:", err));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./public/uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });


app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  const userIp = req.ip;

  try {
    const newUser = new User({ username, email, password, ip: userIp });
    await newUser.save();
    res.status(201).json({ message: "Usuario registrado" });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});


app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Credenciales inválidas" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});


app.get("/api/auth/verify", (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido" });
    }
    res.status(200).json({ message: "Autenticado" });
  });
});


app.post("/api/messages", async (req, res) => {
  const { token, content, media } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const newMessage = new Message({ sender: decoded.id, content, media });
    await newMessage.save();
    res.status(201).json({ message: "Mensaje enviado" });
  } catch (err) {
    res.status(401).json({ error: "Token inválido" });
  }
});


app.post("/api/upload", upload.single("file"), (req, res) => {
  res.status(200).json({ filePath: `/uploads/${req.file.filename}` });
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));