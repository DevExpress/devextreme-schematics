import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('sample views', () => {
  const appOptions: any = {
    name: 'testApp',
    inlineStyle: false,
    inlineTemplate: false,
    routing: true,
    style: 'scss',
    skipTests: false,
    skipPackageJson: false
  };

  const workspaceOptions: WorkspaceOptions = {
    name: 'workspace',
    version: '6.0.0'
  };

  const options: any = {
    layouts: 'side-nav-outer-toolbar',
    overwriteComponent: true
  };

  const schematicRunner = new SchematicTestRunner('@schematics/angular', require.resolve('../../node_modules/@schematics/angular/collection.json'));
  let appTree: UnitTestTree;


  beforeEach(() => {
    appTree = schematicRunner.runSchematic('workspace', workspaceOptions);
    appTree = schematicRunner.runSchematic('application', appOptions, appTree);
  });

  it('should add layout with overwrite', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-layout', options, appTree);

    expect(tree.files).toContain('/testApp/src/app/app-navigation.ts');
    expect(tree.files).toContain('/testApp/src/app/shared/components/header/header.component.ts');
    expect(tree.files).toContain('/testApp/src/app/shared/components/navigation-menu/navigation-menu.component.ts');
    expect(tree.files).toContain('/testApp/src/app/layout/layout.component.ts');
    expect(tree.files).toContain('/testApp/src/themes/theme.additional.css');


    const componentContent = tree.readContent('/testApp/src/app/app.component.html');
    expect(componentContent).toMatch(/<app-layout>/);

    const stylesContent = tree.readContent('/testApp/src/styles.scss');
    expect(stylesContent).toMatch(/html, body {/);

    const moduleContent = tree.readContent('/testApp/src/app/app.module.ts');
    expect(moduleContent).toMatch(/import { AppLayoutModule }/);
    expect(moduleContent).toMatch(/import { AppRoutingModule }/);
  });

  it('should add layout without overwrite', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);

    options.overwriteComponent = false;
    const tree = runner.runSchematic('add-layout', options, appTree);

    expect(tree.files).toContain('/testApp/src/app/app1.component.ts');

    const componentContent = tree.readContent('/testApp/src/app/app1.component.html');
    expect(componentContent).toMatch(/<app-layout>/);
  });

  it('should add routing to layout', () => {

    let newAppTree = schematicRunner.runSchematic('workspace', workspaceOptions);

    appOptions.routing = false;
    newAppTree = schematicRunner.runSchematic('application', appOptions, newAppTree);

    const runner = new SchematicTestRunner('schematics', collectionPath);

    const tree = runner.runSchematic('add-layout', options, appTree);

    expect(tree.files).toContain('/testApp/src/app/app-routing.module.ts');
  });
});
