import log from './log.mjs';

type ValueOf<T> = T[keyof T];
type Tag = ValueOf<typeof TYRANO.kag.ftag.master_tag>;

export const defineTag = (name: string, tag: Tag) => {
	if ({}.hasOwnProperty.call(TYRANO.kag.ftag.master_tag, name)) {
		log('tag already defined:', name);
		return;
	}

	log('defining tag:', name);
	TYRANO.kag.ftag.master_tag[name] = tag;
};

export const invalidParameterError = (
	params: Record<string, string>,
	key: string,
) => {
	TYRANO.kag.error(
		`タグ「${params._tag}」のパラメータ「${key}」が不正です: ${params[key]}`,
		{},
	);
	TYRANO.kag.ftag.nextOrder();
};
