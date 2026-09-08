import type { ConfigurationContextWithExportToXML, XmlImportConfigurationContext } from "@nkdk/runtime"
import type { XmlComponentExportProfile } from "../project/xmlReconstructionProfile"

/** Добавляет к импортному контексту только готовые данные обычного XML-экспорта. */
export function createImportExportContext(
  context: XmlImportConfigurationContext,
  profile: XmlComponentExportProfile,
): ConfigurationContextWithExportToXML {
  return {
    ...context,
    exportToXML: {
      ...(context.exportToXML ?? {}),
      componentKind: profile.componentKind,
      adoptedUuids: profile.adoptedUuids,
      xmlDefaultVariantByLogicalAddress: profile.xmlDefaultVariantByLogicalAddress,
      ...(profile.typeDescriptionXMLNameByType === undefined
        ? {}
        : { typeDescriptionXMLNameByType: profile.typeDescriptionXMLNameByType }),
      version: context.exportToXML?.version ?? context.version,
      itemsTree: context.exportToXML?.itemsTree ?? [],
      context: {
        forms: [],
        templates: [],
        parentName: "",
        ...context.exportToXML?.context,
      },
    },
  }
}
