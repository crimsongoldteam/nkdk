import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { dynamicListFormAttributeQuery, rowFilterFormAttributeQuery } from "~/metadata/forms/elements/table/rules"
import { getUUID } from "~/metadata/helpers/uuid"
import { exportPropertiesToXML } from "~/metadata/orchestration"
import { CypherCache } from "~/metadata/orchestration/property/cypherCache"
import { ClientApplicationFormRules } from "./rules"
import { ClientApplicationForm, ClientApplicationFormXML, FormMetadataXML, FormRulesTags } from "./types"

export const exportClientApplicationFormToXML = (params: {
  context: ConfigurationContextWithExportToXML
  form: ClientApplicationForm
  referenceForm: ClientApplicationForm | undefined
}): ClientApplicationFormXML => {
  const { context, form, referenceForm } = params
  ensureTableFormAttributeCypherCache(context, form)

  const properties = exportPropertiesToXML({
    context,
    metadata: form,
    referenceMetadata: referenceForm,
    rule: ClientApplicationFormRules,
    tag: [FormRulesTags.Form],
  })

  setIdsToElements(context)

  const result = {
    _xmlns: "http://v8.1c.ru/8.3/xcf/logform",
    "_xmlns:app": "http://v8.1c.ru/8.2/managed-application/core",
    "_xmlns:cfg": "http://v8.1c.ru/8.1/data/enterprise/current-config",
    "_xmlns:dcscor": "http://v8.1c.ru/8.1/data-composition-system/core",
    "_xmlns:dcssch": "http://v8.1c.ru/8.1/data-composition-system/schema",
    "_xmlns:dcsset": "http://v8.1c.ru/8.1/data-composition-system/settings",
    "_xmlns:ent": "http://v8.1c.ru/8.1/data/enterprise",
    "_xmlns:lf": "http://v8.1c.ru/8.2/managed-application/logform",
    "_xmlns:style": "http://v8.1c.ru/8.1/data/ui/style",
    "_xmlns:sys": "http://v8.1c.ru/8.1/data/ui/fonts/system",
    "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
    "_xmlns:v8ui": "http://v8.1c.ru/8.1/data/ui",
    "_xmlns:web": "http://v8.1c.ru/8.1/data/ui/colors/web",
    "_xmlns:win": "http://v8.1c.ru/8.1/data/ui/colors/windows",
    "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
    "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
    "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    _version: "2.20",
    ...properties,
  }

  return result
}

const ensureTableFormAttributeCypherCache = (
  context: ConfigurationContextWithExportToXML,
  form: ClientApplicationForm
): void => {
  const existingCache = context.exportToXML.cypherCache
  const hasDynamicListRows = existingCache?.get(dynamicListFormAttributeQuery) !== undefined
  const hasRowFilterRows = existingCache?.get(rowFilterFormAttributeQuery) !== undefined

  if (hasDynamicListRows && hasRowFilterRows) return

  const cache = existingCache ?? new CypherCache()

  if (!hasDynamicListRows) {
    cache.set(dynamicListFormAttributeQuery, getFormAttributeRowsByType(form, "DynamicList"))
  }

  if (!hasRowFilterRows) {
    cache.set(rowFilterFormAttributeQuery, getRowFilterFormAttributeRows(form))
  }

  context.exportToXML.cypherCache = cache
}

const getFormAttributeRowsByType = (
  form: ClientApplicationForm,
  typeName: "DynamicList"
): Record<string, unknown>[] => {
  return (form.attributes ?? [])
    .filter(
      (attr) =>
        attr.itemType === "FormAttribute" &&
        Array.isArray(attr.type?.type) &&
        attr.type.type.includes(typeName)
    )
    .map((attr) => ({ name: attr.name }))
}

const getRowFilterFormAttributeRows = (form: ClientApplicationForm): Record<string, unknown>[] => {
  return (form.attributes ?? [])
    .filter((attr) => {
      if (attr.itemType !== "FormAttribute") return false
      if (!Array.isArray(attr.type?.type)) return false

      return !attr.type.type.includes("DynamicList") && !attr.type.type.includes("ValueTree")
    })
    .map((attr) => ({ name: attr.name }))
}

const globalNumberingScope = Symbol("globalNumberingScope")

export const setIdsToElements = (context: ConfigurationContextWithExportToXML): void => {
  const elementsMap = context.exportToXML?.context?.metadataForNumbering ?? []
  const groups = new Map<unknown, typeof elementsMap>()

  for (const element of elementsMap) {
    const scope = element.numberingScope ?? globalNumberingScope
    const group = groups.get(scope)
    if (group === undefined) {
      groups.set(scope, [element])
    } else {
      group.push(element)
    }
  }

  for (const group of groups.values()) {
    setIdsToElementsGroup(group)
  }
}

const setIdsToElementsGroup = (
  elementsMap: NonNullable<ConfigurationContextWithExportToXML["exportToXML"]["context"]>["metadataForNumbering"]
): void => {
  const occupiedIds = new Set<string>()

  for (const element of elementsMap) {
    const reference = element.referenceElement
    if (reference && typeof reference.id === "string") {
      element.xmlElement._id = reference.id
      occupiedIds.add(reference.id)
    }
  }

  for (const element of elementsMap) {
    if (element.xmlElement._id) continue

    let counter = 1
    while (occupiedIds.has(counter.toString())) {
      counter++
    }
    element.xmlElement._id = counter.toString()
    occupiedIds.add(element.xmlElement._id)
  }
}

export const exportFormMetadataToXML = (params: {
  context: ConfigurationContextWithExportToXML
  form: ClientApplicationForm
  referenceForm: ClientApplicationForm | undefined
  name: string
}): FormMetadataXML => {
  const { context, form, referenceForm, name } = params

  const metadata = { ...form, name: name }

  const properties = exportPropertiesToXML({
    context,
    metadata,
    referenceMetadata: referenceForm,
    rule: ClientApplicationFormRules,
    tag: [FormRulesTags.Metadata],
  })

  const uuid = referenceForm?.uuid ?? getUUID(context)

  const result = {
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
    Form: {
      _uuid: uuid,
      Properties: properties.Form?.Properties,
    },
  }

  return result
}
