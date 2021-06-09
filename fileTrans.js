const express = require('express');
const router = express.Router();
const winston = require('./config/winston')(module);
const makejson = require('./utils/makejson');
const request = require("request");
const fs = require('fs');
const schedule = require('node-schedule');
const db = require('./models');
const path = require('path');

module.exports.searchAndTrans = async function() {
    schedule.scheduleJob("*/10 * * * * *", async function () {
        let rtnResult = {};
        try {
            let tableName = process.env.H009_TABLE;
            let rslt = await db[tableName.toUpperCase()].findAll({where: {file_tag: 'C'}}).then(users => {
                if (users.length) {
                    winston.info('********************** 파일을 전송합니다. ************************');
                    for (user of users) {
                        let data = {};
                        data = user.dataValues;

                        const sendReq = request.post({url: process.env.BUMUN_ADDRESS_FILE}, function (err, resp, body) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('pcap 파일 전송, URL: ' + body);
                            }
                        });

                        const form = sendReq.form();
                        form.append('my_file', fs.createReadStream(__dirname + `${path.sep}downloads${path.sep}`+data.file_name), {filename: data.file_name});

                        user.update({file_tag: 'E'});
                    }
                }
            });
        } catch (e) {
            winston.error(e.stack);
            rtnResult = e;
        } finally {
            return rtnResult;
        }
    })
};