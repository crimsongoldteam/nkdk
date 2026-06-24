import { shortRoundTripXML } from "@nakidka/core"

export const shortRoundTrip = async (xmlDir: string): Promise<void> => {
  await shortRoundTripXML({ inputDir: xmlDir, outputDir: xmlDir })
}
