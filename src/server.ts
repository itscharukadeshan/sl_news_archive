/** @format */

import express, { Request, Response } from "express";
import { archive } from "./services/archive";

const app = express();
const PORT = process.env.PORT || 3001;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});
app.get("/archive", (req: Request, res: Response) => {
  const url = req.query.url as string;
  archive(url)
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      res.status(404).send(error.message);
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
