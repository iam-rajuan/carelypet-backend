import bcrypt from "bcrypt";
import User, { IUser } from "./user.model";
import RefreshToken, { IRefreshToken } from "./refreshToken.model";
import {
  LoginInput,
  RegisterInput,
  RefreshTokenInput,
  VerifyEmailInput,
  ResendEmailOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "./auth.validation";
import { signAccessToken, signRefreshToken, verifyToken } from "../../utils/jwt";
import { sendMail } from "../../utils/mail";
type Carrier = "verizon" | "att" | "tmobile" | "sprint";

const carrierGateways: Record<Carrier, string> = {
  verizon: "vtext.com",
  att: "txt.att.net",
  tmobile: "tmomail.net",
  sprint: "messaging.sprintpcs.com",
};

export const sendPhoneOtp = async ({ phone, carrier }: { phone: string; carrier: Carrier }) => {
  const sanitizedPhone = phone.trim();
  const gateway = carrierGateways[carrier];
  const otp = generateOtp();
  const expiresAt = addMinutes(10);

  let user = await User.findOne({ phone: sanitizedPhone });

  if (!user) {
    user = await User.create({
      phone: sanitizedPhone,
      name: "User-" + sanitizedPhone,
      password: "",
    });
  }

  user.phoneVerificationToken = otp;
  user.phoneVerificationExpires = expiresAt;
  user.isPhoneVerified = false;
  await user.save();

  await sendMail({
    to: `${sanitizedPhone}@${gateway}`,
    subject: "Phone verification code",
    text: `Your verification OTP is ${otp}. It expires in 10 minutes.`,
  });
};

export const verifyPhoneOtp = async ({ phone, otp }: { phone: string; otp: string }) => {
  const sanitizedPhone = phone.trim();
  const user = await User.findOne({ phone: sanitizedPhone });

  if (
    !user ||
    !user.phoneVerificationToken ||
    !user.phoneVerificationExpires ||
    user.phoneVerificationToken !== otp ||
    user.phoneVerificationExpires < new Date()
  ) {
    throw new Error("Invalid or expired OTP");
  }

  user.isPhoneVerified = true;
  user.phoneVerificationToken = null;
  user.phoneVerificationExpires = null;
  await user.save();

  const tokens = await buildTokens(user);

  return { user, tokens };
};



export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: IUser;
  tokens: AuthTokens;
}

const normalizeContact = (value?: string): string | undefined => value?.trim() || undefined;

const hashPassword = async (password?: string): Promise<string> => {
  const sanitized = password?.trim();
  if (!sanitized) {
    throw new Error("Password is required");
  }
  return bcrypt.hash(sanitized, 10);
};

const generateOtp = (): string => Math.floor(100000 + Math.random() * 900000).toString();

const addMinutes = (minutes: number): Date => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
};

const saveRefreshToken = async (userId: string, token: string, expiresAt: Date) => {
  const hashedToken = await bcrypt.hash(token, 10);
  await RefreshToken.create({
    user: userId,
    token: hashedToken,
    expiresAt,
    revoked: false,
  });
};

const buildTokens = async (user: IUser): Promise<AuthTokens> => {
  const payload = { id: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const decodedRefresh = verifyToken(refreshToken);
  const expiresAt = decodedRefresh.exp ? new Date(decodedRefresh.exp * 1000) : new Date();

  await saveRefreshToken(user._id.toString(), refreshToken, expiresAt);

  return { accessToken, refreshToken };
};

export const register = async ({
  name,
  email,
  phone,
  password,
}: RegisterInput): Promise<IUser> => {
  const sanitizedName = name?.trim();
  if (!sanitizedName) {
    throw new Error("Name is required");
  }

  const normalizedEmail = email?.trim().toLowerCase();
  const sanitizedPhone = normalizeContact(phone);

  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  const contactFilters: Record<string, string>[] = [];
  if (normalizedEmail) contactFilters.push({ email: normalizedEmail });
  if (sanitizedPhone) contactFilters.push({ phone: sanitizedPhone });

  const existingUser = await User.findOne({
    $or: contactFilters,
  });

  if (existingUser) {
    throw new Error("User already exists with this email or phone");
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    name: sanitizedName,
    email: normalizedEmail,
    phone: sanitizedPhone,
    password: hashedPassword,
    isVerified: false,
  });

  await sendEmailVerificationOtp(user);

  return user;
};

