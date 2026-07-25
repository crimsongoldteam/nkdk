import { describe, expect, it } from "vitest"
import { importContentFromXML } from "../../../xml/import/importer"
import { resolveXmlImportComponent } from "../../importFromXml/componentDescriptor"
import { MetadataConfigurationExtensionRules } from "./rules"
import "./register"

const EXTENSION_XML = `
<MetaDataObject>
  <Configuration>
    <Properties>
      <Name>РасширениеПоУмолчанию</Name>
      <ConfigurationExtensionPurpose>Customization</ConfigurationExtensionPurpose>
    </Properties>
  </Configuration>
</MetaDataObject>
`

describe("configurationExtension register", () => {
  it("регистрирует descriptor расширения с отдельным корневым правилом", () => {
    const root = importContentFromXML<Record<string, unknown>>(EXTENSION_XML).MetaDataObject as Record<string, unknown>
    const descriptor = resolveXmlImportComponent(root)

    expect(descriptor.kind).toBe("configurationExtension")
    expect(descriptor.rootRule).toBe(MetadataConfigurationExtensionRules)
    expect(descriptor.resolveAddress(root)).toEqual({
      kind: "configurationExtension",
      name: "РасширениеПоУмолчанию",
    })
    expect(descriptor.baseAddress).toEqual({ kind: "configuration" })
    expect(descriptor.metadataItemAugmenter).toBe("configurationExtension")
  })
})
