
import { TElementRules } from "~/lib/rulesManager/types"
import { registerElementRules } from "~/lib/rulesManager/rulesManager"
import { ZElementType } from "../types"
import { ZTable, ZTableXML } from "../table/types"
import { ZChoiceParameterLinks, ZChoiceParameterLinksXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/types"
import { ZUserVisible, ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { formatUserVisible } from "~/lib/metadata/commonObjects/userVisible/format"
import { formatBoolean } from "~/lib/metadata/commonObjects/boolean/format"
import { parseBoolean } from "~/lib/metadata/commonObjects/boolean/parse"
import { parseI8nText } from "~/lib/metadata/commonObjects/i8nText/parse"
import { parseUserVisible } from "~/lib/metadata/commonObjects/userVisible/parse"
import { parseSystemEnumeration } from "~/lib/metadata/systemEnumerations/parse"
import { formatSystemEnumeration } from "~/lib/metadata/systemEnumerations/format"

const rules: TElementRules = {
  "additionalFields": {
    get type() { return ZChoiceParameterLinks },
    nameEnterprise: "ДополнительныеПоля",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "indexedFields": {
    get type() { return ZChoiceParameterLinks },
    nameEnterprise: "ИндексируемыеПоля",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "table": {
    get type() { return z.string() },
    nameEnterprise: "Таблица",
    formatProperties: undefined,
    parseProperties: undefined,
    inProperties: ()=> true,
  },
  "userVisible": {
    get type() { return ZUserVisible },
    nameEnterprise: "ПользовательскаяВидимость",
    formatProperties: formatUserVisible,
    parseProperties: parseUserVisible,
    inProperties: ()=> true,
  },
}

registerElementRules(ZElementType.enum.Object, rules)