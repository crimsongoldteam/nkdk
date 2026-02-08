import { ConfigurationContext } from "~/metadata/context/types"
import { DendrogramField } from "~/metadata/forms/elements/dendrogramField/types"
import {
  importElementFromEnterpriseTyped,
  importElementFromYAMLPartial,
  registerMetadata,
} from "~/metadata/metadataFactory"
import { ToPartialEnterpriseType, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"

export function importDendrogramFieldTypedFromEnterprise<To extends DendrogramField | undefined>(
  context: ConfigurationContext,
  _rule: any,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  return importElementFromEnterpriseTyped(context, "DendrogramField", data as any, name) as unknown as To
}

export function importDendrogramFieldPartialFromEnterprise<To extends DendrogramField>(
  context: ConfigurationContext,
  _rule: any,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromYAMLPartial(context, "DendrogramField", source, data as any) as unknown as To
}

registerMetadata("ImportPartialFromEnterprise", "DendrogramField", importDendrogramFieldPartialFromEnterprise as any)
