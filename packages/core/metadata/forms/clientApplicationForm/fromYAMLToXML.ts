import type { ConfigurationIndexReader } from "../../configurationIndex/sharedSnapshot"
import "../../commonObjects"
import { registerTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { buildClientApplicationBaseForm } from "./baseForm"
import { convertClientApplicationFormYAMLToXMLCore } from "./convertYAMLToXML"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormXML, ClientApplicationFormYAML } from "./types"

export const convertClientApplicationFormFromYAMLToXML =
  convertClientApplicationFormYAMLToXMLCore
export type {
  ConvertClientApplicationFormFromYAMLToXMLParams,
  DirectClientApplicationFormXMLResult,
} from "./convertYAMLToXML"

registerTypeRule("ClientApplicationForm", "yamlToXMLNestedRule", {
  kind: "externalFile",
  convert: ({
    context,
    yaml,
    baseYAML,
    baseConfigurationIndex,
    name,
    referenceXML,
  }) => {
    const rule = ClientApplicationFormRules
    const extensionYaml = yaml as ClientApplicationFormYAML
    const baseFormXML =
      baseYAML === undefined
        ? undefined
        : buildClientApplicationBaseForm({
            context,
            baseIndex: requireBaseConfigurationIndex(baseConfigurationIndex),
            baseYaml: baseYAML as ClientApplicationFormYAML,
            extensionYaml,
            formName: name,
            rule,
          })
    return {
      Form: convertClientApplicationFormYAMLToXMLCore({
        context,
        yaml: extensionYaml,
        name,
        referenceFormXML: referenceXML?.Form as ClientApplicationFormXML | undefined,
        ...(baseFormXML === undefined ? {} : { baseFormXML }),
        rule,
      }).formXML,
    }
  },
})

function requireBaseConfigurationIndex(
  baseConfigurationIndex: ConfigurationIndexReader | undefined
): ConfigurationIndexReader {
  if (baseConfigurationIndex !== undefined) return baseConfigurationIndex
  throw new Error("Для построения BaseForm не передан индекс основной конфигурации")
}
