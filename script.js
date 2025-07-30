// Aguarda o carregamento completo do HTML para executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- BASE DE DADOS EXPANDIDA ---
    const database = {
        leagues: [
            // BRASIL
            {
                id: "bra_a", name: "Brasileirão Série A", country: "Brasil", division: 1,
                teams: [
                    { id: 101, name: "Athletico Paranaense", overall: 75, budget: 15000000 },
                    { id: 102, name: "Atlético Goianiense", overall: 70, budget: 5000000 },
                    { id: 103, name: "Atlético Mineiro", overall: 78, budget: 25000000 },
                    { id: 104, name: "Bahia", overall: 74, budget: 12000000 },
                    { id: 105, name: "Botafogo", overall: 76, budget: 18000000 },
                    { id: 106, name: "Corinthians", overall: 77, budget: 22000000 },
                    { id: 107, name: "Criciúma", overall: 68, budget: 4000000 },
                    { id: 108, name: "Cruzeiro", overall: 74, budget: 14000000 },
                    { id: 109, name: "Cuiabá", overall: 71, budget: 6000000 },
                    { id: 110, name: "Flamengo", overall: 81, budget: 40000000 },
                    { id: 111, name: "Fluminense", overall: 78, budget: 20000000 },
                    { id: 112, name: "Fortaleza", overall: 75, budget: 13000000 },
                    { id: 113, name: "Grêmio", overall: 77, budget: 19000000 },
                    { id: 114, name: "Internacional", overall: 78, budget: 23000000 },
                    { id: 115, name: "Juventude", overall: 69, budget: 4500000 },
                    { id: 116, name: "Palmeiras", overall: 82, budget: 45000000 },
                    { id: 117, name: "Red Bull Bragantino", overall: 76, budget: 17000000 },
                    { id: 118, name: "São Paulo", overall: 79, budget: 28000000 },
                    { id: 119, name: "Vasco da Gama", overall: 73, budget: 16000000 },
                    { id: 120, name: "Vitória", overall: 70, budget: 7000000 },
                ]
            },
            {
                id: "bra_b", name: "Brasileirão Série B", country: "Brasil", division: 2,
                teams: [
                    { id: 201, name: "Amazonas", overall: 65, budget: 2000000 },
                    { id: 202, name: "América-MG", overall: 70, budget: 8000000 },
                    { id: 203, name: "Avaí", overall: 67, budget: 3000000 },
                    { id: 204, name: "Botafogo-SP", overall: 66, budget: 2500000 },
                    { id: 205, name: "Brusque", overall: 65, budget: 2000000 },
                    { id: 206, name: "Ceará", overall: 69, budget: 7000000 },
                    { id: 207, name: "Chapecoense", overall: 66, budget: 3000000 },
                    { id: 208, name: "Coritiba", overall: 70, budget: 9000000 },
                    { id: 209, name: "CRB", overall: 67, budget: 3500000 },
                    { id: 210, name: "Goiás", overall: 69, budget: 7500000 },
                    { id: 211, name: "Guarani", overall: 67, budget: 3200000 },
                    { id: 212, name: "Ituano", overall: 65, budget: 2100000 },
                    { id: 213, name: "Mirassol", overall: 68, budget: 4000000 },
                    { id: 214, name: "Novorizontino", overall: 68, budget: 4100000 },
                    { id: 215, name: "Operário-PR", overall: 66, budget: 2800000 },
                    { id: 216, name: "Paysandu", overall: 65, budget: 2500000 },
                    { id: 217, name: "Ponte Preta", overall: 67, budget: 3300000 },
                    { id: 218, name: "Santos", overall: 72, budget: 10000000 },
                    { id: 219, name: "Sport Recife", overall: 69, budget: 7200000 },
                    { id: 220, name: "Vila Nova", overall: 66, budget: 3100000 },
                ]
            },
            {
                id: "bra_c", name: "Brasileirão Série C", country: "Brasil", division: 3,
                teams: [
                    { id: 301, name: "ABC", overall: 62, budget: 1000000 },
                    { id: 302, name: "Athletic Club", overall: 60, budget: 800000 },
                    { id: 303, name: "Botafogo-PB", overall: 61, budget: 900000 },
                    { id: 304, name: "Confiança", overall: 59, budget: 700000 },
                    { id: 305, name: "Ferroviária", overall: 60, budget: 850000 },
                    { id: 306, name: "Figueirense", overall: 62, budget: 1100000 },
                    // Adicionando mais alguns para completar
                    { id: 307, name: "Remo", overall: 63, budget: 1200000 },
                    { id: 308, name: "Ypiranga-RS", overall: 60, budget: 800000 },
                    { id: 309, name: "São José-RS", overall: 59, budget: 750000 },
                    { id: 310, name: "Volta Redonda", overall: 61, budget: 950000 },
                ]
            },
            {
                id: "bra_d", name: "Brasileirão Série D", country: "Brasil", division: 4,
                teams: [
                    { id: 401, name: "América-RN", overall: 58, budget: 500000 },
                    { id: 402, name: "Santa Cruz", overall: 57, budget: 450000 },
                    { id: 403, name: "Brasil de Pelotas", overall: 56, budget: 400000 },
                    { id: 404, name: "ASA", overall: 55, budget: 350000 },
                ]
            },
            // EUROPA
            {
                id: "eng_1", name: "Premier League", country: "Inglaterra", division: 1,
                teams: [
                    { id: 501, name: "Arsenal", overall: 84, budget: 80000000 },
                    { id: 502, name: "Aston Villa", overall: 81, budget: 50000000 },
                    { id: 503, name: "Chelsea", overall: 82, budget: 90000000 },
                    { id: 504, name: "Everton", overall: 78, budget: 30000000 },
                    { id: 505, name: "Liverpool", overall: 86, budget: 95000000 },
                    { id: 506, name: "Manchester City", overall: 88, budget: 120000000 },
                    { id: 507, name: "Manchester United", overall: 83, budget: 100000000 },
                    { id: 508, name: "Newcastle United", overall: 82, budget: 70000000 },
                    { id: 509, name: "Tottenham Hotspur", overall: 83, budget: 65000000 },
                    { id: 510, name: "West Ham United", overall: 80, budget: 45000000 },
                ]
            },
            {
                id: "spa_1", name: "La Liga", country: "Espanha", division: 1,
                teams: [
                    { id: 601, name: "Atlético Madrid", overall: 84, budget: 70000000 },
                    { id: 602, name: "Barcelona", overall: 86, budget: 100000000 },
                    { id: 603, name: "Real Madrid", overall: 89, budget: 130000000 },
                    { id: 604, name: "Real Sociedad", overall: 82, budget: 40000000 },
                    { id: 605, name: "Sevilla", overall: 81, budget: 45000000 },
                    { id: 606, name: "Villarreal", overall: 80, budget: 35000000 },
                ]
            },
        ],
        players: [
            // Flamengo (ID 110)
            { id: 11001, teamId: 110, name: "Agustín Rossi", age: 29, pos: "GOL", overall: 79, att: { GOL: 82, DEF: 30, PAS: 65, DRI: 30, FIN: 20, RIT: 50 } },
            { id: 11002, teamId: 110, name: "Gerson", age: 28, pos: "MEI", overall: 80, att: { GOL: 20, DEF: 70, PAS: 85, DRI: 84, FIN: 75, RIT: 78 } },
            { id: 11003, teamId: 110, name: "Pedro", age: 28, pos: "ATA", overall: 82, att: { GOL: 20, DEF: 35, PAS: 75, DRI: 80, FIN: 88, RIT: 79 } },
            { id: 11004, teamId: 110, name: "Giorgian De Arrascaeta", age: 31, pos: "MEI", overall: 83, att: { GOL: 20, DEF: 55, PAS: 88, DRI: 87, FIN: 82, RIT: 75 } },

            // Palmeiras (ID 116)
            { id: 11601, teamId: 116, name: "Weverton", age: 37, pos: "GOL", overall: 81, att: { GOL: 85, DEF: 30, PAS: 68, DRI: 30, FIN: 20, RIT: 55 } },
            { id: 11602, teamId: 116, name: "Gustavo Gómez", age: 32, pos: "ZAG", overall: 82, att: { GOL: 25, DEF: 88, PAS: 65, DRI: 60, FIN: 50, RIT: 72 } },
            { id: 11603, teamId: 116, name: "Raphael Veiga", age: 30, pos: "MEI", overall: 81, att: { GOL: 20, DEF: 50, PAS: 84, DRI: 82, FIN: 83, RIT: 76 } },
            { id: 11604, teamId: 116, name: "Dudu", age: 33, pos: "ATA", overall: 80, att: { GOL: 20, DEF: 40, PAS: 78, DRI: 88, FIN: 79, RIT: 84 } },

            // Manchester City (ID 506)
            { id: 50601, teamId: 506, name: "Ederson", age: 31, pos: "GOL", overall: 88, att: { GOL: 87, DEF: 35, PAS: 92, DRI: 40, FIN: 25, RIT: 65 } },
            { id: 50602, teamId: 506, name: "Kevin De Bruyne", age: 34, pos: "MEI", overall: 91, att: { GOL: 25, DEF: 65, PAS: 94, DRI: 87, FIN: 88, RIT: 78 } },
            { id: 50603, teamId: 506, name: "Erling Haaland", age: 25, pos: "ATA", overall: 91, att: { GOL: 25, DEF: 45, PAS: 68, DRI: 80, FIN: 96, RIT: 92 } },
            
            // Jogador Gerado para o ABC (ID 301)
            { id: 30101, teamId: 301, name: "*Carlos Eduardo", age: 23, pos: "ATA", overall: 64, att: { GOL: 20, DEF: 30, PAS: 55, DRI: 68, FIN: 70, RIT: 75 } },
        ]
    };

    const mainContent = document.getElementById('main-content');
    let gameState = {
        playerTeamId: null,
    };


    // --- FUNÇÃO PARA CALCULAR OVERALL ---
    // Por enquanto, uma média simples dos atributos, exceto GOL para jogadores de linha e vice-versa.
    function calculateOverall(player) {
        const att = player.att;
        let sum = 0;
        let count = 0;
        if (player.pos === 'GOL') {
            sum = att.GOL * 6; // Goleiro é mais dependente de seu atributo principal
            count = 6;
        } else {
            sum = att.DEF + att.PAS + att.DRI + att.FIN + att.RIT;
            count = 5;
        }
        return Math.round(sum / count);
    }

    // --- FUNÇÕES DE LÓGICA DO JOGO ---

    function showMainMenu() {
        mainContent.innerHTML = `
            <h2>Novo Jogo</h2>
            <div class="button-container">
                <button id="new-game-existing-club" class="button">Treinar um Clube Existente</button>
                <button id="new-game-create-club" class="button">Criar um Novo Clube</button>
            </div>
        `;

        document.getElementById('new-game-existing-club').addEventListener('click', selectLeagueScreen);
        document.getElementById('new-game-create-club').addEventListener('click', () => {
            alert("Modo 'Criar um Novo Clube' em desenvolvimento!");
        });
    }

    function selectLeagueScreen() {
        // Ordena as ligas: primeiro Brasil por divisão, depois outras.
        const sortedLeagues = [...database.leagues].sort((a, b) => {
            if (a.country === 'Brasil' && b.country !== 'Brasil') return -1;
            if (a.country !== 'Brasil' && b.country === 'Brasil') return 1;
            if (a.country === 'Brasil' && b.country === 'Brasil') return a.division - b.division;
            return a.name.localeCompare(b.name);
        });

        let leagueButtonsHTML = sortedLeagues.map(league => {
            return `<button class="button" data-league-id="${league.id}">${league.name}</button>`;
        }).join('');

        mainContent.innerHTML = `
            <h2>Selecione uma Liga</h2>
            <div class="button-container">
                ${leagueButtonsHTML}
                <button id="back-to-main" class="button button-small">Voltar</button>
            </div>
        `;
        
        document.querySelectorAll('[data-league-id]').forEach(button => {
            button.addEventListener('click', (e) => {
                const leagueId = e.target.getAttribute('data-league-id');
                selectTeamScreen(leagueId);
            });
        });

        document.getElementById('back-to-main').addEventListener('click', showMainMenu);
    }
    
    function selectTeamScreen(leagueId) {
        const league = database.leagues.find(l => l.id === leagueId);
        if (!league) {
            alert('Liga não encontrada!');
            showMainMenu();
            return;
        }

        let teamButtonsHTML = league.teams.sort((a,b) => b.overall - a.overall).map(team => {
            return `<button class="button" data-team-id="${team.id}">${team.name} (Overall: ${team.overall})</button>`;
        }).join('');

        mainContent.innerHTML = `
            <h2>Selecione um Time de ${league.name}</h2>
            <div class="button-container">
                ${teamButtonsHTML}
                <button id="back-to-leagues" class="button button-small">Voltar</button>
            </div>
        `;

        document.querySelectorAll('[data-team-id]').forEach(button => {
            button.addEventListener('click', (e) => {
                const teamId = parseInt(e.currentTarget.getAttribute('data-team-id'));
                startGame(teamId);
            });
        });

        document.getElementById('back-to-leagues').addEventListener('click', selectLeagueScreen);
    }

    function startGame(teamId) {
        gameState.playerTeamId = teamId;
        showClubHub();
    }
    
    function showClubHub() {
        const teamId = gameState.playerTeamId;
        const team = database.leagues.flatMap(l => l.teams).find(t => t.id === teamId);
        if (!team) {
            alert("Erro: Time não encontrado!");
            showMainMenu();
            return;
        }

        mainContent.innerHTML = `
            <div class="club-hub-container">
                <header class="hub-header">
                    <h2>${team.name}</h2>
                    <p>Bem-vindo, manager!</p>
                </header>

                <aside class="hub-info">
                    <h3>Informações do Clube</h3>
                    <p><strong>Liga:</strong> ${database.leagues.find(l => l.teams.some(t => t.id === teamId)).name}</p>
                    <p><strong>Overall Médio:</strong> ${team.overall}</p>
                    <p><strong>Orçamento:</strong> $${team.budget.toLocaleString()}</p>
                    <p><strong>Próxima Partida:</strong> A ser definido</p>
                </aside>

                <section class="hub-actions">
                    <button class="action-button" id="hub-squad">Elenco</button>
                    <button class="action-button" id="hub-tactics">Táticas</button>
                    <button class="action-button" id="hub-calendar">Calendário</button>
                    <button class="action-button" id="hub-transfers">Transferências</button>
                    <button class="action-button" id="hub-finances">Finanças</button>
                    <button class="action-button" id="hub-stadium">Estádio</button>
                    <button class="action-button" id="hub-family">Vida Pessoal</button>
                    <button class="action-button" id="hub-office">Escritório</button>
                </section>

                <footer class="hub-footer">
                     <button id="back-to-main" class="button button-small">Sair do Jogo</button>
                </footer>
            </div>
        `;
        
        // Adiciona listeners para os botões do hub (por enquanto, apenas alertas)
        document.getElementById('hub-squad').addEventListener('click', () => alert('Tela de Elenco em desenvolvimento!'));
        document.getElementById('hub-stadium').addEventListener('click', () => alert('Editor de Estádio em desenvolvimento!'));
        document.getElementById('hub-family').addEventListener('click', () => alert('Módulo de Família em desenvolvimento!'));
        // ... outros botões
        
        document.getElementById('back-to-main').addEventListener('click', showMainMenu);
    }

    // --- INICIALIZAÇÃO DO JOGO ---
    showMainMenu();

});
