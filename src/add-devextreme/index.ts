import {
  Rule,
  Tree,
  SchematicContext,
  chain
} from '@angular-devkit/schematics';

import {
  NodeDependencyType,
  addPackageJsonDependency
} from '@schematics/angular/utility/dependencies';

import {
  NodePackageInstallTask
} from '@angular-devkit/schematics/tasks';

import { getProjectName} from '../utility/get-project';
import { latestVersions } from '../utility/latest-versions';
import { modifyJSONFile } from '../utility/modify-json-file';
import { makeArrayUnique } from '../utility/array';

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
  })
  addPackageJsonDependency(host, {
    type: NodeDependencyType.Default,
    name: 'devextreme-angular',
    version: options.dxversion || latestVersions['devextreme-angular']
  })
  return host;
}

function addDevExtremeCSS(host: Tree, options: any) {
  modifyJSONFile(host, './angular.json', config => {
    const projectName = getProjectName(host, options);
    const projectBuildOptopns = config['projects'][projectName]['architect']['build']['options'];
    const projectSytles = projectBuildOptopns['styles'];

    projectSytles.unshift("node_modules/devextreme/dist/css/dx.light.css");
    projectSytles.unshift("node_modules/devextreme/dist/css/dx.common.css");

    projectBuildOptopns['styles'] = makeArrayUnique(projectSytles);
    return config;
  });

  return host;
}
