export interface TimeEntry {
  id: string;
  description: string;
  project: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  taskId?: string;
}

export interface Project {
  name: string;
  color: string;
}

export interface SprintTask {
  name: string;
  subject: string;
  status: string;
  priority: string;
  sprint_assign: string;
  project: string;
  project_name: string;
  module: string;
  sprint_points: number;
  current_assignee: string;
  dev_assignee: string;
  dev_assignee_name: string;
  qa_assignee: string;
  tech_assignee: string;
  tech_assignee_name: string;
  product_owner: string;
  project_manager: string;
  type: string;
  devops_status: string;
  code_review_status: string;
  date_assigned: string;
  exp_start_date: string;
  exp_end_date: string;
  completed_by: string;
  completed_on: string;
  product_backlogs: string;
  parent_task: string;
  modified: string;
  creation: string;
}

export type View = "tasks" | "history" | "reports";

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
