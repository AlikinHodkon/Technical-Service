import type { PathLike } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { dataType } from './constants.ts';

export const getFilePath = async (fileName: dataType) => {
	const storageDir =
		process.env.NODE_ENV === 'test' ? 'storage-test' : 'storage';
	const dir = path.join(process.cwd(), storageDir);
	const filePath = path.join(dir, `${fileName}.json`);
	await mkdir(dir, { recursive: true });
	return filePath;
};

export const readJsonArray = async <T>(filePath: PathLike): Promise<T[]> => {
	try {
		const raw = await readFile(filePath, 'utf-8');
		return JSON.parse(raw) as T[];
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
		throw error;
	}
};

export const writeJsonArray = async <T>(filePath: PathLike, data: T[]) => {
	await writeFile(filePath, JSON.stringify(data, null, 2));
};
