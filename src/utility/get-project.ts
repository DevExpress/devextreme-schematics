import { Tree } from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/config';

export function getProjects(host: Tree) {
  const workspace = getWorkspace(host);
  return Object.keys(workspace.projects);
}

export function getProjectName(host: Tree, project: any) {
  const projectName = project;
  const projects = getProjects(host);

  return projectName && projects.indexOf(projectName) > -1 ? projectName : projects[0];
};

export function getApplicationPath(host: Tree, projectName: string) {
  const project = getWorkspace(host).projects[projectName];
  let rootPath = project.sourceRoot || project.root;

  return rootPath ? `${rootPath}/app/` : 'src/app/';
}