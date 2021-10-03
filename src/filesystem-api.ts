import * as fs from 'fs';
import * as path from 'path';

export function readDir(dir: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, entries) => {
            if (!err) {
                resolve(entries);
            }
            reject(err);
        });
    });
}

export function readFile(file: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(file, 'utf8', (err, data) => {
            if (!err) {
                resolve(data);
            }
            reject(err);
        });
    });
}