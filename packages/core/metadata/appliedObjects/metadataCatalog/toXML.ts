import {
  CatalogInternalInfoParamsXML,
  MetadataCatalog,
  MetadataCatalogXML,
} from "~/metadata/appliedObjects/metadataCatalog/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportInternalInfoToXML } from "../../commonObjects/internalInfo/toXML"
import { getUUID } from "../../helpers/uuid"
import { exportPropertiesToXML } from "~/metadata/orchestration"
import { getDefaults } from "./defaults"
import { MetadataCatalogRules } from "./rules"

export interface MetadataCatalogContext extends ConfigurationContext {
  context: {
    forms: string[]
    templates: string[]
    parentName: string
  }
}

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

export const exportMetadataCatalogToXML = (
  context: MetadataCatalogContext,
  data: MetadataCatalog | undefined
): MetadataCatalogXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, context)
  const mergedData = { ...defaults, ...data, itemType: "MetadataCatalog" as const }

  const internalInfo = exportInternalInfoToXML<CatalogInternalInfoParamsXML>(context, [
    { name: `CatalogObject.${mergedData.name}`, category: "Object" },
    { name: `CatalogRef.${mergedData.name}`, category: "Ref" },
    { name: `CatalogSelection.${mergedData.name}`, category: "Selection" },
    { name: `CatalogList.${mergedData.name}`, category: "List" },
    { name: `CatalogManager.${mergedData.name}`, category: "Manager" },
  ])

  const flat = exportPropertiesToXML({
    context,
    metadataItem: mergedData,
    rule: MetadataCatalogRules,
  })

  const catalogFromRules = flat.Catalog as MetadataCatalogXML["Catalog"]
  const childObjects = { ...catalogFromRules.ChildObjects }
  const forms = getFormsFromContext(context)
  const templates = getTemplatesFromContext(context)
  if (forms) childObjects.Form = forms
  if (templates) childObjects.Template = templates

  const result: MetadataCatalogXML = {
    ...ROOT_XML_ATTRS,
    Catalog: {
      _uuid: getUUID(context),
      InternalInfo: internalInfo,
      Properties: catalogFromRules.Properties,
      ...(Object.keys(childObjects).length > 0 ? { ChildObjects: childObjects } : {}),
    },
  }

  return result
}

const getFormsFromContext = (context: MetadataCatalogContext): string[] | undefined => {
  if (!context.context) throw new Error("Context is not defined")
  return context.context.forms.length > 0 ? context.context.forms : undefined
}

const getTemplatesFromContext = (context: MetadataCatalogContext): string[] | undefined => {
  if (!context.context) throw new Error("Context is not defined")
  return context.context.templates.length > 0 ? context.context.templates : undefined
}
