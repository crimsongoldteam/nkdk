import { tags } from "typia"
export type MetadataNameEnterprise = string & tags.Pattern<"^[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$">
