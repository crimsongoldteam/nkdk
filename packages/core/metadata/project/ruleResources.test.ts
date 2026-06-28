import { beforeEach, describe, expect, it, vi } from "vitest"
import { MetadataConfigurationRules } from "~/metadata/appliedObjects/configuration/rules"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataCommonFormRules } from "~/metadata/appliedObjects/metadataCommonForm/rules"
import { MetadataReportRules } from "~/metadata/appliedObjects/metadataReport/rules"
import { DynamicListRules } from "~/metadata/forms/commonObjects/dynamicList/rules"
import { ClientApplicationFormRules } from "~/metadata/forms/clientApplicationForm/rules"
import { getTypeRule, registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { registerCoreMetadata } from "~/metadata/register"
import {
  describeMetadataRuleResources,
  describeMetadataRuleProjectResources,
  describeMetadataRuleXmlSyncRoutes,
  matchProjectPattern,
  type MetadataProjectDynamicDescriptor,
  type MetadataProjectExternalXmlDescriptor,
  type MetadataProjectXmlDescriptor,
} from "./ruleResources"
import {
  describeMetadataRuleResources as indexDescribeMetadataRuleResources,
  type MetadataProjectExternalXmlDescriptor as PublicMetadataProjectExternalXmlDescriptor,
  type MetadataProjectExternalXmlPathDescriptor as PublicMetadataProjectExternalXmlPathDescriptor,
} from "./index"

describe("describeMetadataRuleResources", () => {
  beforeEach(() => {
    registerCoreMetadata()
  })

  it("describes YAML properties and XML object resource from item rule directories", () => {
    expect(describeMetadataRuleResources(MetadataCatalogRules)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "yaml",
          role: "properties",
          itemTypePrefix: "Справочник",
        }),
        expect.objectContaining({
          kind: "xml",
          role: "objectXml",
          xmlDir: "Catalogs",
        }),
      ])
    )
  })

  it("describes external XML resources from filePath properties", () => {
    const resources = describeMetadataRuleResources(MetadataCatalogRules)

    expect(resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "xml",
          role: "externalXml",
          propertyName: "predefined",
          propertyType: "Predefined",
          filePath: "Ext/Predefined.xml",
          xmlPathKind: "sameAsFilePath",
        }),
        expect.objectContaining({
          kind: "xml",
          role: "externalXml",
          propertyName: "help",
          propertyType: "Help",
          filePath: "Ext/Help.xml",
          xmlPathKind: "sameAsFilePath",
        }),
      ])
    )
  })

  it("describes dynamic XML path separately from fixed property filePath", () => {
    const reportHelp = describeMetadataRuleResources(MetadataReportRules).find(
      (resource): resource is MetadataProjectXmlDescriptor =>
        resource.kind === "xml" && resource.role === "externalXml" && resource.propertyName === "help"
    )

    expect(reportHelp).toMatchObject({
      filePath: "Ext/Help.xml",
      propertyName: "help",
      propertyType: "Help",
      xmlPathKind: "dynamic",
    })
    expect(reportHelp).not.toHaveProperty("xmlPath")
  })

  it("enforces external XML descriptor path contracts at type level", () => {
    const staticDescriptor: MetadataProjectExternalXmlDescriptor = {
      kind: "xml",
      role: "externalXml",
      propertyName: "help",
      propertyType: "Help",
      filePath: "Ext/Help.xml",
      xmlPathKind: "static",
      xmlPath: "Report/Ext/Help.xml",
    }
    const dynamicDescriptor: MetadataProjectExternalXmlDescriptor = {
      kind: "xml",
      role: "externalXml",
      propertyName: "help",
      propertyType: "Help",
      filePath: "Ext/Help.xml",
      xmlPathKind: "dynamic",
    }
    const sameAsFilePathDescriptor: MetadataProjectExternalXmlDescriptor = {
      kind: "xml",
      role: "externalXml",
      propertyName: "predefined",
      propertyType: "Predefined",
      filePath: "Ext/Predefined.xml",
      xmlPathKind: "sameAsFilePath",
    }
    const publicStaticDescriptor: PublicMetadataProjectExternalXmlDescriptor = staticDescriptor
    const publicStaticPath: PublicMetadataProjectExternalXmlPathDescriptor = {
      xmlPathKind: "static",
      xmlPath: "Report/Ext/Help.xml",
    }

    expect(staticDescriptor.xmlPath).toBe("Report/Ext/Help.xml")
    expect(dynamicDescriptor).not.toHaveProperty("xmlPath")
    expect(sameAsFilePathDescriptor).not.toHaveProperty("xmlPath")
    expect(publicStaticDescriptor.xmlPath).toBe("Report/Ext/Help.xml")
    expect(publicStaticPath.xmlPath).toBe("Report/Ext/Help.xml")

    // @ts-expect-error static descriptors must include xmlPath.
    const staticDescriptorWithoutPath: MetadataProjectExternalXmlDescriptor = {
      kind: "xml",
      role: "externalXml",
      propertyName: "help",
      propertyType: "Help",
      filePath: "Ext/Help.xml",
      xmlPathKind: "static",
    }
    const dynamicDescriptorWithPath: MetadataProjectExternalXmlDescriptor = {
      kind: "xml",
      role: "externalXml",
      propertyName: "help",
      propertyType: "Help",
      filePath: "Ext/Help.xml",
      xmlPathKind: "dynamic",
      // @ts-expect-error dynamic descriptors must not include xmlPath.
      xmlPath: "Report/Ext/Help.xml",
    }
    const dynamicDescriptorWithUndefinedPath: MetadataProjectExternalXmlDescriptor = {
      kind: "xml",
      role: "externalXml",
      propertyName: "help",
      propertyType: "Help",
      filePath: "Ext/Help.xml",
      xmlPathKind: "dynamic",
      // @ts-expect-error dynamic descriptors must not include xmlPath, even as undefined.
      xmlPath: undefined,
    }
    const sameAsFilePathDescriptorWithPath: MetadataProjectExternalXmlDescriptor = {
      kind: "xml",
      role: "externalXml",
      propertyName: "predefined",
      propertyType: "Predefined",
      filePath: "Ext/Predefined.xml",
      xmlPathKind: "sameAsFilePath",
      // @ts-expect-error sameAsFilePath descriptors must not include xmlPath.
      xmlPath: "Ext/Predefined.xml",
    }
    const sameAsFilePathDescriptorWithUndefinedPath: MetadataProjectExternalXmlDescriptor = {
      kind: "xml",
      role: "externalXml",
      propertyName: "predefined",
      propertyType: "Predefined",
      filePath: "Ext/Predefined.xml",
      xmlPathKind: "sameAsFilePath",
      // @ts-expect-error sameAsFilePath descriptors must not include xmlPath, even as undefined.
      xmlPath: undefined,
    }

    void staticDescriptorWithoutPath
    void dynamicDescriptorWithPath
    void dynamicDescriptorWithUndefinedPath
    void sameAsFilePathDescriptorWithPath
    void sameAsFilePathDescriptorWithUndefinedPath
  })

  it("describes dynamic external handlers for child forms and templates", () => {
    const dynamicResources = describeMetadataRuleResources(MetadataCatalogRules).filter(
      (resource): resource is MetadataProjectDynamicDescriptor => resource.kind === "dynamic"
    )

    expect(dynamicResources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "syncExternal",
          propertyName: "forms",
          propertyType: "ChildFormNames",
          hasSyncExternalFromXML: true,
          hasSyncExternalToXML: true,
          syncExternalOnly: false,
        }),
        expect.objectContaining({
          role: "syncExternal",
          propertyName: "templates",
          propertyType: "ChildTemplateNames",
          hasSyncExternalFromXML: true,
          hasSyncExternalToXML: true,
          syncExternalOnly: false,
        }),
      ])
    )
  })

  it("describes root configuration YAML and dynamic syncExternal resources", () => {
    const resources = describeMetadataRuleResources(MetadataConfigurationRules)

    expect(resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "yaml",
          role: "configuration",
        }),
        expect.objectContaining({
          kind: "dynamic",
          role: "syncExternal",
          propertyName: "managedApplicationModule",
          propertyType: "Module",
          syncExternalOnly: true,
        }),
      ])
    )
  })

  it("describes syncExternalOnly resources even without registered sync handlers", () => {
    expect(describeMetadataRuleResources(ClientApplicationFormRules)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "dynamic",
          role: "syncExternal",
          propertyName: "itemPictures",
          propertyType: "ExternalFormItemFile",
          hasSyncExternalFromXML: false,
          hasSyncExternalToXML: false,
          syncExternalOnly: true,
        }),
      ])
    )
  })

  it("describes external form files as XML and dynamic syncExternal resources", () => {
    const resources = describeMetadataRuleResources(MetadataCommonFormRules)

    expect(resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "xml",
          role: "externalXml",
          propertyName: "form",
          propertyType: "ClientApplicationForm",
          filePath: "Ext/Form.xml",
          xmlPathKind: "sameAsFilePath",
        }),
        expect.objectContaining({
          kind: "dynamic",
          role: "syncExternal",
          propertyName: "form",
          propertyType: "ClientApplicationForm",
          hasSyncExternalFromXML: true,
          hasSyncExternalToXML: true,
          syncExternalOnly: false,
        }),
      ])
    )
  })

  it("describes external file name source for asset resources", () => {
    expect(describeMetadataRuleResources(DynamicListRules)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "asset",
          role: "externalFile",
          propertyName: "queryText",
          propertyType: "string",
          nkdkDir: "ДинамическийСписок",
          extension: "query",
          nameFrom: "parent",
        }),
      ])
    )
  })

  it("does not register type rules while describing resources", async () => {
    await withFreshRegistry(async () => {
      const { clearTypeRulesRegistry, getTypeRule } = await import(
        "~/metadata/orchestration/property/typeRuleRegistry"
      )
      const { MetadataCatalogRules } = await import("~/metadata/appliedObjects/metadataCatalog/rules")
      const { describeMetadataRuleResources } = await import("./ruleResources")

      clearTypeRulesRegistry()

      expect(getTypeRule("ChildFormNames", "syncExternalFromXML")).toBeUndefined()
      expect(describeMetadataRuleResources(MetadataCatalogRules)).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "dynamic",
            propertyName: "forms",
            propertyType: "ChildFormNames",
          }),
        ])
      )
      expect(getTypeRule("ChildFormNames", "syncExternalFromXML")).toBeUndefined()
    })
  })

  it("does not register type rules from the public descriptor entrypoint", async () => {
    await withFreshRegistry(async () => {
      const { clearTypeRulesRegistry, getTypeRule } = await import(
        "~/metadata/orchestration/property/typeRuleRegistry"
      )

      clearTypeRulesRegistry()

      expect(getTypeRule("ChildFormNames", "syncExternalFromXML")).toBeUndefined()
      const publicProject = await import("./index")

      expect(publicProject.describeMetadataRuleResources).toBeTypeOf("function")
      expect(getTypeRule("ChildFormNames", "syncExternalFromXML")).toBeUndefined()
    })
  })

  it("exports rule resource descriptor API from project index", () => {
    expect(indexDescribeMetadataRuleResources).toBe(describeMetadataRuleResources)
  })
})

