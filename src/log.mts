export default (msg: string, data: any = null) => {
	console.log(`[buttplug] ${msg}`, ...(data ? [data] : []));
};
