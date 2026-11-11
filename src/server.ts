
import express from "express";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "todo-api",
  });
});

app.listen(port, () => {
  console.log(`Todo API running on port ${port}`);
});
