DROP TABLE IF EXISTS Counters;

CREATE TABLE Counters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hum1 REAL NOT NULL,
    hum2 REAL NOT NULL,
    hum3 REAL NOT NULL,
    hum4 REAL NOT NULL,
    hum_aver REAL NOT NULL,
    temp1 REAL NOT NULL,
    temp2 REAL NOT NULL,
    temp3 REAL NOT NULL,
    temp4 REAL NOT NULL,
    temp_aver REAL NOT NULL,
    soilhum1 REAL NOT NULL,
    soilhum2 REAL NOT NULL,
    soilhum3 REAL NOT NULL,
    soilhum4 REAL NOT NULL,
    soilhum5 REAL NOT NULL,
    soilhum6 REAL NOT NULL,
    soilhum_aver REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS States (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wnd INTEGER NOT NULL,
    aw INTEGER NOT NULL,
    swat1 INTEGER NOT NULL,
    swat2 INTEGER NOT NULL,
    swat3 INTEGER NOT NULL,
    swat4 INTEGER NOT NULL,
    swat5 INTEGER NOT NULL,
    swat6 INTEGER NOT NULL,
    minT REAL NOT NULL,
    maxAH REAL NOT NULL,
    maxSH REAL NOT NULL,
    tm INTEGER NOT NULL,
    extra INTEGER NOT NULL
);

INSERT OR IGNORE INTO States VALUES (1, 0, 0, 0, 0, 0, 0, 0, 0, 35, 60, 72, 2, 0)
