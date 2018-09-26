import { Injectable } from '@angular/core';
import * as AspNetData from "devextreme-aspnet-data-nojquery";
<% const key = getKeyDataProperty(apiSpec);
   const lookups = getDataLookups(apiSpec); %>
const url:string = '/';
const dataSource:any = AspNetData.createStore({
<% if(key instanceof Array) {
%>      key: [<%= key.map((f) => { return '\'' + f + '\''; }) %>], <%
} else {
%>      key: '<%= key %>', <% 
} %>
      loadUrl: url + '<%= getLoadUrl(apiSpec) %>',
      insertUrl: url + '<%= getInsertUrl(apiSpec) %>',
      updateUrl: url + '<%= getUpdateUrl(apiSpec) %>',
      deleteUrl: url + '<%= getDeleteUrl(apiSpec) %>',
        onBeforeSend: function(method, ajaxOptions) {
          ajaxOptions.xhrFields = { withCredentials: true };
        }
      });

<% 
   for(let i = 0; i < lookups.length; i++) { %>
const <%= camelize(lookups[i].name) %>Data = AspNetData.createStore({
      key: "Value",
      loadUrl: url + '<%= lookups[i].action %>',
      onBeforeSend: function(method, ajaxOptions) {
        ajaxOptions.xhrFields = { withCredentials: true };
      }
    });
<% } %>

@Injectable()
export class Service {
  get<%= getDbName(apiSpec) %>() { return dataSource; }
<% for(let i = 0; i < lookups.length; i++) {
%>  get<%= lookups[i].name %>() { return <%= camelize(lookups[i].name) %>Data; }
<% } %>
}