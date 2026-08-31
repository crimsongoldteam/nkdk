import assert from "node:assert/strict"
import test from "node:test"
import {
  callMcpToolToCompletion,
  callToolWithoutPracticalLimit,
  MCP_CALL_TIMEOUT_MS,
} from "./call.mjs"

const timestamp = "2026-09-01T00:00:00.000Z"

function accepted(operationId = "op-1") {
  return response({
    ok: true,
    status: "accepted",
    operationId,
    operationKind: "import_from_xml",
    projectDir: "/project",
  })
}

function snapshot(status, extra = {}) {
  return response({
    ok: true,
    status,
    operationId: "op-1",
    operationKind: "import_from_xml",
    projectDir: "/project",
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: [],
    ...extra,
  })
}

function response(payload, result = {}) {
  return {
    result: { isError: false, structuredContent: payload, ...result },
    payload,
  }
}

function scriptedSession(responses) {
  const calls = []
  return {
    calls,
    async call(toolName, args) {
      calls.push({ toolName, args })
      const next = responses.shift()
      if (next instanceof Error) throw next
      assert.notEqual(next, undefined, `unexpected call ${toolName}`)
      return next
    },
  }
}

test("передаёт тайм-аут в современном втором аргументе MCP client", async () => {
  const calls = []
  const client = {
    callTool(...args) {
      calls.push(args)
      return Promise.resolve({ isError: false })
    },
  }
  const request = { name: "nkdk.import_from_xml", arguments: {} }

  await callToolWithoutPracticalLimit(client, request)

  assert.deepEqual(calls, [[request, { timeout: MCP_CALL_TIMEOUT_MS }]])
})

test("ждёт accepted до succeeded и возвращает вложенный result", async () => {
  const session = scriptedSession([
    accepted(),
    snapshot("queued"),
    snapshot("running"),
    snapshot("succeeded", { result: { ok: true, succeeded: 3, failed: [] } }),
  ])

  const completed = await callMcpToolToCompletion(
    session,
    "nkdk.import_from_xml",
    { projectDir: "/project" },
    { wait: async () => undefined }
  )

  assert.deepEqual(completed.payload, { ok: true, succeeded: 3, failed: [] })
  assert.deepEqual(session.calls.map(({ toolName }) => toolName), [
    "nkdk.import_from_xml",
    "nkdk.get_operation",
    "nkdk.get_operation",
    "nkdk.get_operation",
  ])
  assert.deepEqual(session.calls[1].args, { projectDir: "/project", operationId: "op-1" })
})

test("возвращает обычный синхронный результат без опроса", async () => {
  const direct = response({ ok: true, value: 7 })
  const session = scriptedSession([direct])

  const completed = await callMcpToolToCompletion(session, "nkdk.get_schema", {})

  assert.equal(completed, direct)
  assert.equal(session.calls.length, 1)
})

for (const [status, extra, expected] of [
  ["failed", { error: { code: "worker_failed", message: "worker stopped" } }, /op-1.*failed.*worker_failed/u],
  ["cancelled", {}, /op-1.*cancelled/u],
  ["interrupted", {}, /op-1.*interrupted/u],
]) {
  test(`завершает ${status} ошибкой с идентификатором операции`, async () => {
    const session = scriptedSession([accepted(), snapshot(status, extra)])

    await assert.rejects(
      callMcpToolToCompletion(session, "nkdk.import_from_xml", {}, { wait: async () => undefined }),
      expected
    )
  })
}

test("отклоняет некорректный снимок операции", async () => {
  const session = scriptedSession([
    accepted(),
    response({ ok: true, status: "running", operationId: "other", projectDir: "/project" }),
  ])

  await assert.rejects(
    callMcpToolToCompletion(session, "nkdk.import_from_xml", {}, { wait: async () => undefined }),
    /malformed.*op-1/u
  )
})

test("проверяет вложенный результат succeeded", async () => {
  const okFalse = scriptedSession([
    accepted(),
    snapshot("succeeded", { result: { ok: false, code: "write", message: "EACCES" } }),
  ])
  await assert.rejects(
    callMcpToolToCompletion(okFalse, "nkdk.import_from_xml", {}, { wait: async () => undefined }),
    /ok=false.*write/u
  )

  const invalidFailure = scriptedSession([
    accepted(),
    snapshot("succeeded", { result: { ok: true, failed: [{ code: "write", message: "EACCES" }] } }),
  ])
  await assert.rejects(
    callMcpToolToCompletion(invalidFailure, "nkdk.import_from_xml", {}, { wait: async () => undefined }),
    /operation failure/u
  )

  const validationOnly = scriptedSession([
    accepted(),
    snapshot("succeeded", {
      result: { ok: true, failed: [{ code: "project_validation", message: "invalid" }] },
    }),
  ])
  const completed = await callMcpToolToCompletion(
    validationOnly,
    "nkdk.import_from_xml",
    {},
    { wait: async () => undefined }
  )
  assert.equal(completed.payload.ok, true)
})

test("не маскирует закрытие транспорта во время ожидания", async () => {
  const session = scriptedSession([accepted(), new Error("transport closed")])

  await assert.rejects(
    callMcpToolToCompletion(session, "nkdk.import_from_xml", {}, { wait: async () => undefined }),
    /transport closed/u
  )
})

test("при отмене один раз запрашивает cancel и ограниченно ждёт terminal snapshot", async () => {
  const controller = new AbortController()
  const session = scriptedSession([
    accepted(),
    snapshot("running"),
    response({ ok: true, status: "cancellation_requested", operationId: "op-1", projectDir: "/project" }),
    snapshot("cancelled"),
  ])
  const waits = []

  await assert.rejects(
    callMcpToolToCompletion(session, "nkdk.import_from_xml", {}, {
      signal: controller.signal,
      wait: async (delay) => {
        waits.push(delay)
        controller.abort(new Error("stop"))
      },
    }),
    /stop/u
  )

  assert.deepEqual(session.calls.map(({ toolName }) => toolName), [
    "nkdk.import_from_xml",
    "nkdk.get_operation",
    "nkdk.cancel_operation",
    "nkdk.get_operation",
  ])
  assert.deepEqual(waits, [100])
})
