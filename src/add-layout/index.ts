import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  url,
  move,
  chain,
  filter,
  forEach,
  mergeWith,
  callRule,
  MergeStrategy,
  FileEntry,
  template
} from '@angular-devkit/schematics';

import { of } from 'rxjs';

import { strings } from '@angular-devkit/core';

import { join } from 'path';

import {
  getApplicationPath,
  getRootPath,
  getSourceRootPath,
  getProjectName
 } from '../utility/project';

import {
  humanize
} from '../utility/string';

import {
  addStylesToApp
 } from '../utility/styles';

import {
  modifyJSONFile
 } from '../utility/modify-json-file';

import {
  NodeDependencyType,
  addPackageJsonDependency
} from '@schematics/angular/utility/dependencies';

import {
  NodePackageInstallTask
} from '@angular-devkit/schematics/tasks';

import { getSourceFile } from '../utility/source';

import {
  addImportToModule
} from '@schematics/angular/utility/ast-utils';

import {
  applyChanges
} from '../utility/change';
import { getWorkspace } from '@schematics/angular/utility/config';

function addStyles(sourcePath: string) {
  const modifyContent = (templateContent: string, currentContent: string) => {
    return currentContent + templateContent;
  };

  return modifyContentByTemplate(sourcePath, './files', `/src/styles.scss`, {}, {}, modifyContent);
}

function addScriptSafe(scripts: any, name: string, value: string) {
  const currentValue = scripts[name];

  if (!currentValue) {
    scripts[name] = value;
    return;
  }

  const alterName = `origin-${name}`;
  const safeValue = `npm run ${alterName} && ${value}`;

  if (currentValue === value || currentValue === safeValue) {
    return;
  }

  scripts[alterName] = currentValue;
  scripts[name] = safeValue;
}

function addBuildThemeScript() {
  return (host: Tree) => {
    modifyJSONFile(host, './package.json', config => {
      const scripts = config['scripts'];

      addScriptSafe(scripts, 'build-themes', 'devextreme build');
      addScriptSafe(scripts, 'postinstall', 'npm run build-themes');

      return config;
    });

    return host;
  };
}

function addCustomThemeStyles(options: any, sourcePath: string) {
  return (host: Tree) => {
    modifyJSONFile(host, './angular.json', config => {
      const stylesList = [
        `${sourcePath}/themes/generated/theme.base.css`,
        `${sourcePath}/themes/generated/theme.additional.css`,
        'node_modules/devextreme/dist/css/dx.common.css'
      ];

      return addStylesToApp(host, options.project, config, stylesList);
    });

    return host;
  };
}

function addViewportToRoot(sourcePath: string) {
  return (host: Tree) => {
    const indexPath =  join(sourcePath, 'index.html');
    let indexContent = host.read(indexPath)!.toString();

    indexContent = indexContent.replace(/<app-root>/, '<app-root class="dx-viewport">');
    host.overwrite(indexPath, indexContent);

    return host;
  };
}

function addImportToAppModule(sourcePath: string, importName: string, path: string) {
  return (host: Tree) => {
    const appModulePath = sourcePath + 'app.module.ts';
    const source = getSourceFile(host, appModulePath);

    if (!source) {
      return host;
    }

    const changes = addImportToModule(source, appModulePath, importName, path);

    return applyChanges(host, changes, appModulePath);
  };
}

function getComponentName(host: Tree, sourcePath: string) {
  let name = '';
  const index = 1;

  if (!host.exists(sourcePath + 'app.component.ts')) {
    name = 'app';
  }

  while (!name) {
    const componentName = `app${index}`;
    if (!host.exists(`${sourcePath}${componentName}.component.ts`)) {
      name = componentName;
    }
  }

  return name;
}

function hasRoutingModule(host: Tree, sourcePath: string) {
  return host.exists(sourcePath + 'app-routing.module.ts');
}

function addPackagesToDependency() {
  return (host: Tree) => {
    addPackageJsonDependency(host, {
      type: NodeDependencyType.Default,
      name: '@angular/cdk',
      version: '^7.0.0'
    });

    return host;
  };
}

function modifyContentByTemplate(
  pathToMove: string,
  templateSourcePath: string,
  filePath: string,
  templateOptions: any = {},
  modifyOptions: any = {},
  modifyContent?: (templateContent: string, currentContent: string) => string)
