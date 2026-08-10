import type { DataPathContribution } from "../../validation/dataPath/registry"

export const metadataInformationRegisterDataPathRules: readonly DataPathContribution[] = [{
  kind: "virtualOwnerField",
  resolver: ({ owner, segment }) => {
    if (owner.ref.kind !== "РегистрСведений" || segment !== "ОбластьДанныхВспомогательныеДанные") return undefined
    return { name: segment, typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "InformationRegister.DataArea" } }
  },
}]
