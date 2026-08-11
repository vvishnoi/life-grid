"use client";
import { useEffect, useState } from "react";
import type { Approval } from "@/lib/types";
import { USE_MOCKS } from "@/lib/api";
import { MOCK_APPROVALS } from "@/lib/mockData";

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

export function useMissionApprovals(missionId: string) {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!missionId) {
      setLoading(false);
      return;
    }

    if (USE_MOCKS) {
      const t = setTimeout(() => {
        setApprovals(MOCK_APPROVALS);
        setLoading(false);
      }, 350);
      return () => clearTimeout(t);
    }

    const ref = collectionFn(db, "missions", missionId, "approvals");
    // Order by requested_at asc — oldest (most urgent) first
    const q = queryFn(ref, orderByFn("requested_at", "asc"));
    const unsub = onSnapshotFn(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Approval));
      setApprovals(all);
      setLoading(false);
    });
    return unsub;
  }, [missionId]);

  const pendingApprovals = approvals.filter((a) => a.status === "pending");

  return { approvals, pendingApprovals, loading };
}
