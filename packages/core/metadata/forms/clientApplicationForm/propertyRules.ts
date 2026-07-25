import { dirname, join } from "path"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type {
  SyncExternalFromXMLFunction,
  SyncExternalToXMLFunction,
} from "../../orchestration/property/fn"
import {
  copyFormItemExternalFilesFromXML,
  copyFormItemExternalFilesToXML,
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

registerTypeRule("ClientApplicationForm", "nestedItemRule", { itemRule: ClientApplicationFormRules })
registerTypeRule("ClientApplicationForm", "resolveNestedImportXMLSources", ({ context, xml }) => [
  createClientApplicationFormBodyImportSource({ context, xml }),
])
registerTypeRule("ClientApplicationForm", "exportToJSONSchema", exportClientApplicationFormToJSONSchema)
registerTypeRule("ClientApplicationForm", "syncExternalFromXML", syncClientApplicationFormExternalFromXML)
registerTypeRule("ClientApplicationForm", "syncExternalToXML", syncClientApplicationFormExternalToXML)
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
    ...describeFormExternalResourceDeclarations({
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
