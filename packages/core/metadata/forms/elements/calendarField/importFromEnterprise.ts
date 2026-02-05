import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { CalendarField } from "~/metadata/forms/elements/calendarField/types"
import { importElementFromEnterpriseTyped, importElementFromEnterprisePartial } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  FormElementType,
  ImportPartialFromEnterpriseFn,
  ImportTypedFromEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"

export function importCalendarFieldTypedFromEnterprise<To extends CalendarField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  return importElementFromEnterpriseTyped(context, FormElementType.CalendarField, data, name) as To
}

export function importCalendarFieldPartialFromEnterprise<To extends CalendarField>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromEnterprisePartial(context, FormElementType.CalendarField, source, data)
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "CalendarField",
  importCalendarFieldPartialFromEnterprise as ImportPartialFromEnterpriseFn
)

registerMetadata(
  "ImportTypedFromEnterprise",
  "CalendarField",
  importCalendarFieldTypedFromEnterprise as ImportTypedFromEnterpriseFn
)
