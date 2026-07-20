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
    const tasks = await db.all("SELECT * FROM tasks");
    res.json(tasks);
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
    const result = await db.run(
      "INSERT INTO tasks (title, done) VALUES (?, ?)",
      [title, 0],
    );
    const newTask = await db.get("SELECT * FROM tasks WHERE id = ?", [
      result.lastID,
    ]);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/tasks/:id", async (req, res) => {
  try {
    const task = await db.get("SELECT * FROM tasks WHERE id = ?", [
      req.params.id,
    ]);
    if (!task) {
      return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/tasks/:id", async (req, res) => {
  try {
    const task = await db.get("SELECT * FROM tasks WHERE id = ?", [
      req.params.id,
    ]);
    if (!task) {
      return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }

    const { title, done } = req.body;
    if (title === undefined && done === undefined) {
      return res
        .status(400)
        .json({ error: "Provide at least title or done to update" });
    }

    const newTitle = title !== undefined ? title : task.title;
    const newDone = done !== undefined ? (done ? 1 : 0) : task.done;

    await db.run("UPDATE tasks SET title = ?, done = ? WHERE id = ?", [
      newTitle,
      newDone,
      req.params.id,
    ]);
    const updatedTask = await db.get("SELECT * FROM tasks WHERE id = ?", [
      req.params.id,
    ]);
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    const task = await db.get("SELECT * FROM tasks WHERE id = ?", [
      req.params.id,
    ]);
    if (!task) {
      return res.status(404).json({ error: `Task ${req.params.id} not found` });
    }

    await db.run("DELETE FROM tasks WHERE id = ?", [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
