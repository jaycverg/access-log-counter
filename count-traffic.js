#!/bin/env node

const lineByLine = require('n-readlines');

const logFolders = ['logs/64', 'logs/65', 'logs/66'];
const fs = require('fs');
const { listenerCount } = require('process');

const countByDate = new Map();

logFolders.forEach(folder => {
    fs.readdirSync(folder).forEach(file => {
        if (file.match(/\.gz$/)) {
            return;
        }

        const liner = new lineByLine([folder, file].join('/'));
        let line;
        while (line = liner.next()) {
            const parts = line.toString('ascii').split('\t');
            const timestamp = parts[4];
            const date = timestamp.split(':')[0].substring(4);
            const count = (countByDate.get(date) || 0) + 1;
            countByDate.set(date, count);
        }
    });
});

[...countByDate.keys()]
    .sort((a, b) => new Date(a) - new Date(b))
    .forEach(date => {
        console.log(date, countByDate.get(date));
    });