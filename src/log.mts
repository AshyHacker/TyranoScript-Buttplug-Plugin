// biome-ignore lint/suspicious/noExplicitAny: This file is meant to be used for logging, so it's fine to use any here
export default (msg: string, data: any = null) => {
	// biome-ignore lint/suspicious/noConsoleLog: This is a log function
	// biome-ignore lint/suspicious/noConsole: This is a log function
	console.log(`[buttplug] ${msg}`, ...(data ? [data] : []));
};
