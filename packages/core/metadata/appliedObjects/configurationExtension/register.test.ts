import { describe, expect, it } from "vitest"
import { importContentFromXML } from "../../../xml/import/importer"
import { resolveXmlImportComponent } from "../../importFromXml/componentDescriptor"
import { MetadataConfigurationExtensionRules } from "./rules"
import { getMetadataComponentDescriptor } from "../../components/descriptor"
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
    expect(getMetadataComponentDescriptor(descriptor.kind).rootRule)
      .toBe(MetadataConfigurationExtensionRules)
    expect(descriptor.resolveRoot(root)).toEqual({
      address: {
        kind: "configurationExtension",
        name: "РасширениеПоУмолчанию",
      },
      itemName: "РасширениеПоУмолчанию",
    })
    expect(descriptor.baseAddress).toEqual({ kind: "configuration" })
    expect(descriptor.metadataItemAugmenter).toBe("configurationExtension")
  })
})
