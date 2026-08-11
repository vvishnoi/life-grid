"use client";
import { useEffect, useState } from "react";
import type { Mission } from "@/lib/types";
import { USE_MOCKS } from "@/lib/api";
import { MOCK_MISSION } from "@/lib/mockData";

// Firestore imports only resolved when USE_MOCKS is false
let docFn: typeof import("firebase/firestore").doc;
let onSnapshotFn: typeof import("firebase/firestore").onSnapshot;
let db: import("@firebase/firestore").Firestore;

if (!USE_MOCKS) {
  // Dynamic require so the firebase bundle isn't loaded during mock usage
  // (Next.js handles this at build time via tree-shaking when USE_MOCKS is true)
  const firestore = require("firebase/firestore");
  const firebaseLib = require("@/lib/firebase");
  docFn = firestore.doc;
  onSnapshotFn = firestore.onSnapshot;
  db = firebaseLib.db;
}

export function useMission(missionId: string) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!missionId) {
      setLoading(false);
      return;
    }

    if (USE_MOCKS) {
      // Small delay to simulate a network round-trip so skeleton is visible
      const t = setTimeout(() => {
        setMission({ ...MOCK_MISSION, id: missionId });
        setLoading(false);
      }, 300);
      return () => clearTimeout(t);
    }

    setLoading(true);
    const ref = docFn(db, "missions", missionId);
    const unsub = onSnapshotFn(
      ref,
      (snap) => {
        if (snap.exists()) {
          setMission({ id: snap.id, ...snap.data() } as Mission);
        } else {
          setMission(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [missionId]);

  return { mission, loading, error };
}
