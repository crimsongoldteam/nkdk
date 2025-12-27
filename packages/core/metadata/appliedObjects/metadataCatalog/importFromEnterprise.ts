import { MetadataCatalog, MetadataCatalogEnterprise } from "~/metadata/appliedObjects/metadataCatalog/types"
import { parseBoolean } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importMetadataAttributesFromEnterprise } from "~/metadata/commonObjects/metadataAttribute/importFromEnterprise"
import { importMetadataTabularSectionsFromEnterprise } from "~/metadata/commonObjects/metadataTabularSection/importFromEnterprise"
import { Context } from "~/metadata/context/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importMetadataCatalogFromEnterprise = (
  context: Context,
  data: MetadataCatalogEnterprise | undefined,
  name: string
): MetadataCatalog | undefined => {
  if (!data) return undefined

  return {
    name,
    synonym: importI8nTextFromEnterprise(context, data.Синоним),
    comment: data.Комментарий,
    hierarchical: parseBoolean(data.Иерархический, context),
    hierarchyType: importSystemEnumerationFromEnterprise(context, data.ВидИерархии, SE.HierarchyTypeFromEnterprise),
    attributes: importMetadataAttributesFromEnterprise(context, data.Реквизиты),
    tabularSections: importMetadataTabularSectionsFromEnterprise(context, data.ТабличныеЧасти),
  }
}
