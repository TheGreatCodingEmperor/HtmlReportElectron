import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, NgZone, Sanitizer, SecurityContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import QuillBetterTable from 'quill-better-table';
declare var require: any
declare const Quill: any;
declare const quillBetterTable: any;

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import { JsonEditorComponent, JsonEditorOptions } from 'ang-jsoneditor';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  constructor(
    private zone: NgZone,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {
  }

  @ViewChild('editable', { static: true }) editRef!: ElementRef;
  @ViewChild('container', { static: true }) quillEditorContainer: ElementRef | null = null;
  @ViewChild('.ql-toolbar', { static: false }) toolbar: ElementRef | null = null;
  @ViewChild('menu', { static: false }) menuEditor: JsonEditorComponent;

  quill: any;
  pBreaks: number[] = [];
  pageSize = { width: 595, height: 842 };
  // pageSize = { width: 210, height: 297 };
  printSize = { width: 210, height: 330 };
  
  public editorOptions: JsonEditorOptions;
  public data: any={
    employee: {
      name: 'john',
      age: 32,
      hobby: 'tennis'
    }
  };

  get InnerHTML(){
    return this.sanitizer.bypassSecurityTrustHtml(this.quill?.root.innerHTML);
  }

  setJson(){
    this.data = this.menuEditor.get();
  }

  ngOnInit() {
    this.editorOptions = new JsonEditorOptions()
    this.editorOptions.modes = ['code', 'text', 'tree', 'view']; // set all allowed modes
    this.editorOptions.mode = 'code'; //set only one mod
    setTimeout(() => {
      this.initEditor();
    }, 1000)
  }

  initEditor(): void {
    Quill.register({
      'modules/better-table': quillBetterTable
    }, true);
    // tslint:disable-next-line:no-unused-expression
    this.quill = new Quill(this.editRef.nativeElement, {
      theme: 'snow',
      modules: {
        table: false,
        'better-table': {
          operationMenu: {
            items: {
              unmergeCells: {
                text: 'Another unmerge cells name'
              }
            },
            color: {
              colors: ['green', 'red', 'yellow', 'blue', 'white'],
              text: 'Background Colors:'
            }
          }
        },
        toolbar: {
          container: [
            ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
            ['code-block'],
            [{ 'header': 1 }, { 'header': 2 }],               // custom button values
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
            [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
            [{ 'direction': 'rtl' }],                         // text direction

            [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

            [{ 'font': [] }],
            [{ 'align': [] }],
            [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme

            ['clean'],                                         // remove formatting button

            ['link'],
            ['link', 'image', 'video']
          ],

        },
        keyboard: {
          bindings: quillBetterTable.keyboardBindings
        }
      }
    }
    );
    // const value = `<h1>New content here</h1>`
    // this.quill.clipboard.dangerouslyPasteHTML(this.htmlText);
    // this.quill.container.firstChild.innerHTML = this.htmlText
    this.quill.clipboard.dangerouslyPasteHTML(0, this.htmlText);
    this.quill.on('text-change', (delta: any, oldDelta: any, source: any) => {
      this.pageBreak();
      this.htmlText = this.sanitizer.bypassSecurityTrustHtml(this.quill.root.innerHTML);
    })
  }

  ngAfterViewInit() {

  }

  onInsertTable() {
    const tableModule = this.quill.getModule('better-table');
    tableModule.insertTable(3, 3);
  }

  pageBreak() {
    this.pBreaks = [];
    let toolbarHeight = 0;
    if (this.toolbar) {
      toolbarHeight = this.toolbar.nativeElement.offsetHeight;
    }
    if (this.quillEditorContainer) {
      console.log(this.quillEditorContainer.nativeElement.offsetHeight);
      let element = this.quillEditorContainer.nativeElement;
      let heightPx = this.printSize.height * element.offsetWidth/this.printSize.width;
      let pbreak = ((element.offsetHeight - toolbarHeight)) / heightPx;
      for (let i = 1; i < pbreak; i++) {
        this.pBreaks.push(heightPx * i + toolbarHeight);
      }
    }
  }
  quillSnowCssApi(){
    return this.http.get("assets/quill/quill.snow.css", { responseType: 'text' });
  }
  quillBetterTableCssApi(){
    return this.http.get("assets/quill/quill-better-table.css", { responseType: 'text' });
  }

  toPdf() {
    console.log(this.quill.root.innerHTML);
    let data = this.data;
    // 手動擷取 html + css 列印
    forkJoin(
      this.quillSnowCssApi(),
      this.quillBetterTableCssApi()
    ).subscribe(styleStrings => {
      let realHeight = document.getElementById("section-to-print2").offsetHeight;
      let htmlString = `${document.getElementById("section-to-print").innerHTML}`;
      var re = /\[[A-Za-z0-9\.]*\]/g;
      console.log(htmlString.match(re))
      let matches = htmlString.match(re);
      if (matches) {
        matches.forEach((attr: string) => {
          console.log(attr)
          htmlString = htmlString.replace(attr, eval(`data.` + attr.replace('[', '').replace(']', '')));
        });
      }
      htmlString = `<style>
            ${styleStrings[0]} 
            ${styleStrings[1]} 
            </style>
            <style>
            body{
              height: fit-content;
            }
            @page {
              size: A4;
            }
            #section-to-print2{
              height:${realHeight}px;
            }
            @media print {
              body {-webkit-print-color-adjust: exact;}
              body * {
                visibility: hidden;
              }
              .ql-editor{
                overflow:hidden;
                border: none;
              }
              #section-to-print2, #section-to-print2 * {
                visibility: visible;
              }
              #section-to-print2 {
                position: absolute;
                left: 0;
                top: 0;
              }
            }
            </style>` + htmlString;
      `<style>
            @media print {
              body {-webkit-print-color-adjust: exact;}
              body * {
                visibility: hidden;
              }
              #section-to-print2, #section-to-print2 * {
                visibility: visible;
              }
              #section-to-print2 {
                position: absolute;
                left: 0;
                top: 0;
              }
            }
            body {
              height: ${this.printSize.height}mm;
              width: ${this.printSize.width}mm;
              margin-left: auto;
              margin-right: auto;
            }
            </style>`
      var myWindow = window.open('', '', `width=700,height=900`) as any;
      myWindow.document.write(htmlString);

      myWindow.document.close();
      myWindow.focus();
      myWindow.print();
      // setTimeout(() => {
      //   myWindow.close();
      // }, 3000);
    });

    // 截圖 需實際畫面顯示
    // let DATA: any = document.getElementById('section-to-print');
    // let htmlText =  DATA.innerHTML;
    // var re = /\[[A-Za-z0-9\.]*\]/g;
    // let matches = htmlText.match(re);
    // if (matches) {
    //   matches.forEach((attr: string) => {
    //     console.log(attr)
    //     htmlText = htmlText.replace(attr, eval(`data.` + attr.replace('[', '').replace(']', '')));
    //   });
    // }
    // DATA.innerHTML = htmlText;

    // html2canvas(DATA).then((canvas) => {
    //   const FILEURI = canvas.toDataURL('image/png');
    //   let PDF = new jsPDF('p', 'mm', 'a4');
    //   let position = 0;
    //   PDF.addImage(FILEURI, 'PNG', 0, position, this.printSize.width, (DATA.offsetHeight / DATA.offsetWidth) * this.printSize.width);
    //   // PDF.save('angular-demo.pdf');
    //   var string = PDF.output('datauristring');
    //   var embed = "<embed width='100%' height='100%' src='" + string + "'/>"
    //   var x = window.open() as any;
    //   x.document.open();
    //   x.document.write(embed);
    //   x.document.close();
    // });
  }

  htmlText: string | SafeHtml = `<p>header</p><p>Testing</p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p>123</p>`
}