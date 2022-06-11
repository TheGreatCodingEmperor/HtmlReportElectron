import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import { SafePipe } from './components/safe.pipe';

@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective, SafePipe],
  imports: [CommonModule, TranslateModule, FormsModule],
  exports: [TranslateModule, WebviewDirective, FormsModule,SafePipe]
})
export class SharedModule {}
