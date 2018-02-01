import {Component, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as $ from 'jquery';
import {isUndefined} from "util";
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
@Injectable()
export class AppComponent {
  constructor(private http: HttpClient) { }
  ngOnInit() {
    const loc = localStorage.getItem('cache');
    console.log(loc);
    if(typeof loc === 'string'){
      this.textArea = loc;
    }
    if(this.textArea.length){
      this.ser();
    }
  }
  placeholder = 'AAAAAAAAAA item name \r\n BBBBBBBBBBB item2 name';
  textArea = '';
  rows = [];
  loading = false;
  inputsValues = [];
  statuses = {
    pending: {
      key : 'pending',
      cls: 'fa fa-spinner fa-pulse',
      title: 'جاري الاتصال',
      addition : '',
    },
    failed: {
      key: 'failed',
      cls: 'fa fa-warning',
      title: 'غير قادر على الاتصال',
      addition : '',
    },
    rec: {
      key: 'rec',
      cls: 'fa fa-check',
      title: 'واصل',
      addition : '',
    },
    shipping: {
      key: 'shipping',
      cls: 'fa fa-times',
      title: 'غير واصل',
      addition : '',
    },
  };
  tblInput() {
    this.textArea = this.rows.reduce((str, row) => str + row.trackNo + ' ' + row.productName + '\r\n' , '').trim();
    localStorage.setItem('cache', this.textArea);
  }
  ser() {
    localStorage.setItem('cache', this.textArea);
    this.rows = [];
    this.loading = true;
    const lines = this.textArea.split('\n');
    for (const line of lines) {
      const row = [];
      const trackNo = line.split(' ')[0].trim();
      const productName = line.split(' ').slice(1).filter(v => v.trim().length ).join(' ');
      if (trackNo) {
        row['trackNo'] = trackNo;
        row['productName'] = productName;
        row['local'] = this.statuses.pending;
        row['isra'] = this.statuses.pending;
        this.rows.push(row);
      }
    }
    console.log(this.rows);
    this.checkLocal();
    this.checkIsra();
  }
  checkLocal() {
    const statuses = this.statuses;
    const http = this.http;
    let time = 500;
    let that = this;
    for (const row of this.rows) {
      setTimeout(function () {
        const formData: FormData = new FormData();
        formData.append('serial_no', row.trackNo);
        http.post('//bntracking.com/check.php', formData).subscribe(function (data) {
          data = data[0];
          try {
            const $table = $(data).find('thead').eq(0);
            const $tr = $(data).find('tbody tr').eq(0);
            if ( ! $table.length){
              row.local = statuses.failed;
            } else if (!$tr.length) {
              row.local = statuses.shipping;
            } else {
              const text = $tr.find('td').eq(2).text() + ' : ' + $tr.find('td').eq(3).text();
              const temp = statuses.rec;
              row.local = JSON.parse(JSON.stringify(temp));
              row.local.addition = text;
            }

          } catch (e) {
            row.local = statuses.failed;
          }
          that.checkSpin();
        }, function (error) {
          row.local = statuses.failed;
          that.checkSpin();
        });
      }, time);
      time += 200;
    }
  }
  checkIsra() {
    const statuses = this.statuses;
    const http = this.http;
    let time = 500;
    let that = this;
    for (const row of this.rows) {
      setTimeout(function () {
        const formData: FormData = new FormData();
        formData.append('itemcode', row.trackNo);
        http.post('//bntracking.com/check.php', formData).subscribe(function (data) {
          data = data['itemcodeinfo'];
          try {
            const $table = $(data).find('tr');
            const $tr = $(data).find('tbody tr').eq(1);
            if ($table.length !== 2){
              row.isra = statuses.failed;
            } else if (!$tr.length) {
              row.isra = statuses.shipping;
            } else {
              const text2 = $tr.find('td').eq(0).text() + ' : ' + $tr.find('td').eq(1).text();
              const temp = statuses.rec;
              row.isra = JSON.parse(JSON.stringify(temp));
              row.isra.addition = text2;
            }
          } catch (e) {
            row.isra = statuses.shipping;
          }
          that.checkSpin();

        }, function (error) {
          row.isra = statuses.failed;
          that.checkSpin();
        });
      }, time);
      time += 200;
    }
  }
  checkSpin() {
    const count = $('.table .fa.fa-spinner.fa-pulse').length;
    console.log(count);
    if (count <= 1){
      this.loading = false;
    }
  }

}
