import { Component } from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './<%= name %>.component.html',
    styleUrls: ['./<%= name %>.component.scss']
})
export class <%= strings.classify(name) %>Component  {
  title = '<%= title %>';
}
