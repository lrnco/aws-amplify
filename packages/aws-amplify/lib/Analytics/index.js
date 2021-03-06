"use strict";
/*
 * Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var Analytics_1 = require("./Analytics");
exports.AnalyticsClass = Analytics_1.default;
var Common_1 = require("../Common");
var Platform_1 = require("../Common/Platform");
var logger = new Common_1.ConsoleLogger('Analytics');
var startsessionRecorded = false;
var authConfigured = false;
var analyticsConfigured = false;
var _instance = null;
if (!_instance) {
    logger.debug('Create Analytics Instance');
    _instance = new Analytics_1.default();
}
var Analytics = _instance;
Common_1.Amplify.register(Analytics);
exports.default = Analytics;
__export(require("./Providers"));
// listen on app state change
var dispatchAppStateEvent = function (event, data) {
    Common_1.Hub.dispatch('appState', { event: event, data: data }, 'AppState');
};
if (Platform_1.default.isReactNative) {
    Common_1.AppState.addEventListener('change', function (nextAppState) {
        switch (nextAppState) {
            case 'active':
                dispatchAppStateEvent('active', {});
        }
    });
}
// send a session start event if autoSessionRecord is enabled
var autoSessionRecord = function () {
    var config = Analytics.configure();
    startsessionRecorded = true;
    if (config.autoSessionRecord) {
        Analytics.updateEndpoint({}).then(function () {
            Analytics.startSession().catch(function (e) {
                logger.debug('start Session error', e);
            });
        });
    }
    else {
        logger.debug('auto Session record is diasabled');
    }
};
Analytics.onHubCapsule = function (capsule) {
    var channel = capsule.channel, payload = capsule.payload, source = capsule.source;
    logger.debug('on hub capsule ' + channel, payload);
    switch (channel) {
        case 'auth':
            authEvent(payload);
            break;
        case 'storage':
            storageEvent(payload);
            break;
        case 'analytics':
            analyticsEvent(payload);
            break;
        default:
            break;
    }
};
var storageEvent = function (payload) {
    var attrs = payload.attrs, metrics = payload.metrics;
    if (!attrs)
        return;
    Analytics.record('Storage', attrs, metrics);
};
var authEvent = function (payload) {
    var event = payload.event;
    if (!event) {
        return;
    }
    switch (event) {
        case 'signIn':
            Analytics.record('_userauth.sign_in');
            break;
        case 'signUp':
            Analytics.record('_userauth.sign_up');
            break;
        case 'signOut':
            break;
        case 'signIn_failure':
            Analytics.record('_userauth.auth_fail');
            break;
        case 'configured':
            authConfigured = true;
            if (authConfigured && analyticsConfigured && !startsessionRecorded) {
                autoSessionRecord();
            }
            break;
    }
};
var analyticsEvent = function (payload) {
    var event = payload.event;
    if (!event)
        return;
    switch (event) {
        case 'configured':
            analyticsConfigured = true;
            if (authConfigured && analyticsConfigured && !startsessionRecorded) {
                autoSessionRecord();
            }
            break;
    }
};
Common_1.Hub.listen('auth', Analytics);
Common_1.Hub.listen('storage', Analytics);
Common_1.Hub.listen('analytics', Analytics);
//# sourceMappingURL=index.js.map