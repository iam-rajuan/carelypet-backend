import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execFile } from "child_process";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";

export interface OptimizedMedia {
  buffer: Buffer;
  mimeType: string;
  originalSize: number;
  optimizedSize: number;
}

const IMAGE_MAX_DIMENSION = 1920;
const IMAGE_QUALITY = 78;

const runExecFile = (file: string, args: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    execFile(file, args, { windowsHide: true }, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

const optimizeImage = async (buffer: Buffer, mimeType: string): Promise<OptimizedMedia> => {
  const optimized = await sharp(buffer)
    .rotate()
    .resize({
      width: IMAGE_MAX_DIMENSION,
      height: IMAGE_MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: IMAGE_QUALITY, effort: 4 })
    .toBuffer();

  if (optimized.length >= buffer.length) {
    return {
      buffer,
      mimeType,
      originalSize: buffer.length,
      optimizedSize: buffer.length,
    };
  }

  return {
    buffer: optimized,
    mimeType: "image/webp",
    originalSize: buffer.length,
    optimizedSize: optimized.length,
  };
};

const optimizeVideo = async (buffer: Buffer, mimeType: string): Promise<OptimizedMedia> => {
  if (!ffmpegPath) {
    return {
      buffer,
      mimeType,
      originalSize: buffer.length,
      optimizedSize: buffer.length,
    };
  }

  const dir = await fs.mkdtemp(join(tmpdir(), "carelypet-video-"));
  const input = join(dir, "input");
  const output = join(dir, "output.mp4");

  try {
    await fs.writeFile(input, buffer);
    await runExecFile(ffmpegPath, [
      "-y",
      "-i",
      input,
      "-vf",
      "scale=min(1280\\,iw):-2",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "28",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      output,
    ]);

    const optimized = await fs.readFile(output);
    if (optimized.length === 0 || optimized.length >= buffer.length) {
      return {
        buffer,
        mimeType,
        originalSize: buffer.length,
        optimizedSize: buffer.length,
      };
    }

    return {
      buffer: optimized,
      mimeType: "video/mp4",
      originalSize: buffer.length,
      optimizedSize: optimized.length,
    };
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
};

export const optimizeMediaForUpload = async (
  buffer: Buffer,
  mimeType: string
): Promise<OptimizedMedia> => {
  if (mimeType.startsWith("image/")) {
    return optimizeImage(buffer, mimeType);
  }

  if (mimeType.startsWith("video/")) {
    return optimizeVideo(buffer, mimeType);
  }

  return {
    buffer,
    mimeType,
    originalSize: buffer.length,
    optimizedSize: buffer.length,
  };
};