describe("project resource type-rule contracts", () => {
  it("registers project resource descriptors for a property type", () => {
    registerTypeRule("ChildFormNames", "projectResources", () => [
      {
        kind: "yaml",
        role: "fileItem",
        projectPattern: "Формы/{itemName}/Форма.yaml",
        required: true,
        repeatable: true,
        owner: "currentItem",
        compositionImpact: "none",
        source: { kind: "propertyType", type: "ChildFormNames" },
      },
    ])

    expect(getTypeRule("ChildFormNames", "projectResources")?.({} as never)).toEqual([
      expect.objectContaining({
        kind: "yaml",
        role: "fileItem",
        projectPattern: "Формы/{itemName}/Форма.yaml",
        compositionImpact: "none",
      }),
    ])
  })

  it("registers XML sync routes and writers for a property type", () => {
    const writer = async () => undefined
    registerTypeRule("ChildFormNames", "xmlSyncRoutes", () => [
      {
        kind: "fileItem",
        yamlPattern: "Формы/{itemName}/Форма.yaml",
        xmlPathPattern: "Forms/{itemName}.xml",
        writerType: "propertyType",
        source: { kind: "propertyType", type: "ChildFormNames" },
      },
    ])
    registerTypeRule("ChildFormNames", "xmlSyncWriter", writer)

    expect(getTypeRule("ChildFormNames", "xmlSyncRoutes")?.({} as never)[0]).toMatchObject({
      kind: "fileItem",
      yamlPattern: "Формы/{itemName}/Форма.yaml",
      xmlPathPattern: "Forms/{itemName}.xml",
    })
    expect(getTypeRule("ChildFormNames", "xmlSyncWriter")).toBe(writer)
  })
})

