import { I8nTextXML } from "../../commonObjects/i8nText/types"
import { InternalInfoItemsXML } from "../../commonObjects/internalInfo/types"
import { MetadataPrimitiveValueXML } from "../../commonObjects/metadataValue/types"
import { TypeDescriptionXML } from "../../commonObjects/typeDescription/types"
import { TypeLinkXML } from "../../commonObjects/typeLink/types"
import { ChoiceParameterLinksXML } from "../../commonObjects/сhoiceParameterLinks/types"
import { ChoiceParametersXML } from "../../commonObjects/сhoiceParameters/types"
import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import * as SE from "../../systemEnumerations/types"
import { MetadataConstantRules } from "./rules"

export type MetadataConstant = MetadataTypeByRule<typeof MetadataConstantRules>
export type MetadataConstantYAML = YAMLTypeByRule<typeof MetadataConstantRules>

export type ConstantInternalInfoParamsXML = [
  { name: string; category: "Manager" },
  { name: string; category: "ValueManager" },
  { name: string; category: "ValueKey" },
]

type MinMaxValueXML = MetadataPrimitiveValueXML<"string"> | { "_xsi:nil": true }

export interface MetadataConstantXML {
  _xmlns?: string
  "_xmlns:app"?: string
  "_xmlns:cfg"?: string
  "_xmlns:cmi"?: string
  "_xmlns:ent"?: string
  "_xmlns:lf"?: string
  "_xmlns:style"?: string
  "_xmlns:sys"?: string
  "_xmlns:v8"?: string
  "_xmlns:v8ui"?: string
  "_xmlns:web"?: string
  "_xmlns:win"?: string
  "_xmlns:xen"?: string
  "_xmlns:xpr"?: string
  "_xmlns:xr"?: string
  "_xmlns:xs"?: string
  "_xmlns:xsi"?: string
  _version: string
  Constant: {
    _uuid: string
    InternalInfo: InternalInfoItemsXML<ConstantInternalInfoParamsXML> | undefined
    Properties: {
      ChoiceFoldersAndItems?: SE.FoldersAndItemsUse
      ChoiceForm?: string
      ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput
      ChoiceParameterLinks?: ChoiceParameterLinksXML
      ChoiceParameters?: ChoiceParametersXML
      Comment?: string
      DataHistory?: SE.DataHistoryUse
      DataLockControlMode?: SE.DefaultDataLockControlMode
      DefaultForm?: string
      EditFormat?: I8nTextXML
      ExecuteAfterWriteDataHistoryVersionProcessing?: boolean
      Explanation?: I8nTextXML
      ExtendedEdit?: boolean
      ExtendedPresentation?: I8nTextXML
      FillChecking?: SE.FillChecking
      Format?: I8nTextXML
      LinkByType?: TypeLinkXML
      MarkNegatives?: boolean
      Mask?: string
      MaxValue?: MinMaxValueXML
      MinValue?: MinMaxValueXML
      MultiLine?: boolean
      Name: string
      ObjectBelonging?: SE.ObjectBelonging
      PasswordMode?: boolean
      QuickChoice?: SE.UseQuickChoice
      Synonym?: I8nTextXML
      ToolTip?: I8nTextXML
      Type: TypeDescriptionXML
      UpdateDataHistoryImmediatelyAfterWrite?: boolean
      UseStandardCommands?: boolean
    }
  }
}

registerMetadataItemRule({
  propertyType: "MetadataConstant",
  itemRule: MetadataConstantRules,
})
