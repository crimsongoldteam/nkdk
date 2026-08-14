import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "./collector/writer"
import { createConfigurationIndexExportRuntime } from "./exportRuntime"
import { createLocalConfigurationIndexReader } from "./localReader"

const UUID = "00000000-0000-4000-8000-000000000001"
const SEED_A = new Uint8Array(32).fill(1)
const SEED_B = new Uint8Array(32).fill(2)

describe("configuration index export runtime", () => {
  it("uses an existing identity and recollects it", () => {
    const collector = createConfigurationIndexCollector()
    const runtime = createConfigurationIndexExportRuntime({
      source: createLocalConfigurationIndexReader(new Map([
        ["А.yaml", { entities: [{ logicalAddress: "Объект", uuid: UUID }] }],
      ])),
      collector,
      targetProjectPath: "А.yaml",
      logicalAddress: "Объект",
      operationSeed: SEED_A,
    })
    expect(runtime.identityOrCreate("uuid")).toBe(UUID)
    expect(collector.fragment("А.yaml").entities).toEqual([{ logicalAddress: "Объект", uuid: UUID }])
  })

  it("generates stable values inside one operation and different values for another seed", () => {
    const first = runtime(SEED_A)
    const same = runtime(SEED_A)
    const second = runtime(SEED_B)
    expect(first.identityOrCreate("uuid")).toBe(same.identityOrCreate("uuid"))
    expect(first.identityOrCreate("xmlId")).toBe(same.identityOrCreate("xmlId"))
    expect(first.configVersion("Объект")).toBe(same.configVersion("Объект"))
    expect(first.identityOrCreate("uuid")).not.toBe(second.identityOrCreate("uuid"))
  })

  it("reads children only from the local entity", () => {
    const source = createLocalConfigurationIndexReader(new Map([
      ["А.yaml", { entities: [{
        logicalAddress: "Объект.Свойство.ДочерниеОбъекты",
        children: [{ xmlName: "Form", name: "Б" }],
      }] }],
    ]))
    const value = createConfigurationIndexExportRuntime({
      source,
      collector: createConfigurationIndexCollector(),
      targetProjectPath: "А.yaml",
      logicalAddress: "Объект",
      xmlNodeLogicalAddress: "Объект.Свойство.ДочерниеОбъекты",
      operationSeed: SEED_A,
    })
    expect(value.children()).toEqual([{ xmlName: "Form", name: "Б" }])
  })

  it("rejects a seed with another length", () => {
    expect(() => runtime(new Uint8Array(31))).toThrow("32")
  })
})

function runtime(operationSeed: Uint8Array) {
  return createConfigurationIndexExportRuntime({
    source: createLocalConfigurationIndexReader(new Map()),
    collector: createConfigurationIndexCollector(),
    targetProjectPath: "А.yaml",
    logicalAddress: "Объект",
    operationSeed,
  })
}
