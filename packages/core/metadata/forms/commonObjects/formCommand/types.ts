import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataSimpleValueXML } from "~/metadata/commonObjects/metadataValue/types"
import { PictureXML } from "~/metadata/commonObjects/picture/types"
import { UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { MetadataReferenceTypeByRule, MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { ButtonRepresentation, CurrentRowUse } from "~/metadata/systemEnumerations/types"
import { FormCommandRules } from "./rules"

export type FormCommand = MetadataTypeByRule<typeof FormCommandRules>

export type FormCommandReference = MetadataReferenceTypeByRule<typeof FormCommandRules>

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
  Representation?: ButtonRepresentation
  ModifiesSavedData?: boolean
  CurrentRowUse?: CurrentRowUse
  AssociatedTableElementId?: MetadataSimpleValueXML
}

export type FormCommandsXML = FormCommandXML | FormCommandXML[]

export type FormCommandYAML = YAMLTypeByRule<typeof FormCommandRules>

export type FormCommandsYAML = Record<string, FormCommandYAML>
