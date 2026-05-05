import { I8nText } from "~/metadata/commonObjects/i8nText/types"

export const fixtureUSPStringSingleLang: I8nText = { items: { ru: "Один язык - string" } }
export const fixtureUSPLocalStringSingleLang: I8nText = { items: { ru: "Один язык - local string" } }
export const fixtureUSPLocalStringTwoLangs: I8nText = {
  items: { ru: "Русский язык - local string", en: "English language - local string" },
}

/** referenceMetadata при импорте string.xml с forReference=true */
export const fixtureUSPStringRef = "Один язык - string"
/** referenceMetadata при импорте localString.xml с forReference=true */
export const fixtureUSPLocalStringRef: I8nText = { items: { ru: "Один язык - local string" } }
/** referenceMetadata при импорте localStringTwoLangs.xml с forReference=true */
export const fixtureUSPLocalStringTwoLangsRef: I8nText = {
  items: { ru: "Русский язык - local string", en: "English language - local string" },
}
