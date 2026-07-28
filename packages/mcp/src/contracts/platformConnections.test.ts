import { describe, expect, it } from "vitest"
import { z } from "zod/v4"
import {
  closeAllPlatformConnectionsInputShape,
  closeAllPlatformConnectionsOutputShape,
  closePlatformConnectionInputShape,
  closePlatformConnectionOutputShape,
} from "./platformConnections"

describe("platform connection contracts", () => {
  it("accepts one project path without write confirmation", () => {
    expect(z.strictObject(closePlatformConnectionInputShape).parse({ projectDir: "/project" })).toEqual({
      projectDir: "/project",
    })
    expect(() =>
      z.strictObject(closePlatformConnectionInputShape).parse({
        projectDir: "/project",
        allowWrite: true,
      })
    ).toThrow()
  })

  it("accepts an empty close-all input", () => {
    expect(z.strictObject(closeAllPlatformConnectionsInputShape).parse({})).toEqual({})
  })

  it("accepts both close result shapes", () => {
    expect(
      closePlatformConnectionOutputShape.parse({
        ok: true,
        closed: true,
        stoppedOwnedProcess: true,
      })
    ).toMatchObject({ ok: true })
    expect(
      closeAllPlatformConnectionsOutputShape.parse({
        ok: true,
        closedCount: 2,
        stoppedOwnedProcesses: 2,
      })
    ).toMatchObject({ ok: true })
  })
})
