import { Tree, UpdateRecorder } from '@angular-devkit/schematics';
import { InsertChange } from '@schematics/angular/utility/change';

function getSeparator(text: string) {
  const isEmpty = text.search(/}\s*,?\s*]/g) !== -1;
  return isEmpty ? ', ' : '';
}

function prepareChangesForAdditionInArray(recorder: UpdateRecorder, filePath: string, changes: any, content: string, endIndex: number) {
  const position = content!.lastIndexOf(']', endIndex);

  if (position > -1) {
    let insertData = new InsertChange(filePath, position, getSeparator(content) + changes);
    recorder.insertLeft(insertData.pos, insertData.toAdd);
  }

  return recorder;
}

export function applyChanges(host: Tree, changes: any, filePath: string, content?: string, endIndex?: number) {

  let recorder = host.beginUpdate(filePath);

  if (Array.isArray(changes)) {
    for (const change of changes) {
      recorder.insertLeft(change.pos, change.toAdd);
    }
  } else if (content && endIndex) {
      recorder = prepareChangesForAdditionInArray(recorder, filePath, changes, content, endIndex);
  }

  host.commitUpdate(recorder);

  return host;
}
