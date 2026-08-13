import { describe, expect, it } from "vitest"
import {
  closeAllPlatformConnections,
  closePlatformConnection,
  type PlatformConnectionsDependencies,
} from "./platformConnections"

describe("platform connection services", () => {
  it("closes one project connection", async () => {
    const dependencies = fakeDependencies()

    await expect(closePlatformConnection({ projectDir: "/project" }, dependencies)).resolves.toEqual({
      ok: true,
      closed: true,
      stoppedOwnedProcess: true,
    })
  })

  it("closes every cached connection", async () => {
    const dependencies = fakeDependencies()

    await expect(closeAllPlatformConnections(dependencies)).resolves.toEqual({
      ok: true,
      closedCount: 2,
      stoppedOwnedProcesses: 2,
    })
  })

  it("maps an unexpected close error without exposing its text", async () => {
    const dependencies = fakeDependencies()
    dependencies.manager.closeConnection = async () => {
      throw new Error("secret")
    }

    const result = await closePlatformConnection({ projectDir: "/project" }, dependencies)

    expect(result).toMatchObject({ ok: false, code: "core_error" })
    expect(JSON.stringify(result)).not.toContain("secret")
  })
})

function fakeDependencies(): PlatformConnectionsDependencies {
  return {
    manager: {
      async exportConfiguration() {
        return { mode: "designer-agent", reusedConnection: false }
      },
      async listExtensions() {
        return {
          extensions: [],
          mode: "designer-agent",
          reusedConnection: false,
        }
      },
      async loadPartialConfiguration() {
        throw new Error("not used")
      },
      async closeConnection() {
        return { closed: true, stoppedOwnedProcess: true }
      },
      async closeAllConnections() {
        return { closedCount: 2, stoppedOwnedProcesses: 2 }
      },
    },
  }
}
