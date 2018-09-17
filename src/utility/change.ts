import { Tree, UpdateRecorder } from '@angular-devkit/schematics';
import { SourceFile } from 'typescript';

function insertToRecorder(recorder: UpdateRecorder, changes: any) {
  if (changes.pos && changes.pos !== -1 && changes.toAdd) {
    recorder.insertLeft(changes.pos, changes.toAdd);
  }
  return recorder;
}

export function applyChanges(host: Tree, changes: any, filePath: string) {
  let recorder = host.beginUpdate(filePath);

  if (Array.isArray(changes)) {
    for (const change of changes) {
      recorder = insertToRecorder(recorder, change);
    }
  } else {
    recorder = insertToRecorder(recorder, changes);
  }

  host.commitUpdate(recorder);

  return host;
}

export function getSeparator(text: string) {
  const isEmpty = text.search(/}\s*,?\s*]/g) !== -1;
  return isEmpty ? ', ' : '';
}

export function getPositionInFile(source: SourceFile, endIndex?: number) {
  return source.getText().lastIndexOf(']', endIndex);
}