: Rule {
  return(host: Tree, context: SchematicContext) => {
    const modifyIfExists = (fileEntry: FileEntry) => {
      const override = modifyOptions.override;
      if (!override && !host.exists(filePath)) {
        return fileEntry;
      }

      const templateContent = fileEntry.content!.toString();
      let fileEntryPath = fileEntry.path.toString();
      let modifiedContent = templateContent;

      if (modifyContent) {
        const currentContent = host.read(filePath)!.toString();
        modifiedContent = modifyContent(templateContent, currentContent);
      }

      if (override) {
        fileEntryPath = join(modifyOptions.rootPath, fileEntryPath);
      }

      // NOTE: Workaround for https://github.com/angular/angular-cli/issues/11337
      host.overwrite(fileEntryPath, modifiedContent);

      return null;
    };

    const rules = [
      filter(path => {
        let isSkip = false;
        const skipFiles = modifyOptions.skipFiles;
        if (skipFiles) {
          isSkip = skipFiles.some((file: string) => path.includes(file));
        }

        return !isSkip && (filePath === '*' || join('./', path) === join('./', filePath));
      }),
      template(templateOptions),
      forEach(modifyIfExists),
      move(pathToMove)
    ];

    const modifiedSource = apply(url(templateSourcePath), rules);
    const resultRule = mergeWith(modifiedSource, MergeStrategy.Overwrite);

    return callRule(resultRule, of(host), context);
  };
}

function addAppComponent(rootPath: string, templateOptions: any, componentOptions: any) {
  return ['ts', 'html', 'scss'].map((ext) => {
    return modifyContentByTemplate(
      rootPath,
      './files',
      `src/app/__name__.component.${ext}`,
      templateOptions,
      componentOptions);
  });
}

function updateDevextremeConfig(sourcePath: string) {
  const devextremeConfigPath = '/devextreme.json';
  const templateOptions = {
    engine: 'angular',
    sourcePath
  };

  const modifyConfig = (templateContent: string, currentContent: string) => {
    const oldConfig = JSON.parse(currentContent);
    const newConfig = JSON.parse(templateContent);

    [].push.apply(oldConfig.build.commands, newConfig.build.commands);

    return JSON.stringify(oldConfig, null, '   ');
  };

  return modifyContentByTemplate('./', './files', devextremeConfigPath, templateOptions, {}, modifyConfig);
}

export default function(options: any): Rule {
  return (host: Tree) => {
    const project = getProjectName(host, options.project);
    const title = humanize(project);
    const appPath = getApplicationPath(host, project);
    const sourcePath = getSourceRootPath(host, project);
    const rootPath = getRootPath(host, project);
    const layout = options.layout;
    const override = options.resolveConflicts === 'override';
    const componentName = override ? 'app' : getComponentName(host, appPath);
    const pathToCss = sourcePath.replace(/\/?(\w)+\/?/g, '../');
    const templateOptions = {name: componentName, layout, title, strings, path: pathToCss};
    const componentOptions = { override, rootPath };
    const skipFiles = [
      'styles.scss',
      '__name__.component.html',
      '__name__.component.ts',
      '__name__.component.scss'];

    if (hasRoutingModule(host, appPath)) {
      skipFiles.push('app-routing.module.ts');
    }

    const rules = [
      modifyContentByTemplate(sourcePath, './files/src', '*', templateOptions, { skipFiles }),
      updateDevextremeConfig(sourcePath),
      addImportToAppModule(appPath, 'SideNavOuterToolbarModule', './layouts'),
      addImportToAppModule(appPath, 'SideNavInnerToolbarModule', './layouts'),
      addImportToAppModule(appPath, 'FooterModule', `./shared/components/footer/footer.component`),
      addStyles(rootPath),
      addBuildThemeScript(),
      addCustomThemeStyles(options, sourcePath),
      addViewportToRoot(sourcePath),
      addPackagesToDependency()
    ];

    [].push.apply(rules, addAppComponent(rootPath, templateOptions, componentOptions));

    if (!options.skipInstall) {
      rules.push((_: Tree, context: SchematicContext) => {
        context.addTask(new NodePackageInstallTask());
      });
    }

    if (override) {
      const workspace = getWorkspace(host);
      if (project === workspace.defaultProject) {
        rules.push(modifyContentByTemplate('./', './files', 'e2e/src/app.e2e-spec.ts', { title }));
        rules.push(modifyContentByTemplate('./', './files', 'e2e/src/app.po.ts'));
      }
    }

    if (!hasRoutingModule(host, appPath)) {
      rules.push(addImportToAppModule(appPath, 'AppRoutingModule', './app-routing.module'));
    }

    return chain(rules);
  };
}
