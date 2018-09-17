import { Tree } from '@angular-devkit/schematics';
import { SourceFile } from 'typescript';

function updateHost(host: Tree, filePath: string, change: any) {
  if(change.pos && change.toAdd) {
    const recorder = host.beginUpdate(filePath);
    recorder.insertLeft(change.pos, change.toAdd);
    host.commitUpdate(recorder);
  }

  return host;
}

export function applyChanges(host: Tree, changes: any, filePath: string) {
  if (Array.isArray(changes)) {
    for (const change of changes) {
      return updateHost(host, filePath, change);
    }
  } else {
    return updateHost(host, filePath, changes);
  }
}

export function getSeparator(text: string) {
  const isEmpty = text.search(/}\s*,?\s*]/g) !== -1;
  return isEmpty ? ', ' : '';
}

export function getPositionInFile(source: SourceFile, endIndex?: number) {
  return source.getText().lastIndexOf(']', endIndex);
}