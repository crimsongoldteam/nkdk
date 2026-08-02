import { describe, expect, it, vi } from "vitest"
import type { ProjectStateWriterResponse } from "../writerProtocol"
import {
  acknowledgeWriterCommand,
  createMockWriterTransport,
  type MockWriterTransportOutcome,
} from "./mockWriterTransport"

describe("mock ProjectState writer transport", () => {
  it("записывает перенесённую команду и синхронно возвращает response", () => {
    const received = vi.fn()
    const transport = createMockWriterTransport(acknowledgeWriterCommand)
    transport.on("message", received)
    const hashBytes = new Uint8Array(8)

    transport.postMessage({
      kind: "writeBatch",
      requestId: "write",
      operationId: "operation",
      batch: { updates: [], hashBytes },
    }, [hashBytes.buffer])

    expect(hashBytes.byteLength).toBe(0)
    expect(transport.commands).toEqual([{
      kind: "writeBatch",
      requestId: "write",
      operationId: "operation",
      batch: { updates: [], hashBytes: new Uint8Array(8) },
    }])
    expect(received).toHaveBeenCalledWith({
      kind: "ack",
      requestId: "write",
      result: { kind: "batchWritten", operationId: "operation" },
    })
  })

  it.each([
    ["response", { kind: "ack", requestId: "close", result: { kind: "closed" } } satisfies ProjectStateWriterResponse],
    ["error", { kind: "transportError", error: new Error("worker failed") }],
    ["exit", { kind: "transportExit", code: 86 }],
  ] as const)("управляемым Promise возвращает %s", async (event, outcome) => {
    let resolve!: (value: MockWriterTransportOutcome) => void
    const transport = createMockWriterTransport(() => new Promise((next) => {
      resolve = next
    }))
    const listener = vi.fn()
    if (event === "response") transport.on("message", listener)
    else if (event === "error") transport.on("error", listener)
    else transport.on("exit", listener)
    transport.postMessage({ kind: "close", requestId: "close" })

    resolve(outcome)
    await Promise.resolve()
    await Promise.resolve()

    expect(listener).toHaveBeenCalledWith(
      event === "response" ? outcome : event === "error" ? outcome.error : outcome.code,
    )
  })
})
