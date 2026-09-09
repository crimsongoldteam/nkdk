import { expect, it } from "vitest"
import { createXmlAnomalyAnnotations } from "@nkdk/runtime"
import { createFinalBoundaryReferences } from "./finalBoundaryReferences"
import { collectBoundaryReferenceFacts } from "./boundaryReferences"
import { createRuleRegistrySet, createXmlImportAttemptJournal, attachXmlImportAttemptAdapter } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../composition/metadataRules"
import { FormAttributeRules } from "../forms/commonObjects/formAttribute/rules"
import { mockContextFromXML } from "../../tests/mockContext"
import { createFormDataPathIndexFromYAML } from "../validation/dataPath/formYamlIndex"
import { clientApplicationFormDataPathProjection } from "../forms/clientApplicationForm/formDataPathProjection"

function register(collector: ReturnType<typeof createFinalBoundaryReferences>, yaml: Record<string, unknown>, path: readonly (string | number)[]) {
  const references = collectBoundaryReferenceFacts({
    context: mockContextFromXML(), execution: createRuleRegistrySet(metadataRules).execution,
    rule: FormAttributeRules, yaml, yamlPath: ["Реквизиты", 0],
    annotations: createXmlAnomalyAnnotations(), filePath: "Форма.yaml",
  }).references
  collector.accept({ yaml, sourcePath: ["Реквизиты", 0], finalPath: path, references })
}

function collectedChild() {
  const collector = createFinalBoundaryReferences()
  const child = { ФункциональныеОпции: ["Опция"] }
  const root = { Реквизиты: { Имя: child } }
  register(collector, child, ["Реквизиты", "Имя"])
  return { collector, child, root, annotations: createXmlAnomalyAnnotations() }
}

it("собирает цель вложенного объекта после завершения адреса родителя", () => {
  const collector = createFinalBoundaryReferences()
  const child = { Тип: "Число" }
  const root = { Таблицы: { Данные: child } }
  collector.accept({ yaml: child, sourcePath: ["Таблицы", 0], finalPath: ["Таблицы", "Данные"], references: [],
    objectTarget: { segment: "Table.Данные", filePath: "Источник.yaml", type: "Число" } })
  collector.accept({ yaml: root, sourcePath: [], finalPath: [], references: [],
    objectTarget: { segment: "ExternalDataSource.Источник", filePath: "Источник.yaml" } })
  expect(collector.finish(root, createXmlAnomalyAnnotations()).objectIndexEntries.map(entry => ({
    canonical: entry.canonical, details: entry.result.ok ? entry.result.details : undefined,
  }))).toEqual([
    { canonical: "ExternalDataSource.Источник.Table.Данные", details: { type: "Число" } },
    { canonical: "ExternalDataSource.Источник", details: {} },
  ])
})

it("не публикует цель отменённой попытки и чистого raw", () => {
  const collector = createFinalBoundaryReferences()
  const child = {}
  const attempt = createXmlImportAttemptJournal([collector]).begin()
  collector.accept({ yaml: child, sourcePath: ["Таблицы", 0], finalPath: ["Таблицы", "Данные"], references: [],
    objectTarget: { segment: "Table.Данные", filePath: "Источник.yaml" } })
  attempt.rollback()
  expect(collector.finish({ Таблицы: { Данные: child } }, createXmlAnomalyAnnotations()).objectIndexEntries).toEqual([])

  const rawCollector = createFinalBoundaryReferences()
  const root = { Данные: child }
  rawCollector.accept({ yaml: child, sourcePath: ["Данные"], finalPath: ["Данные"], references: [],
    objectTarget: { segment: "ExternalDataSource.Источник.Table.Данные", filePath: "Источник.yaml" } })
  const annotations = createXmlAnomalyAnnotations()
  annotations.set(root, "Данные", { kind: "raw", occurrence: 1, target: "value" })
  expect(rawCollector.finish(root, annotations).objectIndexEntries).toEqual([])
})

