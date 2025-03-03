import {
	ButtplugClient,
	ButtplugBrowserWebsocketClientConnector,
} from 'buttplug';
import log from './log.mjs';

type ValueOf<T> = T[keyof T];
type Tag = ValueOf<typeof window.TYRANO.kag.ftag.master_tag>;

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
log('defined tags:', Object.keys(window.TYRANO.kag.ftag.master_tag));

const defineTag = (name: string, tag: Tag) => {
	log('defining tag:', name);
	window.TYRANO.kag.ftag.master_tag[name] = tag;
};

defineTag('buttplug_start', {
	start(pm: Record<string, any>) {
		log('buttplug tag start:', pm);
		TYRANO.kag.ftag.nextOrder();
	},
	vital: [],
	pm: {},
});

export default log;
