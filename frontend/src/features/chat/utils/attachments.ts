import { CHAT_MAX_ATTACHMENTS, CHAT_MAX_FILE_SIZE_BYTES } from '../config';

export const filterValidAttachments = (files: File[], limit = CHAT_MAX_ATTACHMENTS): File[] => {
  const seen = new Set<string>();
  const valid: File[] = [];

  for (const file of files) {
    if (file.size > CHAT_MAX_FILE_SIZE_BYTES) continue;

    const key = `${file.name}-${file.size}-${file.type}`;
    if (seen.has(key)) continue;
    seen.add(key);

    valid.push(file);
    if (valid.length >= limit) break;
  }

  return valid;
};

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });


