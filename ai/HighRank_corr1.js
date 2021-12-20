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

module.exports.searchAndtransm = async function(req) {
    schedule.scheduleJob('30 * * * * *', async function() {
        let time = setDateTime.setDateTime_Twoago();

        const query = `select * from dti.motie_ai_corr_result_v2 where version > '${time}'`;

        let rtnResult = {};
        try {
            let tableInfo = {};
            let rslt = await clickhouse.query(query).toPromise();

            //부문전송 block(11.03)처리
            for (r of rslt){
                r.f_ip = ''; r.b_ip = '';
            }

            if (rslt instanceof Error) {
                throw new Error(rslt);
            } else {
                if(rslt.length > 100){
                    winston.info('**************************** Data is transmitted ************************************');
                    winston.info('******************************** Value 갯수가 100개가 넘었습니다. ********************************')
                    let motherTable = rslt.division(100);

                    for(let daughtTable of motherTable){
                        tableInfo = {tableName: 'motie_ai_corr_result_v2', tableData: _.cloneDeep(daughtTable)};
                        makereq.highrankPush(tableInfo);
                        await timer(200);
                    }
                }
                else if(rslt.length) {
                    tableInfo = {tableName: 'motie_ai_corr_result_v2', tableData: _.cloneDeep(rslt)};
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
