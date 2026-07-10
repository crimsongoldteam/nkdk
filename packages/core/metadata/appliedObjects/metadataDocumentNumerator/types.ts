import { I8nTextXML } from "../../commonObjects/i8nText/types"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { registerMetadataItemRule } from "../../orchestration"
import * as SE from "../../systemEnumerations/types"
import { MetadataDocumentNumeratorRules } from "./rules"

export type MetadataDocumentNumerator = MetadataTypeByRule<typeof MetadataDocumentNumeratorRules>
export type MetadataDocumentNumeratorYAML = YAMLTypeByRule<typeof MetadataDocumentNumeratorRules>

export interface MetadataDocumentNumeratorXML {
  CheckUnique?: boolean
  Comment?: string
  Name?: string
  NumberAllowedLength?: SE.AllowedLength
  NumberLength?: number
  NumberPeriodicity?: SE.DocumentNumberPeriodicity
  NumberType?: SE.DocumentNumberType
  ObjectBelonging?: SE.ObjectBelonging
  Synonym?: I8nTextXML
}

registerMetadataItemRule({
  propertyType: "MetadataDocumentNumerator",
  itemRule: MetadataDocumentNumeratorRules,
})
