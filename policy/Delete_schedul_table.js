const schedule = require('node-schedule');
const db = require('../models');

const winston = require('../config/winston')(module);
const { Op } = require("sequelize");
const setDateTime = require('../utils/setDateTime');

const timer = ms => new Promise(res => setTimeout(res, ms));

module.exports.scheduleDelete = () => {
    schedule.scheduleJob('19 55 3 */3 * *', async function() {  //삭제 스케쥴 설정(3일마다 03:55:19 작동)
        let rtnResult = {};
        let tables = ['kdn_amly_H001_connect_unit','kdn_amly_H001_process_info','kdn_amly_H002','kdn_amly_H002_disk_info','kdn_amly_H004','kdn_amly_H004_policy_bl','kdn_amly_H004_policy_connect','kdn_amly_H004_policy_ip',
            'kdn_amly_H006','kdn_amly_H008','kdn_amly_H008_file_list','kdn_amly_H009','kdn_amly_H010','kdn_amly_H010_device_list','kdn_amly_H011','kdn_amly_H012','kdn_amly_H015','kdn_lgsys_L001_result',
            'kdn_lgsys_L002','kdn_lgsys_L003','kdn_lgsys_L005','kdn_lgsys_L006','kdn_lgsys_L007','kdn_lgsys_L009','kdn_lgsys_L011','kdn_manag_I003','kdn_manag_I003_disk_info'];

        let month_ago_time = setDateTime.setDateTime_H009(12); // 12개월 전 데이터 삭제 설정 부분

        try {
            winston.info('********** ' + month_ago_time + ' 이전의 수집 데이터를 삭제합니다. ************************');

            for (tableName of tables) {
                winston.info('********** 테이블 ' + tableName + ' 의 데이터를 삭제합니다. (12개월 전) ************************');
                let rslt = await db[tableName.toUpperCase()].destroy({where: {date_time: {[Op.lt]: month_ago_time}}}).then(() => {

                });
                await timer(10000);
            }
        }
        catch (error) {
            // If the execution reaches this line, an error occurred.
            // The transaction has already been rolled back automatically by Sequelize!
            winston.error(error.stack);
            rtnResult = error;
        } finally {
            return rtnResult;
        }
    })
};
