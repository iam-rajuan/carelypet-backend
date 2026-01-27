import bcrypt from "bcrypt";
import Admin, { IAdmin } from "./admin.model";
import AdminRefreshToken, { IAdminRefreshToken } from "./adminRefreshToken.model";
import {
  AdminLoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  VerifyOtpInput,
  ResetPasswordInput,
} from "./auth.validation";
import { signAccessToken, signRefreshToken, verifyToken } from "../../../utils/jwt";
import { sendMail } from "../../../utils/mail";

export interface AdminTokens {
  accessToken: string;
  refreshToken: string;
}

const generateOtp = (): string => Math.floor(100000 + Math.random() * 900000).toString();

const addMinutes = (minutes: number): Date => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
};

const saveRefreshToken = async (adminId: string, token: string, expiresAt: Date) => {
  const hashedToken = await bcrypt.hash(token, 10);
  await AdminRefreshToken.create({
    admin: adminId,
    token: hashedToken,
    expiresAt,
    revoked: false,
  });
};

const buildTokens = async (admin: IAdmin): Promise<AdminTokens> => {
  const payload = {
    id: admin._id.toString(),
    role: "admin",
    tokenVersion: admin.tokenVersion ?? 0,
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const decodedRefresh = verifyToken(refreshToken);
  const expiresAt = decodedRefresh.exp ? new Date(decodedRefresh.exp * 1000) : new Date();
  await saveRefreshToken(admin._id.toString(), refreshToken, expiresAt);

  return { accessToken, refreshToken };
};

const findMatchingRefreshToken = async (
  adminId: string,
  rawToken: string
): Promise<IAdminRefreshToken | null> => {
  const activeTokens = await AdminRefreshToken.find({
    admin: adminId,
    revoked: false,
    expiresAt: { $gt: new Date() },
  });

  for (const tokenDoc of activeTokens) {
    const isMatch = await bcrypt.compare(rawToken, tokenDoc.token);
    if (isMatch) {
      return tokenDoc;
    }
  }

  return null;
};

const requireAdmin = (admin?: IAdmin | null): IAdmin => {
  if (!admin) {
    throw new Error("Admin not found");
  }
  return admin;
};

export const login = async ({
  email,
  password,
}: AdminLoginInput): Promise<{ user: IAdmin; tokens: AdminTokens }> => {
  const normalizedEmail = email?.trim().toLowerCase();
  const sanitizedPassword = password?.trim();

  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  const admin = await Admin.findOne({ email: normalizedEmail });
  const adminUser = requireAdmin(admin);

  if (!sanitizedPassword) {
    throw new Error("Password is required");
  }

  const match = await bcrypt.compare(sanitizedPassword, adminUser.password);
  if (!match) {
    throw new Error("Invalid credentials");
  }

  if (!adminUser.isVerified) {
    throw new Error("Email not verified");
  }

  const tokens = await buildTokens(adminUser);

  return { user: adminUser, tokens };
};

export const refreshTokens = async ({ refreshToken }: RefreshTokenInput): Promise<AdminTokens> => {
  const decoded = verifyToken(refreshToken);

  if (decoded.type !== "refresh") {
    throw new Error("Invalid token type");
  }

  const adminUser = requireAdmin(await Admin.findById(decoded.id));
  const tokenVersion = decoded.tokenVersion ?? 0;
  const currentVersion = adminUser.tokenVersion ?? 0;
  if (tokenVersion != currentVersion) {
    throw new Error("Token revoked");
  }

  const tokenDoc = await findMatchingRefreshToken(decoded.id, refreshToken);
  if (!tokenDoc) {
    throw new Error("Refresh token is invalid or expired");
  }

  tokenDoc.revoked = true;
  tokenDoc.revokedAt = new Date();
  await tokenDoc.save();

  return buildTokens(adminUser);
};

export const logout = async ({ refreshToken }: RefreshTokenInput): Promise<void> => {
  const decoded = verifyToken(refreshToken);

  if (decoded.type !== "refresh") {
    throw new Error("Invalid token type");
  }

  const adminUser = requireAdmin(await Admin.findById(decoded.id));

  const tokenDoc = await findMatchingRefreshToken(adminUser._id.toString(), refreshToken);
  if (tokenDoc) {
    tokenDoc.revoked = true;
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();
  }

  await AdminRefreshToken.updateMany(
    { admin: adminUser._id, revoked: false },
    { revoked: true, revokedAt: new Date() }
  );
  adminUser.tokenVersion = (adminUser.tokenVersion ?? 0) + 1;
  await adminUser.save();
};

export const forgotPassword = async ({ email }: ForgotPasswordInput): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();
  const adminUser = await Admin.findOne({ email: normalizedEmail });
  if (!adminUser) {
    return;
  }
  const otp = generateOtp();
  adminUser.resetPasswordToken = otp;
  adminUser.resetPasswordExpires = addMinutes(10);
  adminUser.resetPasswordVerified = false;
  adminUser.resetPasswordVerifiedExpires = null;
  await adminUser.save();

  await sendMail({
    to: normalizedEmail,
    subject: "Admin Password Reset OTP",
    text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
  });
};

export const verifyOtp = async ({ email, otp }: VerifyOtpInput): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();
  const adminUser = requireAdmin(await Admin.findOne({ email: normalizedEmail }));
  if (
    !adminUser.resetPasswordToken ||
    !adminUser.resetPasswordExpires ||
    adminUser.resetPasswordToken !== otp ||
    adminUser.resetPasswordExpires < new Date()
  ) {
    throw new Error("Invalid or expired OTP");
  }

  adminUser.resetPasswordVerified = true;
  adminUser.resetPasswordVerifiedExpires = addMinutes(10);
  adminUser.resetPasswordToken = null;
  adminUser.resetPasswordExpires = null;
  await adminUser.save();
};

export const resetPassword = async ({
  email,
  newPassword,
}: ResetPasswordInput): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();
  const adminUser = requireAdmin(await Admin.findOne({ email: normalizedEmail }));
  if (
    !adminUser.resetPasswordVerified ||
    !adminUser.resetPasswordVerifiedExpires ||
    adminUser.resetPasswordVerifiedExpires < new Date()
  ) {
    throw new Error("OTP verification required or expired");
  }

  const hashed = await bcrypt.hash(newPassword.trim(), 10);
  adminUser.password = hashed;
  adminUser.resetPasswordVerified = false;
  adminUser.resetPasswordVerifiedExpires = null;
  await adminUser.save();

  await AdminRefreshToken.updateMany(
    { admin: adminUser._id, revoked: false },
    { revoked: true, revokedAt: new Date() }
  );
  adminUser.tokenVersion = (adminUser.tokenVersion ?? 0) + 1;
  await adminUser.save();
};
