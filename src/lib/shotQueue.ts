// Lightweight IndexedDB queue so captured shots survive bad networks / reloads.
import { supabase } from "@/integrations/supabase/client";

export interface QueuedShot {
  id: string; // client_capture_id
  eventId: string;
  guestId: string;
  token: string;
  blob: Blob;
  ext: string;
  mediaType: string;
  width?: number;
  height?: number;
}

const DB = "pov-shots";
const STORE = "queue";

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((res, rej) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export const enqueue = (s: QueuedShot) => tx("readwrite", (st) => st.put(s)).catch(() => undefined);
export const dequeue = (id: string) => tx("readwrite", (st) => st.delete(id)).catch(() => undefined);
export const pending = (guestId: string) =>
  tx<QueuedShot[]>("readonly", (st) => st.getAll()).then((all) => all.filter((s) => s.guestId === guestId)).catch(() => []);

export type UploadResult = { ok: boolean; remaining?: number; fatal?: boolean; reason?: string };

/** Upload file then atomically register the shot server-side. Safe to retry (dedup by capture id). */
export async function uploadShot(s: QueuedShot): Promise<UploadResult> {
  const path = `${s.eventId}/${s.guestId}/${s.id}.${s.ext}`;
  const up = await supabase.storage.from("event-photos").upload(path, s.blob, { contentType: s.blob.type, upsert: false });
  if (up.error && !/exists|Duplicate/i.test(up.error.message)) {
    const fatal = /row-level security|Unauthorized|403/i.test(up.error.message);
    return { ok: false, fatal, reason: fatal ? "camera_empty" : "network" };
  }
  const { data, error } = await supabase.rpc("register_shot", {
    _guest_id: s.guestId, _session_token: s.token, _storage_path: path,
    _media_type: s.mediaType, _client_capture_id: s.id, _width: s.width ?? null, _height: s.height ?? null,
  } as any);
  if (error) {
    const m = error.message || "";
    const fatal = /camera_empty|event_closed|invalid_session|invalid_path/.test(m);
    return { ok: false, fatal, reason: m.match(/camera_empty|event_closed|invalid_session|invalid_path/)?.[0] || "network" };
  }
  return { ok: true, remaining: data as number };
}
