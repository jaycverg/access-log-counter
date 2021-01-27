#!/bin/env node

const commandLineArgs = require('command-line-args');
const log = require('fancy-log');
const { writeFileSync } = require('fs');
const { join, resolve } = require('upath');

const { getHTML, getTextTable, restrict, sort } = require('./lib/data.js');
const { getFileList, parseFile } = require('./lib/file.js');

const checkDate = str => new Date(str);

const checkLogDir = str => {
    const path = resolve(__dirname, str);
    if (!existsSync(path)) {
        throw new Error(`Selected log folder doesn't exist: ${path}`);
    }
    return path;
};

const optionsDefaults = [
    { name: "from", type: str => checkDate(str), defaultValue: null },
    { name: "limit", type: Number, defaultValue: 0 },
    { name: "log-dir", type: str => checkLogDir(str), defaultValue: resolve(__dirname, 'logs') },
    { name: "output", type: String, defaultValue: "txt" },
    { name: "pretty", type: Boolean },
    { name: "to", type: str => checkDate(str), defaultValue: null },
];

const options = commandLineArgs(optionsDefaults, { camelCase: true });

(async() => {
    let parsed = {
        data: {},
        extensions: []
    };
    let i = 0;

    const fileList = getFileList(options.logDir, {
        ...options,
        i
    });

    await Promise.all(fileList.map(path => parseFile(path, parsed)));

    parsed.data = restrict(parsed.data, options);
    parsed.data = sort(parsed.data);

    Array.prototype.sort.apply(parsed.extensions);

    let resultOpts = {
        file: null,
        data: null
    };

    switch (options.output) {
        case 'html':
            resultOpts = getHTML(parsed, options.pretty);
            break;

        default:
            resultOpts = getTextTable(parsed, options.pretty);
            break;
    }

    writeFileSync(resultOpts.file, resultOpts.data);
    writeFileSync(join(__dirname, 'output', 'data.json'), JSON.stringify(parsed, null, ' '));
    log(`See calculation result in ${resultOpts.file}`);
})();