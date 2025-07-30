const players = [
    // Flamengo (110)
    { id: 11001, teamId: 110, name: "Agustín Rossi", squadNumber: 1, pos: "GOL", age: 29, overall: 79, att: { GOL: 82, DEF: 30, PAS: 65, DRI: 30, FIN: 20, RIT: 50 } },
    { id: 11002, teamId: 110, name: "Gerson", squadNumber: 8, pos: "MEI", age: 28, overall: 80, att: { GOL: 20, DEF: 70, PAS: 85, DRI: 84, FIN: 75, RIT: 78 } },
    { id: 11003, teamId: 110, name: "Pedro", squadNumber: 9, pos: "ATA", age: 28, overall: 82, att: { GOL: 20, DEF: 35, PAS: 75, DRI: 80, FIN: 88, RIT: 79 } },
    { id: 11004, teamId: 110, name: "De Arrascaeta", squadNumber: 14, pos: "MEI", age: 31, overall: 83, att: { GOL: 20, DEF: 55, PAS: 88, DRI: 87, FIN: 82, RIT: 75 } },
    { id: 11006, teamId: 110, name: "Léo Ortiz", squadNumber: 3, pos: "ZAG", age: 29, overall: 78, att: { GOL: 20, DEF: 82, PAS: 72, DRI: 65, FIN: 40, RIT: 70 } },
    { id: 11007, teamId: 110, name: "Erick Pulgar", squadNumber: 5, pos: "VOL", age: 31, overall: 79, att: { GOL: 20, DEF: 80, PAS: 81, DRI: 70, FIN: 68, RIT: 72 } },
    { id: 11008, teamId: 110, name: "De la Cruz", squadNumber: 18, pos: "MEI", age: 28, overall: 82, att: { GOL: 20, DEF: 68, PAS: 84, DRI: 85, FIN: 78, RIT: 83 } },
    { id: 11009, teamId: 110, name: "G. Varela", squadNumber: 2, pos: "LD", age: 32, overall: 75, att: { GOL: 20, DEF: 76, PAS: 72, DRI: 75, FIN: 60, RIT: 80 } },

    // Palmeiras (116)
    { id: 11601, teamId: 116, name: "Weverton", squadNumber: 21, pos: "GOL", age: 37, overall: 81, att: { GOL: 85, DEF: 30, PAS: 68, DRI: 30, FIN: 20, RIT: 55 } },
    { id: 11602, teamId: 116, name: "Gustavo Gómez", squadNumber: 15, pos: "ZAG", age: 32, overall: 82, att: { GOL: 25, DEF: 88, PAS: 65, DRI: 60, FIN: 50, RIT: 72 } },
    { id: 11603, teamId: 116, name: "Raphael Veiga", squadNumber: 23, pos: "MEI", age: 30, overall: 81, att: { GOL: 20, DEF: 50, PAS: 84, DRI: 82, FIN: 83, RIT: 76 } },
    { id: 11604, teamId: 116, name: "Dudu", squadNumber: 7, pos: "ATA", age: 33, overall: 79, att: { GOL: 20, DEF: 40, PAS: 78, DRI: 88, FIN: 79, RIT: 84 } },
    { id: 11605, teamId: 116, name: "J. Piquerez", squadNumber: 22, pos: "LE", age: 26, overall: 79, att: { GOL: 20, DEF: 78, PAS: 77, DRI: 79, FIN: 65, RIT: 82 } },
    { id: 11606, teamId: 116, name: "Aníbal Moreno", squadNumber: 5, pos: "VOL", age: 26, overall: 80, att: { GOL: 20, DEF: 83, PAS: 78, DRI: 75, FIN: 60, RIT: 77 } },
    { id: 11607, teamId: 116, name: "Endrick", squadNumber: 9, pos: "ATA", age: 18, overall: 78, att: { GOL: 20, DEF: 40, PAS: 70, DRI: 85, FIN: 82, RIT: 88 } },
    
    // Corinthians (106)
    { id: 10601, teamId: 106, name: "Cássio", squadNumber: 12, pos: "GOL", age: 38, overall: 80, att: { GOL: 85, DEF: 20, PAS: 60, DRI: 20, FIN: 10, RIT: 50 } },
    { id: 10602, teamId: 106, name: "Fágner", squadNumber: 23, pos: "LD", age: 36, overall: 76, att: { GOL: 20, DEF: 75, PAS: 78, DRI: 79, FIN: 60, RIT: 74 } },
    { id: 10603, teamId: 106, name: "Yuri Alberto", squadNumber: 9, pos: "ATA", age: 24, overall: 77, att: { GOL: 20, DEF: 40, PAS: 68, DRI: 78, FIN: 80, RIT: 85 } },
    { id: 10604, teamId: 106, name: "Rodrigo Garro", squadNumber: 10, pos: "MEI", age: 27, overall: 78, att: { GOL: 20, DEF: 55, PAS: 82, DRI: 80, FIN: 75, RIT: 76 } },
    
    // São Paulo (118)
    { id: 11801, teamId: 118, name: "Rafael", squadNumber: 23, pos: "GOL", age: 35, overall: 78, att: { GOL: 81, DEF: 20, PAS: 65, DRI: 20, FIN: 10, RIT: 55 } },
    { id: 11802, teamId: 118, name: "R. Arboleda", squadNumber: 5, pos: "ZAG", age: 33, overall: 77, att: { GOL: 20, DEF: 81, PAS: 65, DRI: 60, FIN: 40, RIT: 70 } },
    { id: 11803, teamId: 118, name: "L. Moura", squadNumber: 7, pos: "ATA", age: 32, overall: 79, att: { GOL: 20, DEF: 50, PAS: 78, DRI: 86, FIN: 78, RIT: 88 } },
    { id: 11804, teamId: 118, name: "J. Calleri", squadNumber: 9, pos: "ATA", age: 31, overall: 79, att: { GOL: 20, DEF: 45, PAS: 70, DRI: 75, FIN: 84, RIT: 77 } },
    
    // Adicionando mais alguns jogadores para outros times da Série A
    // Santos (218)
    { id: 21801, teamId: 218, name: "João Paulo", squadNumber: 1, pos: "GOL", age: 30, overall: 77, att: { GOL: 80, DEF: 20, PAS: 60, DRI: 20, FIN: 10, RIT: 55 } },
    { id: 21802, teamId: 218, name: "Tomás Rincón", squadNumber: 8, pos: "VOL", age: 37, overall: 74, att: { GOL: 20, DEF: 78, PAS: 72, DRI: 70, FIN: 60, RIT: 65 } },
    
    // Grêmio (113)
    { id: 11301, teamId: 113, name: "F. Cristaldo", squadNumber: 10, pos: "MEI", age: 28, overall: 78, att: { GOL: 20, DEF: 55, PAS: 82, DRI: 80, FIN: 76, RIT: 75 } },
    
    // Internacional (114)
    { id: 11401, teamId: 114, name: "S. Rochet", squadNumber: 1, pos: "GOL", age: 32, overall: 79, att: { GOL: 83, DEF: 20, PAS: 65, DRI: 20, FIN: 10, RIT: 58 } },
    
    // Atlético Mineiro (103)
    { id: 10301, teamId: 103, name: "Hulk", squadNumber: 7, pos: "ATA", age: 38, overall: 80, att: { GOL: 20, DEF: 45, PAS: 78, DRI: 80, FIN: 88, RIT: 78 } },
    { id: 10302, teamId: 103, name: "Paulinho", squadNumber: 10, pos: "ATA", age: 24, overall: 81, att: { GOL: 20, DEF: 40, PAS: 76, DRI: 83, FIN: 84, RIT: 85 } },

    // ... (Elencos dos outros 12 times da Série A seriam adicionados aqui no mesmo formato)
];
