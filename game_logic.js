// Este arquivo contém a lógica central do jogo, mutações de estado e simulação.
// Ele depende de 'globals.js' para o estado e constantes, e 'utils.js' para utilitários.

// --- Funções de Inicialização e Setup do Jogo (CORE) ---
function mergeAllData() {
    // Mescla dados de biografia e contrato nos objetos de liga existentes.
    if (typeof playerBioData === 'undefined' || typeof leaguesData === 'undefined') {
        console.error("ERRO CRÍTICO: O arquivo player_bio_data.js ou os arquivos de liga não foram carregados.");
        return;
    }

    const allContracts = {
        'brasileirao_a': typeof contratos_seriea !== 'undefined' ? contratos_seriea : [],
        'brasileirao_b': typeof contratos_serieb !== 'undefined' ? contratos_serieb : [],
        'brasileirao_c': typeof contratos_seriec !== 'undefined' ? contratos_seriec : [],
    };

    for (const leagueId in leaguesData) {
        const league = leaguesData[leagueId];
        const bioLeague = playerBioData[leagueId];
        const contractLeague = allContracts[leagueId];

        if (!league) {
            console.error(`ERRO: Dados da liga ${leagueId} não encontrados em leaguesData.`);
            continue;
        }
        if (!bioLeague) {
            console.error(`ERRO: Dados de biografia (idade/valor) para a liga ${leagueId} não foram carregados. Verifique o arquivo "dinheiro_joga" correspondente.`);
            continue;
        }
        if (!contractLeague) {
            console.error(`ERRO: Dados de contrato para a liga ${leagueId} não foram carregados. Verifique o arquivo "contratos" correspondente.`);
            continue;
        }

        for (const team of league.teams) {
            const bioTeam = bioLeague.teams.find(t => t.name === team.name);
            const contractTeam = contractLeague.find(t => t.time === team.name);

            if (!team.players) continue;

            if (!bioTeam) {
                console.error(`[mergeAllData] Time de biografia "${team.name}" não encontrado no arquivo "dinheiro_joga" da liga.`);
                continue;
            }
            if (!contractTeam) {
                console.error(`[mergeAllData] Time de contrato "${team.name}" não encontrado no arquivo "contratos" da liga. Verifique a propriedade 'time'.`);
                continue;
            }

            for (const player of team.players) {
                const bioPlayer = bioTeam.players.find(p => p.name === player.name);
                const contractPlayer = contractTeam.jogadores.find(p => p.nome === player.name);

                if (!bioPlayer) {
                    console.warn(`[mergeAllData] Jogador de biografia "${player.name}" não encontrado no time "${team.name}".`);
                } else {
                    Object.assign(player, bioPlayer);
                }

                if (!contractPlayer) {
                    console.warn(`[mergeAllData] Jogador de contrato "${player.name}" não encontrado no time "${team.name}". Verifique a propriedade 'nome'.`);
                } else if (typeof contractPlayer.contrato_anos === 'number') {
                    player.contractUntil = contractPlayer.contrato_anos * 12;
                }
            }
        }
    }
}

function initializeAllPlayerData() {
    // Inicializa dados de jogadores para todos os times (overall, valor de mercado).
    for (const leagueId in leaguesData) {
        for (const team of leaguesData[leagueId].teams) {
            initializeAllPlayerDataForTeam(team);
        }
    }
}

function initializeAllPlayerDataForTeam(team) {
    const requiredAttributes = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
    const attributeMap = { pac: 'pace', sho: 'shooting', pas: 'passing', dri: 'dribbling', def: 'defending', phy: 'physical' };

    for (const player of team.players) {
        if (typeof player.age !== 'number' || isNaN(player.age)) {
            player.age = 23;
        }

        if (!player.attributes) player.attributes = {};
        for (const shortKey in attributeMap) {
            if (player.attributes.hasOwnProperty(shortKey)) {
                const longKey = attributeMap[shortKey];
                player.attributes[longKey] = player.attributes[shortKey];
                delete player.attributes[shortKey];
            }
        }

        for (const attr of requiredAttributes) {
            if (typeof player.attributes[attr] !== 'number') {
                player.attributes[attr] = 50;
            }
        }

        if (typeof player.marketValue === 'string') { // Parse string values to numbers
            player.marketValue = parseMarketValue(player.marketValue);
            // Se o valor inicial veio de uma string e era em EUR, converta para BRL
            if (player.marketValue && player.marketValue > 1000000 && (player.marketValue / currencyRates.EUR) < (player.marketValue / currencyRates.BRL)) {
                player.marketValue = player.marketValue * currencyRates.BRL / currencyRates.EUR;
            }
        }
        updateMarketValue(player); // Garante que o valor esteja sempre em BRL e calculado corretamente
    }
}

function initializeClubFinances() {
    // Inicializa as finanças do clube do usuário.
    const clubFinancialData = typeof estimativaVerbaMedia2025 !== 'undefined' ? estimativaVerbaMedia2025.find(c => c.time === gameState.userClub.name) : null;
    let initialBudget = 5 * 1000000;
    if (clubFinancialData) {
        initialBudget = clubFinancialData.verba_media_estimada_milhoes_reais * 1000000;
    }
    gameState.clubFinances.balance = 0;
    gameState.clubFinances.history = [];
    addTransaction(initialBudget, "Verba inicial da temporada");
    gameState.userTicketPrice = BASE_TICKET_PRICE[gameState.currentLeagueId] || 70; // Define o preço inicial do ingresso
    calculateFixedMonthlyExpenses(); // Calcula as despesas fixas iniciais
}

function addTransaction(amount, description) {
    // Adiciona uma transação ao histórico financeiro do clube.
    gameState.clubFinances.history.unshift({ date: new Date(gameState.currentDate), description, amount });
    gameState.clubFinances.balance += amount;
}

function initializeSeason() {
    // Prepara o estado do jogo para uma nova temporada.
    const year = 2025 + gameState.season - 1;
    gameState.isOffSeason = false;
