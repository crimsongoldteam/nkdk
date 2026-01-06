import { tags } from "typia"
export type MetadataEnterpriseName = string & tags.Pattern<"^[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$">
