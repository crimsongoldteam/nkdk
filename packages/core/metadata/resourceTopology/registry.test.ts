import { describe, expect, it, vi } from "vitest"
import type { MetadataItemRule, PropertyRule } from "../orchestration/property/types"

const itemRule = { itemType: "TestForm", properties: {} } as MetadataItemRule
const propertyRule = { type: "ChildFormNames" } as PropertyRule

describe("property resource topology registry", () => {
  it("describes registered child form resources in one contribution", async () => {
    await withFreshRegistry(async () => {
      const { registerCoreMetadata } = await import("../register")
      registerCoreMetadata()
      const { describePropertyResourceTopology } = await import("./registry")

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
          }),
          expect.objectContaining({
            kind: "externalFile",
            projectPattern: "Формы/{itemName}/Модуль.bsl",
            xmlPattern: "Forms/{itemName}/Ext/Form/Module.bsl",
          }),
        ])
      )
    })
  })

  it("returns all resource kinds from one property-type contribution", async () => {
    await withFreshRegistry(async () => {
      const { registerTypeRule } = await import("../orchestration/property/typeRuleRegistry")
      const { describePropertyResourceTopology } = await import("./registry")
      registerTypeRule("ChildFormNames", "resourceTopology", () => [
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
          source: { kind: "property", description: "forms:ChildFormNames" },
        }),
        expect.objectContaining({ kind: "xmlDocument", role: "metadata" }),
        expect.objectContaining({ kind: "xmlDocument", role: "body" }),
        expect.objectContaining({ kind: "externalFile" }),
      ])
    })
  })

  it("returns an empty list when the property type has no contribution", async () => {
    await withFreshRegistry(async () => {
      const { describePropertyResourceTopology } = await import("./registry")
      expect(describePropertyResourceTopology("forms", propertyRule)).toEqual([])
    })
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
  ] as const)("describes %s resources through the common contribution", async (_type, rule) => {
    await withFreshRegistry(async () => {
      const { registerCoreMetadata } = await import("../register")
      registerCoreMetadata()
      const { describePropertyResourceTopology } = await import("./registry")
      expect(describePropertyResourceTopology("value", rule as PropertyRule)).not.toEqual([])
    })
  })

  it("compiles registered project specs with their property resources", async () => {
    await withFreshRegistry(async () => {
      const { registerCoreMetadata } = await import("../register")
      registerCoreMetadata()
      const { compileRegisteredMetadataResourceTopology } = await import("./registry")
      const topology = compileRegisteredMetadataResourceTopology()

      expect(topology.assignments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            projectPattern: "Справочник/{ownerName}/Свойства.yaml",
            xmlDocuments: expect.arrayContaining([
              expect.objectContaining({ xmlPattern: "Catalogs/{ownerName}.xml", role: "metadata" }),
            ]),
          }),
          expect.objectContaining({
            projectPattern: "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
            ownerProjectPattern: "Справочник/{ownerName}/Свойства.yaml",
            xmlDocuments: expect.arrayContaining([
              expect.objectContaining({
                xmlPattern: "Catalogs/{ownerName}/Forms/{itemName}/Ext/Form.xml",
                role: "body",
              }),
            ]),
          }),
        ])
      )
    })
  })
})

async function withFreshRegistry(assertions: () => Promise<void>): Promise<void> {
  vi.resetModules()
  try {
    await assertions()
  } finally {
    vi.resetModules()
    const { registerCoreMetadata } = await import("../register")
    registerCoreMetadata()
  }
}
