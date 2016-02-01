/*** SensorValueLoggingAzureEventHub Z-Way Home Automation module *************************************

 Version: 1.0.0
 (c) Magnus Härlin, 2016

 -----------------------------------------------------------------------------
 Author: Magnus Härlin <magnus.harlin@gmail.com>
 Description:
     Log sensor values to Azure Event Hub

******************************************************************************/
executeFile(enc-base64-min.js);
executeFile(hmac-sha256.js);

function create_sas_token(uri, key_name, key) {
    // Token expires in 24 hours
    var expiry = Math.floor(new Date().getTime() / 1000 + 3600 * 24);

    var string_to_sign = encodeURIComponent(uri) + '\n' + expiry;
    var hmac = CryptoJS.HmacSHA256(string_to_sign, key);
    var signature = CryptoJS.enc.Base64.stringify(hmac);
    var token = 'SharedAccessSignature sr=' + encodeURIComponent(uri) + '&sig=' + encodeURIComponent(signature) + '&se=' + expiry + '&skn=' + key_name;

    return token;
}

function SensorValueLoggingAzureEventHub(id, controller) {
    SensorValueLoggingAzureEventHub.super_.call(this, id, controller);
};

inherits(SensorValueLoggingAzureEventHub, AutomationModule);

_module = SensorValueLoggingAzureEventHub;

SensorValueLoggingAzureEventHub.prototype.init = function (config) {
    SensorValueLoggingAzureEventHub.super_.prototype.init.call(this, config);

    var self = this;

    this.handler = function (vDev) {
        var namespace = self.config.namespace;
        var hubName = self.config.hubName;
        var deviceName = vDev.get('metrics:title');
        var fullUri = 'https://' + namespace + '.servicebus.windows.net' + '/' + hubName + '/publishers/' + deviceName + '/messages';

        
        var deviceData = JSON.stringify({
            title: vDev.get('metrics:probeTitle'),
            scale: vDev.get('metrics:scaleTitle'),
            value: vDev.get('metrics:level')
        });

        var options = {
            }
        };

        var req = http.request({
            url: fullUri,
            method: 'POST',
            headers: {
                'Authorization': create_sas_token(fullUri, self.config.sharedAccessKeyName, self.config.shareAccessKey),
                'Content-Length': deviceData.length,
                'Content-Type': 'application/atom+xml;type=entry;charset=utf-8'
            },
            data: deviceData
        });
    };

    this.controller.devices.on(this.config.device, "change:metrics:level", this.handler);
};

SensorValueLoggingAzureEventHub.prototype.stop = function () {
    SensorValueLoggingAzureEventHub.super_.prototype.stop.call(this);

    this.controller.devices.off(this.config.device, "change:metrics:level", this.handler);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

// This module doesn't have any additional methods