export const login = async ({ email, password }: LoginInput): Promise<AuthResult> => {
  const normalizedEmail = email?.trim().toLowerCase();
  const sanitizedPassword = password?.trim();

  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error("User not found");
  }

  if (!sanitizedPassword) {
    throw new Error("Password is required");
  }

  const match = await bcrypt.compare(sanitizedPassword, user.password);
  if (!match) {
    throw new Error("Invalid credentials");
  }

  if (!user.isVerified) {
    throw new Error("Email not verified");
  }

  const tokens = await buildTokens(user);

  return { user, tokens };
};

const findMatchingRefreshToken = async (
  userId: string,
  rawToken: string
): Promise<IRefreshToken | null> => {
  const activeTokens = await RefreshToken.find({
    user: userId,
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

export const refreshTokens = async ({ refreshToken }: RefreshTokenInput): Promise<AuthTokens> => {
  const decoded = verifyToken(refreshToken);

  if (decoded.type !== "refresh") {
    throw new Error("Invalid token type");
  }

  const tokenDoc = await findMatchingRefreshToken(decoded.id, refreshToken);

  if (!tokenDoc) {
    throw new Error("Refresh token is invalid or expired");
  }

  tokenDoc.revoked = true;
  tokenDoc.revokedAt = new Date();
  await tokenDoc.save();

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new Error("User not found");
  }

  return buildTokens(user);
};

export const logout = async ({ refreshToken }: RefreshTokenInput): Promise<void> => {
  const decoded = verifyToken(refreshToken);

  if (decoded.type !== "refresh") {
    throw new Error("Invalid token type");
  }

  const tokenDoc = await findMatchingRefreshToken(decoded.id, refreshToken);

  if (tokenDoc) {
    tokenDoc.revoked = true;
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();
  }
};

export const verifyEmailWithOtp = async ({ email, otp }: VerifyEmailInput): Promise<AuthResult> => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error("Invalid OTP");
  }

  if (
    !user.emailVerificationToken ||
    !user.emailVerificationExpires ||
    user.emailVerificationToken !== otp ||
    user.emailVerificationExpires < new Date()
  ) {
    throw new Error("Invalid or expired OTP");
  }

  user.isVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  const tokens = await buildTokens(user);

  return { user, tokens };
};

export const resendEmailVerificationOtp = async ({ email }: ResendEmailOtpInput): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("Email already verified");
  }

  await sendEmailVerificationOtp(user);
};

export const requestPasswordReset = async ({ email }: ForgotPasswordInput): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  // Always respond success later to avoid disclosing existence
  if (!user) {
    return;
  }

  const otp = generateOtp();
  user.resetPasswordToken = otp;
  user.resetPasswordExpires = addMinutes(10);
  await user.save();

  await sendMail({
    to: normalizedEmail,
    subject: "Password Reset OTP",
    text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
  });
};

export const resetPasswordWithOtp = async ({
  email,
  otp,
  password,
}: ResetPasswordInput): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (
    !user ||
    !user.resetPasswordToken ||
    !user.resetPasswordExpires ||
    user.resetPasswordToken !== otp ||
    user.resetPasswordExpires < new Date()
  ) {
    throw new Error("Invalid or expired OTP");
  }

  const hashed = await hashPassword(password);
  user.password = hashed;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();
};

export const sendEmailVerificationOtp = async (user: IUser): Promise<void> => {
  const otp = generateOtp();
  user.emailVerificationToken = otp;
  user.emailVerificationExpires = addMinutes(30);
  await user.save();

  if (user.email) {
    await sendMail({
      to: user.email,
      subject: "Verify your email",
      text: `Your verification OTP is ${otp}. It expires in 30 minutes.`,
    });
  }
};
