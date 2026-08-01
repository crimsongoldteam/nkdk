import { parentPort, workerData } from "node:worker_threads"
import type { ProjectStateReadToken } from "../contracts"
import type { ProjectStateReadSession } from "../readSession"
import { openSqliteProjectStateReadSession } from "./readSession"

const token = workerData.token as ProjectStateReadToken
let session!: ProjectStateReadSession
session = openSqliteProjectStateReadSession(token, workerData.waitForClose === true
  ? {
      onClose: () => {
        let queryRejected = false
        try {
          session.resolveTargets([])
        } catch {
          queryRejected = true
        }
        parentPort?.postMessage({ event: "closed", queryRejected })
      },
    }
  : {})
if (workerData.waitForClose === true) {
  parentPort?.postMessage("opened")
} else {
  const [result] = session.resolveTargets([
    { requestId: "worker", componentPath: "cf", canonicalTarget: "Catalog.Товары" },
  ])
  session.close()
  parentPort?.postMessage(result)
}
