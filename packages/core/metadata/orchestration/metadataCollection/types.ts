import type { ItemXML } from "~/metadata/orchestration/property/types"

export type NamedMetadataItem = { name: string }
export type NamedElementXML = ItemXML & { _name: string; _id?: string }
