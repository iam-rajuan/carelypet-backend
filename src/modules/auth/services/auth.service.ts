import bcrypt from "bcrypt";
import User, { IUser } from "../models/user.model";
import { LoginInput, RegisterInput } from "../validations/auth.validation";

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
  const normalizedEmail = email?.trim().toLowerCase() || undefined;
  const sanitizedPhone = phone?.trim() || undefined;
  const sanitizedPassword = password?.trim();
  if (!sanitizedPassword) {
    throw new Error("Password is required");
  }

  if (!normalizedEmail && !sanitizedPhone) {
    throw new Error("Email or phone is required");
  }

  const orFilters: Record<string, string>[] = [];
  if (normalizedEmail) {
    orFilters.push({ email: normalizedEmail });
  }
  if (sanitizedPhone) {
    orFilters.push({ phone: sanitizedPhone });
  }

  const existingUser = await User.findOne({ $or: orFilters });

  if (existingUser) {
    throw new Error("User already exists with this email or phone");
  }

  const hashedPassword = await bcrypt.hash(sanitizedPassword, 10);

  const user = await User.create({
    name: sanitizedName,
    email: normalizedEmail,
    phone: sanitizedPhone,
    password: hashedPassword,
  });

  return user;
};

export const login = async ({
  email,
  phone,
  password,
}: LoginInput): Promise<IUser> => {
  const normalizedEmail = email?.trim().toLowerCase() || undefined;
  const sanitizedPhone = phone?.trim() || undefined;

  if (!normalizedEmail && !sanitizedPhone) {
    throw new Error("Email or phone is required");
  }

  const orFilters: Record<string, string>[] = [];
  if (normalizedEmail) {
    orFilters.push({ email: normalizedEmail });
  }
  if (sanitizedPhone) {
    orFilters.push({ phone: sanitizedPhone });
  }

  const user = await User.findOne({
    $or: orFilters,
  });

  if (!user) {
    throw new Error("User not found");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error("Invalid credentials");
  }

  return user;
};
