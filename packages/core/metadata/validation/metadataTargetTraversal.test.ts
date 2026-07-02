import { describe, expect, it } from "vitest"
import "../commonObjects/metadataTargets/validationHandlers"
import { registerTypeRule } from "../orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "../orchestration/property/types"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { collectMetadataTargetReferencesInModel, validateMetadataTargetsInModel } from "./metadataTargetTraversal"

const emptyParsedYaml = () => parseMetadataYaml("")

describe("validateMetadataTargetsInModel", () => {
  it("calls registered validation handler for properties with metadataTarget", () => {
    const calls: unknown[] = []
    const testType = "__MetadataTargetTraversalUnit" as never

    registerTypeRule(testType, "validateMetadataTarget", (params) => {
      calls.push(params.value)
      return []
    })

    const rule: MetadataItemRule = {
      itemType: "MetadataCatalog",
      properties: {
        inputByString: {
          type: testType,
          yaml: "ВводПоСтроке",
          metadataTarget: { kind: "object", roots: ["Catalog"] },
        },
      },
    } as never

    const diagnostics = validateMetadataTargetsInModel({
      filePath: "/tmp/Свойства.yaml",
      parsed: emptyParsedYaml(),
      model: { itemType: "MetadataCatalog", inputByString: "Catalog.Контрагенты" } as never,
      rule,
      resolver: {} as never,
    })

    expect(diagnostics).toEqual([])
    expect(calls).toEqual(["Catalog.Контрагенты"])
  })

  it("validates string member targets with current owner context", () => {
    const calls: unknown[] = []
    const rule: MetadataItemRule = {
      itemType: "MetadataDocument",
      properties: {
        formRef: {
          type: "string",
          yaml: "ФормаСсылки",
          metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
        },
      },
    } as never

    const diagnostics = validateMetadataTargetsInModel({
      filePath: "/tmp/Документ/АвансовыйОтчет/Свойства.yaml",
      parsed: emptyParsedYaml(),
      model: { itemType: "MetadataDocument", formRef: "Document.АвансовыйОтчет.Form.ФормаДокумента" } as never,
      rule,
      resolver: {
        resolveMember(params: unknown) {
          calls.push(params)
          return { ok: true }
        },
      } as never,
      owner: { root: "Document", objectName: "АвансовыйОтчет" },
    })

    expect(diagnostics).toEqual([])
    expect(calls).toEqual([
      expect.objectContaining({
        target: expect.objectContaining({
          kind: "member",
          root: "Document",
          objectName: "АвансовыйОтчет",
          segments: [{ kind: "Form", name: "ФормаДокумента" }],
        }),
      }),
    ])
  })

  it("reports diagnostics for string values that do not match member targets", () => {
    const rule: MetadataItemRule = {
      itemType: "MetadataDocument",
      properties: {
        mainForm: {
          type: "string",
          yaml: "ОсновнаяФорма",
          metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
        },
      },
    } as never

    const diagnostics = validateMetadataTargetsInModel({
      filePath: "/tmp/Документ/АвансовыйОтчет/Свойства.yaml",
      parsed: emptyParsedYaml(),
      model: { itemType: "MetadataDocument", mainForm: "CommonForm.ФормаДокумента" } as never,
      rule,
      resolver: {} as never,
      owner: { root: "Document", objectName: "АвансовыйОтчет" },
    })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        source: "structure",
      }),
    ])
  })

  it("validates owner object references accepted by member targets with allowOwner", () => {
    const rule: MetadataItemRule = {
      itemType: "MetadataFunctionalOption",
      properties: {
        content: {
          type: "string",
          yaml: "Состав",
          metadataTarget: { kind: "member", owner: "explicit", allowOwner: true },
        },
      },
    } as never

    const diagnostics = validateMetadataTargetsInModel({
      filePath: "/tmp/ФункциональнаяОпция/Опция/Свойства.yaml",
      parsed: emptyParsedYaml(),
      model: { itemType: "MetadataFunctionalOption", content: "Catalog.НетТакого" } as never,
      rule,
      resolver: {
        resolveObject() {
          return {
            ok: false,
            diagnostics: [
              {
                filePath: "/tmp/Справочник/НетТакого/Свойства.yaml",
                line: 1,
                col: 1,
                source: "reference",
                severity: "error",
                message: 'Не найден объект "Справочник.НетТакого"',
              },
            ],
          }
        },
      } as never,
    })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        source: "reference",
        severity: "error",
        message: 'Не найден объект "Справочник.НетТакого"',
      }),
    ])
  })

  it("passes object target filters from validation handlers to resolver", () => {
    const calls: unknown[] = []
    const rule: MetadataItemRule = {
      itemType: "MetadataCatalog",
      properties: {
        styleColor: {
          type: "MetadataItemLink",
          yaml: "Цвет",
          metadataTarget: {
            kind: "object",
            roots: ["StyleItem"],
            filters: [{ kind: "styleItemType", values: ["Color"] }],
          },
        },
      },
    } as never

    const diagnostics = validateMetadataTargetsInModel({
      filePath: "/tmp/Справочник/Товары/Свойства.yaml",
      parsed: emptyParsedYaml(),
      model: { itemType: "MetadataCatalog", styleColor: "StyleItem.ОсновнойЦвет" } as never,
      rule,
      resolver: {
        resolveObject(params: unknown) {
          calls.push(params)
          return { ok: true }
        },
      } as never,
    })

    expect(diagnostics).toEqual([])
    expect(calls).toEqual([
      expect.objectContaining({
        filters: [{ kind: "styleItemType", values: ["Color"] }],
        target: expect.objectContaining({
          kind: "object",
          root: "StyleItem",
          objectName: "ОсновнойЦвет",
        }),
      }),
    ])
  })

  it("validates metadata targets in nested collection items", () => {
    const calls: unknown[] = []
    const testCollectionType = "__MetadataTargetTraversalNestedCollectionUnit" as never
    const tabularSectionRule: MetadataItemRule = {
      itemType: "MetadataTabularSection",
      properties: {
        name: { type: "string" },
        defaultForm: {
          type: "string",
          yaml: "ФормаПоУмолчанию",
          metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
        },
      },
    } as never

    registerTypeRule(testCollectionType, "collectionItemRule", {
      itemRule: tabularSectionRule,
    })

    const rule: MetadataItemRule = {
      itemType: "MetadataDocument",
      properties: {
        tabularSections: {
          type: testCollectionType,
          yaml: "ТабличныеЧасти",
        },
      },
    } as never

    const diagnostics = validateMetadataTargetsInModel({
      filePath: "/tmp/Документ/АвансовыйОтчет/Свойства.yaml",
      parsed: emptyParsedYaml(),
      model: {
        itemType: "MetadataDocument",
        tabularSections: [
          {
            itemType: "MetadataTabularSection",
            name: "Товары",
            defaultForm: "Document.АвансовыйОтчет.Form.ФормаДокумента",
          },
        ],
      } as never,
      rule,
      resolver: {
        resolveMember(params: unknown) {
          calls.push(params)
          return { ok: true }
        },
      } as never,
      owner: { root: "Document", objectName: "АвансовыйОтчет" },
    })

    expect(diagnostics).toEqual([])
    expect(calls).toEqual([
      expect.objectContaining({
        target: expect.objectContaining({
          kind: "member",
          root: "Document",
          objectName: "АвансовыйОтчет",
          segments: [{ kind: "Form", name: "ФормаДокумента" }],
        }),
      }),
    ])
  })

  it("collects pending metadata target references without resolving them", () => {
    const rule: MetadataItemRule = {
      itemType: "MetadataFunctionalOption",
      properties: {
        content: {
          type: "MetadataItemLinks",
          yaml: "СоставФункциональнойОпции",
          metadataTarget: { kind: "member", owner: "explicit" },
        },
      },
    } as never

    const references = collectMetadataTargetReferencesInModel({
      filePath: "/tmp/ФункциональнаяОпция/Опция/Свойства.yaml",
      parsed: parseMetadataYaml(["СоставФункциональнойОпции:", "  - Catalog.Номенклатура.Attribute.Артикул"].join("\n")),
      model: {
        itemType: "MetadataFunctionalOption",
        content: ["Catalog.Номенклатура.Attribute.Артикул"],
      } as never,
      rule,
    })

    expect(references.diagnostics).toEqual([])
    expect(references.references).toEqual([
      expect.objectContaining({
        filePath: "/tmp/ФункциональнаяОпция/Опция/Свойства.yaml",
        yamlPath: ["СоставФункциональнойОпции", 0],
        canonical: "Catalog.Номенклатура.Attribute.Артикул",
        target: expect.objectContaining({
          kind: "member",
          root: "Catalog",
          objectName: "Номенклатура",
          segments: [{ kind: "Attribute", name: "Артикул" }],
        }),
        constraint: expect.objectContaining({ kind: "member", owner: "explicit" }),
      }),
    ])
  })

  it("collects structure diagnostics for invalid pending metadata targets", () => {
    const rule: MetadataItemRule = {
      itemType: "MetadataDocument",
      properties: {
        mainForm: {
          type: "string",
          yaml: "ОсновнаяФорма",
          metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
        },
      },
    } as never

    const references = collectMetadataTargetReferencesInModel({
      filePath: "/tmp/Документ/АвансовыйОтчет/Свойства.yaml",
      parsed: parseMetadataYaml("ОсновнаяФорма: CommonForm.ФормаДокумента"),
      model: { itemType: "MetadataDocument", mainForm: "CommonForm.ФормаДокумента" } as never,
      rule,
      owner: { root: "Document", objectName: "АвансовыйОтчет" },
    })

    expect(references.references).toEqual([])
    expect(references.diagnostics).toEqual([
      expect.objectContaining({
        source: "structure",
        severity: "error",
      }),
    ])
  })
})
