import { beforeAll, describe, expect, it } from "vitest"
import { registerTypeRule } from "../orchestration/property/typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "../orchestration/property/types"
import { registerCoreMetadata } from "../register"
import { compileRegisteredMetadataResourceTopology, describePropertyResourceTopology } from "./registry"
import type { CompiledMetadataResourceTopology } from "./types"
import {
  ClientApplicationFormRules,
  ClientApplicationFormWithExtendedPresentationRules,
} from "../forms/clientApplicationForm/rules"

const itemRule = { itemType: "TestForm", properties: {} } as MetadataItemRule
const propertyRule = { type: "TestChildFormNames" } as PropertyRule
let topology: CompiledMetadataResourceTopology

describe("property resource topology registry", () => {
  beforeAll(() => {
    registerCoreMetadata()
    topology = compileRegisteredMetadataResourceTopology()
  })

  it("describes registered child form resources in one contribution", () => {
    expect(
      describePropertyResourceTopology(
        "forms",
        {
          type: "ChildFormNames",
          folderName: "Формы",
        } as PropertyRule
      )
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "content",
          projectPattern: "Формы/{itemName}/Форма.yaml",
          role: "fileItem",
        }),
        expect.objectContaining({
          kind: "xmlDocument",
          xmlPattern: "Forms/{itemName}.xml",
          role: "metadata",
        }),
        expect.objectContaining({
          kind: "xmlDocument",
          xmlPattern: "Forms/{itemName}/Ext/Form.xml",
          role: "body",
          baseInput: {
            kind: "sameProjectPath",
            value: "wholeYaml",
          },
        }),
        expect.objectContaining({
          kind: "externalFile",
          projectPattern: "Формы/{itemName}/Модуль.bsl",
          xmlPattern: "Forms/{itemName}/Ext/Form/Module.bsl",
        }),
      ])
    )
  })

  it("uses the item rule declared by ChildFormNames", () => {
    const declarations = describePropertyResourceTopology(
      "forms",
      {
        type: "ChildFormNames",
        folderName: "Формы",
        itemRule,
      } as PropertyRule
    )

    expect(
      declarations.find(
        (declaration) => declaration.kind === "content"
      )
    ).toMatchObject({ itemRule })
  })

  it("returns all resource kinds from one property-type contribution", () => {
    registerTypeRule("TestChildFormNames", "resourceTopology", () => [
      {
        kind: "content",
        projectPattern: "Формы/{itemName}/Форма.yaml",
        role: "fileItem",
        required: true,
        repeatable: true,
        compositionImpact: "none",
        itemRule,
        source: { kind: "itemRule", description: "form content" },
      },
      {
        kind: "xmlDocument",
        assignmentProjectPattern: "",
        xmlPattern: "Forms/{itemName}.xml",
        role: "metadata",
        required: true,
        read: { inputRole: "metadata" },
        prepareCapabilityId: "form",
        source: { kind: "itemRule", description: "form metadata" },
      },
      {
        kind: "xmlDocument",
        assignmentProjectPattern: "",
        xmlPattern: "Forms/{itemName}/Ext/Form.xml",
        role: "body",
        required: true,
        read: { inputRole: "body" },
        prepareCapabilityId: "form",
        source: { kind: "itemRule", description: "form body" },
      },
      {
        kind: "externalFile",
        assignmentProjectPattern: "",
        projectPattern: "Формы/{itemName}/Модуль.bsl",
        xmlPattern: "Forms/{itemName}/Ext/Form/Module.bsl",
        direction: "both",
        transferCapabilityId: "copy",
        compositionImpact: "none",
        source: { kind: "itemRule", description: "form module" },
      },
    ])

    expect(describePropertyResourceTopology("forms", propertyRule)).toEqual([
      expect.objectContaining({
        kind: "content",
        source: expect.objectContaining({ kind: "property", description: "forms:TestChildFormNames" }),
      }),
      expect.objectContaining({ kind: "xmlDocument", role: "metadata" }),
      expect.objectContaining({ kind: "xmlDocument", role: "body" }),
      expect.objectContaining({ kind: "externalFile" }),
    ])
  })

  it("returns an empty list when the property type has no contribution", () => {
    expect(describePropertyResourceTopology("forms", { type: "UnknownPropertyType" } as PropertyRule)).toEqual([])
  })

  it.each([
    ["Module", { type: "Module", xmlPath: "Ext/Module.bsl", nkdkPath: "Модуль.bsl" }],
    ["Template", { type: "Template", xmlPath: "Ext/Template.xml", nkdkPath: "Template.xml" }],
    ["Help", { type: "Help", filePath: "Ext/Help.xml", nkdkDir: "Справка" }],
    ["ExternalFile", { type: "ExternalFile", xmlPath: "Ext/File.bin", nkdkPath: "Файл.bin" }],
    [
      "ExternalPicture",
      { type: "ExternalPicture", xmlPath: "Ext/Picture.xml", payloadXmlDir: "Ext/Picture", nkdkDir: "Картинка" },
    ],
    ["WSDefinitionSchemas", { type: "WSDefinitionSchemas" }],
    ["Recalculations", { type: "Recalculations" }],
  ] as const)("describes %s resources through the common contribution", (_type, rule) => {
    expect(describePropertyResourceTopology("value", rule as PropertyRule)).not.toEqual([])
  })

  it("compiles registered project specs with their property resources", () => {
    expect(topology.assignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          projectPattern: "Справочник/{ownerName}/Свойства.yaml",
          xmlDocuments: expect.arrayContaining([
            expect.objectContaining({ xmlPattern: "Catalogs/{ownerName}.xml", role: "metadata" }),
            expect.objectContaining({
              xmlPattern: "Catalogs/{ownerName}/Ext/AdditionalIndexes.xml",
              role: "property",
              prepareCapabilityId: "itemProperty",
              source: expect.objectContaining({ propertyName: "additionalIndexes" }),
            }),
          ]),
        }),
        expect.objectContaining({
          projectPattern: "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
          ownerProjectPattern: "Справочник/{ownerName}/Свойства.yaml",
          xmlDocuments: expect.arrayContaining([
            expect.objectContaining({
              xmlPattern: "Catalogs/{ownerName}/Forms/{itemName}/Ext/Form.xml",
              role: "body",
              baseInput: {
                kind: "sameProjectPath",
                value: "wholeYaml",
              },
            }),
          ]),
        }),
      ])
    )
    expect(
      topology.assignments
        .find((assignment) => assignment.projectPattern === "ОбщаяФорма/{ownerName}/Свойства.yaml")
        ?.xmlDocuments
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          xmlPattern: "CommonForms/{ownerName}/Ext/Form.xml",
          role: "body",
          prepareCapabilityId: "externalFileProperty",
          source: expect.objectContaining({ propertyName: "form" }),
          baseInput: {
            kind: "sameProjectPath",
            value: "sourceProperty",
          },
        }),
      ])
    )
  })

  it("selects the form rule in owner declarations", () => {
    const byPattern = (pattern: string) =>
      topology.assignments.find(
        (assignment) => assignment.projectPattern === pattern
      )

    expect(
      byPattern("Обработка/{ownerName}/Формы/{itemName}/Форма.yaml")
        ?.itemRule
    ).toBe(ClientApplicationFormWithExtendedPresentationRules)
    expect(
      byPattern("Отчет/{ownerName}/Формы/{itemName}/Форма.yaml")?.itemRule
    ).toBe(ClientApplicationFormWithExtendedPresentationRules)
    expect(
      byPattern("Справочник/{ownerName}/Формы/{itemName}/Форма.yaml")
        ?.itemRule
    ).toBe(ClientApplicationFormRules)
  })
})
