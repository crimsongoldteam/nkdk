import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function assembled(requests) {
  try {
    const output = execFileSync(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('./assembled-child.mjs', import.meta.url))],
      {input:JSON.stringify(requests), encoding:'utf8', timeout:60000, maxBuffer:8 * 1024 * 1024});
    const marker = '\nNKDK_RULES_RESULT:';
    const offset = output.lastIndexOf(marker);
    if (offset < 0) throw new Error('Missing child result');
    const results = JSON.parse(output.slice(offset + marker.length));
    if (!Array.isArray(results) || results.length !== requests.length || results.some((r, i) =>
      r.path !== requests[i].path || r.symbol !== requests[i].symbol || !['loaded','load-error'].includes(r.status) ||
      (r.status === 'loaded' && ((r.itemType!==null && typeof r.itemType!=='string') || !Array.isArray(r.propertyStates) || !Array.isArray(r.keys) || r.keys.some(k => typeof k !== 'string') || (r.xmlOrder!==null && (!Array.isArray(r.xmlOrder) || r.xmlOrder.some(k=>typeof k!=='string'))))))) throw new Error('Invalid child result');
    return results;
  } catch (error) {
    return requests.map(request => ({...request, status:'load-error', error:String(error?.message ?? error).slice(0, 2000)}));
  }
}
