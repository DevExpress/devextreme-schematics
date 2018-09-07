import {
  Rule,
  Tree,
  SchematicContext,
  chain
} from '@angular-devkit/schematics';

import {
  NodeDependencyType, addPackageJsonDependency
} from '@schematics/angular/utility/dependencies';

import {
  NodePackageInstallTask
} from '@angular-devkit/schematics/tasks';

// TODO: extract getProjectName to the utils
import {
  getWorkspace
} from '@schematics/angular/utility/config';

function getProjectName(host: Tree, options: any) {
  const projectName = options.project;
  const workspace = getWorkspace(host);
  const projects = Object.keys(workspace.projects);

  return projectName && projects.indexOf(projectName) ? projectName : projects[0];
}

export default function (options: any): Rule {
  return chain([
    (host: Tree) => addDevExtremeDependency(host, { dxversion: options.dxversion }),
    (host: Tree) => addDevExtremeCSS(host, { project: options.project }),
    (_host: Tree, context: SchematicContext) => {
      context.addTask(new NodePackageInstallTask());
    }
  ]);
}

// TODO: implement
function getLatestDevExtremeVersion() {
  return '18.2-unstable';
}

function addDevExtremeDependency(host: Tree, options: any) {
  addPackageJsonDependency(host, {
    type: NodeDependencyType.Default,
    name: 'devextreme',
    version: options.dxversion || getLatestDevExtremeVersion()
  })
  return host;
}

function addDevExtremeCSS(host: Tree, options: any) {
  const projectName = getProjectName(host, options);
  const angularConfigPath = './angular.json';
  const serializedConfig = host.read(angularConfigPath)!.toString('utf-8');
  const config = JSON.parse(serializedConfig);
  const projectBuildOptopns = config['projects'][projectName]['architect']['build']['options'];
  const projectSytles = projectBuildOptopns['styles'];

  projectSytles.unshift("node_modules/devextreme/dist/css/dx.light.css");
  projectSytles.unshift("node_modules/devextreme/dist/css/dx.common.css");

  projectBuildOptopns['styles'] = [...new Set(projectSytles)]

  host.overwrite(angularConfigPath, JSON.stringify(config, null, 2));

  return host;
}
