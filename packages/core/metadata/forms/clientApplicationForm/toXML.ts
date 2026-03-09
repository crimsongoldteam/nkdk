import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { getUUID } from "~/metadata/helpers/uuid"
import { exportPropertiesToXML } from "~/metadata/orchestration"
import { exportEventsToXML } from "~/metadata/orchestration/event"
import { ClientApplicationFormRules } from "./rules"
import {
  ClientApplicationForm,
  ClientApplicationFormMetadataReference,
  ClientApplicationFormReference,
  ClientApplicationFormXML,
  FormMetadataXML,
  FormRulesTags,
} from "./types"

export const exportClientApplicationFormToXML = (params: {
  context: ConfigurationContextWithExportToXML
  form: ClientApplicationForm
  referenceForm: ClientApplicationFormReference | undefined
}): ClientApplicationFormXML => {
  const { context, form, referenceForm } = params

  const properties = exportPropertiesToXML({
    context,
    metadata: form,
    referenceMetadata: referenceForm,
    rule: ClientApplicationFormRules,
    tag: [FormRulesTags.Form],
  })

  const events = exportEventsToXML({ context, rule: ClientApplicationFormRules, data: form })

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
    ...events,
  }

  return result
}

export const exportFormMetadataToXML = (params: {
  context: ConfigurationContextWithExportToXML
  form: ClientApplicationForm
  referenceForm: ClientApplicationFormMetadataReference | undefined
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

  // const parentPath = getParentFromContext(context, ["MetadataCatalog"]).path
  // const path = `${parentPath}.Form.${name}`
  // const uuid = receiveUUID({ context, parentPath, path })
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
