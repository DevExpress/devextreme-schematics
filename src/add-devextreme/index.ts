import {
  Rule,
  Tree,
  SchematicContext,
  chain
} from '@angular-devkit/schematics';

import { addStylesToApp } from '../utility/styles';

import {
  NodeDependencyType,
  addPackageJsonDependency
} from '@schematics/angular/utility/dependencies';

import {
  NodePackageInstallTask
} from '@angular-devkit/schematics/tasks';

import { latestVersions } from '../utility/latest-versions';
import { modifyJSONFile } from '../utility/modify-json-file';

export default function (options: any): Rule {
  return chain([
    (host: Tree) => addDevExtremeDependency(host, { dxversion: options.dxversion }),
    (host: Tree) => addDevExtremeCSS(host, { project: options.project }),
    (_host: Tree, context: SchematicContext) => {
      context.addTask(new NodePackageInstallTask());
    }
    // TODO: Register JSZip https://github.com/DevExpress/devextreme-angular/blob/master/docs/setup-3rd-party-dependencies.md
  ]);
}

function addDevExtremeDependency(host: Tree, options: any) {
  addPackageJsonDependency(host, {
    type: NodeDependencyType.Default,
    name: 'devextreme',
    version: options.dxversion || latestVersions['devextreme']
  });
  addPackageJsonDependency(host, {
    type: NodeDependencyType.Default,
    name: 'devextreme-angular',
    version: options.dxversion || latestVersions['devextreme-angular']
  });
  addPackageJsonDependency(host, {
    type: NodeDependencyType.Dev,
    name: 'devextreme-cli',
    version: latestVersions['devextreme-cli']
  });

  return host;
}

function addDevExtremeCSS(host: Tree, options: any) {
  modifyJSONFile(host, './angular.json', config => {

    return addStylesToApp(host, options.project, config);
  });

  return host;
}
