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

const timer = ms => new Promise(res => setTimeout(res, ms));

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

module.exports.searchAndtransm = async function(req) {
    schedule.scheduleJob('55 * * * * *', async function() {
        let time = setDateTime.setDateTime_Twoago();

        // let time_slip = setDateTime.setDateTime_1121(10, 1);
        // let time_slip_plus = setDateTime.setDateTime_1121_plus(10);

        const query = `select * from dti.motie_ai_op_result where version > '${time}' `;
        //const query = `select * from dti.motie_ai_op_result where version between '${time_slip}' and '${time_slip_plus}' `; //데이터전송테스트
        console.log(query); //데이터전송테스트, 쿼리확인

        let rtnResult = {};
        try {
            let tableInfo = {};
            let rslt = await clickhouse.query(query).toPromise();

            if (rslt instanceof Error) {
                throw new Error(rslt);
            } else {
                if(rslt.length > 100){
                    winston.info('**************************** Data is transmitted ************************************');
                    winston.info('******************************** Value 갯수가 100개가 넘었습니다. ********************************')
                    let motherTable = rslt.division(100);

                    for(let daughtTable of motherTable){
                        tableInfo = {tableName: 'motie_ai_op_result', tableData: _.cloneDeep(daughtTable)};
                        makereq.highrankPush(tableInfo);
                        await timer(200);
                    }
                }
                else if(rslt.length) {
                    tableInfo = {tableName: 'motie_ai_op_result', tableData: _.cloneDeep(rslt)};
                    winston.info('**************************** Data is transmitted ************************************');
                    makereq.highrankPush(tableInfo);
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
