import { Type } from "@sinclair/typebox"
import { MetadataNameYAML } from "~/metadata/commonObjects/metadataName/types"
import { MetadataRegisterFieldYAML, MetadataRegisterFieldXML } from "~/metadata/commonObjects/metadataRegisterField/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { AccountingFlagRules, ExtDimensionAccountingFlagRules } from "./rules"

export type AccountingFlag = MetadataTypeByRule<typeof AccountingFlagRules>
export type ExtDimensionAccountingFlag = MetadataTypeByRule<typeof ExtDimensionAccountingFlagRules>

export type AccountingFlagXML = MetadataRegisterFieldXML
export type ExtDimensionAccountingFlagXML = MetadataRegisterFieldXML
export type AccountingFlagYAML = MetadataRegisterFieldYAML
export type ExtDimensionAccountingFlagYAML = MetadataRegisterFieldYAML

export type AccountingFlags = AccountingFlag[]
export type ExtDimensionAccountingFlags = ExtDimensionAccountingFlag[]
export type AccountingFlagsXML = AccountingFlagXML | AccountingFlagXML[]
export type ExtDimensionAccountingFlagsXML = ExtDimensionAccountingFlagXML | ExtDimensionAccountingFlagXML[]

export const AccountingFlagsJSONSchema = Type.Record(Type.String(), Type.Any())
export const ExtDimensionAccountingFlagsJSONSchema = Type.Record(Type.String(), Type.Any())
export type AccountingFlagsYAML = Record<MetadataNameYAML, AccountingFlagYAML>
export type ExtDimensionAccountingFlagsYAML = Record<MetadataNameYAML, ExtDimensionAccountingFlagYAML>
