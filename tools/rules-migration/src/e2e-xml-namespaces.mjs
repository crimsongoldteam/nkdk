export function e2eXmlNamespaces(source,root,defaultPrefix){
  const attributes=source.match(new RegExp(`<${root}\\b([^>]*)>`))?.[1];
  if(!attributes)throw new Error(`${root} XML root is missing`);
  const bindings=[...attributes.matchAll(/\bxmlns(?::([\w.-]+))?="([^"]+)"/g)];
  const namespaces=Object.fromEntries(bindings.filter(match=>match[1]).map(match=>[match[1],match[2]]));
  namespaces[defaultPrefix]=bindings.find(match=>!match[1])?.[2];
  if(!namespaces[defaultPrefix])throw new Error(`${root} default XML namespace is missing`);
  return {attributes:bindings.map(match=>match[0]).join(' '),namespaces,
    qualified(name){
      const [prefix,local]=name.split(':');
      const namespace=namespaces[local?prefix:defaultPrefix];
      if(!namespace)throw new Error(`Unknown XML namespace in ${name}`);
      return `{${namespace}}${local??prefix}`;
    }};
}
