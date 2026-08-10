import { dirname, join } from "path"
import type { SyncExternalFromXMLFunction } from "../../ruleRuntime/property/fn"
import {
  definePropertyTypeRule,
  propertyTypesFromContributions,
} from "../../ruleRuntime/property/propertyRuleRegistrySet"
import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"
import {
  copyFormItemExternalFilesFromXML,
  describeFormExternalResourceDeclarations,
} from "./externalItemFiles"
import { copyExistingRawFile } from "./externalRawFiles"
import { ClientApplicationFormRules } from "./rules"
import { createClientApplicationFormBodyImportSource } from "./xmlImportSources"
import { exportClientApplicationFormToJSONSchema } from "./toJSONSchema"

const getDirectFormXmlDir = (params: {
  baseDir: string
  rule: { filePath?: string }
}): string => join(params.baseDir, dirname(params.rule.filePath ?? ""))

const syncClientApplicationFormExternalFromXML: SyncExternalFromXMLFunction =
  async (params) => {
    if (params.rule.filePath === undefined) return

    const formXmlDir = getDirectFormXmlDir({
      baseDir: join(params.xmlDir, params.name),
      rule: params.rule,
    })
    await copyFormItemExternalFilesFromXML({
      formXmlDir,
      formNkdkDir: params.nkdkDir,
    })
    await copyExistingRawFile({
      sourcePath: join(formXmlDir, "Form.bin"),
      targetPath: join(params.nkdkDir, "Form.bin"),
    })
  }

export const clientApplicationFormPropertyRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: propertyTypesFromContributions([
    definePropertyTypeRule("ClientApplicationForm", "nestedItemRule", {
      itemRule: ClientApplicationFormRules,
    }),
    definePropertyTypeRule(
      "ClientApplicationForm",
      "resolveNestedImportXMLSources",
      ({ context, xml }) => [
        createClientApplicationFormBodyImportSource({ context, xml }),
      ],
    ),
    definePropertyTypeRule(
      "ClientApplicationForm",
      "exportToJSONSchema",
      exportClientApplicationFormToJSONSchema,
    ),
    definePropertyTypeRule(
      "ClientApplicationForm",
      "syncExternalFromXML",
      syncClientApplicationFormExternalFromXML,
    ),
    definePropertyTypeRule(
      "ClientApplicationForm",
      "resourceTopology",
      ({ propertyRule }) => {
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
            source: {
              kind: "property",
              description: "ClientApplicationForm",
            },
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
            source: {
              kind: "property",
              description: "ClientApplicationForm",
            },
          },
          ...describeFormExternalResourceDeclarations({
            xmlFormDirPattern: xmlFormDir,
            targetFormDirPattern: "",
          }),
        ]
      },
    ),
  ]),
})