describe("metadata rule resources and XML routes", () => {
  beforeEach(() => {
    registerCoreMetadata()
  })

  it("describes owner properties as configuration composition resource", () => {
    expect(describeMetadataRuleProjectResources(MetadataCatalogRules)).toContainEqual(
      expect.objectContaining({
        kind: "yaml",
        role: "properties",
        projectPattern: "Свойства.yaml",
        compositionImpact: "configurationComposition",
      })
    )
  })

  it("does not hard-code MetadataCatalog for XML root names", () => {
    expect(describeMetadataRuleXmlSyncRoutes(MetadataCatalogRules)).toContainEqual(
      expect.objectContaining({
        kind: "owner",
        yamlPattern: "Свойства.yaml",
        xmlPathPattern: "Catalogs/{ownerName}.xml",
      })
    )
  })

  it("matches named project patterns", () => {
    expect(matchProjectPattern("Формы/{itemName}/Форма.yaml", "Формы/ФормаЭлемента/Форма.yaml")).toEqual({
      itemName: "ФормаЭлемента",
    })
    expect(matchProjectPattern("Формы/{itemName}/Форма.yaml", "Формы/ФормаЭлемента/Модуль.bsl")).toBeUndefined()
  })
})

async function withFreshRegistry(assertions: () => Promise<void>): Promise<void> {
  vi.resetModules()
  try {
    await assertions()
  } finally {
    vi.resetModules()
    const { registerCoreMetadata } = await import("~/metadata/register")
    registerCoreMetadata()
  }
}
