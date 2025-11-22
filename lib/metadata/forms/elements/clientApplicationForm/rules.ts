import * as SE from "~/lib/metadata/systemEnumerations/types"

export const ClientApplicationFormRules = {
  autoTitle: {
    nameEnterprise: "Автозаголовок",
    type: "boolean",
    inProperties: () => true,
  },
  verticalScroll: {
    nameEnterprise: "ВертикальнаяПрокрутка",
    type: SE.ZVerticalFormScroll,
    inProperties: () => true,
  },
}
