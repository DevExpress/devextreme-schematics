import { Tree } from '@angular-devkit/schematics';
import {
  createSourceFile,
  ScriptTarget,
  SourceFile
} from 'typescript';

export function getSourceFile(host: Tree, filePath: string): SourceFile | undefined {
  const buffer = host.read(filePath);

  if(!buffer) {
    return;
  }
  const serializedRouting = host.read(filePath)!.toString();
  return createSourceFile(filePath, serializedRouting, ScriptTarget.Latest, true);
}
