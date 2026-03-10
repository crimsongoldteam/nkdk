import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { getUUID } from "~/metadata/helpers/uuid"
import { exportPropertiesToXML } from "~/metadata/orchestration"
import { ClientApplicationFormRules } from "./rules"
import { ClientApplicationForm, ClientApplicationFormXML, FormMetadataXML, FormRulesTags } from "./types"

export const exportClientApplicationFormToXML = (params: {
  context: ConfigurationContextWithExportToXML
  form: ClientApplicationForm
  referenceForm: ClientApplicationForm | undefined
}): ClientApplicationFormXML => {
  const { context, form, referenceForm } = params

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

export const setIdsToElements = (context: ConfigurationContextWithExportToXML): void => {
  const elementsMap = context.exportToXML?.context?.metadataForNumbering ?? []
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

  const properties = exportPropertiesToXML({
    context,
    metadata: form,
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
      Properties: sortObject({
        FormType: "Managed",
        Name: name,
        ...(properties.Form?.Properties ?? {}),
      }),
    },
  }

  return result
}
