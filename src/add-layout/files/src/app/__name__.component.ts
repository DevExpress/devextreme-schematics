import { Component } from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './<%= name %>.component.html',
    styleUrls: ['./<%= name %>.component.scss']
})
export class <%= classify(name) %>Component  {

}
