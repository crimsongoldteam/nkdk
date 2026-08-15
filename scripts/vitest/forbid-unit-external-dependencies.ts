import { vi } from "vitest"
import { forbiddenUnitDependency } from "./forbidden-unit-dependency"

const fullyForbiddenModules = [
  "child_process",
  "fs",
  "fs/promises",
  "http",
  "https",
  "lmdb",
  "net",
  "node:child_process",
  "node:dgram",
  "node:dns",
  "node:fs",
  "node:fs/promises",
  "node:http",
  "node:https",
  "node:net",
  "node:tls",
  "tls",
] as const

for (const moduleName of fullyForbiddenModules) {
  vi.doMock(moduleName, async (importOriginal) => guardModule(
    await importOriginal<Record<string, unknown>>(),
    moduleName,
  ))
}

vi.doMock("node:worker_threads", async (importOriginal) => ({
  ...await importOriginal<Record<string, unknown>>(),
  Worker: forbiddenClass("node:worker_threads.Worker"),
}))

vi.doMock("worker_threads", async (importOriginal) => ({
  ...await importOriginal<Record<string, unknown>>(),
  Worker: forbiddenClass("worker_threads.Worker"),
}))

vi.doMock("node:sqlite", async (importOriginal) => ({
  ...await importOriginal<Record<string, unknown>>(),
  DatabaseSync: forbiddenClass("node:sqlite.DatabaseSync"),
}))

vi.doMock("piscina", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    default: forbiddenClass("piscina.Piscina"),
  }
})

vi.doMock("ssh2", async (importOriginal) => ({
  ...await importOriginal<Record<string, unknown>>(),
  Client: forbiddenClass("ssh2.Client"),
}))

vi.stubGlobal("fetch", forbiddenUnitDependency("fetch"))
vi.stubGlobal("WebSocket", forbiddenClass("WebSocket"))

function guardModule(actual: Record<string, unknown>, moduleName: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(actual).map(([name, value]) => [
    name,
    guardValue(value, `${moduleName}.${name}`),
  ]))
}

function guardValue(value: unknown, name: string): unknown {
  if (typeof value === "function") return forbiddenUnitDependency(name)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(Object.entries(value).map(([childName, child]) => [
    childName,
    typeof child === "function" ? forbiddenUnitDependency(`${name}.${childName}`) : child,
  ]))
}

function forbiddenClass(name: string): new (...args: unknown[]) => never {
  return class {
    constructor(..._args: unknown[]) {
      forbiddenUnitDependency(name)()
    }
  } as new (...args: unknown[]) => never
}
