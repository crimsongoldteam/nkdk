import { z } from "zod/v4"

export const configurationComponentPathSchema = z.string().refine(
  (value): value is "cf" | `cfe/${string}` =>
    value === "cf" || /^cfe\/[^/\\.][^/\\]*$/u.test(value),
  "Ожидался путь cf или cfe/<Имя>"
)
