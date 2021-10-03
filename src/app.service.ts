import { Injectable, Logger } from '@nestjs/common';
import { type } from 'os';
import * as FS from './filesystem-api';
import { BWData } from './bwdata';

interface BW_RESULT_LINE {
    date: string;
    src_region: string;
    src_location: string;
    src_zone: string;
    src_vip: string;
    src_device: string;
    src_ip: string;

    dest_region: string;
    dest_location: string;
    dest_zone: string;
    dest_vip: string;
    dest_device: string;
    dest_ip: string;

    calc_bandwidth: string;
}

@Injectable()
export class AppService {
    private readonly logger = new Logger(AppService.name);
    private lineItems: BW_RESULT_LINE[] = [];
    private obj: BWData;

    processData(): string {
        this.readFile().then((data: any) => {
           //  this.logger.log("===>" + data);
            let jData = JSON.parse(data);
            this.parseEntWatchJson(jData[0]);
           
        });
        return "Processing ...";
    }

    parseEntWatchJson(data) {
        const runTitle = data.title;
       

        let lvl1Size = data.children.length;
        const strPtrn1 = /(\w+)\s+\([\w\s,]+\)\s+([\d\/]+\s+(\d+:\d+:\d+))/;
        const strPtrn2 = /(\w+)\s+(\d+.\d+.\d+.\d+)\s+\((\d+)\)/;

        let info = strPtrn1.exec(data.title);
        //this.obj.date = info[3] + " " + info[4];

        for( let i = 0; i < lvl1Size; i++ ) {
            this.obj = new BWData();
            const results = strPtrn2.exec(data.children[i].title);
            
            this.logger.log(results[1]);
            this.obj.date = info[3];
            this.obj.src_region = "Region1";
            this.obj.src_location = "Location1";
            this.obj.dest_region = "Region1";
            this.obj.dest_location = "Location1";
            this.obj.src_vip = results[2];
            this.obj.src_zone = results[3];

            this.processNodeLevel(data.children[i].children);
            this.lineItems.push(this.obj);
            this.obj = null;
        }

        this.dumpObj();
       
       
    }

    processNodeLevel(data) {
        const strPtrn1 = /(\w+)\s+(\d+.\d+.\d+.\d+)\s+/;
        
        for( let i = 0; i < data.length; i++) {
            const results = strPtrn1.exec(data[i].title);
            this.logger.log(results[1]);

            this.obj.src_ip = results[2];

            this.processTestLevel(data[i].children);

            
        }
    }

    processTestLevel(data: any) {
        const strPtrn1 = /^BWdly\s+[A-Za-z]+\s+(\d+)\s+KBps,\s+delay\s+([0-9.]+),\s+[0-9:]+\s+from\s+(\d+.\d+.\d+.\d+)/;
        const strPtrn2 = /^BWdly\s+(Not supported)/;
        const strPtrn3 = /^BWdly\s+(\d+)\s+KBps,\s+delay\s+([0-9.]+),\s+[0-9:]+\s+from\s+(\d+.\d+.\d+.\d+)/;
        let result;

        for ( let i = 0; i < data.length; i++) {
            let checkStr: string = data[i].title;

            if (checkStr.indexOf("BWdly") ) {
                // this.logger.log("Skipping index: " + i);
                continue;
            }
            this.logger.log("Checking ..." + data[i].title);
            if ( (result = strPtrn1.exec(data[i].title)) ) {
                this.logger.log("Got match 1:" + result);
            } else if ( (result = strPtrn2.exec(data[i].title) ) ) {
                this.logger.log("Got match 2:" + result);
            } else if ( (result = strPtrn3.exec(data[i].title)) ) {
                this.logger.log("Got match 3:" + result[1]);
            }

            this.obj.calc_bandwidth = result[1];


        }

    }

    readFile() {

        const file = "171.151.3.230.jsonh.1632872063";
        const path = "";
        
        return new Promise((resolve, reject) => {
            FS.readFile(path + file)
                .then(data => {
                    resolve(data);
                })
                .catch(err => {
                    console.log(`Error opening file: ${err}`);
                });
        });
    }

    dumpObj() {

        this.logger.log(JSON.stringify(this.lineItems[0]));
    }
}
