import { describe, expect, it } from "vitest"
import {
  closeAllPlatformConnectionsInputShape,
  closeAllPlatformConnectionsOutputShape,
  closePlatformConnectionInputShape,
  closePlatformConnectionOutputShape,
} from "./platformConnections"
import { parseTypeBox } from "./mcpSchema"

describe("platform connection contracts", () => {
  it("accepts one project path without write confirmation", () => {
    expect(parseTypeBox(closePlatformConnectionInputShape, { projectDir: "/project" })).toEqual({
      projectDir: "/project",
    })
    expect(() =>
      parseTypeBox(closePlatformConnectionInputShape, {
        projectDir: "/project",
        allowWrite: true,
      })
    ).toThrow()
  })

  it("accepts an empty close-all input", () => {
    expect(parseTypeBox(closeAllPlatformConnectionsInputShape, {})).toEqual({})
  })

  it("accepts both close result shapes", () => {
    expect(
      parseTypeBox(closePlatformConnectionOutputShape, {
        ok: true,
        closed: true,
        stoppedOwnedProcess: true,
      })
    ).toMatchObject({ ok: true })
    expect(
      parseTypeBox(closeAllPlatformConnectionsOutputShape, {
        ok: true,
        closedCount: 2,
        stoppedOwnedProcesses: 2,
      })
    ).toMatchObject({ ok: true })
  })
})
