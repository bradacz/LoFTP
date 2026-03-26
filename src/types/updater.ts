export interface UpdaterStatus {
  configured: boolean;
  currentVersion: string;
  endpoint: string;
}

export interface AvailableUpdate {
  version: string;
  currentVersion: string;
  date?: string | null;
  body?: string | null;
}

export type UpdaterInstallEvent =
  | { event: "started"; data: { contentLength?: number | null } }
  | { event: "progress"; data: { chunkLength: number } }
  | { event: "finished"; data: null };
