import { Injectable, Logger } from '@nestjs/common';
import { type } from 'os';
import * as FS from './filesystem-api';
import { BWData, BW_RESULT_LINE, DESTINATION_INFO, BWDLY_ROW_DATA } from './bwdata';


@Injectable()
export class AppService {
    private readonly logger = new Logger(AppService.name);
    private lineItems: BW_RESULT_LINE[] = [];
    private obj: BWData;
    private destInfoTbl: DESTINATION_INFO[] = [];
    private jData: JSON;

    async processData() {
        let data: any = await this.readFile();
        this.jData = JSON.parse(data);
        return await this.processZoneLevel(this.jData[0]);
    }

    async processDataMain() {
        let data: any = await this.readFile();
        this.jData = JSON.parse(data);
        await this.processZoneLevel(this.jData[0]);
        this.populatelDestinationInfo();
        return this.lineItems;
    }

    processZoneLevel(data): Promise<any> {
        return new Promise((resolve, reject) => {
            let zoneCnt = data.children.length;
            const entLvlTitle = /(\w+)\s+\([\w\s,]+\)\s+([\d\/]+\s+(\d+:\d+:\d+))/;
            const zoneLvlTitle = /(\w+)\s+(\d+.\d+.\d+.\d+)\s+\((\d+)\)/;
            const enterprise = 1;
            const nodes_zones = 2;
            const date = 3;
            const time = 4;
           
            const entLvlTitleData = entLvlTitle.exec(data.title);

            for( let i = 0; i < zoneCnt; i++ ) {
                const zoneLvlTitleData = zoneLvlTitle.exec(data.children[i].title);
                let nodeAry = this.processNodeLevel(data.children[i].children);
                
                this.logger.log("nodeary length = " + nodeAry.length);

                for ( let ii = 0; ii < nodeAry.length; ii++) {
                    let  data = <BW_RESULT_LINE>{};
                    let dest_data = <DESTINATION_INFO>{};

                    data.date = entLvlTitle[date];
                    data.src_region = "SRC_REGION";
                    data.src_location = "SRC_LOCATION";
                    dest_data.dest_zone = data.src_zone = zoneLvlTitleData[3];
                    dest_data.dest_vip = data.src_vip = zoneLvlTitleData[2];
                    dest_data.dest_device = data.src_device = nodeAry[ii].device;
                    dest_data.dest_ip = data.src_ip = nodeAry[ii].dev_ip;
                    data.calc_bandwidth = nodeAry[ii].bwdly;
                    data.from_ip = nodeAry[ii].from_ip;
                    data.dest_region = "DEST_REGION";
                    data.dest_location = "DEST_LOCATION";

                    this.lineItems.push(data);

                    // Build destination info table
                    this.destInfoTbl.push(dest_data);
                }
            }

           resolve(/*this.lineItems*/1);
        });
    }

    processNodeLevel(data): any[] {
        const nodeLvlTitle = /(\w+)\s+(\d+.\d+.\d+.\d+)\s+/;
        let nodeObjAry: string[] = [];
        let nodeObj = {
            device: "",
            dev_ip: "",
            bwdly: "",
            from_ip: ""
        }
        
        for( let i = 0; i < data.length; i++) {
            const obj = Object.create(nodeObj);
            const nodeLvlTitleData = nodeLvlTitle.exec(data[i].title);
            
            obj.device =  nodeLvlTitleData[1];
            obj.dev_ip = nodeLvlTitleData[2];
            let result = this.processTestLevel(data[i].children);
            obj.bwdly = result.bwdly;
            obj.from_ip = result.from_ip;
            nodeObjAry.push(obj);
        }
        return nodeObjAry;
    }

    processTestLevel(testLvl: any): any {
        const strPtrn1 = /^BWdly\s+[A-Za-z]+\s+(\d+)\s+KBps,\s+delay\s+([0-9.]+),\s+[0-9:]+\s+from\s+(\d+.\d+.\d+.\d+)/;
        const strPtrn2 = /^BWdly\s+(Not supported)/;
        const strPtrn3 = /^BWdly\s+(\d+)\s+KBps,\s+delay\s+([0-9.]+),\s+[0-9:]+\s+from\s+(\d+.\d+.\d+.\d+)/;
        let result;
        let testObj = {
            bwdly: "",
            from_ip: "",
        }

        for ( let i = 0; i < testLvl.length; i++) {
            let checkStr: string = testLvl[i].title;

            if (checkStr.indexOf("BWdly") ) {
                continue;
            }

            const obj = Object.create(testObj);            
            // this.logger.log("Checking ..." + data[i].title);
            if ( (result = strPtrn1.exec(testLvl[i].title)) ) {
                obj.bwdly = result[1];
                obj.from_ip = result[3];
            } else if ( (result = strPtrn2.exec(testLvl[i].title) ) ) {
                obj.bwdly = "NS";
                obj.from_ip = "NS";
            } else if ( (result = strPtrn3.exec(testLvl[i].title)) ) {
                obj.bwdly = result[1];
                obj.from_ip = result[3];
            }

            return obj;
        }

    }

    getDestDataIndex(from_ip) {

        for( let i = 0; i < this.destInfoTbl.length; i++ ) {
            this.logger.log(`Got ${this.destInfoTbl[i].dest_ip} looking for ${from_ip}}`);
            if(this.destInfoTbl[i].dest_ip === from_ip) {
                return i;
            } else if( this.destInfoTbl[i].dest_vip === from_ip) {
                return i;
            }
        }
    }

    populatelDestinationInfo() {
       
        this.logger.log("Entering populatelDestinationInfo");
        for (let i = 0; i < this.lineItems.length; i++) {
            let index = this.getDestDataIndex(this.lineItems[i].from_ip);
            
            this.logger.log("Index: " + index);
            if (this.lineItems[i].src_device.indexOf("MM")) {
                this.lineItems[i].dest_ip = this.destInfoTbl[index].dest_ip;
                this.lineItems[i].dest_vip = this.destInfoTbl[index].dest_vip;
                this.lineItems[i].dest_device = this.destInfoTbl[index].dest_device;
                this.lineItems[i].dest_zone = this.destInfoTbl[index].dest_zone;
            } else {
                this.lineItems[i].dest_ip = this.destInfoTbl[index].dest_vip;
                this.lineItems[i].dest_vip = this.destInfoTbl[index].dest_vip;
                this.lineItems[i].dest_device = "CCM";
                this.lineItems[i].dest_zone = this.destInfoTbl[index].dest_zone;
            }
            
        }
    }

    convertFormat() {
        let rowData: BWDLY_ROW_DATA[] = [];

        
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
