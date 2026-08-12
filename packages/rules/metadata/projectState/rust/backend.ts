import { createBinaryProjectStateStore } from "../binary/store"
import { openBinaryProjectStateReadSession } from "../binary/readSession"
import type { ProjectStateBackend } from "../backend"
import { openRustProjectStateReadSession } from "./readSession"
import { createRustProjectStateStore } from "./store"

export const typescriptProjectStateBackend: ProjectStateBackend = {
  kind: "typescript",
  async openStore(params) {
    return createBinaryProjectStateStore(params).store
  },
  openReadSession: openBinaryProjectStateReadSession,
}

export const rustProjectStateBackend: ProjectStateBackend = {
  kind: "rust",
  async openStore(params) {
    return createRustProjectStateStore(params)
  },
  openReadSession: openRustProjectStateReadSession,
}
