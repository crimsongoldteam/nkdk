import { describe, expect, it } from "vitest"
import {
  closePlatformSessionManager,
  getPlatformSessionManager,
  setPlatformSessionManagerFactoryForTests,
} from "./platformSessionHandle"

describe("platform session process handle", () => {
  it("creates one manager lazily and resets it after close", async () => {
    let created = 0
    let closed = 0
    const restore = setPlatformSessionManagerFactoryForTests(() => {
      created += 1
      return {
        async exportConfiguration() {
          return { mode: "designer-agent", reusedConnection: false }
        },
        async closeConnection() {
          return { closed: false, stoppedOwnedProcess: false }
        },
        async closeAllConnections() {
          closed += 1
          return { closedCount: 0, stoppedOwnedProcesses: 0 }
        },
      }
    })
    try {
      expect(getPlatformSessionManager()).toBe(getPlatformSessionManager())
      expect(created).toBe(1)
      await expect(closePlatformSessionManager()).resolves.toEqual({
        closedCount: 0,
        stoppedOwnedProcesses: 0,
      })
      expect(closed).toBe(1)
      getPlatformSessionManager()
      expect(created).toBe(2)
    } finally {
      await closePlatformSessionManager()
      restore()
    }
  })

  it("returns zero counts before a manager is requested", async () => {
    const restore = setPlatformSessionManagerFactoryForTests(() => {
      throw new Error("must not create")
    })
    try {
      await expect(closePlatformSessionManager()).resolves.toEqual({
        closedCount: 0,
        stoppedOwnedProcesses: 0,
      })
    } finally {
      restore()
    }
  })
})
