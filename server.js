const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const express = require("express");
const authRoute = require("./routes/auth");
const privateRoute = require("./routes/private");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/error");
connectDB();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/private", privateRoute);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
