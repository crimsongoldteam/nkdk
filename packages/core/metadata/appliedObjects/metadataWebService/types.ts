import { I8nTextXML } from "../../commonObjects/i8nText/types"
import {
  MetadataWebServiceOperations,
  MetadataWebServiceOperationsXML,
  MetadataWebServiceOperationsYAML,
} from "../../commonObjects/metadataWebServiceOperation/types"
import { XDTOPackages, XDTOPackagesXML, XDTOPackagesYAML } from "../../commonObjects/xDTOPackages/types"
import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import * as SE from "../../systemEnumerations/types"
import { MetadataWebServiceRules } from "./rules"

export type MetadataWebService = MetadataTypeByRule<typeof MetadataWebServiceRules>
export type MetadataWebServiceYAML = YAMLTypeByRule<typeof MetadataWebServiceRules>

export interface MetadataWebServiceXML {
  _uuid?: string
  Properties: {
    Comment?: string
    DescriptorFileName?: string
    ExtendedConfigurationObject?: string
    Name: string
    Namespace?: string
    ObjectBelonging?: SE.ObjectBelonging
    ReuseSessions?: SE.SessionReuseMode
    SessionMaxAge?: number
    Synonym?: I8nTextXML
    XDTOPackages?: XDTOPackagesXML
  }
  ChildObjects?: {
    Operation?: MetadataWebServiceOperationsXML
  }
}

export type {
  MetadataWebServiceOperations,
  MetadataWebServiceOperationsXML,
  MetadataWebServiceOperationsYAML,
  XDTOPackages,
  XDTOPackagesXML,
  XDTOPackagesYAML,
}

registerMetadataItemRule({
  propertyType: "MetadataWebService",
  itemRule: MetadataWebServiceRules,
})
