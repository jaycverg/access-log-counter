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

```sh
{
    "12/1/2020": {
        "totalRequests": 0,
        "totalBytesReceived": 0,
        "totalBytesSent": 0,
        "byDomain": {
            "domain.com": {
                "totalRequests": 0,
                "totalBytesReceived": 0,
                "totalBytesSent": 0,
                "byExt": {
                    ".jpg": {
                        "totalRequests": 0,
                        "totalBytesReceived": 0,
                        "totalBytesSent": 0
                    },
                    ".otherExt": {
                        "totalRequests": 0,
                        "totalBytesReceived": 0,
                        "totalBytesSent": 0
                    }
                }
            },
            "otherdomain.com": {
                ...
            }
        }
    }
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

### Options

| Option    | Default value | Purpose |
|-----------|---------------|---------|
| --from    |               | Date in `YYYY-MM-DD` format to restrict log entries. |
| --limit   |               | Limit of the log files to process. |
| --log-dir | logs/         | Folder where the log files are stored. |
| --output  | txt           | Resulting file format. Accepted value: `html` |
| --pretty  | false         | Whether to convert bytes into human readable strings like kilobytes and megabytes. |
| --to      |               | Date in `YYYY-MM-DD` format to restrict log entries. |
