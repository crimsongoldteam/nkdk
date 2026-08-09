import { dirname, join } from "path"
import { registerTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { SyncExternalFromXMLFunction } from "../../ruleRuntime/property/fn"
import {
  copyFormItemExternalFilesFromXML,
  describeFormExternalResourceDeclarations,
} from "./externalItemFiles"
import { copyExistingRawFile } from "./externalRawFiles"
import { ClientApplicationFormRules } from "./rules"
import { createClientApplicationFormBodyImportSource } from "./xmlImportSources"
import { exportClientApplicationFormToJSONSchema } from "./toJSONSchema"
import { prepareFormXML } from "./syncToXML"
import {
  registerMetadataExternalTransferCapability,
  registerMetadataXmlPrepareCapability,
} from "../../resourceTopology/adapters/capabilities"

const getDirectFormXmlDir = (params: { baseDir: string; rule: { filePath?: string } }): string =>
  join(params.baseDir, dirname(params.rule.filePath ?? ""))

const syncClientApplicationFormExternalFromXML: SyncExternalFromXMLFunction = async (params) => {
  if (params.rule.filePath === undefined) return

  const formXmlDir = getDirectFormXmlDir({ baseDir: join(params.xmlDir, params.name), rule: params.rule })
  await copyFormItemExternalFilesFromXML({
    formXmlDir,
    formNkdkDir: params.nkdkDir,
  })
  await copyExistingRawFile({
    sourcePath: join(formXmlDir, "Form.bin"),
    targetPath: join(params.nkdkDir, "Form.bin"),
  })
}

registerTypeRule("ClientApplicationForm", "nestedItemRule", { itemRule: ClientApplicationFormRules })
registerTypeRule("ClientApplicationForm", "resolveNestedImportXMLSources", ({ context, xml }) => [
  createClientApplicationFormBodyImportSource({ context, xml }),
])
registerTypeRule("ClientApplicationForm", "exportToJSONSchema", exportClientApplicationFormToJSONSchema)
registerTypeRule("ClientApplicationForm", "syncExternalFromXML", syncClientApplicationFormExternalFromXML)
registerTypeRule("ClientApplicationForm", "resourceTopology", ({ propertyRule }) => {
  const filePath = propertyRule?.filePath
  if (filePath === undefined) return []
  const xmlFormDir = dirname(filePath).replace(/\\/g, "/")
  return [
    {
      kind: "yamlCompanion",
      assignmentProjectPattern: "",
      projectPattern: "БазоваяФорма.yaml",
      required: false,
      itemRule: ClientApplicationFormRules,
      projectRole: "form",
      indexContribution: "isolated",
      logicalAddressSegment: "ОсноваФормы",
      source: { kind: "property", description: "ClientApplicationForm" },
    },
    {
      kind: "xmlDocument",
      assignmentProjectPattern: "",
      xmlPattern: filePath,
      role: "body",
      required: true,
      read: { inputRole: "body" },
      prepareCapabilityId: "externalFileProperty",
      baseInput: {
        kind: "sameProjectPath",
        value: "sourceProperty",
      },
      source: { kind: "property", description: "ClientApplicationForm" },
    },
    ...describeFormExternalResourceDeclarations({
      xmlFormDirPattern: xmlFormDir,
      targetFormDirPattern: "",
    }),
  ]
})

registerMetadataXmlPrepareCapability({
  id: "ClientApplicationForm",
  run: ({
    context,
    preparedYamlFile,
    basePreparedYamlFile,
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
      ...(basePreparedYamlFile === undefined ? {} : { basePreparedYamlFile }),
      ...(baseConfigurationIndex === undefined
        ? {}
        : { baseConfigurationIndex }),
      ...(baseFormContext === undefined ? {} : { baseFormContext }),
    })
    return prepared.flatMap((document) => {
      const output = byRole.get(document.targetKind)
      return output === undefined
        ? []
        : [{ declarationId: output.declarationId, targetXmlPath: output.targetXmlPath, ...document }]
    })
  },
})
registerMetadataExternalTransferCapability({
  id: "ClientApplicationForm",
  projectToXml: (params) => params,
})
