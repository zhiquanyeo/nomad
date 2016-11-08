'use strict';

const EventEmitter = require('events');
const mqtt = require('mqtt');
const NomadRouter = require('./router.js');

class NomadManager extends EventEmitter {
    constructor(clientId, url, username, password) {
        super();

        this.d_mqttConnection = null;
        this.d_ready = false;

        this.d_clientId = clientId;
        this.d_url = url;
        this.d_username = username;
        this.d_password = password;

        this.d_nodes = {};

        this.d_router = new NomadRouter();

        this.d_pendingReconnection = false;

        this._initializeConnection(clientId, url, username, password);
    }

    // PRIVATE
    _onBrokerConnect() {
        console.log('Broker Connection');
        this.d_ready = true;
        this.d_pendingReconnection = false;
        this.emit('ready');
    }

    _onBrokerDisconnect() {
        console.log('Broker Disconnected');
        this.d_ready = false;
        this.emit('disconnected');

        // TODO Do we need this?
        // Attempt a reconnection
        if (!this.d_pendingReconnection) {
            this.d_pendingReconnection = true;
            this._initializeConnection(this.d_clientId, 
                                       this.d_url, 
                                       this.d_username, 
                                       this.d_password);
        }
    }

    _onBrokerError(err) {
        console.log('Broker Error: ', err);
    }

    _onMessageReceived(topic, message, packet) {
        // Hand off to message processors
        if (topic === 'register/client') {
            // Client registration message
            this._handleNodeRegistration(message);
        }
        else if (topic === 'register/client-disconnect') {
            this._handleNodeDisconnection(message);
        }
        else if (topic.indexOf('out/') === 0) {
            // outbound message from a node

        }
    }

    _initializeConnection(clientId, url, username, password) {
        if (this.d_mqttConnection) {
            this.d_mqttConnection.removeAllListeners();
            this.d_mqttConnection = undefined;
        }

        this.d_mqttConnection = mqtt.connect(url, {
            username: username,
            password: password,
            clientId: clientId
        });

        this.d_mqttConnection.on('connect', this._onBrokerConnect.bind(this));
        this.d_mqttConnection.once('close', this._onBrokerDisconnect.bind(this));
        this.d_mqttConnection.on('error', this._onBrokerError.bind(this));
        this.d_mqttConnection.on('message', this._onMessageReceived.bind(this));

        // Set up subscriptions
        this.d_mqttConnection.subscribe({
            'in/#': 1,
            'out/#': 1,
            'register/#': 1
        });
    }

    _handleNodeRegistration(message) {
        // Format: { clientId: id, type: 'endpoint'|'client' }
        console.log('node registration: ', message.toString());
        try {
            var registrationObj = JSON.parse(message.toString());
            if (registrationObj.type === undefined) {
                console.log('No client type specified');
                return;
            }
            if (registrationObj.clientId === undefined) {
                console.log('No client ID specified');
                return;
            }

            if (registrationObj.type !== 'endpoint' && registrationObj.type !== 'client') {
                console.log('Invalid client type: ' + registrationObj.type);
                return;
            }

            if (this.d_nodes[registrationObj.clientId]) {
                console.log('Node with ID ' + registrationObj.clientId + 
                            ' is already registered as a ' + 
                            this.d_nodes[registrationObj.clientId].type);
                return;
            }

            this.d_nodes[registrationObj.clientId] = {
                type: registrationObj.type
            };

            this.d_router.registerNode(registrationObj.clientId);
        }
        catch (err) {
            console.log('Error parsing node registration message: ', err);
        }
    }

    _handleNodeDisconnection(message) {
        // Format: clientId as a string
        if (!this.d_nodes[message]) {
            console.log('Node does not exist');
        }
        else {
            delete this.d_nodes[message];
            this.d_router.unregisterNode(message);
            // TODO shutdown any connections
        }
    }

    // PUBLIC
}

module.exports = NomadManager;