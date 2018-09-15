import { Tree } from '@angular-devkit/schematics';

export function applyChanges(host: Tree, changes: any, filePath: string) {
  const recorder = host.beginUpdate(filePath);

  if(Array.isArray(changes)) {
    for (const change of changes) {
      recorder.insertLeft(change.pos, change.toAdd);
    }
  } else {
    recorder.insertLeft(changes.pos, changes.toAdd);
  }

  host.commitUpdate(recorder);

  return host;
}