import { I8nTextXML } from "../../../commonObjects/i8nText/types"
import { MetadataPrimitiveValueXML } from "../../../commonObjects/metadataValue/types"
import { PictureXML } from "../../../commonObjects/picture/types"
import { UserVisibleXML } from "../../../commonObjects/userVisible/types"
import { registerMetadataItemCollectionRule } from "../../../orchestration/metadataCollection"
import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { ButtonRepresentation, CurrentRowUse } from "../../../systemEnumerations/types"
import { importFormCommandsFromXML } from "./fromXML"
import { importFormCommandsFromXMLToYAML } from "./fromXMLToYAML"
import { FormCommandRules } from "./rules"

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
  Representation?: ButtonRepresentation | "TextPicture"
  ModifiesSavedData?: boolean
  CurrentRowUse?: CurrentRowUse
  AssociatedTableElementId?: MetadataPrimitiveValueXML
}

export type FormCommandsXML = FormCommandXML | FormCommandXML[]

export type FormCommandYAML = YAMLTypeByRule<typeof FormCommandRules>

export type FormCommandsYAML = Record<string, FormCommandYAML>

registerMetadataItemCollectionRule({
  propertyType: "FormCommands",
  itemRule: FormCommandRules,
  xmlElement: "Command",
  keyField: "name",
  fromXML: importFormCommandsFromXML,
  fromXMLToYAML: importFormCommandsFromXMLToYAML,
  mapItemOutput: ({ xml }) => {
    const { _name, _id, ...properties } = xml
    const result = { _name, _id: typeof _id === "string" ? _id : "", ...properties }
    if (result.Representation === "PictureAndText") result.Representation = "TextPicture"
    return result
  },
})
