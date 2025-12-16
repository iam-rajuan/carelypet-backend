import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import * as providersService from "./providers.service";
import { toProviderResponse, toReviewResponse } from "./providers.mapper";
import { ProviderQueryInput } from "./providers.validation";

const requireUser = (
  req: AuthRequest,
  res: Response
): { id: string; role: string } | null => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  return { id: req.user.id, role: req.user.role };
};

export const createProvider = async (req: AuthRequest, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const provider = await providersService.createProvider(user.id, req.body);
    res.status(201).json({ success: true, data: toProviderResponse(provider) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create provider";
    res.status(400).json({ success: false, message });
  }
};

export const updateProvider = async (req: AuthRequest, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const provider = await providersService.updateProvider(user.id, req.params.id, req.body);
    res.json({
      success: true,
      data: toProviderResponse(provider),
      message: "Provider updated",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update provider";
    const status =
      message === "Provider not found" || message === "Provider not found or not authorized"
        ? 404
        : 400;
    res.status(status).json({ success: false, message });
  }
};

export const deleteProvider = async (req: AuthRequest, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    await providersService.deleteProvider(user.id, req.params.id);
    res.json({ success: true, message: "Provider deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete provider";
    const status =
      message === "Provider not found or not authorized" || message === "Provider not found"
        ? 404
        : 400;
    res.status(status).json({ success: false, message });
  }
};

export const verifyProvider = async (req: AuthRequest, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const provider = await providersService.verifyProvider(user.id, req.params.id, req.body);
    res.json({
      success: true,
      data: toProviderResponse(provider),
      message: "Provider verification updated",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to verify provider";
    const status = message === "Provider not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const getProviderById = async (req: AuthRequest, res: Response) => {
  try {
    const authUser = req.user;
    const provider = await providersService.getProviderById(
      req.params.id,
      authUser?.id,
      authUser?.role === "admin"
    );
    res.json({ success: true, data: toProviderResponse(provider) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch provider";
    const status = message === "Provider not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const listProviders = async (req: Request, res: Response) => {
  try {
    const filters = (req as Request & { validatedQuery?: ProviderQueryInput }).validatedQuery || {};
    const result = await providersService.listProviders(filters);
    res.json({
      success: true,
      data: { ...result, data: result.data.map(toProviderResponse) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list providers";
    res.status(400).json({ success: false, message });
  }
};

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const review = await providersService.createOrUpdateReview(
      user.id,
      req.params.id,
      req.body
    );
    const provider = await providersService.getProviderById(
      req.params.id,
      user.id,
      user.role === "admin"
    );

    res.status(201).json({
      success: true,
      data: {
        review: toReviewResponse(review),
        provider: toProviderResponse(provider),
      },
      message: "Review saved",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit review";
    const status = message === "Provider not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};
