import { prepareFormXML } from "./syncToXML"
import {
  defineMetadataExternalTransferCapability,
  defineMetadataXmlPrepareCapability,
} from "../../resourceTopology/adapters/capabilities"
import { composeMetadataRules } from "../../ruleRuntime/definition"

const formPrepareCapabilityRules = defineMetadataXmlPrepareCapability({
  id: "ClientApplicationForm",
  run: ({
    context,
    preparedYamlFile,
    baseFormPreparedYamlFile,
    currentConfigurationFormPreparedYamlFile,
    baseFormSourceKind,
    baseConfigurationIndex,
    baseFormContext,
    assignment,
    itemName,
    outputs,
    profile,
  }) => {
    const byRole = new Map(outputs.map((output) => [output.role, output]))
    const prepared = prepareFormXML({
      context,
      preparedYamlFile,
      formName: itemName,
      rule: assignment.itemRule,
      currentXMLPath: byRole.get("body")?.targetXmlPath,
      profile,
      ...(baseFormPreparedYamlFile === undefined
        ? {}
        : { baseFormPreparedYamlFile }),
      ...(currentConfigurationFormPreparedYamlFile === undefined
        ? {}
        : { currentConfigurationFormPreparedYamlFile }),
      ...(baseFormSourceKind === undefined ? {} : { baseFormSourceKind }),
      ...(baseConfigurationIndex === undefined
        ? {}
        : { baseConfigurationIndex }),
      ...(baseFormContext === undefined ? {} : { baseFormContext }),
    })
    return prepared.flatMap((document) => {
      const output = byRole.get(document.targetKind)
      return output === undefined
        ? []
        : [
            {
              declarationId: output.declarationId,
              targetXmlPath: output.targetXmlPath,
              ...document,
            },
          ]
    })
  },
})

const formTransferCapabilityRules = defineMetadataExternalTransferCapability({
  id: "ClientApplicationForm",
  projectToXml: (params) => params,
})

export const clientApplicationFormResourceCapabilityRules = composeMetadataRules(
  formPrepareCapabilityRules,
  formTransferCapabilityRules,
)
