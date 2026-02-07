import { ConfigurationContext } from "~/metadata/context/types"
import { ColumnGroup } from "~/metadata/forms/elements/columnGroup/types"
import { importElementFromEnterprisePartial, importElementFromEnterpriseTyped, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType, ToPartialEnterpriseType, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"

export function importColumnGroupTypedFromEnterprise<To extends ColumnGroup | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  return importElementFromEnterpriseTyped(context, FormElementType.ColumnGroup, data as any, name) as To
}

export function importColumnGroupPartialFromEnterprise<To extends ColumnGroup>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromEnterprisePartial(context, FormElementType.ColumnGroup, source, data as any)
}

registerMetadata("ImportPartialFromEnterprise", "ColumnGroup", importColumnGroupPartialFromEnterprise as any)
registerMetadata("ImportTypedFromEnterprise", "ColumnGroup", importColumnGroupTypedFromEnterprise as any)
