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

	connect(clientA, clientB) {
		if (!this.d_nodes[clientA]) {
			console.log('Node ' + clientA + ' is not registered');
			return;
		}
		if (!this.d_nodes[clientB]) {
			console.log('Node ' + clientB + ' is not registered');
			return;
		}

		this.d_nodes[clientA].endpoint = clientB;
		this.d_nodes[clientB].endpoint = clientA;
	}

	disconnect(clientId) {
		if (this.d_nodes[clientId]) {
			if (this.d_nodes[clientId].endpoint) {
				var ep = this.d_nodes[clientId].endpoint;
				this.d_nodes[ep].endpoint = undefined;
			}
			this.d_nodes[clientId].endpoint = undefined;
		}
		else {
			console.log('Node ' + clientId + ' is not registered');
		}
	}
}

module.exports = NomadRouter;