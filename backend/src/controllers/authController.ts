import { Request, Response } from "express";
import prisma from "../utils/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string; // expect env var set

// GENERATE TOKENS
const generateTokens = (userId: number) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

  return { accessToken, refreshToken };
};

// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    res.status(201).json({ message: "User registered", user });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Failed to register user" });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, password: true, refreshToken: true }
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const { accessToken, refreshToken } = generateTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to login" });
  }
};

// REFRESH TOKEN
export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded: any = jwt.verify(refreshToken, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, refreshToken: true }
    });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const tokens = generateTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    res.json(tokens);
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(403).json({ message: "Token expired or invalid" });
  }
};

// LOGOUT
export const logout = async (req: Request, res: Response) => {
  const { userId } = req.body;

  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });

  res.json({ message: "Logged out successfully" });
};