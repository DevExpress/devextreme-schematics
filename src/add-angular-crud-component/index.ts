import * as FS from 'fs';
import * as JSON5 from 'json5';

import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { apply, branchAndMerge, chain, move, mergeWith, template, url } from '@angular-devkit/schematics';
import { strings, normalize } from '@angular-devkit/core';

import * as apiSpecUtils from './api-spec-utils';
import { ApiSpecModel } from './api-spec-model';
import { ComponentOptionsModel } from './component-options-model';
import { ComponentOptions } from './schema';
import { addImportToParentModule } from '../utility/ng-module-utils';

export default function(options: ComponentOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    options.path = options.path || "src/app";
    options.path = options.path ? normalize(options.path) : options.path;

    const apiSpec = getApiSpec(options);
    const componentOptions = getComponentOptions(options);
    const controlToScaffold = componentOptions.controlToScaffold || "DataGrid";

    const templateCSS = apply(url('./files/css/' + strings.dasherize(controlToScaffold)), [
      template({
        ...strings,
        ...options
      }),
      move(options.path)
    ]);

    const templateHTML = apply(url('./files/html/' + strings.dasherize(controlToScaffold)), [
      template({
        ...strings,
        ...options,
        ...apiSpecUtils as any,
        apiSpec,
        componentOptions
      }),
      move(options.path)
    ]);

    const templateTS = apply(url('./files/ts'), [
      template({
        ...strings,
        ...options,
        ...apiSpecUtils as any,
        apiSpec,
        componentOptions
      }),
      move(options.path)
    ]);

    const rule = chain([
      branchAndMerge(chain([
        mergeWith(templateCSS),
        mergeWith(templateTS),
        mergeWith(templateHTML),
        addImportToParentModule(options, controlToScaffold)
      ])),
    ]);

    return rule(tree, _context);
  };
}

function getApiSpec(options: ComponentOptions) : ApiSpecModel {
  try {    
    return JSON5.parse(options.apiSpec) as ApiSpecModel;
  } catch {
    const apiSpecJson = FS.readFileSync(options.apiSpec).toString('utf-8');
    return JSON5.parse(apiSpecJson) as ApiSpecModel;
  }
}

function getComponentOptions(options: ComponentOptions) : ComponentOptionsModel {
  try {    
    return JSON5.parse(options.componentOptions) as ComponentOptionsModel;
  } catch {
    const componentOptionJson = FS.readFileSync(options.componentOptions).toString('utf-8');
    return JSON5.parse(componentOptionJson) as ComponentOptionsModel;
  }
}
