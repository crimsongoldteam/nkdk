import { expect, it } from "vitest"

import { getTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "../../orchestration/property/types"
import {
  createOwnerAttributeCollectionRuleBuilder,
  registerOwnerAttributeCollection,
} from "./registerOwnerCollection"

it("регистрирует коллекцию реквизитов с точным XML-договором", () => {
  const propertyType = "TestOwnerAttributes"
  const itemRule: MetadataItemRule = { itemType: "TestOwnerAttribute", properties: {} }

  registerOwnerAttributeCollection({ propertyType, schemaName: "TestOwnerAttribute", itemRule })

  expect(getTypeRule(propertyType, "collectionItemRule")?.itemRule).toBe(itemRule)
  expect(getTypeRule(propertyType, "yamlToXMLNestedRule")).toMatchObject({
    kind: "collection",
    itemRule,
    xmlElement: "Attribute",
    keyField: "name",
  })
})

it("создаёт правило свойства реквизитов с ролью и целью миграции", () => {
  const rule = createOwnerAttributeCollectionRuleBuilder("TestOwnerAttributes")({ yaml: "Реквизиты" })

  expect(rule).toMatchObject({
    type: "TestOwnerAttributes",
    yaml: "Реквизиты",
    ownerFactRole: "attributes",
    operationTarget: {
      kind: "namedCollectionTarget",
      targetKind: "attribute",
      migrationSegment: "Реквизит",
      requiresMigration: true,
    },
  })
})
