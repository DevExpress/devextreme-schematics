import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('view', () => {
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
    version: '6.0.0'
  };

  const componentOptions: any = {
    name: 'test',
    inlineStyle: false,
    inlineTemplate: false,
    changeDetection: 'Default',
    styleext: 'css',
    skipImport: true,
    module: undefined,
    export: false,
    project: 'testApp'
  };

  const schematicRunner = new SchematicTestRunner('@schematics/angular', require.resolve('../../node_modules/@schematics/angular/collection.json'));
  let appTree: UnitTestTree;


  beforeEach(() => {
    appTree = schematicRunner.runSchematic('workspace', workspaceOptions);
    appTree = schematicRunner.runSchematic('application', appOptions, appTree);
  });

  it('should create new view', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-view', componentOptions, appTree);

    expect(tree.files).toContain('/testApp/src/app/pages/test/test.component.ts');
    expect(tree.files).toContain('/testApp/src/app/pages/test/test.component.html');

    const content = tree.readContent('/testApp/src/app/pages/test/test.component.html');

    expect(content).toMatch(/<h2>test<\/h2>/);
  });

  it('should add view to default routing module', () => {
    const options = { ...componentOptions, addRoute: true };

    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-view', options, appTree);
    const moduleContent = tree.readContent('/testApp/src/app/app-routing.module.ts');

    expect(moduleContent).toMatch(/Routes = \[{/);
    expect(moduleContent).toMatch(/component: TestComponent/);
    expect(moduleContent).toMatch(/path: 'pages\/test'/);
  });

  it('should add view to other routing module', () => {
    const options = { ...componentOptions, addRoute: true, module: 'test/test-routing' };

    const runner = new SchematicTestRunner('schematics', collectionPath);
    let tree = runner.runExternalSchematic('@schematics/angular', 'module', { name: 'test', routing: true, project: 'testApp' }, appTree);
    tree = runner.runSchematic('add-view', options, tree);

    const moduleContent = tree.readContent('/testApp/src/app/test/test-routing.module.ts');

    expect(moduleContent).toMatch(/component: TestComponent/);
    expect(moduleContent).toMatch(/path: 'pages\/test'/);
  });

  it('should add view to navigation', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    let tree = runner.runSchematic('add-layout', { layout: 'side-nav-outer-toolbar' }, appTree);
    tree = runner.runSchematic('add-view', componentOptions, tree);

    componentOptions.name = 'some test';
    componentOptions.icon = 'home';
    tree = runner.runSchematic('add-view', componentOptions, tree);

    const moduleContent = tree.readContent('/testApp/src/app/app-navigation.ts');

    expect(moduleContent).toMatch(/text: 'Some test'/);
    expect(moduleContent).toMatch(/icon: 'home'/);
    expect(moduleContent).toMatch(/text: 'Test'/);
    expect(moduleContent).toMatch(/icon: 'folder'/);
  });

  it('should create new view with path', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    componentOptions.name = 'folder/test';
    const tree = runner.runSchematic('add-view', componentOptions, appTree);

    expect(tree.files).toContain('/testApp/src/app/folder/test/test.component.ts');
    expect(tree.files).toContain('/testApp/src/app/folder/test/test.component.html');
  });
});
