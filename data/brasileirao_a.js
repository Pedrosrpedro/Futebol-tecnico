const leaguesData = {
    "brasileirao_a": {
        "name": "Brasileirão Série A",
        "logo": "logo_brasileirao_a.png",
        "teams": [
            {
                "name": "Flamengo",
                "logo": "logo_flamengo.png",
                "players": [
                    { "name": "Agustín Rossi", "position": "Goleiro", "attributes": { "pace": 80, "shooting": 40, "passing": 65, "dribbling": 50, "defending": 85, "physical": 78 }, "overall": 82 },
                    { "name": "Léo Pereira", "position": "Zagueiro", "attributes": { "pace": 75, "shooting": 55, "passing": 68, "dribbling": 62, "defending": 84, "physical": 80 }, "overall": 81 },
                    { "name": "De Arrascaeta", "position": "Meia", "attributes": { "pace": 82, "shooting": 85, "passing": 88, "dribbling": 90, "defending": 50, "physical": 70 }, "overall": 87 },
                    { "name": "Gabriel Barbosa", "position": "Atacante", "attributes": { "pace": 86, "shooting": 88, "passing": 75, "dribbling": 84, "defending": 40, "physical": 76 }, "overall": 86 }
                ]
            },
            {
                "name": "Palmeiras",
                "logo": "logo_palmeiras.png",
                "players": [
                    { "name": "Weverton", "position": "Goleiro", "attributes": { "pace": 78, "shooting": 35, "passing": 60, "dribbling": 45, "defending": 86, "physical": 79 }, "overall": 83 },
                    { "name": "Gustavo Gómez", "position": "Zagueiro", "attributes": { "pace": 76, "shooting": 60, "passing": 65, "dribbling": 61, "defending": 87, "physical": 85 }, "overall": 83 },
                    { "name": "Raphael Veiga", "position": "Meia", "attributes": { "pace": 81, "shooting": 86, "passing": 85, "dribbling": 83, "defending": 55, "physical": 72 }, "overall": 84 }
                ]
            },
            // Lista dos outros times do Brasileirão Série A 2024
            { "name": "Atlético Mineiro", "logo": "logo_atletico_mg.png", "players": [{ "name": "*A. Junior", "position": "Goleiro", "attributes": { "pace": 70, "shooting": 30, "passing": 50, "dribbling": 40, "defending": 75, "physical": 72 }, "overall": 72 }] },
            { "name": "Botafogo", "logo": "logo_botafogo.png", "players": [{ "name": "*B. Silva", "position": "Atacante", "attributes": { "pace": 82, "shooting": 78, "passing": 65, "dribbling": 77, "defending": 40, "physical": 70 }, "overall": 76 }] },
            { "name": "Corinthians", "logo": "logo_corinthians.png", "players": [{ "name": "*C. Miguel", "position": "Goleiro", "attributes": { "pace": 75, "shooting": 32, "passing": 55, "dribbling": 42, "defending": 79, "physical": 76 }, "overall": 77 }] },
            { "name": "Cruzeiro", "logo": "logo_cruzeiro.png", "players": [{ "name": "*M. Pereira", "position": "Meia", "attributes": { "pace": 78, "shooting": 79, "passing": 81, "dribbling": 80, "defending": 50, "physical": 68 }, "overall": 79 }] },
            { "name": "Fluminense", "logo": "logo_fluminense.png", "players": [{ "name": "*G. Cano", "position": "Atacante", "attributes": { "pace": 80, "shooting": 85, "passing": 70, "dribbling": 75, "defending": 38, "physical": 74 }, "overall": 81 }] },
            { "name": "Grêmio", "logo": "logo_gremio.png", "players": [{ "name": "*D. Costa", "position": "Atacante", "attributes": { "pace": 88, "shooting": 80, "passing": 78, "dribbling": 86, "defending": 45, "physical": 65 }, "overall": 80 }] },
            { "name": "Internacional", "logo": "logo_internacional.png", "players": [{ "name": "*S. Rochet", "position": "Goleiro", "attributes": { "pace": 77, "shooting": 38, "passing": 62, "dribbling": 48, "defending": 83, "physical": 78 }, "overall": 80 }] },
            { "name": "Vasco da Gama", "logo": "logo_vasco.png", "players": [{ "name": "*D. Payet", "position": "Meia", "attributes": { "pace": 74, "shooting": 82, "passing": 86, "dribbling": 84, "defending": 52, "physical": 67 }, "overall": 81 }] },
            { "name": "Bahia", "logo": "logo_bahia.png", "players": [{ "name": "*E. Ribeiro", "position": "Meia", "attributes": { "pace": 76, "shooting": 78, "passing": 82, "dribbling": 83, "defending": 51, "physical": 69 }, "overall": 79 }] },
            { "name": "Athletico Paranaense", "logo": "logo_athletico_pr.png", "players": [{ "name": "*Bento", "position": "Goleiro", "attributes": { "pace": 80, "shooting": 34, "passing": 61, "dribbling": 50, "defending": 84, "physical": 77 }, "overall": 80 }] },
            { "name": "Fortaleza", "logo": "logo_fortaleza.png", "players": [{ "name": "*Y. Pikachu", "position": "Lateral", "attributes": { "pace": 85, "shooting": 75, "passing": 72, "dribbling": 78, "defending": 68, "physical": 74 }, "overall": 77 }] },
            { "name": "São Paulo", "logo": "logo_sao_paulo.png", "players": [{ "name": "*L. Moura", "position": "Atacante", "attributes": { "pace": 89, "shooting": 81, "passing": 77, "dribbling": 87, "defending": 48, "physical": 68 }, "overall": 82 }] },
            { "name": "Red Bull Bragantino", "logo": "logo_bragantino.png", "players": [{ "name": "*Cleiton", "position": "Goleiro", "attributes": { "pace": 76, "shooting": 30, "passing": 58, "dribbling": 46, "defending": 78, "physical": 75 }, "overall": 76 }] },
            { "name": "Criciúma", "logo": "logo_criciuma.png", "players": [{ "name": "*Y. Bolasie", "position": "Atacante", "attributes": { "pace": 84, "shooting": 76, "passing": 70, "dribbling": 82, "defending": 42, "physical": 71 }, "overall": 75 }] },
            { "name": "Juventude", "logo": "logo_juventude.png", "players": [{ "name": "*Nenê", "position": "Meia", "attributes": { "pace": 65, "shooting": 78, "passing": 83, "dribbling": 77, "defending": 45, "physical": 60 }, "overall": 76 }] },
            { "name": "Vitória", "logo": "logo_vitoria.png", "players": [{ "name": "*L. Adriano", "position": "Atacante", "attributes": { "pace": 75, "shooting": 79, "passing": 68, "dribbling": 74, "defending": 39, "physical": 73 }, "overall": 76 }] },
            { "name": "Atlético Goianiense", "logo": "logo_atletico_go.png", "players": [{ "name": "*S. Churín", "position": "Atacante", "attributes": { "pace": 74, "shooting": 76, "passing": 62, "dribbling": 70, "defending": 41, "physical": 78 }, "overall": 73 }] }
        ]
    }
    // Adicione outras ligas aqui no futuro (brasileirao_b, etc.)
};
