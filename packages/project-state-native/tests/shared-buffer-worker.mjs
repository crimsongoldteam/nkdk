import { parentPort, workerData } from "node:worker_threads"
import { fillSharedBuffer, probeSharedBuffer } from "../index.js"

const bytes = new Uint8Array(workerData)
fillSharedBuffer(bytes, 0x17)
parentPort.postMessage(probeSharedBuffer(bytes))
