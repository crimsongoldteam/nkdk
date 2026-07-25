import { dirname, join } from "path"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { describeMetadataRuleProjectResources } from "../../project/ruleResources"
import { DynamicListRules } from "../commonObjects/dynamicList/rules"
import type {
  ProjectResourcesFunction,
  SyncExternalFromXMLFunction,
  SyncExternalToXMLFunction,
} from "../../orchestration/property/fn"
import {
  copyFormItemExternalFilesFromXML,
  copyFormItemExternalFilesToXML,
  describeFormItemResourceDeclarations,
  describeFormItemXmlImportRoutes,
} from "./externalItemFiles"
import { copyExistingRawFile } from "./externalRawFiles"
import { ClientApplicationFormRules } from "./rules"
import { createClientApplicationFormBodyImportSource } from "./xmlImportSources"
import { exportClientApplicationFormToJSONSchema } from "./toJSONSchema"
import { prepareFormXML } from "./syncToXML"
import {
  registerMetadataExternalTransferCapability,
  registerMetadataXmlPrepareCapability,
} from "../../resourceTopology/capabilities"

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

const syncClientApplicationFormExternalToXML: SyncExternalToXMLFunction = async (params) => {
  if (params.rule.filePath === undefined) return

  const formXmlDir = getDirectFormXmlDir({ baseDir: params.xmlDir, rule: params.rule })
  await copyFormItemExternalFilesToXML({
    formNkdkDir: params.nkdkDir,
    formXmlDir,
    xmlManifest: params.xmlManifest,
  })
  await copyExistingRawFile({
    sourcePath: join(params.nkdkDir, "Form.bin"),
    targetPath: join(formXmlDir, "Form.bin"),
    xmlManifest: params.xmlManifest,
  })
}

const describeClientApplicationFormProjectResources: ProjectResourcesFunction = () => [
  {
    kind: "yaml",
    role: "resourceOnly",
    projectPattern: "Form.bin",
    required: false,
    repeatable: false,
    owner: "currentItem",
    compositionImpact: "none",
    source: { kind: "propertyType", type: "ClientApplicationForm" },
  },
  {
    kind: "directory",
    role: "resourceOnly",
    projectPattern: "Справка",
    required: false,
    repeatable: false,
    owner: "currentItem",
    compositionImpact: "none",
    source: { kind: "propertyType", type: "ClientApplicationForm" },
  },
  ...describeMetadataRuleProjectResources(ClientApplicationFormRules),
  ...describeMetadataRuleProjectResources(DynamicListRules),
]

registerTypeRule("ClientApplicationForm", "nestedItemRule", { itemRule: ClientApplicationFormRules })
registerTypeRule("ClientApplicationForm", "resolveNestedImportXMLSources", ({ context, xml }) => [
  createClientApplicationFormBodyImportSource({ context, xml }),
])
registerTypeRule("ClientApplicationForm", "exportToJSONSchema", exportClientApplicationFormToJSONSchema)
registerTypeRule("ClientApplicationForm", "syncExternalFromXML", syncClientApplicationFormExternalFromXML)
registerTypeRule("ClientApplicationForm", "syncExternalToXML", syncClientApplicationFormExternalToXML)
registerTypeRule("ClientApplicationForm", "projectResources", describeClientApplicationFormProjectResources)
registerTypeRule("ClientApplicationForm", "xmlImportRoutes", ({ propertyRule }) => {
  const filePath = propertyRule?.filePath
  if (filePath === undefined) return []
  return [
    {
      kind: "assignment",
      xmlPattern: filePath,
      targetPattern: "",
      role: "properties",
      inputRole: "body",
      itemType: "",
      source: { kind: "propertyType", type: "ClientApplicationForm" },
    },
    {
      kind: "externalFile",
      xmlPattern: join(dirname(filePath), "Form.bin").replace(/\\/g, "/"),
      targetPattern: "Form.bin",
      assignmentTargetPattern: "",
      source: { kind: "propertyType", type: "ClientApplicationForm" },
    },
    ...describeFormItemXmlImportRoutes({
      xmlFormDirPattern: dirname(filePath).replace(/\\/g, "/"),
      targetFormDirPattern: "",
      assignmentTargetPattern: "",
    }),
  ]
})
registerTypeRule("ClientApplicationForm", "resourceTopology", ({ propertyRule }) => {
  const filePath = propertyRule?.filePath
  if (filePath === undefined) return []
  const xmlFormDir = dirname(filePath).replace(/\\/g, "/")
  return [
    {
      kind: "xmlDocument",
      assignmentProjectPattern: "",
      xmlPattern: filePath,
      role: "body",
      required: true,
      read: { inputRole: "body" },
      prepareCapabilityId: "ClientApplicationForm",
      source: { kind: "property", description: "ClientApplicationForm" },
    },
    {
      kind: "externalFile",
      assignmentProjectPattern: "",
      xmlPattern: join(xmlFormDir, "Form.bin").replace(/\\/g, "/"),
      projectPattern: "Form.bin",
      direction: "both",
      transferCapabilityId: "ClientApplicationForm",
      compositionImpact: "none",
      source: { kind: "property", description: "ClientApplicationForm" },
    },
    ...describeFormItemResourceDeclarations({
      xmlFormDirPattern: xmlFormDir,
      targetFormDirPattern: "",
    }),
  ]
})

registerMetadataXmlPrepareCapability({
  id: "ClientApplicationForm",
  run: ({ context, preparedYamlFile, itemName, outputs, profile }) => {
    const byRole = new Map(outputs.map((output) => [output.role, output]))
    const prepared = prepareFormXML({
      context,
      preparedYamlFile,
      formName: itemName,
      currentXMLPath: byRole.get("body")?.targetXmlPath,
      profile,
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