it("отделяет логический адрес дочернего реквизита от цепочки объектных целей", () => {
  const collector = createFinalBoundaryReferences()
  const child = {}
  const root = { Реквизиты: { Код: child } }
  collector.accept({ yaml: child, sourcePath: ["Реквизиты", 0], finalPath: ["Реквизиты", "Код"], references: [],
    logicalTarget: { segment: "Attribute.Код", filePath: "Свойства.yaml" } })
  collector.accept({ yaml: root, sourcePath: [], finalPath: [], references: [],
    logicalTarget: { segment: "Catalog.Товары", filePath: "Свойства.yaml" } })
  expect(collector.finish(root, createXmlAnomalyAnnotations()).logicalAddresses).toEqual([
    { logicalAddress: "Catalog.Товары.Attribute.Код", sourceProjectPath: "Свойства.yaml" },
    { logicalAddress: "Catalog.Товары", sourceProjectPath: "Свойства.yaml" },
  ])
})

it("сохраняет окончательное имя коллекции и индекс внутри значения ссылки", () => {
  const collector = createFinalBoundaryReferences()
  const child = { ФункциональныеОпции: ["Опция"] }
  register(collector, child, ["Реквизиты", "Имя"])
  const root = { Реквизиты: { Имя: child } }
  expect(collector.finish(root, createXmlAnomalyAnnotations()).references).toEqual([
    expect.objectContaining({ canonical: "FunctionalOption.Опция", yamlPath: ["Реквизиты", "Имя", "ФункциональныеОпции", 0] }),
  ])
})

it("не публикует факты отменённой границы с тем же путём", () => {
  const collector = createFinalBoundaryReferences()
  const cancelled = { ФункциональныеОпции: ["Старая"] }
  const current = { ФункциональныеОпции: ["Новая"] }
  register(collector, cancelled, ["Реквизиты", "Имя"])
  register(collector, current, ["Реквизиты", "Имя"])
  expect(collector.finish({ Реквизиты: { Имя: current } }, createXmlAnomalyAnnotations()).references
    .map(reference => reference.canonical)).toEqual(["FunctionalOption.Новая"])
})

it("не публикует ссылки из родителя, ставшего raw без смысла", () => {
  const { collector, root, annotations } = collectedChild()
  annotations.set(root, "Реквизиты", { kind: "raw", occurrence: 1, target: "value" })
  expect(collector.finish(root, annotations).references).toEqual([])
})

it("строит зависимости только из окончательных ссылок без повторов", () => {
  const { collector, child, root, annotations } = collectedChild()
  child.ФункциональныеОпции.push("Опция")
  register(collector, child, ["Реквизиты", "Имя"])
  expect(collector.finish(root, annotations).dependencies).toEqual(["FunctionalOption.Опция"])
  const raw = collectedChild()
  raw.annotations.set(raw.root, "Реквизиты", { kind: "raw", occurrence: 1, target: "value" })
  expect(raw.collector.finish(raw.root, raw.annotations).dependencies).toEqual([])
})

it("собирает таблицы до проверки корня без обхода остальных элементов", () => {
  const collector = createFinalBoundaryReferences()
  const table = { ПутьКДанным: "Объект.Товары" }
  const other = { get Дочерние() { throw new Error("Лишний обход") } }
  const root = { Элементы: { Таблица: table, Другое: other } }
  const annotations = createXmlAnomalyAnnotations()
  collector.accept({ yaml: table, sourcePath: ["Элементы", 0], finalPath: ["Элементы", "Таблица"], references: [],
    table: { name: "Таблица", itemType: "Table", primaryDataPath: { value: table.ПутьКДанным } } })
  expect([...collector.tabularElements(root, annotations)]).toEqual([
    ["Таблица", { kind: "tabularFormElement", dataPath: "Объект.Товары" }],
  ])
  annotations.set(root, "Элементы", { kind: "raw", occurrence: 1, target: "value" })
  expect([...collector.tabularElements(root, annotations)]).toEqual([])
})

