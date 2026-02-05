import { exportElementToEnterprisePartial, exportElementToEnterpriseTyped } from "~/metadata/metadataFactory/exportElementToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { UsualGroup } from "~/metadata/forms/elements/usualGroup/types"
import { PropertyRule } from "~/metadata/forms/elements/usualGroup/rules"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
	ExportPartialToEnterpriseFn,
	ExportTypedToEnterpriseFn,
	ToPartialEnterpriseType,
	ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"

export function exportUsualGroupTypedToEnterprise<From extends UsualGroup | undefined>(
	context: ConfigurationContext,
	_rule: PropertyRule | undefined,
	data: From
): ToTypedEnterpriseType<From> {
	return exportElementToEnterpriseTyped(context, "UsualGroup", data) as ToTypedEnterpriseType<From>
}

export function exportUsualGroupPartialToEnterprise<From extends UsualGroup | undefined>(
	context: ConfigurationContext,
	_rule: PropertyRule | undefined,
	data: From
): ToPartialEnterpriseType<From> {
	return exportElementToEnterprisePartial(context, "UsualGroup", data) as ToPartialEnterpriseType<From>
}

registerMetadata(
	"ExportPartialToEnterprise",
	"UsualGroup",
	exportUsualGroupPartialToEnterprise as ExportPartialToEnterpriseFn
)
registerMetadata(
	"ExportTypedToEnterprise",
	"UsualGroup",
	exportUsualGroupTypedToEnterprise as ExportTypedToEnterpriseFn
)
