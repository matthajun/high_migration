const httpcall = require('./httpCall');
const winston = require('../config/winston')(module);
const setTime = require('../utils/setDateTime');
const db = require('../models');
const confirmutils = require('./confirmutils');

module.exports.highrankPush = async function(value) {
    let confirmCode = confirmutils.makeConfirmCode(value.tableData);
    value.confirm_code = confirmCode;

    httpcall.Call('post', process.env.BUMUN_ADDRESS, value, async function (err, res) {
        if(value.tableName.indexOf('ai_op') === -1) { //운영정보 데이터가 아닐 경우만 이력을 남김
            if(Array.isArray(value.tableData)) { //테이블 데이터가 배열일 경우
                for (tableData of value.tableData) {
                    let data = {
                        date_time: setTime.setDateTimeforHistory(),
                        tableName: value.tableName,
                        tableData: JSON.stringify(tableData)
                    };
                    await db['MOTIE_TRANSMISSION_HISTORY'].create(data);
                }
            }
            else { //테이블 데이터가 단일일 경우
                let data = {
                    date_time: setTime.setDateTimeforHistory(),
                    tableName: value.tableName,
                    tableData: JSON.stringify(value.tableData)
                };
                await db['MOTIE_TRANSMISSION_HISTORY'].create(data);
            }
        }
        if (err) {
            throw Error(err);
        }
        else{
            winston.info("*************************** " + value.tableName + " is transmitted*****************************");
        }
    });
};
