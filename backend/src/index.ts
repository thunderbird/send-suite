import "dotenv/config";
import cors from "cors";
import express from "express";

import users from './routes/users';
import folders from './routes/folders';

const PORT = 8080;
const HOST = "0.0.0.0";

const app = express();

app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Expose-Headers", "WWW-Authenticate");
  next();
});

app.get("/", (req, res) => {
  res.status(200).send("echo");
});

app.use('/api/users', users);
app.use('/api/folders', folders);


app.get(`*`, (req, res) => {
  res.status(404);
});

const server = app.listen(PORT, HOST, () =>
  console.log(`🚀 Server ready at: http://${HOST}:${PORT}`)
);
