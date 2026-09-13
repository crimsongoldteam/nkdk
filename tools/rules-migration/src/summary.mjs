export function groupOf(file) {
  const parts = file.split('/'), meta = parts.indexOf('metadata');
  if (meta < 0) return parts.slice(0, 2).join('/');
  const depth = parts[meta + 1] === 'forms' ? 4 : 3;
  return parts.slice(meta + 1, meta + depth).join('/');
}

export function cycles(edges) {
  const seen = new Set(), stack = [], active = new Set(), indexes = new Map(), lows = new Map(), groups = [];
  function visit(key) {
    indexes.set(key, indexes.size); lows.set(key, indexes.get(key));
    seen.add(key); active.add(key); stack.push(key);
    for (const dependency of edges.get(key) ?? []) {
      if (!edges.has(dependency)) continue;
      if (!seen.has(dependency)) { visit(dependency); lows.set(key, Math.min(lows.get(key), lows.get(dependency))); }
      else if (active.has(dependency)) lows.set(key, Math.min(lows.get(key), indexes.get(dependency)));
    }
    if (lows.get(key) !== indexes.get(key)) return;
    const component = [];
    let member;
    do { member = stack.pop(); active.delete(member); component.push(member); } while (member !== key);
    if (component.length > 1 || edges.get(key)?.has(key)) groups.push(component.sort());
  }
  for (const key of edges.keys()) if (!seen.has(key)) visit(key);
  return groups.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0], 'en'));
}

export function summarize(files) {
  const production = files.filter(f => f.category === 'production');
  const edges = new Map(production.map(f => [f.path, new Set(f.imports.filter(i => !i.typeOnly && i.resolved).map(i => i.resolved))]));
  const consumers = new Map();
  for (const file of production) for (const dependency of edges.get(file.path)) {
    const group = groupOf(dependency);
    if (group === file.group) continue;
    if (!consumers.has(group)) consumers.set(group, new Set());
    consumers.get(group).add(file.group);
  }
  const rank = new Map(), blockers = new Map();
  for (const file of production) {
    for (const call of file.calls) {
      if (!/Rule$/.test(call.callee) || !/\/(rules|builders|types)\.ts$/.test(file.path)) continue;
      const key = call.target ? `${call.target.path}:${call.callee}` : call.callee;
      const item = rank.get(key) ?? {callee: call.callee, target: call.target, count: 0, files: new Set()};
      item.count++; item.files.add(file.path); rank.set(key, item);
    }
    for (const blocker of file.blockers) {
      const item = blockers.get(blocker.reason) ?? {reason: blocker.reason, count: 0, examples: []};
      item.count++; if (item.examples.length < 5) item.examples.push(blocker); blockers.set(blocker.reason, item);
    }
  }
  return {fileCycles: cycles(edges),
    commonConsumers: [...consumers].filter(([g]) => g.startsWith('commonObjects/') || g.startsWith('forms/commonObjects/'))
      .map(([group, users]) => ({group, consumers: [...users].sort(), count: users.size})).sort((a, b) => b.count - a.count || a.group.localeCompare(b.group, 'en')),
    builders: [...rank.values()].map(r => ({...r, files: [...r.files].sort()})).sort((a, b) => b.count - a.count || a.callee.localeCompare(b.callee, 'en')),
    blockers: [...blockers.values()] };
}
