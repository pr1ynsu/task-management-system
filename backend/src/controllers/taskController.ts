import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/authMiddleware";

// CREATE TASK
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        userId: req.userId!,
      },
    });

    res.status(201).json(task);
  } catch {
    res.status(500).json({ message: "Error creating task" });
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
  } catch {
    res.status(500).json({ message: "Error fetching tasks" });
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
  } catch {
    res.status(500).json({ message: "Error fetching task" });
  }
};

// UPDATE TASK
export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    const task = await prisma.task.updateMany({
      where: {
        id: Number(id),
        userId: req.userId!,
      },
      data: { title, completed },
    });

    res.json(task);
  } catch {
    res.status(500).json({ message: "Error updating task" });
  }
};

// DELETE TASK
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.task.deleteMany({
      where: {
        id: Number(id),
        userId: req.userId!,
      },
    });

    res.json({ message: "Task deleted" });
  } catch {
    res.status(500).json({ message: "Error deleting task" });
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
  } catch {
    res.status(500).json({ message: "Error toggling task" });
  }
};