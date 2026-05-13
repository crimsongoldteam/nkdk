import { CommonAttributeContentXML } from "~/metadata/commonObjects/commonAttributeContent/types"
import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataPrimitiveValueXML, MetadataValueXML } from "~/metadata/commonObjects/metadataValue/types"
import { TypeDescriptionXML } from "~/metadata/commonObjects/typeDescription/types"
import { TypeLinkXML } from "~/metadata/commonObjects/typeLink/types"
import { ChoiceParameterLinksXML } from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import { ChoiceParametersXML } from "~/metadata/commonObjects/сhoiceParameters/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataCommonAttributeRules } from "./rules"

export type MetadataCommonAttribute = MetadataTypeByRule<typeof MetadataCommonAttributeRules>
export type MetadataCommonAttributeYAML = YAMLTypeByRule<typeof MetadataCommonAttributeRules>

type MinMaxValueXML = MetadataPrimitiveValueXML<"string"> | { "_xsi:nil": true }

export interface MetadataCommonAttributeXML {
  _version: string
  CommonAttribute: {
    _uuid: string
    Properties: {
      AuthenticationSeparation?: SE.CommonAttributeAuthenticationSeparation
      AutoUse?: SE.CommonAttributeAutoUse
      ChoiceFoldersAndItems?: SE.FoldersAndItemsUse
      ChoiceForm?: string
      ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput
      ChoiceParameterLinks?: ChoiceParameterLinksXML
      ChoiceParameters?: ChoiceParametersXML
      Comment?: string
      ConditionalSeparation?: string
      ConfigurationExtensionsSeparation?: SE.CommonAttributeConfigurationExtensionsSeparation
      Content?: CommonAttributeContentXML
      CreateOnInput?: SE.CreateOnInput
      DataHistory?: SE.DataHistoryUse
      DataSeparation?: SE.CommonAttributeDataSeparation
      DataSeparationUse?: string
      DataSeparationValue?: string
      EditFormat?: I8nTextXML
      ExtendedEdit?: boolean
      FillChecking?: SE.FillChecking
      FillFromFillingValue?: boolean
      FillValue?: MetadataValueXML
      Format?: I8nTextXML
      FullTextSearch?: SE.UseFullTextSearch
      Indexing?: SE.Indexing
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
      SeparatedDataUse?: SE.CommonAttributeSeparatedDataUse
      Synonym?: I8nTextXML
      ToolTip?: I8nTextXML
      Type: TypeDescriptionXML
      UsersSeparation?: SE.CommonAttributeUsersSeparation
    }
  }
}

registerMetadataItemRule({
  propertyType: "MetadataCommonAttribute",
  itemRule: MetadataCommonAttributeRules,
})
