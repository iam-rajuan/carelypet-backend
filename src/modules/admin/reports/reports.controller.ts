import { Request, Response } from "express";
import * as communityService from "../../user/community/community.service";
import { toCommunityReportResponse } from "../../user/community/community.mapper";

const mapPostSummary = (post: any) => {
  if (!post) return null;
  const author =
    post.author && typeof post.author === "object"
      ? {
          id: String(post.author._id || post.author.id || ""),
          name: post.author.name,
          username: post.author.username,
          avatarUrl: post.author.avatarUrl,
        }
      : null;
  return {
    id: String(post._id || post.id || ""),
    text: post.text || "",
    media: post.media || [],
    author,
    createdAt: post.createdAt,
  };
};

export const listReports = async (_req: Request, res: Response) => {
  try {
    const reports = await communityService.listReports();
    res.json({ success: true, data: reports.map(toCommunityReportResponse) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch reports";
    res.status(400).json({ success: false, message });
  }
};

export const getReport = async (req: Request, res: Response) => {
  try {
    const report = await communityService.getReportById(req.params.id);
    res.json({
      success: true,
      data: {
        ...toCommunityReportResponse(report),
        post: mapPostSummary(report.post),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Report not found";
    const status = message === "Report not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const deleteReport = async (req: Request, res: Response) => {
  try {
    await communityService.deleteReport(req.params.id);
    res.json({ success: true, message: "Report deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete report";
    const status = message === "Report not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const removeContent = async (req: Request, res: Response) => {
  try {
    const report = await communityService.removeReportedContent(req.params.id);
    res.json({
      success: true,
      message: "Reported content removed",
      data: toCommunityReportResponse(report),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove content";
    const status = message === "Report not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const warnUser = async (req: Request, res: Response) => {
  try {
    const report = await communityService.updateReportStatus(req.params.id, "warned");
    res.json({
      success: true,
      message: "User warned",
      data: toCommunityReportResponse(report),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to warn user";
    const status = message === "Report not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};

export const dismissReport = async (req: Request, res: Response) => {
  try {
    const report = await communityService.updateReportStatus(req.params.id, "dismissed");
    res.json({
      success: true,
      message: "Report dismissed",
      data: toCommunityReportResponse(report),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to dismiss report";
    const status = message === "Report not found" ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
};
