const NodeHelper = require('node_helper');

const fs = require('fs');

/**
 * @module node_helper
 * @description Backend for the module to query data from the API providers.
 *
 * @requires external:fs
 * @requires external:node_helper
 */
module.exports = NodeHelper.create({

    /**
     * @function start
     * @description Logs a start message to the console.
     * @override
     */
    start() {
        console.log(`Starting module helper: ${this.name}`);
    },

    /**
     * @function socketNotificationReceived
     * @description Receives socket notifications from the module and loads API provider.
     * @override
     *
     * @param {string} notification - Notification name
     * @param {*} payload - Detailed payload of the notification.
     */
    socketNotificationReceived(notification, payload) {
        if (notification === 'CONFIG') {
            this.config = payload;
            if (fs.existsSync(`modules/${this.name}/apis/${this.config.provider}.js`)) {
                // eslint-disable-next-line global-require, import/no-dynamic-require
                this.provider = require(`./apis/${this.config.provider}`)();
                this.getData();
            } else {
                console.log(`${this.name}: Couldn't load provider ${this.config.provider}`);
            }
        } else if (notification === 'GET_NEXT_WORD') {
            this.sendWordSet();
        }
    },

    /**
     * @function getData
     * @description Uses API provider to get data.
     */
    getData() {
        this.provider.getData((err, data) => {
            if (err) {
                console.log(err);
            } else {
                this.wordSets = data;
                this.sendWordSet();
                setInterval(() => {
                    this.sendWordSet();
                }, this.config.nativeTimeout + this.config.foreignTimeout);
            }
        });
    },

    /**
     * @function sendWordSet
     * @description Sends random word set to the frontend.
     */
    sendWordSet() {
        const index = Math.floor(Math.random() * this.wordSets.length);
        this.sendSocketNotification('WORDSET', this.wordSets[index]);
    }
});
