import { describe, expect, it } from "vitest"
import { createProjectStateDependencyValidator } from "../../validation/projectStateDependencyValidation"
import { createBinaryProjectStateStore } from "../binary/store"
import { createProjectStateFragmentWriter } from "../binary/fragment"
import { richYamlUpdate } from "../binary/testData"
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
