#!/bin/env node

const lineByLine = require('n-readlines');

const cliArgs = process.argv;
let logDir = 'logs';

if (cliArgs.length > 3 && cliArgs[2] === '--log-dir') {
    logDir = cliArgs[3];
}

const fs = require('fs');
const path = require('path');
const countByDate = new Map();

const scanForLogs = (folder) => {
    fs.readdirSync(folder).forEach(file => {
        file = path.resolve(folder, file);
        if (file.match(/\.gz$/)) {
            return;
        }

        const stat = fs.statSync(file);
        if (stat.isDirectory()) {
            return scanForLogs(file);
        }

        const liner = new lineByLine(file);
        let line;
        while (line = liner.next()) {
            const parts = line.toString('ascii').split('\t');
            const timestamp = parts[4];
            const date = timestamp.split(':')[0].substring(4);
            const count = (countByDate.get(date) || 0) + 1;
            countByDate.set(date, count);
        }
    });
};

scanForLogs(logDir);

[...countByDate.keys()]
    .sort((a, b) => new Date(a) - new Date(b))
    .forEach(date => {
        console.log(date, countByDate.get(date));
    });