import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import {
  MetadataWebServiceOperations,
  MetadataWebServiceOperationsXML,
  MetadataWebServiceOperationsYAML,
} from "~/metadata/commonObjects/metadataWebServiceOperation/types"
import { XDTOPackages, XDTOPackagesXML, XDTOPackagesYAML } from "~/metadata/commonObjects/xDTOPackages/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
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

export interface MetadataWebServiceOperationsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataWebServiceOperations"
}

export type MetadataWebServiceOperationsRuleParams = Omit<MetadataWebServiceOperationsWidePropertyRule, "type">

export function metadataWebServiceOperationsRule<const Params extends MetadataWebServiceOperationsRuleParams>(
  params: WideExactRuleParams<MetadataWebServiceOperationsRuleParams, Params>
): Readonly<{ type: "MetadataWebServiceOperations" } & Params> {
  return defineWidePropertyRule("MetadataWebServiceOperations", params)
}
