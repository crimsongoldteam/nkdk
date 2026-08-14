import { mkdtemp, readFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { describe, expect, it } from "vitest"
import {
  adaptMcpModule,
  openScenarioMcpSession,
  type LowLevelMcpSession,
} from "./mcp-session"

describe("partial sync MCP session", () => {
  it("starts the compiled MCP server with packaged workers", async () => {
    let received: unknown
    const lowLevel = fakeLowLevel([])
    const createSession = adaptMcpModule({
      async createMcpToolSession(options: unknown) {
        received = options
        return lowLevel
      },
    })

    await expect(createSession()).resolves.toBe(lowLevel)
    expect(received).toEqual({ serverMode: "compiled" })
  })

  it("keeps one session and logs every request, response and stderr", async () => {
    const attemptLogDir = await mkdtemp(join(tmpdir(), "nkdk-mcp-session-"))
    const lowLevel = fakeLowLevel([
      { result: { content: [{ type: "text", text: "ok" }] }, payload: { ok: true, value: 1 } },
      { result: { content: [{ type: "text", text: "ok" }] }, payload: { ok: true, value: 2 } },
    ])
    const session = await openScenarioMcpSession({
      attemptLogDir,
      createSession: async () => lowLevel,
    })

    await expect(session.call("nkdk.validate_project", { projectDir: "/project" }))
      .resolves.toEqual({ ok: true, value: 1 })
    await expect(session.call("nkdk.sync_to_infobase", { projectDir: "/project" }))
      .resolves.toEqual({ ok: true, value: 2 })
    await session.close()

    await expect(readJson(join(
      attemptLogDir,
      "001-nkdk.validate_project.request.json"
    ))).resolves.toEqual({
      name: "nkdk.validate_project",
      arguments: { projectDir: "/project" },
    })
    await expect(readJson(join(
      attemptLogDir,
      "001-nkdk.validate_project.response.json"
    ))).resolves.toMatchObject({ payload: { ok: true, value: 1 } })
    await expect(readFile(join(
      attemptLogDir,
      "001-nkdk.validate_project.server.stderr.log"
    ), "utf8")).resolves.toBe("stderr 1\n")
    expect(lowLevel.closeCalls).toBe(1)
  })

  it.each([
    ["tool payload", { result: { content: [] }, payload: { ok: false, code: "invalid", message: "bad" } }],
    ["MCP error", { result: { isError: true, content: [{ type: "text", text: "bad" }] }, payload: undefined }],
  ])("throws for a %s and preserves the response", async (_name, response) => {
    const attemptLogDir = await mkdtemp(join(tmpdir(), "nkdk-mcp-session-failure-"))
    const session = await openScenarioMcpSession({
      attemptLogDir,
      createSession: async () => fakeLowLevel([response]),
    })
    const responsePath = join(
      attemptLogDir,
      "001-nkdk.validate_project.response.json"
    )

    await expect(session.call("nkdk.validate_project", {})).rejects.toThrow(
      `nkdk.validate_project: ${responsePath}`
    )

    await expect(readJson(responsePath)).resolves.toMatchObject({ result: response.result })
  })
})

function fakeLowLevel(responses: Array<Awaited<ReturnType<LowLevelMcpSession["call"]>>>) {
  let index = 0
  let stderrIndex = 0
  return {
    closeCalls: 0,
    async call() {
      const response = responses[index]
      index += 1
      if (response === undefined) throw new Error("missing fake response")
      return response
    },
    takeStderr() {
      stderrIndex += 1
      return `stderr ${stderrIndex}\n`
    },
    async close() {
      this.closeCalls += 1
    },
  }
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"))
}
