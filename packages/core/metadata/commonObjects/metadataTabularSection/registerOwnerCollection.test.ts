import { expect, it } from "vitest"

import { getTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "../../orchestration/property/types"
import {
  createOwnerTabularSectionCollectionRuleBuilder,
  registerOwnerTabularSectionCollection,
} from "./registerOwnerCollection"

it("регистрирует коллекцию табличных частей с точным XML-договором", () => {
  const propertyType = "TestOwnerTabularSections"
  const itemRule: MetadataItemRule = { itemType: "TestOwnerTabularSection", properties: {} }

  registerOwnerTabularSectionCollection({ propertyType, schemaName: "TestOwnerTabularSection", itemRule })

  expect(getTypeRule(propertyType, "collectionItemRule")?.itemRule).toBe(itemRule)
  expect(getTypeRule(propertyType, "yamlToXMLNestedRule")).toMatchObject({
    kind: "collection",
    itemRule,
    xmlElement: "TabularSection",
    keyField: "name",
  })
})

it("создаёт правило свойства табличных частей с ролью и целью миграции", () => {
  const rule = createOwnerTabularSectionCollectionRuleBuilder("TestOwnerTabularSections")({
    yaml: "ТабличныеЧасти",
  })

  expect(rule).toMatchObject({
    type: "TestOwnerTabularSections",
    yaml: "ТабличныеЧасти",
    ownerFactRole: "tabularSections",
    operationTarget: {
      kind: "namedCollectionTarget",
      targetKind: "tabularSection",
      migrationSegment: "ТабличнаяЧасть",
      requiresMigration: true,
    },
  })
})
