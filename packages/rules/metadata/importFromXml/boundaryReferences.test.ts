import { RootCommandInterfaceRules } from "../commonObjects/rootCommandInterface/rules"
import { expect, it } from "vitest"
import { createXmlAnomalyAnnotations, parseMetadataYaml } from "@nkdk/runtime"
import { createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../composition/metadataRules"
import { FormAttributeRules } from "../forms/commonObjects/formAttribute/rules"
import { mockContextFromXML } from "../../tests/mockContext"
import { collectBoundaryReferenceFacts } from "./boundaryReferences"
import { MetadataConstantRules } from "../appliedObjects/metadataConstant/rules"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"

const execution = createRuleRegistrySet(metadataRules).execution

function collect(yaml: Record<string, unknown>, annotations = createXmlAnomalyAnnotations()) {
  return collectBoundaryReferenceFacts({
    context: mockContextFromXML(), execution, rule: FormAttributeRules,
    name: "Реквизит", yamlPath: ["Реквизиты", "Реквизит"],
    yaml, filePath: "Форма.yaml", annotations,
  }).references
}

it("собирает окончательную ссылку реквизита до закрытия формы", () => {
  const { references } = collectBoundaryReferenceFacts({
    context: mockContextFromXML(), execution: createRuleRegistrySet(metadataRules).execution,
    rule: FormAttributeRules, name: "Реквизит", yamlPath: ["Реквизиты", "Реквизит"],
    yaml: { ФункциональныеОпции: ["НетТакойОпции"] }, filePath: "Форма.yaml",
    annotations: createXmlAnomalyAnnotations(),
  })
  expect(references).toEqual([expect.objectContaining({
    canonical: "FunctionalOption.НетТакойОпции",
    yamlPath: ["Реквизиты", "Реквизит", "ФункциональныеОпции", 0],
  })])
})

it("не восстанавливает ссылку, которой нет в окончательном YAML", () => {
  expect(collect({})).toEqual([])
})

it("собирает поля ввода по строке общим механизмом ссылок", () => {
  const { references } = collectBoundaryReferenceFacts({
    context: mockContextFromXML(), execution, rule: MetadataCatalogRules, name: "Товары",
    yaml: { ВводПоСтроке: ["СтандартныйРеквизит.Код"] }, yamlPath: [],
    filePath: "Свойства.yaml", annotations: createXmlAnomalyAnnotations(),
  })
  expect(references.map(reference => reference.canonical)).toEqual(["Catalog.Товары.StandardAttribute.Code"])
})

it("не разрешает UUID самостоятельно", () => {
  expect(collect({ ФункциональныеОпции: ["26b79d3a-475f-4df9-91ea-fc6bc714a521"] })).toEqual([])
})

it("не извлекает ссылку из raw без смыслового значения", () => {
  const yaml = { ФункциональныеОпции: ["НетТакойОпции"] }
  const annotations = createXmlAnomalyAnnotations()
  annotations.set(yaml, "ФункциональныеОпции", { kind: "raw", occurrence: 1, target: "value" })
  expect(collect(yaml, annotations)).toEqual([])
})

it("не обходит дочерние элементы повторно", () => {
  const yaml = Object.defineProperty({}, "Колонки", {
    enumerable: true,
    get() { throw new Error("Повторное чтение дочернего элемента") },
  })
  expect(collect(yaml)).toEqual([])
})

it("не проверяет отдельное raw-вхождение в списке", () => {
  const yaml = { ФункциональныеОпции: ["Пропустить", "Проверить"] }
  const annotations = createXmlAnomalyAnnotations()
  annotations.set(yaml.ФункциональныеОпции, 0, { kind: "raw", occurrence: 1, target: "value" })
  expect(collect(yaml, annotations).map(reference => reference.canonical))
    .toEqual(["FunctionalOption.Проверить"])
})

it("передаёт состояние уже отмеченного вхождения", () => {
  const yaml = { ФункциональныеОпции: ["НетТакойОпции"] }
  const annotations = createXmlAnomalyAnnotations()
  annotations.set(yaml.ФункциональныеОпции, 0, { kind: "invalid", occurrence: 1, target: "value" })
  expect(collect(yaml, annotations)[0]?.xmlAnomaly).toBe("pending")
})

it("берёт владельца формы из окончательного соседнего типа", () => {
  const { references } = collectBoundaryReferenceFacts({
    context: mockContextFromXML(), execution, rule: MetadataConstantRules,
    yaml: { Тип: "Справочник.Товары", ФормаВыбора: "Выбор" },
    yamlPath: [], filePath: "Константа.yaml", annotations: createXmlAnomalyAnnotations(),
  })
  expect(references.map(reference => reference.canonical)).toContain("Catalog.Товары.Form.Выбор")
})

it("передаёт режим ссылки из собственного YAML вложенной границы", () => {
  const parsed = parseMetadataYaml("Тип: Справочник.Товары\nФормаВыбора: !проверять Выбор\n")
  const { references } = collectBoundaryReferenceFacts({
    context: mockContextFromXML(), execution, rule: MetadataConstantRules,
    yaml: parsed.data as Record<string, unknown>, yamlPath: ["Реквизиты", 2],
    filePath: "Свойства.yaml", annotations: parsed.annotations,
    propertyStateCapability: { itemType: MetadataConstantRules.itemType, properties: {
      choiceForm: { availability: "borrowed", modes: ["control", "notify"], representation: "tagged" },
    } },
  })
  expect(references).toEqual([expect.objectContaining({
    canonical: "Catalog.Товары.Form.Выбор", propertyStateMode: "notify",
    yamlPath: ["Реквизиты", 2, "ФормаВыбора"],
  })])
})

it("отмечает недоступную ссылку при составном типе на границе объекта", () => {
  const facts = collectBoundaryReferenceFacts({
    context: mockContextFromXML(), execution, rule: MetadataConstantRules,
    yaml: { Тип: ["Справочник.Товары", "Строка"], ФормаВыбора: "Выбор" },
    yamlPath: ["Константа"], filePath: "Константа.yaml", annotations: createXmlAnomalyAnnotations(),
  })
  expect(facts.references).toEqual([])
  expect(facts.issues).toEqual([expect.objectContaining({
    kind: "semantic", target: { kind: "path", path: ["Константа", "ФормаВыбора"] },
    params: { message: 'Свойство "ФормаВыбора" недоступно для реквизита с составным типом' },
  })])
})

it("не проверяет недоступность ссылки, сохранённой только как raw", () => {
  const yaml = { Тип: ["Справочник.Товары", "Строка"], ФормаВыбора: "Выбор" }
  const annotations = createXmlAnomalyAnnotations()
  annotations.set(yaml, "ФормаВыбора", { kind: "raw", occurrence: 1, target: "value" })
  expect(collectBoundaryReferenceFacts({
    context: mockContextFromXML(), execution, rule: MetadataConstantRules, yaml,
    yamlPath: [], filePath: "Константа.yaml", annotations,
  })).toEqual({ references: [], issues: [] })
})

it("наследует владельца короткой ссылки из контекста", () => {
  const context = mockContextFromXML()
  const { references } = collectBoundaryReferenceFacts({
    context: { ...context, importFromYAML: { ...context.importFromYAML,
      metadataTargetOwners: [{ itemType: "MetadataCatalog", name: "Товары",
        owner: { root: "Catalog", objectName: "Товары" } }],
    } },
    execution, rule: { itemType: "InheritedReferenceProbe", metadataTargetOwner: { kind: "inherit" },
      properties: { defaultChoiceForm: MetadataCatalogRules.properties.defaultChoiceForm } },
    yaml: { ОсновнаяФормаДляВыбора: "Выбор" }, yamlPath: [], filePath: "Свойства.yaml",
    annotations: createXmlAnomalyAnnotations(),
  })
  expect(references.map(reference => reference.canonical)).toEqual(["Catalog.Товары.Form.Выбор"])
})

it("сохраняет именованные ссылки в ключах ролей, исключая UUID", () => {
  const parsed = parseMetadataYaml("ВидимостьКоманд:\n  - Команда: '0'\n    Роли:\n      Администратор: Ложь\n      !xml/invalid НетРоли: Истина\n      !xml/uuid 26b79d3a-475f-4df9-91ea-fc6bc714a521: Ложь")
  const facts = collectBoundaryReferenceFacts({
    context: mockContextFromXML(), execution, rule: RootCommandInterfaceRules,
    yaml: parsed.data as Record<string, unknown>, yamlPath: [],
    filePath: "Свойства.yaml", annotations: parsed.annotations,
  })
  expect(facts.references.map(reference => [reference.canonical, reference.xmlAnomaly])).toEqual([
    ["Role.Администратор", undefined], ["Role.НетРоли", "pending"],
  ])
})