it("не учитывает языковой контекст отменённого или ставшего raw текста", () => {
  const collector = createFinalBoundaryReferences()
  const yaml = { Синоним: "Текст" }
  const accept = () => collector.accept({ yaml, sourcePath: [], finalPath: [], references: [], localizedTextPaths: [["Синоним"]] })
  const attempt = createXmlImportAttemptJournal([collector]).begin()
  accept()
  attempt.rollback()
  expect(collector.finish(yaml, createXmlAnomalyAnnotations()).localizedTextProperties).toBe(0)
  accept()
  const annotations = createXmlAnomalyAnnotations()
  annotations.set(yaml, "Синоним", { kind: "raw", occurrence: 1, target: "value" })
  expect(collector.finish(yaml, annotations).localizedTextProperties).toBe(0)
})

it("не публикует отменённый элемент структуры и сохраняет путь родителя", () => {
  const collector = createFinalBoundaryReferences()
  const child = { Вид: "ПолеВвода" }
  const root = { Элементы: { Поле: child } }
  const params = { yaml: child, sourcePath: ["Элементы", 0], finalPath: ["Элементы", "Поле"], references: [],
    formElement: { name: "Поле", primaryDataPath: { present: false, value: undefined } } }
  const attempt = createXmlImportAttemptJournal([collector]).begin()
  collector.accept(params)
  attempt.rollback()
  collector.accept({ yaml: root, sourcePath: [], finalPath: [], references: [],
    formOwner: { kind: "Справочник", name: "Товары" },
    formIndex: createFormDataPathIndexFromYAML(root, clientApplicationFormDataPathProjection, new Map()),
  })
  expect(collector.finish(root, createXmlAnomalyAnnotations()).structuredComponents?.filter(value => value.componentKind === "element"))
    .toEqual([])
})

it("сохраняет аннотированный повтор элемента под окончательным ключом YAML", () => {
  const collector = createFinalBoundaryReferences()
  const first = { Вид: "ПолеВвода" }
  const second = { Вид: "ПолеВвода" }
  const root = { Элементы: { Поле: first, runtime: second } }
  const annotations = createXmlAnomalyAnnotations()
  annotations.setKey(root.Элементы, "runtime", { kind: "invalid", occurrence: 1, target: "key", logicalKey: "Поле" })
  for (const [index, key, yaml] of [[0, "Поле", first], [1, "runtime", second]] as const) {
    collector.accept({ yaml, sourcePath: ["Элементы", index], finalPath: ["Элементы", key], references: [],
      formElement: { name: "Поле", primaryDataPath: { present: false, value: undefined } } })
  }
  collector.accept({ yaml: root, sourcePath: [], finalPath: [], references: [],
    formOwner: { kind: "Справочник", name: "Товары" },
    formIndex: createFormDataPathIndexFromYAML(root, clientApplicationFormDataPathProjection, new Map()),
  })
  expect(collector.finish(root, annotations).structuredComponents?.filter(value => value.componentKind === "element").map(value => value.name))
    .toEqual(["Поле", "runtime"])
})

it("читает окончательную отметку аномалии без повторного преобразования ссылки", () => {
  const { collector, child, root, annotations } = collectedChild()
  annotations.set(child.ФункциональныеОпции, 0, { kind: "invalid", occurrence: 1, target: "value" })
  expect(collector.finish(root, annotations).references[0]?.xmlAnomaly).toBe("pending")
})

it("не переносит аномалию целого списка на отдельные ссылки", () => {
  const { collector, child, root, annotations } = collectedChild()
  annotations.set(child, "ФункциональныеОпции", { kind: "invalid", occurrence: 1, target: "value" })
  expect(collector.finish(root, annotations).references[0]?.xmlAnomaly).toBeUndefined()
})

