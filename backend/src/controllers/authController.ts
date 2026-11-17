import bcrypt from "bcryptjs";
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User";
import { env } from "../config/env";

function createToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: "7d",
  });
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export const register: RequestHandler = async (req, res, next) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (name.length < 2 || name.length > 60) {
      res.status(400).json({
        success: false,
        message: "Name must be between 2 and 60 characters",
      });
      return;
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
      return;
    }

    if (password.length < 8 || password.length > 72) {
      res.status(400).json({
        success: false,
        message: "Password must be between 8 and 72 characters",
      });
      return;
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token: createToken(user._id.toString()),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
      return;
    }

    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: createToken(user._id.toString()),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication",
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User account not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
