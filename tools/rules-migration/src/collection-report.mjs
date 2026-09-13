export function collectionReport(emission) {
  const ready=emission.results.filter(r=>r.status==='candidate');
  const lines=['# Выпуск деклараций коллекций','',
    `Кандидатов: ${ready.length}; заблокировано: ${emission.results.length-ready.length}.`,
    'Кандидат свойства коллекции не является приёмкой полного владельца.', '',
    '| Владелец и свойство | Правило элемента | Результат |', '|---|---|---|'];
  const cell=text=>String(text).replaceAll('|','\\|').replaceAll('\n',' ');
  for(const item of emission.results) {
    const state=item.status==='candidate'?item.declaration:item.blockers.map(b=>b.reason+(b.reason==='item-properties'?': '+b.details.map(p=>`${p.property} (${p.reason})`).join(', '):'')).join('; ');
    lines.push(`| ${cell(item.owner.symbol+'.'+item.property)} | ${cell(item.item.symbol)} | ${cell(state)} |`);
  }
  return lines.join('\n')+'\n';
}
