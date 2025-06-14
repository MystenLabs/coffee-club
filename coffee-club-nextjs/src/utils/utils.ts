import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// import { format, isToday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Formats a timestamp differently depending on whether it's from today or not.
 * If the date is today, formats as "HH:mm" (e.g., "14:30").
 * If the date is not today, formats as "MMM d, yyyy" (e.g., "Mar 27, 2025").
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
// export const formatDatetime = (timestamp: number): string => {
//   const date = new Date(timestamp);

//   if (isToday(date)) {
//     return format(date, "HH:mm");
//   } else {
//     return format(date, "MMM d, yyyy");
//   }
// };

type FileType = "image" | "file";

/**
 * Parses a filename and returns its general type ("image" or "file") based on the extension.
 *
 * @param filename The name of the file.
 * @returns "image" if the extension is a common image format, "file" otherwise.
 */
export function getFileTypeFromFilename(filename: string): FileType | null {
  if (!filename || typeof filename !== "string") {
    return null;
  }

  const parts = filename.split(".");
  if (parts.length < 2) {
    return null; // No extension
  }

  const extension = parts.pop()!.toLowerCase(); // Get the last part and convert to lowercase

  const imageExtensions = new Set([
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    "svg",
    "tiff",
    "tif",
    "ico",
  ]);

  if (imageExtensions.has(extension)) {
    return "image";
  } else {
    return "file";
  }
}
