"use client";
import { useEffect, useState } from "react";
import type { Task } from "@/lib/types";
import { USE_MOCKS } from "@/lib/api";
import { MOCK_TASKS } from "@/lib/mockData";

let collectionFn: typeof import("firebase/firestore").collection;
let onSnapshotFn: typeof import("firebase/firestore").onSnapshot;
let queryFn: typeof import("firebase/firestore").query;
let orderByFn: typeof import("firebase/firestore").orderBy;
let db: import("@firebase/firestore").Firestore;

if (!USE_MOCKS) {
  const firestore = require("firebase/firestore");
  const firebaseLib = require("@/lib/firebase");
  collectionFn = firestore.collection;
  onSnapshotFn = firestore.onSnapshot;
  queryFn = firestore.query;
  orderByFn = firestore.orderBy;
  db = firebaseLib.db;
}

export function useMissionTasks(missionId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!missionId) {
      setLoading(false);
      return;
    }

    if (USE_MOCKS) {
      const t = setTimeout(() => {
        setTasks(MOCK_TASKS);
        setLoading(false);
      }, 400);
      return () => clearTimeout(t);
    }

    const ref = collectionFn(db, "missions", missionId, "tasks");
    const q = queryFn(ref, orderByFn("updated_at", "desc"));
    const unsub = onSnapshotFn(q, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task)));
      setLoading(false);
    });
    return unsub;
  }, [missionId]);

  return { tasks, loading };
}
