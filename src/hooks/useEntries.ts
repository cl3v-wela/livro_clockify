import { useState, useEffect, useCallback } from "react";
import type { TimeEntry, Project } from "../types";
import * as ipc from "../lib/ipc";

export function useEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [fetchedEntries, fetchedProjects] = await Promise.all([
        ipc.getEntries(),
        ipc.getProjects(),
      ]);
      setEntries(fetchedEntries);
      setProjects(fetchedProjects);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addEntry = useCallback(async (entry: TimeEntry) => {
    const created = await ipc.createEntry(entry);
    setEntries((prev) => [created, ...prev]);
    return created;
  }, []);

  const editEntry = useCallback(async (entry: TimeEntry) => {
    const updated = await ipc.updateEntry(entry);
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    return updated;
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    await ipc.deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addProject = useCallback(async (project: Project) => {
    const created = await ipc.createProject(project);
    setProjects((prev) => [...prev, created]);
    return created;
  }, []);

  return {
    entries,
    projects,
    loading,
    addEntry,
    editEntry,
    removeEntry,
    addProject,
    reload: loadData,
  };
}
