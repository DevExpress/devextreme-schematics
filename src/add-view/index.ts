import {
  Rule,
  chain,
  Tree,
  SchematicsException,
  externalSchematic
} from '@angular-devkit/schematics';

import {
  findModuleFromOptions
} from '@schematics/angular/utility/find-module';

import {
  applyChanges
} from '../utility/change';

import {
  Node,
  SourceFile,
  SyntaxKind
} from 'typescript';

import { getSourceFile } from '../utility/source';

import { strings, basename, normalize, dirname } from '@angular-devkit/core';

import {
  getProjectName,
  getApplicationPath
} from '../utility/project';

function findComponentInRoutes(text: string, componentName: string) {
  return text.indexOf(componentName) !== -1;
}

function getChangesForRoutes(name: string, routes: Node) {
  const componentName = `${strings.classify(basename(normalize(name)))}Component`;
  const routesText = routes.getText();

  return findComponentInRoutes(routesText, componentName)
    ? ''
    : `{
        path: '${strings.dasherize(name)}',
        component: ${componentName},
        canActivate: [ AuthGuardService ]
    }`;
}

function getPathToFile(host: Tree, projectName: string, moduleName: string) {
  const rootPath = getApplicationPath(host, projectName);

  try {
    return findModuleFromOptions(host, { name: moduleName, path: rootPath, module: moduleName });
  } catch (error) {
    return;
  }
}

function isRouteVariable(node: Node, text: string) {
  return node.kind === SyntaxKind.VariableStatement &&
    text.search(/\:\s*Routes/) !== -1;
}

function findRoutesInSource(source: SourceFile) {
  return source.forEachChild((node) => {
    const text = node.getText();
    if (isRouteVariable(node, text)) {
      return node;
    }
  });
}

function addViewToNavigation(options: any) {
  return (host: Tree) => {
    const navigationName = 'app-navigation';
    const navigationFilePath = getPathToFile(host, options.project, navigationName);

    if (navigationFilePath) {
      const source = getSourceFile(host, navigationFilePath);

      if (!source) {
        return host;
      }

      const changes = `{
            text: '${strings.capitalize(basename(normalize(options.name)))}',
            path: '${strings.dasherize(options.name)}',
            icon: '${options.icon}'
        }`;

      return applyChanges(host, changes, navigationFilePath, source.getText(), source.getEnd());
    }
  };
}

export function addViewToRouting(options: any) {
  return (host: Tree) => {
    const routingModulePath = getPathToFile(host, options.project, options.module);

    if (!routingModulePath) {
      throw new SchematicsException('Specified module does not exist.');
    }

    const source = getSourceFile(host, routingModulePath);

    if (!source) {
      return host;
    }

    const routes = findRoutesInSource(source);

    if (!routes) {
      throw new SchematicsException('No routes found.');
    }

    const changes = getChangesForRoutes(options.name, routes);

    if (!changes) {
      return host;
    }

    return applyChanges(host, changes, routingModulePath, source.getText(), routes.getEnd());
  };
}

function getPathForView(name: string) {
  if (name.includes('/')) {
    return name;
  }
  return 'pages/' + name;
}

function getModuleName(addRoute: boolean, moduleName: string) {
  if (!moduleName && addRoute) {
    return 'app-routing';
  }
  return moduleName;
}

function addContentToView(options: any) {
  return (host: Tree) => {
    const name = strings.dasherize(basename(normalize(options.name)));
    const path = `${dirname(options.name)}/${name}`;
    const componentPath = `/${getApplicationPath(host, options.project)}${path}/${name}.component.html`;
    if (host.exists(componentPath)) {
      host.overwrite(
        componentPath,
        `<h2>${name}</h2>\n<div class="dx-card content-block">Put your content here</div>\n`);
    }
    return host;
  };
}

export default function(options: any): Rule {
  return (host: Tree) => {
    const addRoute = options.addRoute;
    const project = getProjectName(host, options);
    const module = getModuleName(addRoute, options.module);
    const name = getPathForView(options.name);

    const rules = [externalSchematic('@schematics/angular', 'component', {
        name,
        project,
        module,
        spec: options.spec,
        inlineStyle: options.inlineStyle,
        prefix: options.prefix
      }),
      addContentToView({ name, project })
    ];

    if (addRoute) {
      rules.push(addViewToRouting({ name, project, module }));
      rules.push(addViewToNavigation({ name, icon: options.icon, project }));
    }
    return chain(rules);
  };
}
