import { describe, expect, it } from "vitest"

import { mockContext } from "../../../tests/mockContext"
import type { MetadataTargetOwner } from "../../commonObjects/metadataTargets/types"
import {
  exportStringMetadataTargetToYAML,
  importStringMetadataTargetFromYAML,
  metadataTargetOwnerFromRule,
} from "./metadataTargetString"
import type { MetadataItemRule } from "./types"

const documentRule = {
  itemType: "MetadataDocument",
  itemTypePrefix: "Документ",
  metadataTargetOwner: { kind: "self", root: "Document" },
  properties: {
    name: { type: "string", defaultValue: ({ name }: { name?: string }) => name },
    comment: { yaml: "Комментарий", type: "string" },
    defaultObjectForm: {
      yaml: "ОсновнаяФормаОбъекта",
      type: "string",
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
    },
  },
} as const satisfies MetadataItemRule

const documentRuleWithCommonForms = {
  ...documentRule,
  properties: {
    ...documentRule.properties,
    defaultObjectForm: {
      ...documentRule.properties.defaultObjectForm,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
    },
  },
} as const satisfies MetadataItemRule

const documentRuleWithNumerator = {
  ...documentRule,
  properties: {
    ...documentRule.properties,
    numerator: {
      yaml: "Нумератор",
      type: "string",
      metadataTarget: { kind: "object", roots: ["DocumentNumerator"] },
    },
  },
} as const satisfies MetadataItemRule

const documentOwner = { root: "Document", objectName: "АвансовыйОтчет" } as const

describe("metadataTargetOwnerFromRule", () => {
  it("uses self declaration for simple root objects", () => {
    expect(metadataTargetOwnerFromRule({ itemRule: documentRule, name: "Заказ" })).toEqual({
      root: "Document",
      objectName: "Заказ",
    })
  })

  it("inherits owner for forms", () => {
    const rule = {
      itemType: "ClientApplicationForm",
      metadataTargetOwner: { kind: "inherit" },
      properties: {},
    } as const satisfies MetadataItemRule

    expect(
      metadataTargetOwnerFromRule({
        itemRule: rule,
        name: "ФормаДокумента",
        context: {
          ...mockContext,
          importFromYAML: {
            metadataTargetOwners: [
              { itemType: "MetadataDocument", name: "Заказ", owner: { root: "Document", objectName: "Заказ" } },
            ],
          },
        },
      })
    ).toEqual({ root: "Document", objectName: "Заказ" })
  })

  it("reuses the owner of the current frame without resolving it twice", () => {
    const owner = {
      root: "ExternalDataSource",
      objectName: "Источник.Table.Таблица",
    } satisfies MetadataTargetOwner
    const rule = { itemType: "MetadataExternalDataSourceTable", properties: {} } as const satisfies MetadataItemRule

    expect(
      metadataTargetOwnerFromRule({
        itemRule: rule,
        name: "Таблица",
        context: {
          ...mockContext,
          importFromYAML: { metadataTargetOwners: [{ itemType: rule.itemType, name: "Таблица", owner }] },
        },
      })
    ).toEqual(owner)
  })
})

describe("string metadataTarget YAML", () => {
  it("exports canonical local member strings to short YAML", () => {
    expect(
      exportStringMetadataTargetToYAML({
        rule: documentRule.properties.defaultObjectForm,
        value: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        owner: documentOwner,
      })
    ).toBe("ФормаДокумента")
  })

  it("imports short YAML member strings to canonical model strings", () => {
    expect(
      importStringMetadataTargetFromYAML({
        rule: documentRule.properties.defaultObjectForm,
        value: "ФормаДокумента",
        owner: documentOwner,
      })
    ).toBe("Document.АвансовыйОтчет.Form.ФормаДокумента")
  })

  it("imports and exports common forms when objectRoots allows them", () => {
    const rule = documentRuleWithCommonForms.properties.defaultObjectForm
    expect(importStringMetadataTargetFromYAML({ rule, value: "ОбщаяФорма.ФормаДокумента", owner: documentOwner })).toBe(
      "CommonForm.ФормаДокумента"
    )
    expect(exportStringMetadataTargetToYAML({ rule, value: "CommonForm.ФормаДокумента", owner: documentOwner })).toBe(
      "ОбщаяФорма.ФормаДокумента"
    )
  })

  it("exports canonical object strings to YAML roots", () => {
    expect(
      exportStringMetadataTargetToYAML({
        rule: documentRuleWithNumerator.properties.numerator,
        value: "DocumentNumerator.СчетаФактуры",
        owner: { root: "Document", objectName: "СчетФактура" },
      })
    ).toBe("СчетаФактуры")
  })

  it("imports YAML object strings to canonical model roots", () => {
    expect(
      importStringMetadataTargetFromYAML({
        rule: documentRuleWithNumerator.properties.numerator,
        value: "СчетаФактуры",
        owner: { root: "Document", objectName: "СчетФактура" },
      })
    ).toBe("DocumentNumerator.СчетаФактуры")
  })

  it("rejects YAML object strings with unknown YAML roots", () => {
    expect(() =>
      importStringMetadataTargetFromYAML({
        rule: documentRuleWithNumerator.properties.numerator,
        value: "DocumentNumerator.СчетаФактуры",
        owner: documentOwner,
      })
    ).toThrow('Неизвестный корень "DocumentNumerator"')
  })

  it("rejects YAML object strings outside allowed roots", () => {
    expect(() =>
      importStringMetadataTargetFromYAML({
        rule: documentRuleWithNumerator.properties.numerator,
        value: "Документ.СчетФактура",
        owner: documentOwner,
      })
    ).toThrow('Корень "Document" не разрешён для цели метаданных')
  })

  it("keeps ordinary string properties unchanged", () => {
    const rule = documentRule.properties.comment
    expect(
      exportStringMetadataTargetToYAML({
        rule,
        value: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        owner: documentOwner,
      })
    ).toBe("Document.АвансовыйОтчет.Form.ФормаДокумента")
    expect(importStringMetadataTargetFromYAML({ rule, value: "ФормаДокумента", owner: documentOwner })).toBe(
      "ФормаДокумента"
    )
  })

  it("rejects local member strings when owner context is unavailable on import", () => {
    expect(() =>
      importStringMetadataTargetFromYAML({
        rule: documentRule.properties.defaultObjectForm,
        value: "ФормаДокумента",
        owner: undefined,
      })
    ).toThrow('Для metadataTarget kind "member" owner "this" требуется контекст текущего объекта')
  })

  it("rejects local member strings when owner context is unavailable on export", () => {
    expect(() =>
      exportStringMetadataTargetToYAML({
        rule: documentRule.properties.defaultObjectForm,
        value: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        owner: undefined,
      })
    ).toThrow('Для metadataTarget kind "member" owner "this" требуется контекст текущего объекта')
  })

  it("rejects YAML strings that do not match a member target", () => {
    expect(() =>
      importStringMetadataTargetFromYAML({
        rule: documentRule.properties.defaultObjectForm,
        value: "ОбщаяФорма.ФормаДокумента",
        owner: documentOwner,
      })
    ).toThrow()
  })

  it("rejects model strings that do not match a member target", () => {
    expect(() =>
      exportStringMetadataTargetToYAML({
        rule: documentRule.properties.defaultObjectForm,
        value: "CommonForm.ФормаДокумента",
        owner: documentOwner,
      })
    ).toThrow()
  })
})
