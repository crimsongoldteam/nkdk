import { once } from "node:events"
import { Worker } from "node:worker_threads"
import { describe, expect, it } from "vitest"
import { fillSharedBuffer, probeSharedBuffer } from "../index.js"

describe("napi-rs SharedArrayBuffer", () => {
  it("читает и изменяет общий буфер без замены хранилища", () => {
    const shared = new SharedArrayBuffer(8)
    const bytes = new Uint8Array(shared)
    bytes[0] = 7

    expect(probeSharedBuffer(bytes)).toEqual({ byteLength: 8, first: 7 })
    fillSharedBuffer(bytes, 0x2a)

    expect(bytes).toEqual(new Uint8Array(8).fill(0x2a))
    expect(bytes.buffer).toBe(shared)
  })

  it("видит те же байты после изменения в worker_threads", async () => {
    const shared = new SharedArrayBuffer(8)
    const worker = new Worker(new URL("./shared-buffer-worker.mjs", import.meta.url), {
      workerData: shared,
    })

    const [probe] = await once(worker, "message")
    expect(probe).toEqual({ byteLength: 8, first: 0x17 })
    expect(new Uint8Array(shared)).toEqual(new Uint8Array(8).fill(0x17))
    await once(worker, "exit")
  })
})
