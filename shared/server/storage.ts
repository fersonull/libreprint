import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

export function getUploadsDir(): string {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  return UPLOADS_DIR;
}

export async function saveFile(
  fileId: string,
  originalName: string,
  buffer: ArrayBuffer | Buffer
): Promise<{ fileName: string; filePath: string }> {
  const dir = getUploadsDir();
  const ext = path.extname(originalName) || ".bin";
  const storedFileName = `${fileId}${ext}`;
  const fullPath = path.join(dir, storedFileName);

  const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  await fsPromises.writeFile(fullPath, nodeBuffer);

  return {
    fileName: storedFileName,
    filePath: fullPath,
  };
}

export function getFilePath(storedFileName: string): string | null {
  const fullPath = path.join(getUploadsDir(), storedFileName);
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }
  return null;
}

export async function deleteFile(storedFileName: string): Promise<boolean> {
  const fullPath = path.join(getUploadsDir(), storedFileName);
  try {
    if (fs.existsSync(fullPath)) {
      await fsPromises.unlink(fullPath);
      return true;
    }
  } catch (err) {
    console.error("Failed to delete file:", err);
  }
  return false;
}
