// Derive a lexical projection from one declaration, never copy its dictionary.
export function canonicalYamlXmlEnum(source,id) {
  if(!source?.enum)throw new Error('Expected an enum declaration');
  return {format:'nkdk-declarations/1',kind:'value',id,enum:Object.fromEntries(
    Object.entries(source.enum).map(([name,value])=>{
      const label=typeof value==='string'?value:value.yaml;
      const original=typeof value==='string'?name:(value.xml??name);
      const accepted=[...new Set([original,...(value.accept??[])])].filter(text=>text!==label);
      return [name,{yaml:label,xml:label,...(accepted.length?{accept:accepted}:{})}];
    }))};
}