it("применяет окончательный ключ предка к вложенной ссылке после отменённой альтернативы", () => {
  const collector = createFinalBoundaryReferences()
  const cancelled = { ФункциональныеОпции: ["Старая"] }
  const current = { ФункциональныеОпции: ["Новая"] }
  const sourcePath = ["Реквизиты", 0, "Вложенные", 0] as const
  const add = (yaml: typeof current) => {
    const references = collectBoundaryReferenceFacts({
      context: mockContextFromXML(), execution: createRuleRegistrySet(metadataRules).execution,
      rule: FormAttributeRules, yaml, yamlPath: sourcePath, filePath: "Форма.yaml",
      annotations: createXmlAnomalyAnnotations(),
    }).references
    collector.accept({ yaml, sourcePath, finalPath: ["Реквизиты", "Owner", "Вложенные", "Before"], references })
  }
  add(cancelled)
  collector.place({ Отменённый: cancelled }, "Отменённый")
  add(current)
  const children = { Итоговый: current }
  collector.place(children, "Итоговый")
  const parent = { Вложенные: children }
  collector.accept({ yaml: parent, sourcePath: ["Реквизиты", 0], finalPath: ["Реквизиты", "Owner"], references: [] })
  const parents = { Владелец: parent }
  collector.place(parents, "Владелец")
  expect(collector.finish({ Реквизиты: parents }, createXmlAnomalyAnnotations()).references).toEqual([
    expect.objectContaining({ canonical: "FunctionalOption.Новая", yamlPath: ["Реквизиты", "Владелец", "Вложенные", "Итоговый", "ФункциональныеОпции", 0] }),
  ])
})

it("откатывает записи и именование, даже когда другой участник падает после commit", () => {
  const collector = createFinalBoundaryReferences()
  const failing = {}
  attachXmlImportAttemptAdapter(failing, { begin: () => undefined, commit() { throw new Error("commit failed") }, rollback() {} })
  const attempt = createXmlImportAttemptJournal([failing, collector]).begin()
  const child = { ФункциональныеОпции: ["Отменённая"] }
  register(collector, child, ["Реквизиты", "Before"])
  const children = { After: child }
  collector.place(children, "After")
  expect(() => attempt.commit()).toThrow()
  expect(collector.finish({ Реквизиты: children }, createXmlAnomalyAnnotations()).references).toEqual([])
})

it("восстанавливает прежний ключ при внешнем rollback после успешной внутренней попытки", () => {
  const { collector, child, root, annotations } = collectedChild()
  const journal = createXmlImportAttemptJournal([collector])
  const outer = journal.begin()
  const inner = journal.begin()
  collector.place({ НовоеИмя: child }, "НовоеИмя")
  inner.commit()
  outer.rollback()
  expect(collector.finish(root, annotations).references[0]?.yamlPath).toEqual(["Реквизиты", "Имя", "ФункциональныеОпции", 0])
})

it("сохраняет проверку отсутствующего значения на окончательном пути границы", () => {
  const collector = createFinalBoundaryReferences()
  const child = {}
  collector.accept({ yaml: child, sourcePath: ["Реквизиты", 0], finalPath: ["Реквизиты", "Имя"], references: [],
    checks: [{ kind: "fillValue", yamlPath: ["Реквизиты", 0, "Заполнять"],
      location: { filePath: "Объект.yaml", line: 1, col: 1 }, itemType: "Attribute", type: {}, value: { type: "xs:string" } }],
  })
  expect(collector.finish({ Реквизиты: { Имя: child } }, createXmlAnomalyAnnotations()).checks)
    .toEqual([expect.objectContaining({ kind: "fillValue", yamlPath: ["Реквизиты", "Имя", "Заполнять"] })])
})

