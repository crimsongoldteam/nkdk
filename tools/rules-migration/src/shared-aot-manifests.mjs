import {relative,join} from 'node:path';

// Cargo wrappers and prepared sources can have independent publication owners.
export function sharedAotManifests(root,output,layout,{sources=output,facadeName='nkdk-shared-catalog',workspace=true}={}) {
  const files=new Map();
  const pathFrom=(directory,path)=>relative(directory,path).split('\\').join('/');
  const dependency=(directory,name,path)=>`${name} = { path = ${JSON.stringify(pathFrom(directory,path))} }\n`;
  const common=(name,directory,names)=>`[package]\nname=${JSON.stringify(name)}\nversion="0.0.0"\nedition="2024"\n[lib]\ntest=false\n[dependencies]\n`+
    dependency(directory,'nkdk-conversion-core',join(root,'rust/crates/conversion-core'))+
    names.map(name=>dependency(directory,name,join(output,'packages',name))).join('');
  const wrapper=path=> {
    const local=join(output,path,'src');
    const prepared=join(sources,path,'src/generated.rs');
    return `include!(${JSON.stringify(pathFrom(local,prepared))});\n`;
  };
  const members=[];
  for(const package_ of layout.packages.filter(package_=>!package_.facade)) {
    const path=`packages/${package_.package}`;members.push(path);
    files.set(`${path}/Cargo.toml`,Buffer.from(common(package_.package,join(output,path),package_.dependencies)));
    files.set(`${path}/src/lib.rs`,Buffer.from(wrapper(path)));
  }
  files.set('Cargo.toml',Buffer.from(common(facadeName,output,layout.facadeDependencies)+(workspace?`[workspace]\nmembers=${JSON.stringify(members)}\n`:'')));
  files.set('src/lib.rs',Buffer.from(wrapper('')));
  return files;
}
