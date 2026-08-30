import { describe, expect, it } from "vitest"

import {
  createConfigurationIndexCollector,
  createConfigurationIndexExportRuntime,
  registerFormXmlIdReservation,
  type ConfigurationIndexExportRuntime,
  type ConfigurationIndexBlockEntity,
  type FormXmlIdSpace,
} from "@nkdk/runtime"
import { assignFormXmlIds } from "./formXmlIdAssignment"
import { testConfigurationIndexReader } from "../../../tests/configurationIndex"

describe("assignFormXmlIds", () => {
  it.each([
    ["снимок", "11", "22", undefined, "11"],
    ["целевой XML", undefined, "22", undefined, "22"],
    ["специальный ID", "11", "22", "-1", "-1"],
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
    const identities = setup.collector.fragment("Форма.yaml").entities
    if (specialId === undefined) {
      expect(identities).toContainEqual(expect.objectContaining({ logicalAddress: address, xmlId: expected }))
    } else {
      expect(identities).toEqual([])
    }
  })

  it.each([
    ["снимка", "-4", undefined, "-4"],
    ["целевого XML", undefined, "-6", "-6"],
  ] as const)("сохраняет отрицательный ID из %s", (_case, snapshotId, referenceId, expected) => {
    const address = "Форма.Элемент.Поле"
    const setup = runtimeSetup(snapshotId === undefined ? [] : [entity(address, snapshotId)])
    const node = { _name: "Поле", _id: "" }
    register(setup.runtime.withLogicalAddress(address), node, "elements")

    assignFormXmlIds(
      { Items: [node] },
      referenceId === undefined ? undefined : { Items: [{ _name: "Поле", _id: referenceId }] },
    )

    expect(node._id).toBe(expected)
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

  it.each(["1", "-4"])("отклоняет повторный ID %s внутри одного XML-контейнера", (id) => {
    const firstAddress = "Форма.Элемент.Первый"
    const secondAddress = "Форма.Элемент.Второй"
    const setup = runtimeSetup([entity(firstAddress, id), entity(secondAddress, id)])
    const { first, second } = registerElementPair(setup.runtime, firstAddress, secondAddress)

    expect(() => assignFormXmlIds({ Items: [first, second] })).toThrow(
      `Повторный ID ${id} в XML-контейнере (elements)`,
    )
  })

  it("разрешает одинаковый постоянный ID правила в разных проекциях одного результата", () => {
    const setup = runtimeSetup([])
    const first = { _name: "ПерваяПанель", _id: "" }
    const second = { _name: "ВтораяПанель", _id: "" }
    register(setup.runtime, first, "elements", "-1")
    register(setup.runtime, second, "elements", "-1")

    expect(() => assignFormXmlIds({ BaseForm: first, AutoCommandBar: second })).not.toThrow()
    expect([first._id, second._id]).toEqual(["-1", "-1"])
  })
})

function register(
  runtime: ConfigurationIndexExportRuntime,
  node: Record<string, unknown>,
  space: FormXmlIdSpace,
  specialId?: string,
): void {
  registerFormXmlIdReservation(node, {
    ...(specialId === undefined ? { runtime } : {}),
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

function entity(logicalAddress: string, xmlId: string): ConfigurationIndexBlockEntity {
  return { logicalAddress, xmlId }
}

function runtimeSetup(entities: ConfigurationIndexBlockEntity[]) {
  const source = testConfigurationIndexReader(entities)
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
