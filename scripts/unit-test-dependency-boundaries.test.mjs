import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { findForbiddenUnitTestDependencies } from "./unit-test-dependency-boundaries.mjs"

describe("unit test dependency boundaries", () => {
  test("запрещает внешние импорты обычному unit-тесту", () => {
    const files = [
      { file: "packages/a/read.test.ts", source: 'import fs from "node:fs"' },
      { file: "packages/a/net.test.ts", source: 'import { request } from "node:https"' },
      { file: "packages/a/db.test.ts", source: 'import { open } from "lmdb"' },
      { file: "packages/a/process.test.ts", source: 'import { spawn } from "node:child_process"' },
      { file: "packages/a/worker.test.ts", source: 'import Piscina from "piscina"' },
    ]

    assert.deepEqual(
      findForbiddenUnitTestDependencies(files).map(({ category }) => category),
      ["database", "network", "process", "filesystem", "worker"],
    )
  })

  test("запрещает варианты файловых, сетевых, database и worker зависимостей", () => {
    const files = [
      { file: "packages/a/promises.test.ts", source: 'const fs = await import("node:fs/promises")' },
      { file: "packages/a/fetch.test.ts", source: 'await fetch("https://example.test")' },
      { file: "packages/a/websocket.test.ts", source: 'new WebSocket("wss://example.test")' },
      { file: "packages/a/sqlite.test.ts", source: 'import { DatabaseSync } from "node:sqlite"' },
      { file: "packages/a/ssh.test.ts", source: 'import { Client } from "ssh2"' },
      { file: "packages/a/thread.test.ts", source: 'import { Worker } from "node:worker_threads"' },
    ]

    assert.deepEqual(findForbiddenUnitTestDependencies(files), [
      { file: "packages/a/fetch.test.ts", specifier: "fetch", category: "network" },
      { file: "packages/a/promises.test.ts", specifier: "node:fs/promises", category: "filesystem" },
      { file: "packages/a/sqlite.test.ts", specifier: "node:sqlite", category: "database" },
      { file: "packages/a/ssh.test.ts", specifier: "ssh2", category: "network" },
      { file: "packages/a/thread.test.ts", specifier: "node:worker_threads", category: "worker" },
      { file: "packages/a/websocket.test.ts", specifier: "WebSocket", category: "network" },
    ])
  })

  test("разрешает внешние зависимости интеграционному тесту", () => {
    assert.deepEqual(findForbiddenUnitTestDependencies([
      { file: "packages/a/read.integration.test.ts", source: 'import fs from "node:fs"' },
      { file: "packages/a/net.integration.test.ts", source: 'await fetch("https://example.test")' },
    ]), [])
  })

  test("не принимает строки и локальные функции за внешние зависимости", () => {
    assert.deepEqual(findForbiddenUnitTestDependencies([{
      file: "packages/a/pure.test.ts",
      source: [
        'const example = \'import fs from "node:fs"\'',
        "const fetch = async () => 'memory'",
        "class WebSocket {}",
        "await fetch()",
        "new WebSocket()",
      ].join("\n"),
    }]), [])
  })
})
