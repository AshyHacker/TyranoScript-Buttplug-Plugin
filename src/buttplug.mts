import {
	ButtplugClient,
	ButtplugBrowserWebsocketClientConnector,
} from 'buttplug';
import log from './log.mjs';

type ValueOf<T> = T[keyof T];
type Tag = ValueOf<typeof window.TYRANO.kag.ftag.master_tag>;

log('buttplug plugin loading...');

const buttplugClient = new ButtplugClient('TyranoScript-Buttplug-Plugin');
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

export default buttplugClient;