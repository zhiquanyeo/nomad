'use strict';

class NomadRouter {
	constructor() {
		this.d_nodes = {}
	}

	registerNode(clientId) {
		this.d_nodes[clientId] = {};
	}

	unregisterNode(clientId) {
		if (this.d_nodes[clientId] && this.d_nodes[clientId].endpoint) {
			var ep = this.d_nodes[clientId].endpoint;
			this.d_nodes[ep].endpoint = undefined;
		}
		delete this.d_nodes[clientId];
	}

	setConnection(clientA, clientB) {

	}
}

module.exports = NomadRouter;