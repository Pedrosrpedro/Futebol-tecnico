const leagues = [
    // =================================================================================
    // AMÉRICA DO SUL
    // =================================================================================

    // --- BRASIL (Séries A, B, C, D) ---
    {
        id: "bra_a", name: "Brasileirão Série A", country: "Brasil", division: 1,
        teams: [
            { id: 103, name: "Atlético Mineiro", overall: 78, budget: 25000000 }, { id: 104, name: "Bahia", overall: 75, budget: 15000000 },
            { id: 105, name: "Botafogo", overall: 77, budget: 18000000 }, { id: 106, name: "Corinthians", overall: 77, budget: 22000000 },
            { id: 108, name: "Cruzeiro", overall: 74, budget: 14000000 }, { id: 110, name: "Flamengo", overall: 82, budget: 45000000 },
            { id: 111, name: "Fluminense", overall: 78, budget: 20000000 }, { id: 112, name: "Fortaleza", overall: 76, budget: 14000000 },
            { id: 113, name: "Grêmio", overall: 77, budget: 19000000 }, { id: 114, name: "Internacional", overall: 78, budget: 23000000 },
            { id: 115, name: "Juventude", overall: 69, budget: 4500000 }, { id: 116, name: "Palmeiras", overall: 82, budget: 45000000 },
            { id: 117, name: "Red Bull Bragantino", overall: 76, budget: 17000000 }, { id: 118, name: "São Paulo", overall: 79, budget: 28000000 },
            { id: 119, name: "Vasco da Gama", overall: 73, budget: 16000000 }, { id: 120, name: "Vitória", overall: 70, budget: 7000000 },
            { id: 218, name: "Santos", overall: 72, budget: 15000000 }, { id: 213, name: "Mirassol", overall: 68, budget: 4000000 },
            { id: 219, name: "Sport Recife", overall: 69, budget: 7200000 }, { id: 206, name: "Ceará", overall: 69, budget: 7000000 },
        ]
    },
    {
        id: "bra_b", name: "Brasileirão Série B", country: "Brasil", division: 2,
        teams: [
            { id: 101, name: "Athletico Paranaense", overall: 75, budget: 10000000 }, { id: 109, name: "Cuiabá", overall: 71, budget: 6000000 },
            { id: 107, name: "Criciúma", overall: 68, budget: 4000000 }, { id: 102, name: "Atlético Goianiense", overall: 70, budget: 5000000 },
            { id: 201, name: "Amazonas", overall: 65, budget: 2000000 }, { id: 202, name: "América-MG", overall: 70, budget: 8000000 },
            { id: 203, name: "Avaí", overall: 67, budget: 3000000 }, { id: 204, name: "Botafogo-SP", overall: 66, budget: 2500000 },
            { id: 207, name: "Chapecoense", overall: 66, budget: 3000000 }, { id: 208, name: "Coritiba", overall: 70, budget: 9000000 },
            { id: 209, name: "CRB", overall: 67, budget: 3500000 }, { id: 210, name: "Goiás", overall: 69, budget: 7500000 },
            { id: 214, name: "Novorizontino", overall: 68, budget: 4100000 }, { id: 215, name: "Operário-PR", overall: 66, budget: 2800000 },
            { id: 216, name: "Paysandu", overall: 65, budget: 2500000 }, { id: 220, name: "Vila Nova", overall: 66, budget: 3100000 },
            { id: 310, name: "Volta Redonda", overall: 61, budget: 950000 }, { id: 302, name: "Athletic Club", overall: 60, budget: 800000 },
            { id: 305, name: "Ferroviária", overall: 60, budget: 850000 }, { id: 307, name: "Remo", overall: 63, budget: 1200000 },
        ]
    },
    { id: "bra_c", name: "Brasileirão Série C", country: "Brasil", division: 3, teams: [ /* ... */ ] },
    { id: "bra_d", name: "Brasileirão Série D", country: "Brasil", division: 4, teams: [ /* ... */ ] },

    // --- ARGENTINA ---
    {
        id: "arg_1", name: "Liga Profesional de Fútbol", country: "Argentina", division: 1,
        teams: [
            { id: 801, name: "River Plate", overall: 79, budget: 20000000 }, { id: 802, name: "Boca Juniors", overall: 78, budget: 18000000 },
            { id: 803, name: "Racing Club", overall: 76, budget: 10000000 }, { id: 804, name: "Independiente", overall: 75, budget: 9000000 },
            { id: 805, name: "San Lorenzo", overall: 74, budget: 8000000 }, { id: 806, name: "Estudiantes (LP)", overall: 75, budget: 7000000 },
            { id: 807, name: "Vélez Sarsfield", overall: 73, budget: 6000000 }, { id: 808, name: "Argentinos Juniors", overall: 72, budget: 5000000 },
            { id: 809, name: "Defensa y Justicia", overall: 72, budget: 5500000 }, { id: 810, name: "Talleres (Córdoba)", overall: 73, budget: 6500000 },
            { id: 811, name: "Rosario Central", overall: 71, budget: 4500000 }, { id: 812, name: "Newell's Old Boys", overall: 71, budget: 4500000 },
            { id: 813, name: "Lanús", overall: 70, budget: 4000000 }, { id: 814, name: "Godoy Cruz", overall: 70, budget: 3500000 },
        ]
    },

    // --- COLÔMBIA ---
    {
        id: "col_1", name: "Categoría Primera A", country: "Colômbia", division: 1,
        teams: [
            { id: 901, name: "Millonarios", overall: 74, budget: 5000000 }, { id: 902, name: "Atlético Nacional", overall: 73, budget: 4500000 },
            { id: 903, name: "Junior Barranquilla", overall: 72, budget: 4000000 }, { id: 904, name: "Independiente Medellín", overall: 71, budget: 3500000 },
            { id: 905, name: "América de Cali", overall: 71, budget: 3800000 }, { id: 906, name: "Deportes Tolima", overall: 70, budget: 3000000 },
        ]
    },

    // --- CHILE ---
    {
        id: "chi_1", name: "Campeonato Chileno", country: "Chile", division: 1,
        teams: [
            { id: 1001, name: "Colo-Colo", overall: 75, budget: 5500000 }, { id: 1002, name: "Universidad de Chile", overall: 74, budget: 5000000 },
            { id: 1003, name: "Universidad Católica", overall: 73, budget: 4500000 }, { id: 1004, name: "Palestino", overall: 68, budget: 2000000 },
        ]
    },

    // --- URUGUAI ---
    {
        id: "uru_1", name: "Campeonato Uruguaio", country: "Uruguai", division: 1,
        teams: [
            { id: 1101, name: "Peñarol", overall: 74, budget: 4000000 }, { id: 1102, name: "Nacional", overall: 73, budget: 3800000 },
            { id: 1103, name: "Liverpool FC (URU)", overall: 69, budget: 1500000 }, { id: 1104, name: "Defensor Sporting", overall: 68, budget: 1400000 },
        ]
    },
    // ... placeholders para Paraguai, Equador, etc ...

    // =================================================================================
    // AMÉRICA DO NORTE
    // =================================================================================

    // --- MÉXICO ---
    {
        id: "mex_1", name: "Liga MX", country: "México", division: 1,
        teams: [
            { id: 1201, name: "Club América", overall: 78, budget: 15000000 }, { id: 1202, name: "Chivas Guadalajara", overall: 76, budget: 12000000 },
            { id: 1203, name: "Cruz Azul", overall: 75, budget: 10000000 }, { id: 1204, name: "Pumas UNAM", overall: 74, budget: 9000000 },
            { id: 1205, name: "Tigres UANL", overall: 77, budget: 14000000 }, { id: 1206, name: "CF Monterrey", overall: 77, budget: 14500000 },
        ]
    },

    // --- MLS (EUA) ---
    {
        id: "usa_1", name: "Major League Soccer (MLS)", country: "EUA", division: 1,
        teams: [
            { id: 1301, name: "Inter Miami CF", overall: 78, budget: 20000000 }, { id: 1302, name: "Los Angeles FC", overall: 76, budget: 15000000 },
            { id: 1303, name: "LA Galaxy", overall: 74, budget: 12000000 }, { id: 1304, name: "Seattle Sounders FC", overall: 73, budget: 10000000 },
            { id: 1305, name: "Atlanta United FC", overall: 72, budget: 9000000 }, { id: 1306, name: "New York City FC", overall: 71, budget: 8500000 },
        ]
    },

    // =================================================================================
    // EUROPA
    // =================================================================================
    
    // --- INGLATERRA ---
    {
        id: "eng_1", name: "Premier League", country: "Inglaterra", division: 1,
        teams: [
            { id: 501, name: "Arsenal", overall: 85, budget: 80000000 }, { id: 502, name: "Aston Villa", overall: 82, budget: 55000000 },
            { id: 503, name: "Chelsea", overall: 83, budget: 90000000 }, { id: 504, name: "Liverpool", overall: 87, budget: 95000000 },
            { id: 505, name: "Manchester City", overall: 89, budget: 120000000 }, { id: 506, name: "Manchester United", overall: 84, budget: 100000000 },
            { id: 507, name: "Newcastle United", overall: 83, budget: 75000000 }, { id: 508, name: "Tottenham Hotspur", overall: 83, budget: 70000000 },
        ]
    },

    // --- ESPANHA ---
    {
        id: "spa_1", name: "La Liga", country: "Espanha", division: 1,
        teams: [
            { id: 601, name: "Atlético Madrid", overall: 84, budget: 70000000 }, { id: 602, name: "FC Barcelona", overall: 86, budget: 100000000 },
            { id: 603, name: "Real Madrid", overall: 89, budget: 130000000 }, { id: 604, name: "Real Sociedad", overall: 82, budget: 40000000 },
            { id: 605, name: "Sevilla FC", overall: 81, budget: 45000000 }, { id: 606, name: "Villarreal CF", overall: 80, budget: 35000000 },
        ]
    },

    // --- ALEMANHA ---
    {
        id: "ger_1", name: "Bundesliga", country: "Alemanha", division: 1,
        teams: [
            { id: 1401, name: "Bayern München", overall: 88, budget: 100000000 }, { id: 1402, name: "Borussia Dortmund", overall: 85, budget: 80000000 },
            { id: 1403, name: "Bayer 04 Leverkusen", overall: 86, budget: 75000000 }, { id: 1404, name: "RB Leipzig", overall: 84, budget: 85000000 },
        ]
    },

    // --- ITÁLIA ---
    {
        id: "ita_1", name: "Serie A", country: "Itália", division: 1,
        teams: [
            { id: 1501, name: "Inter Milan", overall: 86, budget: 90000000 }, { id: 1502, name: "AC Milan", overall: 84, budget: 85000000 },
            { id: 1503, name: "Juventus", overall: 83, budget: 80000000 }, { id: 1504, name: "Napoli", overall: 83, budget: 70000000 },
            { id: 1505, name: "AS Roma", overall: 82, budget: 60000000 }, { id: 1506, name: "Lazio", overall: 81, budget: 55000000 },
        ]
    },

    // --- FRANÇA ---
    {
        id: "fra_1", name: "Ligue 1", country: "França", division: 1,
        teams: [
            { id: 1601, name: "Paris Saint-Germain", overall: 85, budget: 150000000 }, { id: 1602, name: "AS Monaco", overall: 80, budget: 40000000 },
            { id: 1603, name: "Olympique de Marseille", overall: 80, budget: 45000000 }, { id: 1604, name: "Olympique Lyonnais", overall: 78, budget: 35000000 },
        ]
    },

    // --- PORTUGAL ---
    {
        id: "por_1", name: "Primeira Liga", country: "Portugal", division: 1,
        teams: [
            { id: 1701, name: "SL Benfica", overall: 82, budget: 50000000 }, { id: 1702, name: "FC Porto", overall: 82, budget: 50000000 },
            { id: 1703, name: "Sporting CP", overall: 81, budget: 45000000 }, { id: 1704, name: "SC Braga", overall: 78, budget: 20000000 },
        ]
    },

    // --- HOLANDA ---
    {
        id: "ned_1", name: "Eredivisie", country: "Holanda", division: 1,
        teams: [
            { id: 1801, name: "AFC Ajax", overall: 79, budget: 35000000 }, { id: 1802, name: "PSV Eindhoven", overall: 80, budget: 38000000 },
            { id: 1803, name: "Feyenoord", overall: 79, budget: 32000000 }, { id: 1804, name: "AZ Alkmaar", overall: 76, budget: 15000000 },
        ]
    },

    // --- TURQUIA ---
    {
        id: "tur_1", name: "Süper Lig", country: "Turquia", division: 1,
        teams: [
            { id: 1901, name: "Galatasaray", overall: 78, budget: 25000000 }, { id: 1902, name: "Fenerbahçe", overall: 78, budget: 24000000 },
            { id: 1903, name: "Beşiktaş", overall: 76, budget: 20000000 }, { id: 1904, name: "Trabzonspor", overall: 75, budget: 15000000 },
        ]
    },

    // =================================================================================
    // ORIENTE MÉDIO
    // =================================================================================

    // --- ARÁBIA SAUDITA ---
    {
        id: "sau_1", name: "Saudi Pro League", country: "Arábia Saudita", division: 1,
        teams: [
            { id: 2001, name: "Al-Hilal", overall: 80, budget: 90000000 }, { id: 2002, name: "Al-Nassr", overall: 79, budget: 85000000 },
            { id: 2003, name: "Al-Ahli", overall: 77, budget: 70000000 }, { id: 2004, name: "Al-Ittihad", overall: 76, budget: 65000000 },
        ]
    },

    // --- QATAR ---
    {
        id: "qat_1", name: "Qatar Stars League", country: "Qatar", division: 1,
        teams: [
            { id: 2101, name: "Al-Sadd", overall: 72, budget: 30000000 }, { id: 2102, name: "Al-Duhail", overall: 70, budget: 25000000 },
            { id: 2103, name: "Al-Rayyan", overall: 68, budget: 20000000 },
        ]
    },
];