it("строит адрес проверки из собственных имён предков после их завершения", () => {
  const collector = createFinalBoundaryReferences()
  const child = {}
  const parent = { Поля: { Поле: child } }
  const root = { Таблицы: { Таблица: parent } }
  collector.accept({ yaml: child, sourcePath: ["Таблицы", 0, "Поля", 0],
    finalPath: ["Таблицы", "Таблица", "Поля", "Поле"], addressSegment: "Field.Поле", references: [],
    checks: [{ kind: "addressableRequired", canonicalTarget: "", missing: ["Тип"],
      yamlPath: ["Таблицы", 0, "Поля", 0], location: { filePath: "Источник.yaml", line: 1, col: 1 } }],
  })
  collector.accept({ yaml: parent, sourcePath: ["Таблицы", 0], finalPath: ["Таблицы", "Таблица"],
    addressSegment: "Table.Таблица", references: [] })
  collector.accept({ yaml: root, sourcePath: [], finalPath: [], addressSegment: "ExternalDataSource.Источник", references: [] })
  expect(collector.finish(root, createXmlAnomalyAnnotations()).checks[0]).toMatchObject({
    canonicalTarget: "ExternalDataSource.Источник.Table.Таблица.Field.Поле", yamlPath: ["Таблицы", "Таблица", "Поля", "Поле"],
  })
})

it("не оставляет проверку границы без ссылок после rollback", () => {
  const collector = createFinalBoundaryReferences()
  const attempt = createXmlImportAttemptJournal([collector]).begin()
  const child = {}
  collector.accept({ yaml: child, sourcePath: ["Дети", 0], finalPath: ["Дети", "Имя"], references: [],
    addressSegment: "Attribute.Имя", checks: [{ kind: "addressableRequired", canonicalTarget: "", missing: ["Тип"],
      yamlPath: ["Дети", 0], location: { filePath: "Объект.yaml", line: 1, col: 1 } }],
  })
  attempt.rollback()
  expect(collector.finish({ Дети: { Имя: child } }, createXmlAnomalyAnnotations())).toEqual({ references: [], dependencies: [], localizedTextProperties: 0, checks: [], objectIndexEntries: [], logicalAddresses: [] })
})

it("использует окончательный путь родительской таблицы вместо пути первого прохода", () => {
  const collector = createFinalBoundaryReferences()
  const field = { ПутьКДанным: "Объект.Таблица.Колонка" }
  const table = { Элементы: { Колонка: field } }
  collector.accept({ yaml: field, sourcePath: ["Элементы", 0, "Элементы", 0],
    finalPath: ["Элементы", "Таблица", "Элементы", "Колонка"], references: [], checks: [{
      kind: "dataPath", yamlPath: ["Элементы", 0, "Элементы", 0, "ПутьКДанным"],
      location: { filePath: "Форма.yaml", line: 1, col: 1 }, owner: { kind: "Справочник", name: "Товары" },
      value: field.ПутьКДанным, policy: "formDataPath", policyInput: { yaml: "ПутьКДанным" },
      tableContext: { dataPath: "Object.OldTable" }, index: {
        roots: new Map(), additionalColumnsByTablePath: new Map(), tabularElementsByName: new Map(),
        duplicateDiagnostics: [], getRoot: () => undefined,
      },
    }] })
  collector.accept({ yaml: table, sourcePath: ["Элементы", 0], finalPath: ["Элементы", "Таблица"],
    references: [], tableDataPath: "Объект.Таблица" })
  expect(collector.finish({ Элементы: { Таблица: table } }, createXmlAnomalyAnnotations()).checks[0])
    .toMatchObject({ tableContext: { dataPath: "Объект.Таблица" } })
})

it("сохраняет аномалию ссылки в ключе при завершении импорта", () => {
  const yaml = { Роли: { НетРоли: false } }
  const annotations = createXmlAnomalyAnnotations()
  const collector = createFinalBoundaryReferences()
  collector.accept({ yaml, sourcePath: [], finalPath: [], references: [{
    filePath: "Форма.yaml", yamlPath: ["Роли", "НетРоли"], canonical: "Role.НетРоли",
    target: { kind: "object", root: "Role", objectName: "НетРоли" },
    constraint: { kind: "object", roots: ["Role"] }, annotationKind: "key",
  }] })
  annotations.setKey(yaml.Роли, "НетРоли", { kind: "invalid", target: "key", occurrence: 1 })
  expect(collector.finish(yaml, annotations).references).toEqual([expect.objectContaining({
    canonical: "Role.НетРоли", xmlAnomaly: "pending", yamlPath: ["Роли", "НетРоли"],
  })])
})
