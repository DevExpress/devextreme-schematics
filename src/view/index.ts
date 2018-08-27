import {
  Rule,
  chain,
  Tree,
  schematic
} from '@angular-devkit/schematics';

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
  return (host: Tree) => {
      const projectName = getProjectName(host, options);
      const pathToView = "src/app/pages";
  
      return chain([
          schematic('component', { project: projectName, path: pathToView })
      ]);
  }
}
