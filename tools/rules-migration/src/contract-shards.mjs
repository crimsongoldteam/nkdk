import {selectContracts} from './focused-catalog.mjs';

export function partitionContracts(manifest,catalog,limit=100,maxBytes=180000,weight=module=>Buffer.byteLength(JSON.stringify(module))) {
 if(!Number.isInteger(limit)||limit<1)throw new Error('Invalid declaration limit');
 if(!Number.isInteger(maxBytes)||maxBytes<1)throw new Error('Invalid declaration byte limit');
 const sizes=new Map([...catalog].map(([id,module])=>[id,weight(module)]));
 const bytes=ids=>[...ids].reduce((sum,id)=>sum+sizes.get(id),0);
 const singles=manifest.cases.map(({id})=>{
   const selected=selectContracts(manifest,catalog,[id]);
   if(selected.modules.length>limit)throw new Error(`Contract ${id} requires ${selected.modules.length} declarations; limit ${limit}`);
   const dependencies=new Set(selected.modules.map(module=>module.id));
   if(bytes(dependencies)>maxBytes)throw new Error(`Contract ${id} requires ${bytes(dependencies)} declaration bytes; limit ${maxBytes}`);
   return {id,dependencies};
 });
 const groups=[];
 for(const item of singles) {
   let chosen,score=-1;
   for(const group of groups) {
     const overlap=[...item.dependencies].filter(id=>group.dependencies.has(id)).length;
     const added=[...item.dependencies].filter(id=>!group.dependencies.has(id));
     if(group.dependencies.size+added.length<=limit && group.bytes+bytes(added)<=maxBytes && overlap>score){chosen=group;score=overlap;}
   }
   if(!chosen){chosen={ids:[],dependencies:new Set(),bytes:0};groups.push(chosen);}
   chosen.ids.push(item.id);
   for(const id of item.dependencies)if(!chosen.dependencies.has(id)){
     chosen.dependencies.add(id);
     chosen.bytes+=sizes.get(id);
   }
 }
 return groups.map(group=>{
   const selected=selectContracts(manifest,catalog,group.ids);
   if(selected.modules.length>limit || bytes(group.dependencies)>maxBytes)throw new Error('Contract shard exceeded declaration limit');
   return selected;
 });
}
