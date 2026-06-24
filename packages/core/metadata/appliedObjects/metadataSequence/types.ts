import { AdditionalIndexesXML } from "~/metadata/commonObjects/additionalIndex/types"
import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { InternalInfoItemsXML } from "~/metadata/commonObjects/internalInfo/types"
import { MetadataItemLinksXML } from "~/metadata/commonObjects/metadataRef/types"
import { MetadataSequenceDimensionsXML } from "~/metadata/commonObjects/metadataSequenceDimension/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataSequenceRules } from "./rules"

export type MetadataSequence = MetadataTypeByRule<typeof MetadataSequenceRules>
export type MetadataSequenceYAML = YAMLTypeByRule<typeof MetadataSequenceRules>

export type SequenceInternalInfoParamsXML = [
  { name: string; category: "Record" },
  { name: string; category: "Manager" },
  { name: string; category: "RecordSet" },
]

export interface MetadataSequenceXML {
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
  Sequence: {
    _uuid: string
    InternalInfo: InternalInfoItemsXML<SequenceInternalInfoParamsXML> | undefined
    Properties: {
      AdditionalIndexes?: AdditionalIndexesXML
      Comment?: string
      DataLockControlMode?: SE.DefaultDataLockControlMode
      Documents?: MetadataItemLinksXML
      MoveBoundaryOnPosting?: SE.MoveBoundaryOnPosting
      Name: string
      ObjectBelonging?: SE.ObjectBelonging
      RegisterRecords?: MetadataItemLinksXML
      Synonym?: I8nTextXML
    }
    ChildObjects?: {
      Dimension?: MetadataSequenceDimensionsXML
    }
  }
}

registerMetadataItemRule({
  propertyType: "MetadataSequence",
  itemRule: MetadataSequenceRules,
})
