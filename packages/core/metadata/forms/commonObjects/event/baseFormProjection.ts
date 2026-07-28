import { registerBaseFormPropertyProjector } from "../../clientApplicationForm/baseFormProjectionRegistry"

registerBaseFormPropertyProjector("Events", {
  project: () => ({ kind: "omit" }),
})
