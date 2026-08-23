import assert from "node:assert/strict"
import test from "node:test"
import { callToolWithoutPracticalLimit, MCP_CALL_TIMEOUT_MS } from "./call.mjs"

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
