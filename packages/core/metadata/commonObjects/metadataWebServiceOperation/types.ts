import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataNameYAML } from "~/metadata/commonObjects/metadataName/types"
import { XDTOTypeName, XDTOTypeNameXML } from "~/metadata/commonObjects/xdtoTypeName/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataWebServiceOperationRules, MetadataWebServiceParameterRules } from "./rules"

export type MetadataWebServiceParameter = MetadataTypeByRule<typeof MetadataWebServiceParameterRules>

export interface MetadataWebServiceParameterXML {
  _uuid?: string
  Properties: {
    Comment?: string
    ExtendedConfigurationObject?: string
    Name: string
    Nillable?: boolean
    ObjectBelonging?: SE.ObjectBelonging
    Synonym?: I8nTextXML
    TransferDirection?: SE.TransferDirection
    XDTOValueType?: XDTOTypeName | XDTOTypeNameXML
  }
}

export type MetadataWebServiceParameterYAML = YAMLTypeByRule<typeof MetadataWebServiceParameterRules>

export type MetadataWebServiceParameters = MetadataWebServiceParameter[]
export type MetadataWebServiceParametersXML = MetadataWebServiceParameterXML | MetadataWebServiceParameterXML[]
export type MetadataWebServiceParametersYAML = Record<MetadataNameYAML, MetadataWebServiceParameterYAML>

export type MetadataWebServiceOperation = MetadataTypeByRule<typeof MetadataWebServiceOperationRules>

export interface MetadataWebServiceOperationXML {
  _uuid?: string
  Properties: {
    Comment?: string
    DataLockControlMode?: SE.DataLockControlMode
    ExtendedConfigurationObject?: string
    Name: string
    Nillable?: boolean
    ObjectBelonging?: SE.ObjectBelonging
    ProcedureName?: string
    Synonym?: I8nTextXML
    Transactioned?: boolean
    XDTOReturningValueType?: XDTOTypeName | XDTOTypeNameXML
  }
  ChildObjects?: {
    Parameter?: MetadataWebServiceParametersXML
  }
}

export type MetadataWebServiceOperationYAML = YAMLTypeByRule<typeof MetadataWebServiceOperationRules>

export type MetadataWebServiceOperations = MetadataWebServiceOperation[]
export type MetadataWebServiceOperationsXML = MetadataWebServiceOperationXML | MetadataWebServiceOperationXML[]
export type MetadataWebServiceOperationsYAML = Record<MetadataNameYAML, MetadataWebServiceOperationYAML>
