import { parentPort } from "node:worker_threads"
import type { ProjectStateReadToken } from "../contracts"
import type { ProjectStateReadSession } from "../readSession"
import { openSqliteProjectStateReadSession } from "./readSession"

const port = parentPort
if (port === null) throw new Error("SQLite read session test worker requires parentPort")

port.on("message", (command: {
  readonly requestId: number
  readonly token: ProjectStateReadToken
  readonly waitForClose?: boolean
}) => {
  let session!: ProjectStateReadSession
  session = openSqliteProjectStateReadSession(command.token, command.waitForClose === true
    ? {
        onClose: () => {
          let queryRejected = false
          try {
            session.resolveTargets([])
          } catch {
            queryRejected = true
          }
          port.postMessage({
            requestId: command.requestId,
            event: "result",
            value: { event: "closed", queryRejected },
          })
        },
      }
    : {})
  if (command.waitForClose === true) {
    port.postMessage({ requestId: command.requestId, event: "opened" })
    return
  }

  const [result] = session.resolveTargets([
    { requestId: "worker", componentPath: "cf", canonicalTarget: "Catalog.Товары" },
  ])
  session.close()
  port.postMessage({ requestId: command.requestId, event: "result", value: result })
})

port.postMessage({ event: "ready" })
