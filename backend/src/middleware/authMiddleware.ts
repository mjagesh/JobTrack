import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";

export const protect: RequestHandler = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    if (
      typeof decoded === "string" ||
      !("userId" in decoded) ||
      typeof (decoded as JwtPayload).userId !== "string"
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }

    req.user = {
      userId: (decoded as JwtPayload).userId as string,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
