import { Tree } from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/config';

export function getProjectName(host: Tree, project: any) {
  const projectName = project;
  const workspace = getWorkspace(host);
  const projects = Object.keys(workspace.projects);

  return projectName && projects.indexOf(projectName) > -1 ? projectName : projects[0];
}

export function getApplicationPath(host: Tree, projectName: string) {
  const rootPath = getRootPath(host, projectName);
  return rootPath ? `${rootPath}/app/` : 'src/app/';
}

export function getRootPath(host: Tree, projectName: string) {
  const project = getWorkspace(host).projects[projectName];
  return project.sourceRoot || project.root;
}
