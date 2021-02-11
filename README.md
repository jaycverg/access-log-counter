### Process

1. Log file should be placed into the `logs/` folder by default. Another folder can be supplied via the `--log-dir` command line argument, like:
    ```sh
    node count-traffic.js --log-dir=/some/other/path
    ```
1. The script will not process `*.gz` files to avoid excessive memory consumption. If it finds a folder, it will scan all the files inside of it.
1. It will calculate totals for 1) number of bytes sent, 2) number of requests. Counters will be aggregated by 1) domain name, 2) file type.
1. Final result can be in HTML or text table format, the latter being default. You can override it by sending `--output=html`.
1. You can also pass the `--pretty` argument to convert bytes into "human readable" format like kB and MB.

To unpack all files in the sub-folders you can use something like:

```sh
gzip -fdv $(find logs/ -type f -name '*.gz')
```

### Data object prepared by the script

```
{
 "data": {
   "30/Nov/2020": {
      "byDomain": {
         "bankruptcyattorneys.legalmatch.com": {
            "assets": {
               "received": 178728,
               "requests": 462,
               "sent": 5243220
            },
            "byExt": {
               ".css": {
                  "totalBytesReceived": 10083,
                  "totalBytesSent": 300685,
                  "totalRequests": 14
               },
               ".gif": {
                  "totalBytesReceived": 4190,
                  "totalBytesSent": 7715,
                  "totalRequests": 4
               },
               ".html": {
                  "totalBytesReceived": 978472,
                  "totalBytesSent": 40955782,
                  "totalRequests": 1439
               },
               // ...
            },
            "content": {
               "received": 997936,
               "requests": 1505,
               "sent": 42628797
            }
         },
         // ...
      },
      "assets": {
         "sent": 18445638,
         "received": 904284,
         "requests": 1050,
         "averageTimeTaken": 0.006342
      },
      "content": {
         "sent": 103021410,
         "received": 2439881,
         "requests": 3025,
         "averageTimeTaken": 0.040232
      }
   },
   "extensions": [
      ".html",
      ".php",
      // ...
   ]
}
```

### Usage

```sh
# 1. install packages
npm install --no-shrinkwrap
# 2. put log files into logs/ or any other folder
# 3. run the script
node count-traffic.js
# 4. check for the result in the output/ folder
```

In case of "out of memory" errors like:

```
[2624:000001BCDE151950]  2313581 ms: Mark-sweep 1422.9 (1443.2) -> 1422.9 (1443.2) MB, 72.0 / 0.0 ms  (average mu = 0.104, current mu = 0.000) allocation failure scavenge
might not succeed
[2624:000001BCDE151950]  2313657 ms: Mark-sweep 1422.9 (1443.2) -> 1422.9 (1443.2) MB, 75.5 / 0.0 ms  (average mu = 0.056, current mu = 0.005) last resort GC in old space
requested

<--- JS stacktrace --->

==== JS stack trace =========================================

Security context: 0x02e95fc53e31 <JSObject>
    0: builtin exit frame: stringify(this=0x02e95fc48539 <Object map = 000002B1905042A9>,0x017dbc809d69 <String[1]:  >,0x017dbc8022b1 <null>,0x003876f6f461 <Object map = 0
000030A600C5A11>,0x02e95fc48539 <Object map = 000002B1905042A9>)

    1: /* anonymous */ [0000003876F64A11] [D:\dev\access-log-counter\count-traffic.js:54] [bytecode=000001E6FCA59431 offset=362](this=0x010802e0d481 <JSGlobal Ob...

FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
 1: 00007FF7A4337DDA v8::internal::GCIdleTimeHandler::GCIdleTimeHandler+4506
 2: 00007FF7A4312876 node::MakeCallback+4534
 3: 00007FF7A43131F0 node_module_register+2032
 4: 00007FF7A462B6BE v8::internal::FatalProcessOutOfMemory+846
 5: 00007FF7A462B5EF v8::internal::FatalProcessOutOfMemory+639
```

...try to override the default memory allocation (2gb in x64 systems) setting by running:

```sh
node --max-old-space-size=3072 count-traffic.js # 3gb
node --max-old-space-size=4096 count-traffic.js # 4gb
```

### Options

| Option    | Default value | Purpose |
|-----------|---------------|---------|
| --cached  | false         | Whether should be using `data.json` file from the `output/` folder. |
| --from    |               | Date in `YYYY-MM-DD` format to restrict log entries. |
| --limit   |               | Limit of the log files to process. |
| --log-dir | logs/         | Folder where the log files are stored. |
| --output  | txt           | Resulting file format. Accepted value: `html` |
| --pretty  | false         | Whether to convert bytes into human readable strings like kilobytes and megabytes. |
| --to      |               | Date in `YYYY-MM-DD` format to restrict log entries. |
