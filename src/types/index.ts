export interface TimeEntry {
  id: string;
  description: string;
  project: string;
  startTime: string;
  endTime: string | null;
  duration: number;
}

export interface Project {
  name: string;
  color: string;
}

export type View = "timer" | "history" | "reports";

export interface UserInfo {
  fullName: string;
  email: string;
  avatar: string | null;
}

export function parseUserFromCookie(cookie: string): UserInfo | null {
  const get = (key: string) => {
    const m = cookie.match(new RegExp(`(?:^|;\\s*)${key}=([^;]*)`));
    return m ? decodeURIComponent(m[1]).trim() : "";
  };

  const fullName = get("full_name");
  const email = get("user_id");
  if (!fullName || !email || fullName === "Guest" || email === "Guest")
    return null;

  const avatar = get("user_image") || null;
  return { fullName, email, avatar };
}
