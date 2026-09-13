import { dataPath } from './exposed-rules.mjs';
import { readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const requests = JSON.parse(readFileSync(0, 'utf8'));
const results = [];
for (const request of requests) {
  try {
    const absolute = resolve(request.path);
    if (!relative(resolve('packages/rules'), absolute).startsWith('metadata/')) throw new Error('Outside metadata scope');
    const module = await import(pathToFileURL(absolute).href);
    const rule = request.via ? dataPath(module[request.via.export],request.via.path) : module[request.symbol];
    const descriptor = rule && Object.getOwnPropertyDescriptor(rule, 'properties');
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) throw new Error('No data property: properties');
    const properties = descriptor.value;
    if (!properties || typeof properties !== 'object' || Array.isArray(properties)) throw new Error('Invalid properties object');
    const order=Object.getOwnPropertyDescriptor(rule,'xmlOrder');
    if(order && (!Object.hasOwn(order,'value') || (order.value!==undefined && (!Array.isArray(order.value) || order.value.some(key=>typeof key!=='string')))))throw new Error('Invalid data property: xmlOrder');
    results.push({...request, status:'loaded', keys:Object.keys(properties),xmlOrder:order?.value??null});
  } catch (error) {
    results.push({...request, status:'load-error', error:String(error?.message ?? error)});
  }
}
process.stdout.write(`\nNKDK_RULES_RESULT:${JSON.stringify(results)}\n`);
