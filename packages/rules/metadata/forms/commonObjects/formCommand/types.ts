import { I8nTextXML } from "../../../commonObjects/i8nText/types"
import { MetadataPrimitiveValueXML } from "../../../commonObjects/metadataValue/types"
import { PictureXML } from "../../../commonObjects/picture/types"
import { UserVisibleXML } from "../../../commonObjects/userVisible/types"
import { defineMetadataItemCollectionRule } from "../../../ruleRuntime/metadataCollection"
import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { CurrentRowUse, FormCommandButtonRepresentation } from "../../../systemEnumerations/types"
import { importFormCommandsFromXMLToYAML } from "./fromXMLToYAML"
import { FormCommandRules } from "./rules"
import { registerFormXmlIdReservation } from "@nkdk/runtime"
import { defineMetadataRules, type PrepareXMLItemOutputFunction } from "@nkdk/runtime/rule-kit"

export type FormCommand = FormTypeByRule<typeof FormCommandRules>

export type FormCommands = FormCommand[]

export interface FormCommandXML {
  _name: string
  _id: string
  Title?: I8nTextXML
  ToolTip?: I8nTextXML
  Use?: UserVisibleXML
  Shortcut?: string
  Picture?: PictureXML
  Action?: string
  Representation?: FormCommandButtonRepresentation
  ModifiesSavedData?: boolean
  CurrentRowUse?: CurrentRowUse
  AssociatedTableElementId?: MetadataPrimitiveValueXML
}

export type FormCommandsXML = FormCommandXML | FormCommandXML[]

export type FormCommandYAML = YAMLTypeByRule<typeof FormCommandRules>

export type FormCommandsYAML = Record<string, FormCommandYAML>

const commandCollection = defineMetadataItemCollectionRule({
  propertyType: "FormCommands",
  itemRule: FormCommandRules,
  xmlElement: "Command",
  keyField: "name",
  configurationIndexUidSegment: "Команда",
  requiredIdentity: "xmlId",
  fromXMLToYAML: importFormCommandsFromXMLToYAML,
})

const prepareCommandOutput: PrepareXMLItemOutputFunction = ({ context }) => ({
  attributes: ({ _name, _id, ...attributes }) => ({
    _name, _id: typeof _id === "string" ? _id : "", ...attributes,
  }),
  initialize(body) {
    const runtime = context.exportToXML.configurationIndex
    registerFormXmlIdReservation(body, {
      ...(runtime === undefined ? {} : { runtime }),
      space: "commands",
    })
  },
})

export const metadataRuleLayer000 = defineMetadataRules({
  ...commandCollection,
  propertyTypes: {
    ...commandCollection.propertyTypes,
    FormCommands: { ...commandCollection.propertyTypes.FormCommands, prepareXMLItemOutput: prepareCommandOutput },
  },
})
