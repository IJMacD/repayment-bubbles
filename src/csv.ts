export function parseCSV (csv: string) {
    const lines = csv.trim().split("\n");
    const [ header, ...records ] = lines;

    const headerLine = parseLine(header);

    return records.map(parseLine).map(record => zip(headerLine, record));
}

function parseLine (line: string) {
    const re = /"([^"]*)"(?:,|$)|([^"][^,]*)(?:,|$)/g;

    return [...line.matchAll(re)].map(m => m[1] || m[2]);
}

function zip (keys: string[], values: any[]) {
    const object = {} as any;
    for (let i = 0; i < keys.length; i++) {
        object[keys[i]] = values[i];
    }
    return object;
}