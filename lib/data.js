const AsciiTable = require('ascii-table');
const prettyBytes = require('pretty-bytes');
const pug = require('pug');
const {join} = require('upath');

const pb = (value, flag) => !flag ? value : prettyBytes(value);

const zf = str => {
    const i = +str;
    return i > 10 ? str : '0' + str;
};

const averageTimeTaken = data => Object
    .keys(data)
    .reduce((acc, curr) => {
        let row = data[curr];
        ['assets', 'content'].forEach(type => {
            const typeObj = row[type];
            if ('timeTaken' in typeObj) {
                typeObj.averageTimeTaken = parseFloat((typeObj.timeTaken.reduce((a, c) => a + c, 0) / typeObj.timeTaken.length).toFixed(6));
                delete typeObj.timeTaken;
            }
            row [type] = typeObj;
        });
        acc [curr] = row;
        return acc;
    }, {});

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
    const {data} = parsed;

    const tableStats = new AsciiTable();
    tableStats.setHeading(
        'Date',
        'Assets (out)',
        'Assets (req)',
        'Content (out)',
        'Content (req)',
        'TOTAL (out)',
        'TOTAL (req)');

    const tableDetails = new AsciiTable();

    tableDetails.setHeading(
        'Date',
        'Domain',
        'Extension',
        'Total Requests',
        'Bytes Sent',
        'Bytes Received');

    let totalBytesAssets = 0,
        totalBytesContent = 0,
        totalRequestsAssets = 0,
        totalRequestsContent = 0;

    Object.keys(data).forEach(date => {
        tableDetails.addRow(date);

        const rowDate = data[date];

        tableStats.addRow(
            date,
            pb(rowDate.assets.sent, pretty),
            rowDate.assets.requests,
            pb(rowDate.content.sent, pretty),
            rowDate.content.requests,
            pb(rowDate.assets.sent + rowDate.content.sent, pretty),
            (rowDate.assets.sent + rowDate.content.sent));

        totalBytesAssets += rowDate.assets.sent;
        totalBytesContent += rowDate.content.sent;
        totalRequestsAssets += rowDate.assets.requests;
        totalRequestsContent += rowDate.content.requests;

        const totalRequests = (rowDate.assets.requests + rowDate.content.requests);
        const totalSent = (rowDate.assets.sent + rowDate.content.sent);
        const totalReceived = (rowDate.assets.received + rowDate.content.received);

        Object.keys(rowDate.byDomain).forEach(domain => {
            const rowDomain = rowDate.byDomain[domain];
            const totalRequests = rowDomain.assets.requests + rowDomain.content.requests;
            const totalSent = rowDomain.assets.sent + rowDomain.content.sent;
            const totalReceived = rowDomain.assets.received + rowDomain.content.received;
            tableDetails.addRow(null, domain);

            Object.keys(rowDomain.byExt).forEach(ext => {
                const rowExt = rowDomain.byExt[ext];
                tableDetails.addRow(null, null, ext, rowExt.totalRequests, pb(rowExt.totalBytesSent, pretty), pb(rowExt.totalBytesReceived, pretty));
            });

            tableDetails.addRow(null, null, 'TOTAL', totalRequests, pb(totalSent, pretty), pb(totalReceived, pretty));
        });

        tableDetails.addRow(null, 'TOTAL', null, totalRequests, pb(totalSent, pretty), pb(totalReceived, pretty));
    });

    tableStats.addRow(
        'TOTAL',
        pb(totalBytesAssets, pretty),
        totalRequestsAssets,
        pb(totalBytesContent, pretty),
        totalRequestsContent,
        pb(totalBytesAssets + totalBytesContent, pretty),
        (totalRequestsAssets + totalRequestsContent));

    return {
        file: generateFileName('.txt'),
        data: [
            tableStats.toString(),
            tableDetails.toString()
        ].join('\n\n'),
    };
};

const restrict = (data, options) => {
    const {from, to} = options;

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
    averageTimeTaken,
    getHTML,
    getTextTable,
    restrict,
    sort,
};