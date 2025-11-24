import z from "zod"

export const ZOneLineGroupNode = z.object({
  item: z.object({
    name: z.literal("oneLineGroup"),
    children: { Items: [], Properties: [] },
  }),
})
