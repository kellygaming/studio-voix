import type { Cut, Word } from "./cuts";

export type ProjectStatus = "recording" | "uploaded" | "processing" | "ready" | "error";

export type Project = {
  id: string;
  user_id: string;
  title: string;
  template: "podcast" | "cours" | "note" | "libre";
  status: ProjectStatus;
  duration_seconds: number | null;
  raw_path: string | null;
  clean_path: string | null;
  preview_path: string | null;
  peaks: number[] | null;
  export_path: string | null;
  words: Word[] | null;
  live_transcript: string | null;
  created_at: string;
};

export type CutRow = Cut & { project_id: string; created_at?: string };

export type JobType = "process" | "export";
export type JobStatus = "queued" | "running" | "done" | "error";

export type Job = {
  id: string;
  project_id: string;
  user_id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  step: string | null;
  error: string | null;
  created_at: string;
};

export const AUDIO_BUCKET = "audio";
