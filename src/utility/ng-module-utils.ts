import { Rule, Tree, SchematicsException } from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';
import { ModuleOptions, findModuleFromOptions, buildRelativePath } from '@schematics/angular/utility/find-module';
import { addImportToModule, addDeclarationToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';
import * as ts from 'typescript';

export function addImportToParentModule(options: ModuleOptions, widget: string): Rule {
  return (tree: Tree) => {
    addImport(tree, options, widget);
    return tree;
  };
}

function addImport(tree: Tree, options: ModuleOptions, widget: string) {
  const modulePath = findModuleFromOptions(tree, options) || '';
  const moduleContent = tree.read(modulePath);
  if (moduleContent === null) {
    throw new SchematicsException(`File ${modulePath} does not exist.`);
  }
  const sourceText = moduleContent.toString('utf-8');
  const source = ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);
  const componentPath = `/${options.path}/`
            + strings.dasherize(options.name) + '/'
            + strings.dasherize(options.name) + '.component';
  const relativePath = buildRelativePath(modulePath, componentPath);

  const declarationRecorder = tree.beginUpdate(modulePath);

  const classifiedComponent = 'Dx' + widget + 'Module';
  for (const change of addImportToModule(source, modulePath, classifiedComponent, 'devextreme-angular')) {
    if (change instanceof InsertChange) {
      declarationRecorder.insertLeft(change.pos, change.toAdd);
    }
  }

  const classifiedName = strings.classify(options.name + 'Component');
  for (const change of addDeclarationToModule(source, modulePath, classifiedName, relativePath)) {
    if (change instanceof InsertChange) {
      declarationRecorder.insertLeft(change.pos, change.toAdd);
    }
  }

  tree.commitUpdate(declarationRecorder);
}
