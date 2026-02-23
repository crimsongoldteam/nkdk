// import { expandToNode, joinToNode, toString } from "langium/generate"
// import type { Form } from "nkdk-language"
// import * as fs from "node:fs"
// import * as path from "node:path"
// import { extractDestinationAndName } from "./util.js"

// export function generateJavaScript(model: Form, filePath: string, destination: string | undefined): string {
//   const data = extractDestinationAndName(filePath, destination)
//   const generatedFilePath = `${path.join(data.destination, data.name)}.js`

//   const fileNode = expandToNode`
//         "use strict";

//         ${joinToNode(model.childItems ?? [], (field) => `console.log('Hello, ${field}!');`, { appendNewLineIfNotEmpty: true })}
//     `.appendNewLineIfNotEmpty()

//   if (!fs.existsSync(data.destination)) {
//     fs.mkdirSync(data.destination, { recursive: true })
//   }
//   fs.writeFileSync(generatedFilePath, toString(fileNode))
//   return generatedFilePath
// }
