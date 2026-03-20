import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/authMiddleware";

// CREATE TASK
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    // quick check to avoid empty input
    if (!title?.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        userId: req.userId!,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ message: "Failed to create task" });
  }
};

// GET TASKS (Pagination + Filter + Search)
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { page = "1", limit = "10", status, search } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.userId!,
        ...(status !== undefined && {
          completed: status === "true",
        }),
        ...(search && {
          title: {
            contains: search as string,
            mode: "insensitive",
          },
        }),
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    res.json(tasks);
  } catch (error) {
    console.error("Fetch tasks error:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

// GET SINGLE TASK
export const getTaskById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id: Number(id),
        userId: req.userId!,
      },
    });

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (error) {
    console.error("Fetch task error:", error);
    res.status(500).json({ message: "Failed to fetch task" });
  }
};

// UPDATE TASK
export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    // basic check before update
    if (title !== undefined && !title?.trim()) {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    // safer single update
    const task = await prisma.task.findFirst({
      where: {
        id: Number(id),
        userId: req.userId!,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: Number(id),
      },
      data: { 
        ...(title !== undefined && { title: title.trim() }),
        ...(completed !== undefined && { completed }),
      },
    });

    res.json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: "Failed to update task" });
  }
};

// DELETE TASK
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // check exists first
    const task = await prisma.task.findFirst({
      where: {
        id: Number(id),
        userId: req.userId!,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await prisma.task.delete({
      where: {
        id: Number(id),
      },
    });

    res.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ message: "Failed to delete task" });
  }
};

// TOGGLE TASK
export const toggleTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: { id: Number(id), userId: req.userId! },
    });

    if (!task) return res.status(404).json({ message: "Task not found" });

    const updated = await prisma.task.update({
      where: { id: Number(id) },
      data: { completed: !task.completed },
    });

    res.json(updated);
  } catch (error) {
    console.error("Toggle task error:", error);
    res.status(500).json({ message: "Failed to toggle task" });
  }
};