const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');
const sequelize = require('sequelize');
const db = require('../models');
const _ = require('loadsh');
const schedule = require('node-schedule');
const makereq = require('../utils/makerequest');

const {ClickHouse} = require('clickhouse');
const clickhouse = new ClickHouse({
    url: process.env.CH_ADDRESS,
    port: 8124,
    debug: false,
    basicAuth: null,
    isUseGzip: false,
    format: "json",
    config: {
        session_timeout                         : 30,
        output_format_json_quote_64bit_integers : 0,
        enable_http_compression                 : 0,
        database                                : 'dti',
    },
});

Array.prototype.division = function (n) {
    let arr = this;
    let len = arr.length;
    let cnt = Math.floor(len / n) + (Math.floor(len % n) > 0 ? 1 : 0);
    let tmp = [];

    for (let i = 0; i < cnt; i++) {
        tmp.push(arr.splice(0, n));
    }

    return tmp;
};

const timer = ms => new Promise(res => setTimeout(res, ms));

module.exports.searchAndtransm = async function() {
    schedule.scheduleJob('20 * * * * *', async function() {
        let a_time = setDateTime.setDateTime_whatago(6);
        let b_time = setDateTime.setDateTime_whatago(5);

        // let time_slip = setDateTime.setDateTime_1121(100, 1);   //데이터전송테스트
        // let time_slip_plus = setDateTime.setDateTime_1121_plus(100);  //데이터전송테스트

        const query = `select * from dti.motie_ai_single_log where version >= '${a_time}' and version < '${b_time}'`;

        // const query = `select * from dti.motie_ai_single_log where version between '${time_slip}' and '${time_slip_plus}' `;  //데이터전송테스트

        console.log(query);

        let rtnResult = {};
        try {
            let tableInfo = {};
            let rslt = await clickhouse.query(query).toPromise();

            //부문전송 block(11.03)처리
            for (r of rslt){
                r.ip = '';
            }

            if (rslt instanceof Error) {
                throw new Error(rslt);
            } else {
                if(rslt.length > 100){
                    winston.info('**************************** Data is transmitted , 건수 : '+ rslt.length + ' ************************************');
                    let motherTable = rslt.division(100);

                    for(let daughtTable of motherTable){
                        tableInfo = {tableName: 'motie_ai_single_log', tableData: _.cloneDeep(daughtTable)};
                        makereq.highrankPush(tableInfo);
                        await timer(1000);
                    }
                }
                else if(rslt.length) {
                    tableInfo = {tableName: 'motie_ai_single_log', tableData: _.cloneDeep(rslt)};
                    winston.info('**************************** Data is transmitted , 건수 : '+ rslt.length + ' ************************************');
                    makereq.highrankPush(tableInfo);
                }
                else {
                    winston.info('**************************** 전송할 데이터가 없습니다. (스케쥴 결과 0건) ************************************');
                }
            }
        } catch (error) {
            winston.error(error.stack);
            rtnResult = error;
        } finally {
            return rtnResult;
        }
    })
};
