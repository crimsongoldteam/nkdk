import { ConfigurationContext } from "~/metadata/context/types"
import { ColumnGroup } from "~/metadata/forms/elements/columnGroup/types"
import { importElementFromYAMLPartial, importElementFromYAMLTyped, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType, ToPartialEnterpriseType, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"

export function importColumnGroupTypedFromEnterprise<To extends ColumnGroup | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  return importElementFromYAMLTyped(context, FormElementType.ColumnGroup, data as any, name) as To
}

export function importColumnGroupPartialFromEnterprise<To extends ColumnGroup>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromYAMLPartial(context, FormElementType.ColumnGroup, source, data as any)
}

registerMetadata("ImportPartialFromEnterprise", "ColumnGroup", importColumnGroupPartialFromEnterprise as any)
registerMetadata("ImportTypedFromEnterprise", "ColumnGroup", importColumnGroupTypedFromEnterprise as any)
