import { ProjectStateSnapshotView, type ProjectStateSharedBuffers } from "./snapshot"

export interface BinaryProjectStateReadToken {
  readonly claim: SharedArrayBuffer
  readonly buffers: ProjectStateSharedBuffers
}

export function createBinaryProjectStateReadToken(
  buffers: ProjectStateSharedBuffers,
): BinaryProjectStateReadToken {
  new ProjectStateSnapshotView(buffers)
  return { claim: new SharedArrayBuffer(4), buffers }
}

export function cloneBinaryProjectStateReadToken(
  token: BinaryProjectStateReadToken,
): BinaryProjectStateReadToken {
  assertBinaryProjectStateReadToken(token)
  if (Atomics.load(new Int32Array(token.claim), 0) !== 0) {
    throw new Error("Token чтения двоичного состояния уже использован")
  }
  return { claim: new SharedArrayBuffer(4), buffers: token.buffers }
}

export function claimBinaryProjectStateReadToken(
  token: BinaryProjectStateReadToken,
): ProjectStateSharedBuffers {
  assertBinaryProjectStateReadToken(token)
  if (Atomics.compareExchange(new Int32Array(token.claim), 0, 0, 1) !== 0) {
    throw new Error("Token чтения двоичного состояния уже использован")
  }
  return token.buffers
}

function assertBinaryProjectStateReadToken(token: BinaryProjectStateReadToken): void {
  if (typeof token !== "object" || token === null || Array.isArray(token)) {
    throw new Error("Некорректный token чтения двоичного состояния")
  }
  const keys = Object.keys(token).sort()
  if (keys.join(",") !== "buffers,claim" || !(token.claim instanceof SharedArrayBuffer) || token.claim.byteLength !== 4) {
    throw new Error("Некорректный token чтения двоичного состояния")
  }
  new ProjectStateSnapshotView(token.buffers)
}
