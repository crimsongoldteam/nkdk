import { parentPort, workerData } from "node:worker_threads"
import type { ProjectStateReadToken } from "../contracts"
import { openSqliteProjectStateReadSession } from "./readSession"

const token = workerData.token as ProjectStateReadToken
const session = openSqliteProjectStateReadSession(token)
const [result] = session.resolveTargets([
  { requestId: "worker", componentPath: "cf", canonicalTarget: "Catalog.Товары" },
])
session.close()
parentPort?.postMessage(result)
