import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataPrimitiveValueXML } from "~/metadata/commonObjects/metadataValue/types"
import { PictureXML } from "~/metadata/commonObjects/picture/types"
import { UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection"
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { ButtonRepresentation, CurrentRowUse } from "~/metadata/systemEnumerations/types"
import { importFormCommandsFromXML } from "./fromXML"
import { FormCommandRules } from "./rules"
import { exportFormCommandsToXML } from "./toXML"

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
  toXML: exportFormCommandsToXML,
})
