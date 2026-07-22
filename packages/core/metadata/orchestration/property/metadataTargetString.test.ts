import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { importPropertiesFromYAML } from "./fromYAML"
import { metadataTargetOwnerFromRule } from "./metadataTargetString"
import { exportPropertiesToYAML } from "./toYAML"
import type { MetadataItemRule } from "./types"

const documentRule = {
  itemType: "MetadataDocument",
  itemTypePrefix: "Документ",
  metadataTargetOwner: { kind: "self", root: "Document" },
  properties: {
    name: { type: "string", defaultValue: ({ name }: { name?: string }) => name },
    comment: {
      yaml: "Комментарий",
      type: "string",
    },
    defaultObjectForm: {
      yaml: "ОсновнаяФормаОбъекта",
      type: "string",
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
    },
  },
} as const satisfies MetadataItemRule

describe("metadataTargetOwnerFromRule", () => {
  it("uses self declaration for simple root objects", () => {
    const rule = {
      itemType: "MetadataDocument",
      itemTypePrefix: "Документ",
      metadataTargetOwner: { kind: "self", root: "Document" },
      properties: {},
    } as const satisfies MetadataItemRule

    expect(metadataTargetOwnerFromRule({ itemRule: rule, name: "Заказ" })).toEqual({
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
    const owner = { root: "ExternalDataSource", objectName: "Источник.Table.Таблица" }
    const rule = {
      itemType: "MetadataExternalDataSourceTable",
      properties: {},
    } as const satisfies MetadataItemRule

    expect(
      metadataTargetOwnerFromRule({
        itemRule: rule,
        name: "Таблица",
        context: {
          ...mockContext,
          importFromYAML: {
            metadataTargetOwners: [{ itemType: rule.itemType, name: "Таблица", owner }],
          },
        },
      })
    ).toEqual(owner)
  })
})

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

describe("string metadataTarget YAML", () => {
  it("exports canonical local member strings to short YAML", () => {
    expect(
      exportPropertiesToYAML({
        context: mockContext,
        rule: documentRule,
        data: {
          itemType: "MetadataDocument",
          name: "АвансовыйОтчет",
          defaultObjectForm: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        },
      })
    ).toEqual({
      ОсновнаяФормаОбъекта: "ФормаДокумента",
    })
  })

  it("imports short YAML member strings to canonical model strings", () => {
    expect(
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRule,
        name: "АвансовыйОтчет",
        yaml: { ОсновнаяФормаОбъекта: "ФормаДокумента" },
      })
    ).toMatchObject({
      defaultObjectForm: "Document.АвансовыйОтчет.Form.ФормаДокумента",
    })
  })

  it("imports and exports common forms when objectRoots allows them", () => {
    expect(
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRuleWithCommonForms,
        name: "АвансовыйОтчет",
        yaml: { ОсновнаяФормаОбъекта: "ОбщаяФорма.ФормаДокумента" },
      })
    ).toMatchObject({
      defaultObjectForm: "CommonForm.ФормаДокумента",
    })

    expect(
      exportPropertiesToYAML({
        context: mockContext,
        rule: documentRuleWithCommonForms,
        data: {
          itemType: "MetadataDocument",
          name: "АвансовыйОтчет",
          defaultObjectForm: "CommonForm.ФормаДокумента",
        },
      })
    ).toEqual({
      ОсновнаяФормаОбъекта: "ОбщаяФорма.ФормаДокумента",
    })
  })

  it("exports canonical object strings to YAML roots", () => {
    expect(
      exportPropertiesToYAML({
        context: mockContext,
        rule: documentRuleWithNumerator,
        data: {
          itemType: "MetadataDocument",
          name: "СчетФактура",
          numerator: "DocumentNumerator.СчетаФактуры",
        },
      })
    ).toEqual({
      Нумератор: "СчетаФактуры",
    })
  })

  it("imports YAML object strings to canonical model roots", () => {
    expect(
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRuleWithNumerator,
        name: "СчетФактура",
        yaml: { Нумератор: "СчетаФактуры" },
      })
    ).toMatchObject({
      numerator: "DocumentNumerator.СчетаФактуры",
    })
  })

  it("rejects YAML object strings with unknown YAML roots", () => {
    expect(() =>
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRuleWithNumerator,
        name: "СчетФактура",
        yaml: { Нумератор: "DocumentNumerator.СчетаФактуры" },
      })
    ).toThrow('Неизвестный корень "DocumentNumerator"')
  })

  it("rejects YAML object strings outside allowed roots", () => {
    expect(() =>
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRuleWithNumerator,
        name: "СчетФактура",
        yaml: { Нумератор: "Документ.СчетФактура" },
      })
    ).toThrow('Корень "Document" не разрешён для цели метаданных')
  })

  it("keeps ordinary string properties unchanged", () => {
    expect(
      exportPropertiesToYAML({
        context: mockContext,
        rule: documentRule,
        data: {
          itemType: "MetadataDocument",
          name: "АвансовыйОтчет",
          comment: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        },
      })
    ).toEqual({
      Комментарий: "Document.АвансовыйОтчет.Form.ФормаДокумента",
    })

    expect(
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRule,
        name: "АвансовыйОтчет",
        yaml: { Комментарий: "ФормаДокумента" },
      })
    ).toMatchObject({
      comment: "ФормаДокумента",
    })
  })

  it("rejects local member strings when owner context is unavailable on import", () => {
    expect(() =>
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRule,
        yaml: { ОсновнаяФормаОбъекта: "ФормаДокумента" },
      })
    ).toThrow('Для metadataTarget kind "member" owner "this" требуется контекст текущего объекта')
  })

  it("rejects local member strings when owner context is unavailable on export", () => {
    expect(() =>
      exportPropertiesToYAML({
        context: mockContext,
        rule: documentRule,
        data: {
          itemType: "MetadataDocument",
          name: "",
          defaultObjectForm: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        },
      })
    ).toThrow('Для metadataTarget kind "member" owner "this" требуется контекст текущего объекта')
  })

  it("rejects YAML strings that do not match a member target", () => {
    expect(() =>
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRule,
        name: "АвансовыйОтчет",
        yaml: { ОсновнаяФормаОбъекта: "ОбщаяФорма.ФормаДокумента" },
      })
    ).toThrow()
  })

  it("rejects model strings that do not match a member target", () => {
    expect(() =>
      exportPropertiesToYAML({
        context: mockContext,
        rule: documentRule,
        data: {
          itemType: "MetadataDocument",
          name: "АвансовыйОтчет",
          defaultObjectForm: "CommonForm.ФормаДокумента",
        },
      })
    ).toThrow()
  })
})
