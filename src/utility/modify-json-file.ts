import { Tree } from '@angular-devkit/schematics';

export function modifyJSONFile (host: Tree, path: string, callback: (obj: any) => any) {
  const serializedConfig = host.read(path)!.toString('utf-8');
  let obj = JSON.parse(serializedConfig);

  obj = callback(obj);

  host.overwrite(path, JSON.stringify(obj, null, 2));

  return host;
};
  