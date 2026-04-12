import { MetadataCatalog, MetadataCatalogXML } from "~/metadata/appliedObjects/metadataCatalog/types"
import { getChildContextToXML } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { getUUID } from "~/metadata/helpers/uuid"
import { exportMetadataItemToXML } from "~/metadata/orchestration"
import { MetadataCatalogRules } from "./rules"

const ROOT_XML_ATTRS: Omit<MetadataCatalogXML, "Catalog"> = {
  _xmlns: "http://v8.1c.ru/8.3/MDClasses",
  "_xmlns:app": "http://v8.1c.ru/8.2/managed-application/core",
  "_xmlns:cfg": "http://v8.1c.ru/8.1/data/enterprise/current-config",
  "_xmlns:cmi": "http://v8.1c.ru/8.2/managed-application/cmi",
  "_xmlns:ent": "http://v8.1c.ru/8.1/data/enterprise",
  "_xmlns:lf": "http://v8.1c.ru/8.2/managed-application/logform",
  "_xmlns:style": "http://v8.1c.ru/8.1/data/ui/style",
  "_xmlns:sys": "http://v8.1c.ru/8.1/data/ui/fonts/system",
  "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
  "_xmlns:v8ui": "http://v8.1c.ru/8.1/data/ui",
  "_xmlns:web": "http://v8.1c.ru/8.1/data/ui/colors/web",
  "_xmlns:win": "http://v8.1c.ru/8.1/data/ui/colors/windows",
  "_xmlns:xen": "http://v8.1c.ru/8.3/xcf/enums",
  "_xmlns:xpr": "http://v8.1c.ru/8.3/xcf/predef",
  "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
  "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
  "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
  _version: "2.20",
}

export const exportMetadataCatalogToXML = (params: {
  context: ConfigurationContextWithExportToXML
  data: MetadataCatalog | undefined
  referenceData: MetadataCatalog | undefined
}): MetadataCatalogXML | undefined => {
  const { context, data, referenceData } = params
  if (!data) return undefined

  const parentPath = "Catalog.${data.name}"
  const currentContext = getChildContextToXML({
    context,
    itemType: MetadataCatalogRules.itemType,
    path: parentPath,
    name: data.name,
  })

  const flat = exportMetadataItemToXML({
    context: currentContext,
    data,
    rule: MetadataCatalogRules,
    referenceData,
  })

  if (flat == undefined) return undefined

  const catalogFromRules = flat.Catalog as MetadataCatalogXML["Catalog"]
  const childObjects = { ...catalogFromRules.ChildObjects }
  const forms = getFormsFromContext(currentContext)
  const templates = getTemplatesFromContext(currentContext)
  if (forms) childObjects.Form = forms
  if (templates) childObjects.Template = templates

  const result: MetadataCatalogXML = {
    ...ROOT_XML_ATTRS,
    Catalog: {
      _uuid: referenceData?.uuid ?? getUUID(currentContext),

      InternalInfo: catalogFromRules.InternalInfo,
      Properties: catalogFromRules.Properties,
      ...(Object.keys(childObjects).length > 0 ? { ChildObjects: childObjects } : {}),
    },
  }

  return result
}

const getFormsFromContext = (context: ConfigurationContextWithExportToXML): string[] | undefined => {
  const ctx = context.exportToXML.context
  return ctx && ctx.forms.length > 0 ? ctx.forms : undefined
}

const getTemplatesFromContext = (context: ConfigurationContextWithExportToXML): string[] | undefined => {
  const ctx = context.exportToXML.context
  return ctx && ctx.templates.length > 0 ? ctx.templates : undefined
}
