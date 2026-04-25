import { AdditionalIndexesEnvelope } from "~/metadata/commonObjects/additionalIndex/rules"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const PredefinedRules = {
  itemType: "Predefined",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "PredefinedData",
      rootAttributes: {
        _xmlns: "http://v8.1c.ru/8.3/xcf/predef",
        "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
        "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
        "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
        "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "_xsi:type": "CatalogPredefinedItems",
        _version: "2.20",
      },
      forReferenceOnly: true,
      isFileRoot: true,
    },
    items: {
      type: "PredefinedItemCollection",
      xml: "Item",
      yamlInline: true,
      yaml: "items",
    },
  },
} as const satisfies MetadataItemRule

/**
 * Конверт (envelope) для внешнего XML-файла Ext/Predefined.xml.
 *
 * Сохраняется до завершения Phase 5: оркестратор `appliedObject/{convertFromXML,syncToXML}.ts`
 * читает `externalFileEnvelopes`, чтобы понять, как обрабатывать внешние файлы. После Phase 5
 * эти константы удаляются.
 */
export const PredefinedDataEnvelope = {
  container: "PredefinedData",
  rootAttributes: PredefinedRules.properties.xmlRoot.rootAttributes,
} as const

export interface ExternalFileEnvelope {
  readonly container: string
  readonly rootAttributes: Record<string, string>
  readonly childTag?: string
}

/**
 * Карта: type → envelope для внешних XML-файлов, используемая оркестраторами.
 */
export const externalFileEnvelopes: Record<string, ExternalFileEnvelope> = {
  Predefined: PredefinedDataEnvelope,
  AdditionalIndex: AdditionalIndexesEnvelope,
}
