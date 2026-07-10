import { I8nTextXML } from "../../commonObjects/i8nText/types"
import { InternalInfoItemsXML } from "../../commonObjects/internalInfo/types"
import { TypeDescriptionXML } from "../../commonObjects/typeDescription/types"
import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import * as SE from "../../systemEnumerations/types"
import { MetadataDefinedTypeRules } from "./rules"

export type MetadataDefinedType = MetadataTypeByRule<typeof MetadataDefinedTypeRules>
export type MetadataDefinedTypeYAML = YAMLTypeByRule<typeof MetadataDefinedTypeRules>

export type DefinedTypeInternalInfoParamsXML = [{ name: string; category: "DefinedType" }]

export interface MetadataDefinedTypeXML {
  _version: string
  DefinedType: {
    _uuid: string
    InternalInfo: InternalInfoItemsXML<DefinedTypeInternalInfoParamsXML> | undefined
    Properties: {
      Comment?: string
      Name: string
      ObjectBelonging?: SE.ObjectBelonging
      Synonym?: I8nTextXML
      Type?: TypeDescriptionXML
    }
  }
}

registerMetadataItemRule({
  propertyType: "MetadataDefinedType",
  itemRule: MetadataDefinedTypeRules,
})
