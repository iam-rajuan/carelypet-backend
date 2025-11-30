import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import * as usersService from "./users.service";
import { toUserProfileResponse } from "./users.mapper";

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await usersService.getOwnProfile(req.user.id);
    res.json({
      success: true,
      data: toUserProfileResponse(user),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch profile";
    res.status(400).json({ success: false, message });
  }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await usersService.updateOwnProfile(req.user.id, req.body);
    res.json({
      success: true,
      message: "Profile updated",
      data: toUserProfileResponse(user),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    res.status(400).json({ success: false, message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    await usersService.changeOwnPassword(req.user.id, req.body);
    res.json({
      success: true,
      message: "Password changed",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to change password";
    res.status(400).json({ success: false, message });
  }
};

export const updateAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await usersService.updateOwnAvatar(req.user.id, req.body);
    res.json({
      success: true,
      message: "Avatar updated",
      data: toUserProfileResponse(user),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update avatar";
    res.status(400).json({ success: false, message });
  }
};
