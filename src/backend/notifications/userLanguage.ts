import { getClerkUserLanguageByEmail } from "@/backend/intake/repository";

/**
 * 获取用户语言偏好，找不到则返回 'en'。
 */
export async function getUserLanguageByEmail(email: string): Promise<"zh" | "en"> {
  const language = await getClerkUserLanguageByEmail(email);
  return language ?? "en";
}
