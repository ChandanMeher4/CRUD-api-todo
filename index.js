const express = require("express");
const app = express();
app.use(express.json());
const db = require("./db");
db.initDB();
const PORT = 3000;

const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./openapi.json");

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"],
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/tasks", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM tasks ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/tasks", async (req, res) => {
  const { title } = req.body;
  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }
  try {
    const result = await db.query(
      "INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *",
      [title, false],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/tasks/:id", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM tasks WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/tasks/:id", async (req, res) => {
  const { title, done } = req.body;
  if (title === undefined && done === undefined) {
    return res
      .status(400)
      .json({ error: "Provide at least title or done to update" });
  }
  try {
    const check = await db.query("SELECT * FROM tasks WHERE id = $1", [
      req.params.id,
    ]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }
    const currentTask = check.rows[0];
    const newTitle = title !== undefined ? title : currentTask.title;
    const newDone = done !== undefined ? done : currentTask.done;
    const result = await db.query(
      "UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *",
      [newTitle, newDone, req.params.id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [req.params.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
