const AsciiTable = require('ascii-table');
const prettyBytes = require('pretty-bytes');
const pug = require('pug');
const { join } = require('upath');

const pb = (value, flag) => !flag ? value : prettyBytes(value);

const zf = str => {
    const i = +str;
    return i > 10 ? str : '0' + str;
};

const generateFileName = ext => {
    const now = new Date();
    return join(__dirname,
        '..',
        'output', [
            now.getFullYear(),
            zf(now.getMonth() + 1),
            zf(now.getDate()),
            zf(now.getHours()),
            zf(now.getMinutes()),
            zf(now.getSeconds()),
        ].join('-') + ext);
};

const getDateFromString = str => new Date(Date.parse(str));

const getHTML = (parsed, pretty) => ({
    file: generateFileName('.html'),
    data: pug.renderFile(join(__dirname, 'table.pug'), {
        ...parsed,
        pretty,
        pb
    }),
});

const getTextTable = (parsed, pretty) => {
    const { data } = parsed;

    const tableStats = new AsciiTable();
    tableStats.setHeading(
        'Date',
        'Assets',
        'Content',
        'TOTAL');

    const tableDetails = new AsciiTable();

    tableDetails.setHeading(
        'Date',
        'Domain',
        'Extension',
        'Total Requests',
        'Bytes Sent',
        'Bytes Received');

    let totalAssets = 0,
        totalContent = 0;

    Object.keys(data).forEach(date => {
        tableDetails.addRow(date);

        const rowDate = data[date];

        tableStats.addRow(
            date,
            pb(rowDate.bytesSentAssets, pretty),
            pb(rowDate.bytesSentContent, pretty),
            pb(rowDate.bytesSentAssets + rowDate.bytesSentContent, pretty));

        totalAssets += rowDate.bytesSentAssets;
        totalContent += rowDate.bytesSentContent;

        Object.keys(rowDate.byDomain).forEach(domain => {
            const rowDomain = rowDate.byDomain[domain];
            tableDetails.addRow(null, domain);

            Object.keys(rowDomain.byExt).forEach(ext => {
                const rowExt = rowDomain.byExt[ext];
                tableDetails.addRow(null, null, ext, rowExt.totalRequests, pb(rowExt.totalBytesSent, pretty), pb(rowExt.totalBytesReceived, pretty));
            });

            tableDetails.addRow(null, null, 'TOTAL', rowDomain.totalRequests, pb(rowDomain.totalBytesSent, pretty), pb(rowDomain.totalBytesReceived, pretty));
        });

        tableDetails.addRow(null, 'TOTAL', null, rowDate.totalRequests, pb(rowDate.totalBytesSent, pretty), pb(rowDate.totalBytesReceived, pretty));
    });

    tableStats.addRow(
        'TOTAL',
        pb(totalAssets, pretty),
        pb(totalContent, pretty),
        pb(totalAssets + totalContent, pretty));

    return {
        file: generateFileName('.txt'),
        data: [
            tableStats.toString(),
            tableDetails.toString()
        ].join('\n\n'),
    };
};

const restrict = (data, options) => {
    const { from, to } = options;

    if (!from && !to) {
        return data;
    }

    return Object
        .keys(data)
        .reduce((acc, curr) => {
            const date = getDateFromString(curr);
            if (from && date < from) {
                return acc;
            }
            if (to && date > to) {
                return acc;
            }
            acc[curr] = data[curr];
            return acc;
        }, {});
};

const sortChildStringKeys = data => {
    const keys = Object.keys(data);
    keys.sort();

    return keys.reduce((acc, key) => {
        if (typeof data[key] === 'object') {
            data[key] = sortChildStringKeys(data[key]);
        }
        acc[key] = data[key];
        return acc;
    }, {});
};

const sort = data => {
    const keys = Object.keys(data);
    keys.sort((a, b) => new Date(a) - new Date(b));

    return keys.reduce((acc, key) => {
        acc[key] = {
            ...data[key],
            byDomain: sortChildStringKeys(data[key].byDomain)
        };
        return acc;
    }, {});
};

module.exports = {
    getHTML,
    getTextTable,
    restrict,
    sort,
};