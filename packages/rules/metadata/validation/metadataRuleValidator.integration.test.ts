import { expect, it } from "vitest"
import { createXmlAnomalyAnnotations, explicitYAMLString } from "@nkdk/runtime"
import { createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { mockContextFromXML } from "../../tests/mockContext"
import { metadataRules } from "../composition/metadataRules"
import { MetadataCatalogAttributeRules } from "../appliedObjects/metadataCatalog/childRules"
import { createRegisteredMetadataRuleValidator } from "./metadataRuleValidator"
import { AccumulationRegisterAggregateRules } from "../commonObjects/accumulationRegisterAggregates/rules"
import { MetadataEnumerationValueRules } from "../appliedObjects/metadataEnumeration/rules"
import { ExchangePlanContentItemRules } from "../commonObjects/exchangePlanContent/rules"
import { UsualGroupRules } from "../forms/elements/usualGroup/rules"

it("разрешает вид элемента, добавленный зарегистрированной схемой", () => {
  const validator = createRegisteredMetadataRuleValidator({
    context: mockContextFromXML(), rules: createRuleRegistrySet(metadataRules),
  })
  expect(validator.validateBoundary({ rule: UsualGroupRules, yaml: { Вид: "Группа" },
    yamlPath: ["Элементы", "Группа"], name: "Группа", annotations: createXmlAnomalyAnnotations(),
  })).toEqual([])
})

it("отмечает служебное поле, отсутствующее в окончательной схеме дочернего объекта", () => {
  const validator = createRegisteredMetadataRuleValidator({
    context: mockContextFromXML(), rules: createRuleRegistrySet(metadataRules),
  })
  const input = { rule: ExchangePlanContentItemRules, yamlPath: ["Состав", 0], annotations: createXmlAnomalyAnnotations() }
  expect(validator.validateBoundary({ ...input, yaml: { Метаданные: "Документ.Заказ", Использовать: "Ложь" } }))
    .toEqual([expect.objectContaining({ target: { kind: "path", path: ["Состав", 0, "Использовать"] } })])
  expect(validator.validateBoundary({ ...input, yaml: { Метаданные: "Документ.Заказ" } })).toEqual([])
})

it("учитывает имя из ключа коллекции и договор неполного объекта расширения", () => {
  const validator = createRegisteredMetadataRuleValidator({
    context: mockContextFromXML(), rules: createRuleRegistrySet(metadataRules),
  })
  expect(validator.validateBoundary({
    rule: MetadataEnumerationValueRules, yaml: {}, yamlPath: ["Значения", "Первое"],
    name: "Первое", annotations: createXmlAnomalyAnnotations(),
  })).toEqual([])
  expect(validator.validateBoundary({
    rule: AccumulationRegisterAggregateRules, yaml: {}, yamlPath: [],
    deferRequired: true, annotations: createXmlAnomalyAnnotations(),
  })).toEqual([])
})

it("проверяет обязательные поля до закрытия вложенного агрегата", () => {
  const validator = createRegisteredMetadataRuleValidator({
    context: mockContextFromXML(), rules: createRuleRegistrySet(metadataRules),
  })
  const issues = validator.validateBoundary({
    rule: AccumulationRegisterAggregateRules,
    yamlPath: ["Агрегаты", 0],
    yaml: { Периодичность: "День" },
    annotations: createXmlAnomalyAnnotations(),
  })
  expect(issues.map(issue => issue.target)).toEqual([
    { kind: "missing", path: ["Агрегаты", 0, "Использование"] },
    { kind: "missing", path: ["Агрегаты", 0, "Измерения"] },
  ])
})

it("проверяет порядок языков до закрытия вложенного реквизита", () => {
  const validator = createRegisteredMetadataRuleValidator({
    context: mockContextFromXML(), rules: createRuleRegistrySet(metadataRules),
  })
  const input = {
    rule: MetadataCatalogAttributeRules,
    yamlPath: ["Реквизиты", "Проверка"], name: "Проверка",
    annotations: createXmlAnomalyAnnotations(),
  }
  expect(validator.validateBoundary({ ...input, yaml: { Синоним: { en: "Text", ru: "Текст" } } }))
    .toEqual([expect.objectContaining({
      code: "diagnostic.structure",
      target: { kind: "path", path: ["Реквизиты", "Проверка", "Синоним"] },
      params: { message: "Неканонический порядок языков локализованного текста" },
    })])
  expect(validator.validateBoundary({ ...input, yaml: { Синоним: { ru: "Текст", en: "Text" } } })).toEqual([])
  expect(validator.validateBoundary({ ...input, yaml: { Синоним: explicitYAMLString("001") } })).toEqual([])
})

it("сообщает использованные языковые свойства в той же локальной проверке", () => {
  const validator = createRegisteredMetadataRuleValidator({
    context: mockContextFromXML(), rules: createRuleRegistrySet(metadataRules),
  })
  const paths: (readonly (string | number)[])[] = []
  validator.validateBoundary({ rule: MetadataCatalogAttributeRules, name: "Реквизит",
    yaml: { Синоним: "Описание", Тип: "Строка" }, yamlPath: ["Реквизиты", "Реквизит"],
    annotations: createXmlAnomalyAnnotations(), onLocalizedTextProperty: path => paths.push(path),
  })
  expect(paths).toEqual([["Реквизиты", "Реквизит", "Синоним"]])
})
