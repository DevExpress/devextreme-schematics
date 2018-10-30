import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import * as path from 'path';
import { latestVersions } from '../utility/latest-versions';

const collectionPath = path.join(__dirname, '../collection.json');

describe('install', () => {
  // TODO: Extract workspase preparing somewhere
  const appOptions: any = {
    name: 'testApp',
    inlineStyle: false,
    inlineTemplate: false,
    routing: true,
    style: 'css',
    skipTests: false,
    skipPackageJson: false
  };

  const workspaceOptions: WorkspaceOptions = {
    name: 'workspace',
    // TODO: use angular latest-versions module
    version: '6.0.0'
  };

  const angularSchematicsCollection = require.resolve('../../node_modules/@schematics/angular/collection.json');
  const schematicRunner = new SchematicTestRunner('@schematics/angular', angularSchematicsCollection);
  let appTree: UnitTestTree;

  beforeEach(() => {
    appTree = schematicRunner.runSchematic('workspace', workspaceOptions);
    appTree = schematicRunner.runSchematic('application', appOptions, appTree);
  });

  it('should add devextreme dependency (default)', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('install', {}, appTree);
    const packageConfig = JSON.parse(tree.readContent('package.json'));

    expect(packageConfig.dependencies['devextreme']).toBe(latestVersions['devextreme']);
    expect(packageConfig.dependencies['devextreme-angular']).toBe(latestVersions['devextreme-angular']);
  });

  it('should add devextreme dependency (custom)', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('install', { dxversion: '18.2.3' }, appTree);
    const packageConfig = JSON.parse(tree.readContent('package.json'));

    expect(packageConfig.dependencies.devextreme).toBe('18.2.3');
  });

  it('should add devextreme cli devDependency', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('install', { dxversion: '18.2.3' }, appTree);
    const packageConfig = JSON.parse(tree.readContent('package.json'));

    expect(packageConfig.devDependencies['devextreme-cli']).toBeDefined();
  });

  it('should add devextreme styles', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('install', {}, appTree);
    const angularConfig = JSON.parse(tree.readContent('angular.json'));
    const styles = angularConfig['projects']['testApp']['architect']['build']['options']['styles'];

    expect(styles[0]).toBe('node_modules/devextreme/dist/css/dx.common.css');
    expect(styles[1]).toBe('node_modules/devextreme/dist/css/dx.light.css');
  });

  it('should register jszip', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('install', {}, appTree);
    const tsconfig = JSON.parse(tree.readContent('tsconfig.json'));
    const paths = tsconfig['compilerOptions']['paths'];

    expect(paths['jszip'][0]).toBe('node_modules/jszip/dist/jszip.min.js');
    expect(paths['quill-delta-to-html'][0])
      .toBe('node_modules/quill-delta-to-html/dist/browser/QuillDeltaToHtmlConverter.bundle.js');
    expect(paths['quill'][0]).toBe('node_modules/quill/dist/quill.min.js');
  });

  it('should add devextreme styles to the specified project', () => {
    const secondAppOptions: any = {
      name: 'testApp2',
      inlineStyle: false,
      inlineTemplate: false,
      projectRoot: 'src2',
      routing: true,
      style: 'css',
      skipTests: false,
      skipPackageJson: false
    };

    appTree = schematicRunner.runSchematic('application', secondAppOptions, appTree);

    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('install', { project: 'testApp2' }, appTree);
    const angularConfig = JSON.parse(tree.readContent('angular.json'));
    const styles = angularConfig['projects']['testApp2']['architect']['build']['options']['styles'];

    expect(styles[0]).toBe('node_modules/devextreme/dist/css/dx.common.css');
    expect(styles[1]).toBe('node_modules/devextreme/dist/css/dx.light.css');

    expect(angularConfig['projects']['testApp']['architect']['build']['options']['styles'].length).toBe(1);
  });
});
