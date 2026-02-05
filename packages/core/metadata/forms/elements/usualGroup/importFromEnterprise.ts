import { importElementFromEnterprisePartial, importElementFromEnterpriseTyped } from "~/metadata/metadataFactory/importElementFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { UsualGroup } from "~/metadata/forms/elements/usualGroup/types"
import { PropertyRule } from "~/metadata/forms/elements/usualGroup/rules"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
	FormElementType,
	ImportPartialFromEnterpriseFn,
	ImportTypedFromEnterpriseFn,
	ToPartialEnterpriseType,
	ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"

export function importUsualGroupTypedFromEnterprise<To extends UsualGroup | undefined>(
	context: ConfigurationContext,
	_rule: PropertyRule | undefined,
	data: ToTypedEnterpriseType<To>,
	name: string
): To {
	return importElementFromEnterpriseTyped(context, FormElementType.UsualGroup, data, name) as To
}

export function importUsualGroupPartialFromEnterprise<To extends UsualGroup>(
	context: ConfigurationContext,
	_rule: PropertyRule | undefined,
	source: To,
	data: ToPartialEnterpriseType<To> | undefined
): To {
	return importElementFromEnterprisePartial(context, FormElementType.UsualGroup, source, data)
}

registerMetadata(
	"ImportPartialFromEnterprise",
	"UsualGroup",
	importUsualGroupPartialFromEnterprise as ImportPartialFromEnterpriseFn
)

registerMetadata(
	"ImportTypedFromEnterprise",
	"UsualGroup",
	importUsualGroupTypedFromEnterprise as ImportTypedFromEnterpriseFn
)
