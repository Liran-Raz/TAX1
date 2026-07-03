import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function readServiceAccount(): ServiceAccount {
  // In production (Vercel), the JSON is provided via a single env var to avoid
  // committing the file. Locally, we read D:\TAX1\firebase-admin.json.
  const envJson = process.env.FIREBASE_ADMIN_JSON;
  if (envJson) {
    return JSON.parse(envJson) as ServiceAccount;
  }
  const filePath = join(process.cwd(), "firebase-admin.json");
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw) as ServiceAccount;
}

function initAdmin(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];
  return initializeApp({ credential: cert(readServiceAccount()) });
}

const adminApp: App = initAdmin();

export const adminAuth: Auth = getAuth(adminApp);
export const adminDb: Firestore = getFirestore(adminApp);
