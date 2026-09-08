import { describe, expect, it } from "vitest"

import {
  createConfigurationIndexCollector,
  createConfigurationIndexExportRuntime,
  registerFormXmlIdReservation,
  markXmlAnomalyRawItem,
  type ConfigurationIndexExportRuntime,
  type ConfigurationIndexBlockEntity,
  type FormXmlIdSpace,
} from "@nkdk/runtime"
import { assignFormXmlIds, createFormXmlIdAssignmentSession } from "./formXmlIdAssignment"
import { testConfigurationIndexReader } from "../../../tests/configurationIndex"

describe("assignFormXmlIds", () => {
  it.each([
    ["снимок", "11", "22", undefined, "11"],
    ["построенный XML", undefined, "22", undefined, "22"],
    ["специальный ID", "11", "22", "-1", "-1"],
    ["свободный ID", undefined, undefined, undefined, "1"],
  ] as const)("использует приоритет: %s", (_case, snapshotId, assignedId, specialId, expected) => {
    const address = "Форма.Элемент.Поле"
    const setup = runtimeSetup(snapshotId === undefined ? [] : [entity(address, snapshotId)])
    const node = { _name: "Поле", _id: assignedId ?? "" }
    register(setup.runtime.withLogicalAddress(address), node, "elements", specialId)

    assignFormXmlIds({ Items: [node] })

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
    ["построенного XML", undefined, "-6", "-6"],
  ] as const)("сохраняет отрицательный ID из %s", (_case, snapshotId, assignedId, expected) => {
    const address = "Форма.Элемент.Поле"
    const setup = runtimeSetup(snapshotId === undefined ? [] : [entity(address, snapshotId)])
    const node = { _name: "Поле", _id: assignedId ?? "" }
    register(setup.runtime.withLogicalAddress(address), node, "elements")

    assignFormXmlIds({ Items: [node] })

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

  it.each(["1", "-4", "523", "524", "525"])("сохраняет повторный исходный ID %s и не создаёт новых коллизий", (id) => {
    const firstAddress = "Форма.Элемент.Первый"
    const secondAddress = "Форма.Элемент.Второй"
    const setup = runtimeSetup([entity(firstAddress, id), entity(secondAddress, id)])
    const { first, second } = registerElementPair(setup.runtime, firstAddress, secondAddress)

    const added = ["Новый", "ЕщёОдин"].map(name => {
      const node = { _name: name, _id: "" }
      register(setup.runtime.withLogicalAddress(`Форма.Элемент.${name}`), node, "elements")
      return node
    })
    assignFormXmlIds({ Items: [...added, first, second] })

    expect([first._id, second._id]).toEqual([id, id])
    expect(new Set([id, ...added.map(node => node._id)]).size).toBe(3)
    const next = runtimeSetup([...setup.collector.fragment("Форма.yaml").entities])
    const restored = ["Новый", "ЕщёОдин", "Первый", "Второй"].map(name => {
      const node = { _name: name, _id: "" }
      register(next.runtime.withLogicalAddress(`Форма.Элемент.${name}`), node, "elements")
      return node
    })
    assignFormXmlIds({ Items: restored })
    expect(restored.map(node => node._id)).toEqual([...added.map(node => node._id), id, id])
  })

  it("согласует ID реквизита одного адреса из разных снимков в общей сессии", () => {
    const address = "Форма.Атрибут.Поле"
    const session = createFormXmlIdAssignmentSession()
    for (const id of ["1", "2"]) {
      const setup = runtimeSetup([entity(address, id)])
      const node = { _name: "Поле", _id: "" }
      register(setup.runtime.withLogicalAddress(address), node, "attributes")
      assignFormXmlIds({ Items: [node] }, session)
      expect(node._id).toBe("1")
    }
  })

  it("сохраняет разные исходные ID элемента во внешней форме и BaseForm", () => {
    const address = "Форма.Элемент.Группа"
    const session = createFormXmlIdAssignmentSession()
    for (const id of ["29", "32"]) {
      const setup = runtimeSetup([entity(address, id)])
      const node = { _name: "Группа", _id: "" }
      register(setup.runtime.withLogicalAddress(address), node, "elements")
      assignFormXmlIds({ Items: [node] }, session)
      expect(node._id).toBe(id)
    }
  })

  it("не переназначает ID уже построенного BaseForm при включении во внешнюю форму", () => {
    const address = "Форма.ОсноваФормы.Элемент.ИсторическоеПоле"
    const setup = runtimeSetup([])
    const session = createFormXmlIdAssignmentSession()
    const node = { _name: "ИсторическоеПоле", _id: "" }
    register(setup.runtime.withLogicalAddress(address), node, "elements")

    assignFormXmlIds({ Items: [node] }, session)
    const assigned = node._id
    assignFormXmlIds({ BaseForm: { Items: [node] } }, session)

    expect(node._id).toBe(assigned)
  })

  it("не разрешает записать разные ID одного адреса в один снимок", () => {
    const setup = runtimeSetup([])
    setup.collector.setIdentity("Форма.Элемент.Поле", "xmlId", "1")
    expect(() => setup.collector.setIdentity("Форма.Элемент.Поле", "xmlId", "2")).toThrow()
  })

  it.each([
    ["Button", "elements"],
    ["Attribute", "attributes"],
    ["Command", "commands"],
    ["Parameter", "parameters"],
  ] as const)("не занимает ID ещё не восстановленного raw-узла %s и его детей", (name, space) => {
    const setup = runtimeSetup([])
    const node = { _name: "НовоеПоле", _id: "" }
    const other = { _name: "ДругоеПространство", _id: "" }
    register(setup.runtime.withLogicalAddress("Форма.НовоеПоле"), node, space)
    register(setup.runtime.withLogicalAddress("Форма.Другое"), other, space === "elements" ? "attributes" : "elements")
    const raw = {}
    markXmlAnomalyRawItem(raw, "raw-1", { "#name": name, _id: "1", Nested: { _id: "2" } })
    assignFormXmlIds({ Items: [raw, node, other] })
    expect(node._id).toBe("3")
    expect(other._id).toBe("1")
  })

  it("резервирует исходные ID даже удалённых элементов, но не соседней формы или другого пространства", () => {
    const setup = runtimeSetup([
      entity("Форма.Элемент.Удалённый", "1"),
      entity("ДругаяФорма.Элемент.Поле", "2"),
      entity("Форма.Атрибут.Объект", "2"),
    ])
    const node = { _name: "НовоеПоле", _id: "" }
    register(setup.runtime.withLogicalAddress("Форма.Элемент.НовоеПоле"), node, "elements")
    assignFormXmlIds({ ChildItems: [{ InputField: node }] })
    expect(node._id).toBe("2")
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

  it("разрешает одинаковый сохранённый ID в независимых XML-контейнерах", () => {
    const firstAddress = "Форма.ПерваяГруппа.Поле"
    const secondAddress = "Форма.ВтораяГруппа.Поле"
    const setup = runtimeSetup([entity(firstAddress, "1"), entity(secondAddress, "1")])
    const first = { _name: "Первое", _id: "" }
    const second = { _name: "Второе", _id: "" }
    register(setup.runtime.withLogicalAddress(firstAddress), first, "elements")
    register(setup.runtime.withLogicalAddress(secondAddress), second, "elements")

    expect(() => assignFormXmlIds({
      First: { Items: [first] },
      Second: { Items: [second] },
    })).not.toThrow()
    expect([first._id, second._id]).toEqual(["1", "1"])
  })

  it("повторно использует ID смыслового реквизита во внешней форме и BaseForm", () => {
    const setup = runtimeSetup([])
    const session = createFormXmlIdAssignmentSession()
    const occupied = { _name: "Другой", _id: "" }
    const baseAttribute = { _name: "Контрагент", _id: "" }
    const outerAttribute = { _name: "Контрагент", _id: "" }
    register(setup.runtime.withLogicalAddress("Форма.Атрибут.Другой"), occupied, "attributes")
    register(setup.runtime.withLogicalAddress("Форма.Атрибут.Контрагент"), baseAttribute, "attributes")
    register(setup.runtime.withLogicalAddress("Форма.Атрибут.Контрагент"), outerAttribute, "attributes")

    assignFormXmlIds({ Attributes: [occupied, baseAttribute] }, session)
    assignFormXmlIds({ Attributes: [outerAttribute] }, session)

    expect(baseAttribute._id).toBe("2")
    expect(outerAttribute._id).toBe(baseAttribute._id)
  })

  it("не объединяет пространства команд внешней формы и BaseForm", () => {
    const setup = runtimeSetup([])
    const session = createFormXmlIdAssignmentSession()
    const baseCommand = { _name: "Обновить", _id: "" }
    const outerCommand = { _name: "Обновить", _id: "" }
    register(setup.runtime.withLogicalAddress("Форма.ОсноваФормы.Команда.Обновить"), baseCommand, "commands")
    register(setup.runtime.withLogicalAddress("Форма.Команда.Обновить"), outerCommand, "commands")

    assignFormXmlIds({ Commands: [baseCommand] }, session)
    assignFormXmlIds({ Commands: [outerCommand] }, session)

    expect(baseCommand._id).toBe("1000001")
    expect(outerCommand._id).toBe("1")
  })

  it("резервирует ID узла BaseForm без runtime перед внешней формой", () => {
    const session = createFormXmlIdAssignmentSession()
    const baseElement = { _name: "Код", _id: "1" }
    registerFormXmlIdReservation(baseElement, { space: "elements" })
    assignFormXmlIds(
      { Items: [baseElement] },
      session,
    )

    const setup = runtimeSetup([])
    const ownElement = { _name: "ДатаАктуальности", _id: "" }
    register(setup.runtime.withLogicalAddress("Форма.Элемент.ДатаАктуальности"), ownElement, "elements")
    assignFormXmlIds({ Items: [ownElement] }, session)

    expect(ownElement._id).toBe("2")
  })

  it("пропускает некорректный ID снимка и выбирает допустимый", () => {
    const address = "Форма.Атрибут.Контрагент"
    const setup = runtimeSetup([entity(address, "not-an-id")])
    const attribute = { _name: "Контрагент", _id: "7" }
    register(setup.runtime.withLogicalAddress(address), attribute, "attributes")

    assignFormXmlIds(
      { Attributes: [attribute] },
      createFormXmlIdAssignmentSession(),
    )

    expect(attribute._id).toBe("7")
  })

  it("учитывает уже построенный ID только в соответствующем пространстве", () => {
    const setup = runtimeSetup([])
    const attribute = { _name: "Новый", _id: "" }
    const element = { _name: "Поле", _id: "" }
    register(setup.runtime.withLogicalAddress("Форма.Атрибут.Новый"), attribute, "attributes")
    register(setup.runtime.withLogicalAddress("Форма.Элемент.Поле"), element, "elements")
    const session = createFormXmlIdAssignmentSession()

    assignFormXmlIds({ Attributes: [{ _name: "Старый", _id: "1" }, attribute], Elements: [element] }, session)

    expect(attribute._id).toBe("2")
    expect(element._id).toBe("1")
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
      formElementRootLogicalAddress: "Форма",
    }),
  }
}
