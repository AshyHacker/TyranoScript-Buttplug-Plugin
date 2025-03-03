import {
	ButtplugClient,
	ButtplugBrowserWebsocketClientConnector,
} from 'buttplug';

const log = (msg: string, data: any = null) => {
	console.log(`[buttplug] ${msg}`, ...(data ? [data] : []));
};

log('buttplug plugin loading...');

const buttplugClient = new ButtplugClient('WebSaController');
const connector = new ButtplugBrowserWebsocketClientConnector(
	'ws://127.0.0.1:12345/buttplug',
);

buttplugClient.addListener('deviceadded', async (device) => {
	log('Device added:', device);
});

buttplugClient.addListener('deviceremoved', async (device) => {
	log('Device removed:', device);
});

buttplugClient.connect(connector).then(() => {
	log('Connected to Buttplug server');
});

log('buttplug plugin loaded');

export default log;
