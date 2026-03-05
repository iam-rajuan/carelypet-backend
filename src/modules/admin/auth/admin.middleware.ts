import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { verifyToken } from "../../../utils/jwt";
import Admin from "./admin.model";

const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    if (decoded.type !== "access" || decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const tokenVersion = decoded.tokenVersion ?? 0;
    const currentVersion = admin.tokenVersion ?? 0;
    if (tokenVersion != currentVersion) {
      return res.status(401).json({ success: false, message: "Token revoked" });
    }

    req.user = decoded;
    next();
  } catch (_err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export default adminAuth;
