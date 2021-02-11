#!/bin/env node

const commandLineArgs = require('command-line-args');
const log = require('fancy-log');
const {existsSync, readFileSync, writeFileSync} = require('fs');
const {join, resolve} = require('upath');

const {averageTimeTaken, getHTML, getTextTable, restrict, sort} = require('./lib/data.js');
const {getFileList, parseFile} = require('./lib/file.js');

const checkDate = str => new Date(str);

const checkLogDir = str => {
    const path = resolve(__dirname, str);
    if (!existsSync(path)) {
        throw new Error(`Selected log folder doesn't exist: ${path}`);
    }
    return path;
};

const optionsDefaults = [
    {name: "cached", type: Boolean},
    {name: "from", type: str => checkDate(str), defaultValue: null},
    {name: "limit", type: Number, defaultValue: 0},
    {name: "log-dir", type: str => checkLogDir(str), defaultValue: resolve(__dirname, 'logs')},
    {name: "output", type: String, defaultValue: "txt"},
    {name: "pretty", type: Boolean},
    {name: "to", type: str => checkDate(str), defaultValue: null},
];

const options = commandLineArgs(optionsDefaults, {camelCase: true});

(async () => {
    let parsed = {
        data: {},
        extensions: []
    };
    const dataFile = join(__dirname, 'output', 'data.json');

    if (!options.cached) {
        let i = 0;

        const fileList = getFileList(options.logDir, {
            ...options,
            i
        });

        await Promise.all(fileList.map(path => parseFile(path, parsed)));

        parsed.data = restrict(parsed.data, options);
        parsed.data = sort(parsed.data);
        parsed.data = averageTimeTaken(parsed.data);

        Array.prototype.sort.apply(parsed.extensions);
        writeFileSync(dataFile, JSON.stringify(parsed, null, ' '));
    } else {
        if(!existsSync(dataFile)) {
            throw new Error(`Data file doesn't exist at ${dataFile}`);
        }
        try {
            parsed = JSON.parse(readFileSync(dataFile, 'utf8'));
        } catch(e) {}
    }

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
    log(`See calculation result in ${resultOpts.file}`);
})();