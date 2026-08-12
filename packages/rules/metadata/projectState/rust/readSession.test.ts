import { describe, expect, it } from "vitest"
import { createProjectStateDependencyValidator } from "../../validation/projectStateDependencyValidation"
import { createBinaryProjectStateQueryPort } from "../binary/readSession"
import { createBinaryProjectStateStore } from "../binary/store"
import { createProjectStateFragmentWriter } from "../binary/fragment"
import { richYamlUpdate } from "../binary/testData"
import { createTypedProjectStateReader } from "../binary/typedReader"
import { openRustProjectStateReader } from "./addon"
import { openRustProjectStateReadSession } from "./readSession"

describe("Rust ProjectState read session", () => {
  it("разрешает цели в Rust и сохраняет подробности цели", () => {
    const base = richYamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары")
    const update = {
      ...base,
      targets: [{ ...base.targets[0]!, details: { kind: "attribute" as const } }],
    }
    const { store, validator } = publishedStore(update)
    const session = openRustProjectStateReadSession(store.createReadToken(), validator)
    expect(session.resolveTargets([{
      requestId: "target",
      componentPath: "cf",
      canonicalTarget: "Catalog.Товары",
    }])).toEqual([{
      requestId: "target",
      status: "found",
      target: {
        kind: "object",
        canonical: "Catalog.Товары",
        details: { kind: "attribute" },
      },
      source: { projectPath: "cf/Товары.yaml", componentPath: "cf" },
    }])
    session.close()
    store.close()
  })

  it("явно делегирует пока не перенесённое чтение владельцев TypeScript", () => {
    const update = richYamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары")
    const { store, validator } = publishedStore(update)
    const session = openRustProjectStateReadSession(store.createReadToken(), validator)
    expect(session.readOwners([{
      requestId: "owner",
      componentPath: "cf",
      owner: update.owners[0]!.owner,
    }])).toMatchObject([{ requestId: "owner", status: "found" }])
    session.close()
    store.close()
  })

  it("один раз разрешает повторяющуюся цель через Rust", () => {
    const update = richYamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары")
    const { store, validator } = publishedStore(update)
    let executeCalls = 0
    let typedReaderCalls = 0
    let cacheKeyCalls = 0
    let createdTypedReader: ReturnType<typeof createTypedProjectStateReader> | undefined
    let fallbackTypedReader: ReturnType<typeof createTypedProjectStateReader> | undefined
    const requestCounts: number[] = []
    const session = openRustProjectStateReadSession(store.createReadToken(), validator, {
      openReader(sections) {
        const reader = openRustProjectStateReader(sections)
        return {
          stats: () => reader.stats(),
          filePaths: () => reader.filePaths(),
          execute(request) {
            executeCalls += 1
            requestCounts.push(
              new DataView(request.buffer, request.byteOffset, request.byteLength).getUint32(12, true),
            )
            return reader.execute(request)
          },
          close: () => reader.close(),
        }
      },
      createTypedReader(...args: Parameters<typeof createTypedProjectStateReader>) {
        typedReaderCalls += 1
        return createdTypedReader = createTypedProjectStateReader(...args)
      },
      createFallbackQueryPort(...args: Parameters<typeof createBinaryProjectStateQueryPort>) {
        fallbackTypedReader = args[1].typedReader
        return createBinaryProjectStateQueryPort(...args)
      },
      createTargetCacheKey(componentPath: string, canonicalTarget: string) {
        cacheKeyCalls += 1
        return `${componentPath}\u0000${canonicalTarget}`
      },
    })
    const lookup = (requestId: string) => ({
      requestId,
      componentPath: "cf",
      canonicalTarget: "Catalog.Товары",
    })

    expect(session.resolveTargets([lookup("first"), lookup("duplicate")]))
      .toMatchObject([
        { requestId: "first", status: "found" },
        { requestId: "duplicate", status: "found" },
      ])
    expect(session.resolveTargets([lookup("cached")]))
      .toMatchObject([{ requestId: "cached", status: "found" }])
    expect(executeCalls).toBe(1)
    expect(requestCounts).toEqual([1])
    expect(typedReaderCalls).toBe(1)
    expect(fallbackTypedReader).toBe(createdTypedReader)
    expect(cacheKeyCalls).toBe(3)

    session.close()
    store.close()
  })
})

function publishedStore(update: ReturnType<typeof richYamlUpdate>) {
  const validator = createProjectStateDependencyValidator()
  const { store } = createBinaryProjectStateStore({ dependencyValidator: validator })
  const writer = createProjectStateFragmentWriter()
  writer.appendFile(update, 1n)
  store.beginUpdate()
  store.appendFragment(writer.finish())
  store.commitUpdate()

  return { store, validator }
}
