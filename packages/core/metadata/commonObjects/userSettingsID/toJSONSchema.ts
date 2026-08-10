import { Type } from "typebox"
import { BooleanJSONSchema } from "../boolean/types"
import { definePropertyTypeRule } from "../../ruleRuntime"

export const metadataPropertyRule000 = definePropertyTypeRule("UserSettingsID", "exportToJSONSchema", () => Type.Union([BooleanJSONSchema, Type.String()]))
