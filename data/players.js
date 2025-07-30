const players = [
    // --- Flamengo (ID 110) ---
    { id: 11001, teamId: 110, name: "Agustín Rossi", age: 29, pos: "GOL", overall: 79, att: { GOL: 82, DEF: 30, PAS: 65, DRI: 30, FIN: 20, RIT: 50 } },
    { id: 11008, teamId: 110, name: "Nicolás de la Cruz", age: 28, pos: "MEI", overall: 82, att: { GOL: 20, DEF: 68, PAS: 84, DRI: 85, FIN: 78, RIT: 83 } },
    { id: 11003, teamId: 110, name: "Pedro", age: 28, pos: "ATA", overall: 82, att: { GOL: 20, DEF: 35, PAS: 75, DRI: 80, FIN: 88, RIT: 79 } },

    // --- Palmeiras (ID 116) ---
    { id: 11601, teamId: 116, name: "Weverton", age: 37, pos: "GOL", overall: 81, att: { GOL: 85, DEF: 30, PAS: 68, DRI: 30, FIN: 20, RIT: 55 } },
    { id: 11602, teamId: 116, name: "Gustavo Gómez", age: 32, pos: "ZAG", overall: 82, att: { GOL: 25, DEF: 88, PAS: 65, DRI: 60, FIN: 50, RIT: 72 } },
    { id: 11603, teamId: 116, name: "Raphael Veiga", age: 30, pos: "MEI", overall: 81, att: { GOL: 20, DEF: 50, PAS: 84, DRI: 82, FIN: 83, RIT: 76 } },

    // --- River Plate (ID 801) ---
    { id: 80101, teamId: 801, name: "Franco Armani", age: 38, pos: "GOL", overall: 80, att: { GOL: 84, DEF: 20, PAS: 60, DRI: 20, FIN: 10, RIT: 55 } },
    { id: 80102, teamId: 801, name: "Claudio Echeverri", age: 19, pos: "MEI", overall: 74, att: { GOL: 15, DEF: 40, PAS: 78, DRI: 85, FIN: 72, RIT: 80 } },

    // --- Boca Juniors (ID 802) ---
    { id: 80201, teamId: 802, name: "Edinson Cavani", age: 38, pos: "ATA", overall: 81, att: { GOL: 20, DEF: 45, PAS: 70, DRI: 75, FIN: 86, RIT: 72 } },
    { id: 80202, teamId: 802, name: "Marcos Rojo", age: 35, pos: "ZAG", overall: 78, att: { GOL: 20, DEF: 82, PAS: 68, DRI: 65, FIN: 50, RIT: 69 } },

    // --- Inter Miami CF (ID 1301) ---
    { id: 130101, teamId: 1301, name: "Lionel Messi", age: 38, pos: "ATA", overall: 90, att: { GOL: 20, DEF: 35, PAS: 92, DRI: 94, FIN: 93, RIT: 80 } },
    { id: 130102, teamId: 1301, name: "Luis Suárez", age: 38, pos: "ATA", overall: 84, att: { GOL: 20, DEF: 45, PAS: 78, DRI: 80, FIN: 89, RIT: 70 } },
    { id: 130103, teamId: 1301, name: "Sergio Busquets", age: 37, pos: "VOL", overall: 82, att: { GOL: 20, DEF: 80, PAS: 88, DRI: 75, FIN: 60, RIT: 50 } },

    // --- Bayern München (ID 1401) ---
    { id: 140101, teamId: 1401, name: "Manuel Neuer", age: 39, pos: "GOL", overall: 87, att: { GOL: 90, DEF: 25, PAS: 75, DRI: 30, FIN: 15, RIT: 55 } },
    { id: 140102, teamId: 1401, name: "Harry Kane", age: 31, pos: "ATA", overall: 90, att: { GOL: 25, DEF: 50, PAS: 85, DRI: 82, FIN: 95, RIT: 75 } },

    // --- Paris Saint-Germain (ID 1601) ---
    { id: 160101, teamId: 1601, name: "Ousmane Dembélé", age: 28, pos: "ATA", overall: 84, att: { GOL: 20, DEF: 45, PAS: 82, DRI: 92, FIN: 80, RIT: 93 } },
    
    // --- Al-Nassr (ID 2002) ---
    { id: 200201, teamId: 2002, name: "Cristiano Ronaldo", age: 40, pos: "ATA", overall: 86, att: { GOL: 20, DEF: 40, PAS: 78, DRI: 82, FIN: 92, RIT: 84 } },
    { id: 200202, teamId: 2002, name: "Sadio Mané", age: 33, pos: "ATA", overall: 84, att: { GOL: 20, DEF: 45, PAS: 80, DRI: 88, FIN: 85, RIT: 89 } },

    // --- Jogadores Gerados (Exemplos) ---
    { id: 90101, teamId: 901, name: "*Javier Rodriguez", age: 24, pos: "MEI", overall: 68, att: { GOL: 15, DEF: 55, PAS: 72, DRI: 70, FIN: 65, RIT: 74 } }, // Millonarios
    { id: 190101, teamId: 1901, name: "*Emre Yilmaz", age: 22, pos: "ZAG", overall: 70, att: { GOL: 20, DEF: 78, PAS: 55, DRI: 50, FIN: 30, RIT: 72 } }, // Galatasaray
];
