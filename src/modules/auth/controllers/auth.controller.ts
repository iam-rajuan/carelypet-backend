import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import * as authService from "../services/auth.service";
import { LoginInput, RegisterInput } from "../validations/auth.validation";

const getJwtSecret = (): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }
  return process.env.JWT_SECRET;
};

export const register = async (
  req: Request<unknown, unknown, RegisterInput>,
  res: Response
) => {
  try {
    const user = await authService.register(req.body);

    res.json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    res.status(400).json({ success: false, message });
  }
};

export const login = async (
  req: Request<unknown, unknown, LoginInput>,
  res: Response
) => {
  try {
    const user = await authService.login(req.body);
    const expiresIn = process.env.JWT_EXPIRES_IN || "1d";

    const payload = {
      id: user._id.toString(),
      role: user.role,
    };

    const token = jwt.sign(payload, getJwtSecret(), {
      expiresIn,
    } as SignOptions);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    res.status(400).json({ success: false, message });
  }
};
