import { app } from "electron";
import path from "path";
import fs from "fs";

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

interface StoreSchema {
  entries: TimeEntry[];
  projects: Project[];
}

const defaults: StoreSchema = {
  entries: [],
  projects: [
    { name: "Work", color: "#6c63ff" },
    { name: "Personal", color: "#ff6584" },
    { name: "Learning", color: "#43b581" },
    { name: "Meeting", color: "#faa61a" },
  ],
};

class JsonStore {
  private filePath: string;
  private data: StoreSchema;

  constructor() {
    const userDataPath = app.getPath("userData");
    this.filePath = path.join(userDataPath, "clockify-data.json");
    this.data = this.load();
  }

  private load(): StoreSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        return { ...defaults, ...JSON.parse(raw) };
      }
    } catch {
      // fall through to defaults
    }
    return { ...defaults };
  }

  private save(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      this.filePath,
      JSON.stringify(this.data, null, 2),
      "utf-8"
    );
  }

  get<K extends keyof StoreSchema>(key: K): StoreSchema[K] {
    return this.data[key];
  }

  set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void {
    this.data[key] = value;
    this.save();
  }
}

const store = new JsonStore();
export default store;
