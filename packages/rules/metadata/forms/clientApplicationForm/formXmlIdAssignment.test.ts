import { describe, expect, it } from "vitest"

import {
  createConfigurationIndexCollector,
  createConfigurationIndexExportRuntime,
  createConfigurationIndexReader,
  encodeConfigurationIndex,
  registerFormXmlIdReservation,
  snapshotConfigurationIndex,
  type ConfigurationIndexExportRuntime,
  type ConfigurationSnapshotEntity,
  type FormXmlIdSpace,
} from "@nkdk/runtime"
import { assignFormXmlIds } from "./formXmlIdAssignment"

describe("assignFormXmlIds", () => {
  it.each([
    ["снимок", "11", "22", "-1", "11"],
    ["целевой XML", undefined, "22", "-1", "22"],
    ["специальный ID", undefined, undefined, "-1", "-1"],
    ["свободный ID", undefined, undefined, undefined, "1"],
  ] as const)("использует приоритет: %s", (_case, snapshotId, referenceId, specialId, expected) => {
    const address = "Форма.Элемент.Поле"
    const setup = runtimeSetup(snapshotId === undefined ? [] : [entity(address, snapshotId)])
    const node = { _name: "Поле", _id: "" }
    register(setup.runtime.withLogicalAddress(address), node, "elements", specialId)

    assignFormXmlIds(
      { Items: [node] },
      referenceId === undefined ? undefined : { Items: [{ _name: "Поле", _id: referenceId }] },
    )

    expect(node._id).toBe(expected)
    expect(setup.collector.fragment("Форма.yaml").entities).toContainEqual(
      expect.objectContaining({ logicalAddress: address, identities: { xmlId: expected } }),
    )
  })

  it("назначает одинаковый свободный ID в разных пространствах", () => {
    const setup = runtimeSetup([])
    const element = { _name: "Поле", _id: "" }
    const attribute = { _name: "Поле", _id: "" }
    const command = { _name: "Поле", _id: "" }
    register(setup.runtime.withLogicalAddress("Форма.Элемент.Поле"), element, "elements")
    register(setup.runtime.withLogicalAddress("Форма.Атрибут.Поле"), attribute, "attributes")
    register(setup.runtime.withLogicalAddress("Форма.Команда.Поле"), command, "commands")

    assignFormXmlIds({ Elements: [element], Attributes: [attribute], Commands: [command] })

    expect([element._id, attribute._id, command._id]).toEqual(["1", "1", "1"])
  })

  it("учитывает занятый ID элемента ниже по XML до распределения", () => {
    const firstAddress = "Форма.Элемент.Первый"
    const secondAddress = "Форма.Элемент.Второй"
    const setup = runtimeSetup([entity(secondAddress, "1")])
    const { first, second } = registerElementPair(setup.runtime, firstAddress, secondAddress)

    assignFormXmlIds({ Items: [first, second] })

    expect(first._id).toBe("2")
    expect(second._id).toBe("1")
  })

  it("отклоняет повторный неотрицательный ID внутри одного XML-контейнера", () => {
    const firstAddress = "Форма.Элемент.Первый"
    const secondAddress = "Форма.Элемент.Второй"
    const setup = runtimeSetup([entity(firstAddress, "1"), entity(secondAddress, "1")])
    const { first, second } = registerElementPair(setup.runtime, firstAddress, secondAddress)

    expect(() => assignFormXmlIds({ Items: [first, second] })).toThrow(
      "Повторный ID 1 в XML-контейнере (elements)",
    )
  })
})

function register(
  runtime: ConfigurationIndexExportRuntime,
  node: Record<string, unknown>,
  space: FormXmlIdSpace,
  specialId?: string,
): void {
  registerFormXmlIdReservation(node, {
    runtime,
    space,
    ...(specialId === undefined ? {} : { specialId }),
  })
}

function registerElementPair(
  runtime: ConfigurationIndexExportRuntime,
  firstAddress: string,
  secondAddress: string,
) {
  const first = { _name: "Первый", _id: "" }
  const second = { _name: "Второй", _id: "" }
  register(runtime.withLogicalAddress(firstAddress), first, "elements")
  register(runtime.withLogicalAddress(secondAddress), second, "elements")
  return { first, second }
}

function entity(logicalAddress: string, xmlId: string): ConfigurationSnapshotEntity {
  return {
    logicalAddress,
    sourceProjectPath: "Форма.yaml",
    identities: { xmlId },
  }
}

function runtimeSetup(entities: ConfigurationSnapshotEntity[]) {
  const source = createConfigurationIndexReader(
    snapshotConfigurationIndex(
      encodeConfigurationIndex({
        specificationVersion: "1.4",
        indexGeneration: 1n,
        componentPath: "cf",
        files: [{ projectPath: "Форма.yaml", contentHash: 1n }],
        entities,
      }),
    ),
  )
  const collector = createConfigurationIndexCollector()
  return {
    collector,
    runtime: createConfigurationIndexExportRuntime({
      source,
      collector,
      targetProjectPath: "Форма.yaml",
      logicalAddress: "Форма",
    }),
  }
}
