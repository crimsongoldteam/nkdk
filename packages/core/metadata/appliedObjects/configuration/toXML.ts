import {
  Configuration,
  ConfigurationXML,
  ConfigurationPropertiesXML,
} from "~/metadata/appliedObjects/configuration/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertiesToXML } from "~/metadata/metadataFactory"
import { getUUID } from "../../helpers/uuid"
import { ConfigurationRules } from "./rules"

export const exportConfigurationToXML = (
  context: ConfigurationContext,
  data: Configuration | undefined
): ConfigurationXML | undefined => {
  if (!data) return undefined

  const exported = exportPropertiesToXML({
    context,
    metadataItem: data,
    rule: ConfigurationRules,
  })

  const properties = (exported.Configuration?.Properties ?? {}) as ConfigurationPropertiesXML

  const result: ConfigurationXML = {
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
    Configuration: {
      _uuid: getUUID(context),
      Properties: properties,
    },
  }

  return result
}
