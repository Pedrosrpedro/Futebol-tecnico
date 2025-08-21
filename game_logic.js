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
    // Garante que todos os jogadores tenham atributos, overall e marketValue calculados.
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
            // Lógica para garantir que os valores sejam BRL já na importação
            // if (player.marketValue && player.marketValue > 1000000 && (player.marketValue / currencyRates.EUR) < (player.marketValue / currencyRates.BRL)) {
            //     player.marketValue = player.marketValue * currencyRates.BRL / currencyRates.EUR;
            // }
        }
        updateMarketValue(player); // Garante que o valor esteja sempre em BRL e calculado corretamente
    }
}

function initializeClubFinances() {
    // Inicializa as finanças do clube do usuário, incluindo orçamento inicial e despesas fixas.
    const clubFinancialData = typeof estimativaVerbaMedia2025 !== 'undefined' ? estimativaVerbaMedia2025.find(c => c.time === gameState.userClub.name) : null;
    let initialBudget = 5 * 1000000; // Default: 5 milhões
    if (clubFinancialData) {
        initialBudget = clubFinancialData.verba_media_estimada_milhoes_reais * 1000000;
    }
    gameState.clubFinances.balance = 0;
    gameState.clubFinances.history = [];
    addTransaction(initialBudget, "Verba inicial da temporada");

    // Define o preço inicial do ingresso do usuário com base na liga atual
    gameState.userTicketPrice = BASE_TICKET_PRICE[gameState.currentLeagueId] || 70; // Default para 70 se não encontrado
    calculateFixedMonthlyExpenses(); // Calcula as despesas fixas iniciais
}

function calculateFixedMonthlyExpenses() {
    // Calcula as despesas mensais fixas do clube com base na liga e no tamanho do elenco.
    const divisionMultiplier = {
        'brasileirao_a': 1.0, // Base para Série A
        'brasileirao_b': 0.6, // Mais barato na Série B
        'brasileirao_c': 0.3  // Mais barato na Série C
    };

    const baseExpense = 200000; // R$ 200 mil de despesa base por mês
    const playerExpense = 5000; // R$ 5 mil por jogador no elenco

    const leagueFactor = divisionMultiplier[gameState.currentLeagueId] || 0.5;
    const squadSizeFactor = gameState.userClub.players.length * playerExpense;

    gameState.clubFinances.fixedMonthlyExpenses = Math.round((baseExpense * leagueFactor + squadSizeFactor) / 1000) * 1000; // Arredonda para o milhar mais próximo
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
    gameState.newsFeed = [];

    for (const leagueId in leaguesData) {
        const leagueInfo = leaguesData[leagueId];
        const seasonStartDate = leagueInfo.leagueInfo.startDate ? `${year}-${leagueInfo.leagueInfo.startDate.substring(5)}` : `${year}-04-15`;
        const leagueStartDate = new Date(`${seasonStartDate}T12:00:00Z`);
        const isSerieC = leagueId === 'brasileirao_c';
        const schedule = generateSchedule(leagueInfo.teams, leagueInfo.leagueInfo, leagueStartDate, 0, isSerieC ? 1 : undefined);
        gameState.leagueStates[leagueId] = {
            table: initializeLeagueTable(leagueInfo.teams),
            schedule: schedule,
            serieCState: { phase: 1, groups: { A: [], B: [] }, finalists: [] }
        };
    }

    gameState.allMatches = [];
    for (const leagueId in gameState.leagueStates) {
        gameState.allMatches.push(...gameState.leagueStates[leagueId].schedule);
    }
    gameState.allMatches.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (gameState.allMatches.length > 0) {
        const lastMatch = gameState.allMatches[gameState.allMatches.length - 1];
        gameState.lastMatchDateOfYear = new Date(lastMatch.date);
    } else {
        gameState.lastMatchDateOfYear = new Date(`${year}-12-15T12:00:00Z`);
    }

    gameState.currentDate = new Date(`${year}-01-01T12:00:00Z`);
    gameState.matchesView.leagueId = gameState.currentLeagueId;
    gameState.tableView.leagueId = gameState.currentLeagueId;

    setupInitialSquad(); // Inicializa a escalação com base na nova formação
    findNextUserMatch(); // Encontra o próximo jogo do usuário
    updateLeagueTable(gameState.currentLeagueId); // Atualiza a tabela da liga atual
    updateContinueButton(); // Atualiza o botão de avançar dia
    addNews(`Começa a Temporada ${year}!`, `A bola vai rolar para a ${leaguesData[gameState.currentLeagueId].name}. Boa sorte, ${gameState.managerName}!`, true, gameState.userClub.name);
}


// --- Funções de Progressão, Aposentadoria e Valor ---
function calculatePlayerOverall(player) {
    // Calcula o Overall do jogador com base em seus atributos e posição.
    if (!player.attributes || Object.keys(player.attributes).length === 0) {
        return player.overall || 50;
    }

    let weightedSum = 0;
    for (const attr in player.attributes) {
        weightedSum += player.attributes[attr] * (overallWeights[attr] || 0);
    }
    const primaryAttrBonus = { 'ST': 'shooting', 'CAM': 'passing', 'LW': 'dribbling', 'RW': 'dribbling', 'CB': 'defending', 'GK': 'defending' };
    const primaryAttr = primaryAttrBonus[player.position];
    if (primaryAttr && player.attributes[primaryAttr]) {
        weightedSum += player.attributes[primaryAttr] * 0.05;
    }
    return Math.min(99, Math.round(weightedSum));
}

function updateMarketValue(player, forceRecalculation = false) {
    // Atualiza o valor de mercado do jogador em BRL.
    // Garante que marketValue seja sempre um número em BRL após a inicialização.
    if (typeof player.marketValue === 'string') {
        player.marketValue = parseMarketValue(player.marketValue);
    }

    // Se já é um número e não for para forçar o recálculo, retorna.
    if (typeof player.marketValue === 'number' && player.marketValue > 0 && !forceRecalculation) {
        return;
    }

    // Calcula o valor base em BRL
    const baseValueBRL = (player.overall / 100) ** 3 * 5000000;

    let ageMultiplier = 1.0;
    if (player.age < 21) ageMultiplier = 1.3;
    else if (player.age >= 21 && player.age <= 28) ageMultiplier = 1.5 - ((player.age - 21) * 0.05);
    else if (player.age > 28 && player.age < 33) ageMultiplier = 1.1 - ((player.age - 28) * 0.1);
    else ageMultiplier = Math.max(0.1, 0.5 - ((player.age - 33) * 0.03));

    const positionMultiplier = (['ST', 'LW', 'RW', 'CAM'].includes(player.position)) ? 1.2 : 1.0;
    let finalValueBRL = baseValueBRL * ageMultiplier * positionMultiplier;

    // Arredonda para o milhar mais próximo e garante um mínimo.
    finalValueBRL = Math.max(15000, Math.round(finalValueBRL / 5000) * 5000);
    player.marketValue = finalValueBRL;
}


function generateNewPlayer(team) {
    // Gera um novo jogador aleatório para ser adicionado aos times ou como agente livre.
    const positions = ['GK', 'CB', 'RB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST'];
    const newPlayer = {
        name: `*Novo Talento ${Math.floor(Math.random() * 1000)}`,
        position: positions[Math.floor(Math.random() * positions.length)],
        age: 17 + Math.floor(Math.random() * 4),
        attributes: {
            pace: 40 + Math.floor(Math.random() * 25),
            shooting: 40 + Math.floor(Math.random() * 25),
            passing: 40 + Math.floor(Math.random() * 25),
            dribbling: 40 + Math.floor(Math.random() * 25),
            defending: 40 + Math.floor(Math.random() * 25),
            physical: 40 + Math.floor(Math.random() * 25),
        },
        contractUntil: 36 + Math.floor(Math.random() * 25), // 3 a 5 anos de contrato
    };
    newPlayer.overall = calculatePlayerOverall(newPlayer);
    updateMarketValue(newPlayer);
    return newPlayer;
}

function getDevelopmentLogic(age) {
    // Retorna a função de desenvolvimento/declínio de atributos baseada na idade.
    if (age < 24) return () => (1 + Math.floor(Math.random() * 3)); // Melhora de 1 a 3 pontos
    if (age < 30) return () => Math.floor(Math.random() * 2); // Melhora de 0 a 1 ponto
    if (age < 33) return () => (Math.random() < 0.2) ? (Math.random() < 0.5 ? 1 : -1) : 0; // Estagna, com pequena chance de mudar
    // Lógica de declínio para jogadores mais velhos
    return (attr) => {
        let loss = Math.floor(Math.random() * 2); // Perde de 0 a 1 ponto
        // Se for um atributo físico e o jogador for muito velho, a perda é maior
        if ((attr === 'pace' || attr === 'physical') && age >= 35) {
            loss += Math.floor(Math.random() * 2); // Perde mais 0 ou 1 ponto
        }
        return -loss;
    };
}

function updatePlayerDevelopment() {
    // Processa o desenvolvimento (ou declínio) dos jogadores para a nova temporada.
    console.log("Processando desenvolvimento de jogadores para a nova temporada...");
    for (const leagueId in leaguesData) {
        for (const team of leaguesData[leagueId].teams) {
            const playersToRemove = [];
            const playersToAdd = [];
            for (const player of team.players) {
                const oldOverall = player.overall;

                player.age++;
                // Contratos são reduzidos ao final da temporada
                if (player.contractUntil) player.contractUntil -= 12;

                // Lógica de aposentadoria
                if (player.age >= 35 && Math.random() < (player.age - 34) / 10) { // Chance crescente de aposentadoria
                    playersToRemove.push(player.name);
                    playersToAdd.push(generateNewPlayer(team)); // Gera um substituto
                    addNews("Fim de uma Era", `${player.name} (${player.age} anos) do ${team.name} anunciou sua aposentadoria.`, team.name === gameState.userClub.name, team.name);
                    continue; // Pula para o próximo jogador
                }

                const devLogic = getDevelopmentLogic(player.age);
                const attributeChanges = {};
                if (player.attributes) {
                    Object.keys(player.attributes).forEach(attr => {
                        const change = devLogic(attr);
                        if (change !== 0) {
                             attributeChanges[attr] = change;
                        }
                        player.attributes[attr] = Math.min(99, Math.max(20, player.attributes[attr] + change));
                    });
                    player.overall = calculatePlayerOverall(player);
                }
                updateMarketValue(player, true); // Força recálculo do valor de mercado

                // Armazena as mudanças para a UI de desenvolvimento
                player.lastSeasonChanges = {
                    overallChange: player.overall - oldOverall,
                    attributeChanges: attributeChanges
                };
            }
            team.players = team.players.filter(p => !playersToRemove.includes(p.name));
            team.players.push(...playersToAdd);
        }
    }
}

// --- Funções de Progressão de Jogo (Dia, Mês, Temporada) ---
function advanceDay() {
    // Avança um dia no jogo, processando eventos diários e mensais.
    const today = new Date(gameState.currentDate);

    // Checa fim do ano para transição de temporada
    if (today.getMonth() === 11 && today.getDate() === 31) {
        handleEndOfSeason();
        const nextDay = new Date(today);
        nextDay.setDate(nextDay.getDate() + 1); // Passa para 1 de Janeiro
        gameState.currentDate = nextDay;
        triggerNewSeason(); // Inicia nova temporada e processa promoções/rebaixamentos
        return;
    }

    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);
    gameState.currentDate = nextDay;

    // Lógicas mensais (executadas no primeiro dia de cada mês)
    if (today.getDate() === 1) {
        updateMonthlyContracts();
        addTransaction(-gameState.clubFinances.fixedMonthlyExpenses, "Despesas Operacionais Fixas"); // Nova despesa fixa
        if (gameState.clubSponsor) {
            addTransaction(gameState.clubSponsor.monthlyIncome, `Receita de Patrocínio (${gameState.clubSponsor.name})`);
        }
        handleExpiredContracts();
        aiContractManagement();
        aiTransferLogic();
        checkExpiringContracts();
    }

    simulateDayMatches(); // Simula todas as partidas do dia
    checkSeasonEvents(); // Verifica eventos de liga (fases da Série C)
    findNextUserMatch(); // Atualiza o próximo jogo do usuário
    Object.keys(leaguesData).forEach(id => updateLeagueTable(id)); // Atualiza as tabelas das ligas
    updateContinueButton(); // Atualiza o botão de avançar dia
    if (gameState.currentMainContent === 'calendar-content') updateCalendar(); // Se estiver no calendário, atualiza
    if (gameState.currentMainContent === 'finances-content') displayFinances(); // Se estiver em finanças, atualiza
    if (gameState.currentMainContent === 'tickets-content') displayTicketsScreen(); // Se estiver em ingressos, atualiza
}

function updateMonthlyContracts() {
    // Paga os salários mensais dos jogadores do time do usuário e reduz os meses de contrato.
    let totalWages = 0;
    const userPlayers = gameState.userClub.players;
    for (const player of userPlayers) {
        if (player.contractUntil && player.contractUntil > 0) {
            player.contractUntil--;
            totalWages += calculatePlayerWage(player);
        }
    }
    if (totalWages > 0) {
        addTransaction(-totalWages, "Salários mensais dos jogadores");
    }

    // Reduz contratos dos jogadores de outros times (não afeta as finanças do usuário).
    for (const leagueId in leaguesData) {
        for (const team of leaguesData[leagueId].teams) {
            if (team.name === gameState.userClub.name) continue; // Já lidado acima
            for (const player of team.players) {
                if (player.contractUntil && player.contractUntil > 0) {
                    player.contractUntil--;
                }
            }
        }
    }
}

function simulateDayMatches() {
    // Simula todas as partidas agendadas para o dia atual.
    const todayMatches = gameState.allMatches.filter(match => isSameDay(new Date(match.date), gameState.currentDate));
    for (const match of todayMatches) {
        if (match.status === 'scheduled') {
            const isUserMatch = match.home.name === gameState.userClub.name || match.away.name === gameState.userClub.name;
            if (isUserMatch && !gameState.isOnHoliday) {
                // Se for um jogo do usuário e não estiver de férias, pula para ser jogado manualmente
                continue;
            }
            simulateSingleMatch(match, isUserMatch); // Simula o jogo
            // Atualiza a tabela da liga apenas para jogos de liga (não amistosos)
            if (match.round !== 'Amistoso') {
                const leagueId = Object.keys(leaguesData).find(id => leaguesData[id].teams.some(t => t.name === match.home.name));
                updateTableWithResult(leagueId, match);
            }
        }
    }
}

function simulateSingleMatch(match, isUserMatch) {
    // Simula o resultado de uma única partida (não visual).
    const homeTeamData = findTeamInLeagues(match.home.name);
    const awayTeamData = findTeamInLeagues(match.away.name);
    let homeStrength, awayStrength;

    // Calcula a força do time, considerando escalação e táticas do usuário se for o caso
    if (isUserMatch && match.home.name === gameState.userClub.name) {
        homeStrength = getTeamStrength(homeTeamData, true);
        awayStrength = getTeamStrength(awayTeamData, false);
    } else if (isUserMatch && match.away.name === gameState.userClub.name) {
        homeStrength = getTeamStrength(homeTeamData, false);
        awayStrength = getTeamStrength(awayTeamData, true);
    } else {
        homeStrength = getTeamStrength(homeTeamData, false);
        awayStrength = getTeamStrength(awayTeamData, false);
    }

    homeStrength *= 1.1; // Bônus de mando de campo

    if (homeStrength <= 0 && awayStrength <= 0) {
        match.homeScore = 0;
        match.awayScore = 0;
        match.status = 'played';
        if (isUserMatch && match.round === 'Amistoso') showFriendlyResultModal(match);
        return;
    }

    // Lógica de simulação de gols baseada na força dos times
    const averageGoalsPerMatch = 2.7;
    const totalStrength = homeStrength + awayStrength;

    let homeExpectedGoals = (homeStrength / totalStrength) * averageGoalsPerMatch;
    let awayExpectedGoals = (awayStrength / totalStrength) * averageGoalsPerMatch;

    // Adiciona aleatoriedade aos gols esperados
    homeExpectedGoals *= (0.7 + Math.random() * 0.7);
    awayExpectedGoals *= (0.7 + Math.random() * 0.7);

    let homeScore = 0;
    let awayScore = 0;
    for (let minute = 0; minute < 90; minute++) {
        if (Math.random() < homeExpectedGoals / 90) { // Chance de gol por minuto
            homeScore++;
        }
        if (Math.random() < awayExpectedGoals / 90) {
            awayScore++;
        }
    }

    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.status = 'played';

    // Se for uma partida em casa do usuário, calcula a receita de ingressos
    if (isUserMatch && match.home.name === gameState.userClub.name && match.round !== 'Amistoso') {
        const { probableAttendance, revenue } = calculateTicketRevenue();
        addTransaction(revenue, `Receita de Ingressos (vs ${match.away.name}) - ${probableAttendance} torcedores`);
    }

    if (isUserMatch && match.round === 'Amistoso') {
        showFriendlyResultModal(match);
    }
}

function getTeamStrength(teamData, isUser) {
    // Calcula a força geral de um time, considerando táticas e escalação se for o usuário.
    let strength = 0;
    if (isUser) {
        const startingXI = Object.values(gameState.squadManagement.startingXI);
        // Garante que haja 11 jogadores e que todos sejam objetos válidos
        if (startingXI.length === 11 && startingXI.every(p => p && p.overall)) {
            strength = startingXI.reduce((acc, player) => acc + calculateModifiedOverall(player, Object.keys(gameState.squadManagement.startingXI).find(pos => gameState.squadManagement.startingXI[pos].name === player.name)), 0) / 11;
            // Aplica modificadores de tática
            switch (gameState.tactics.mentality) {
                case 'very_attacking': strength *= 1.05; break;
                case 'attacking': strength *= 1.02; break;
                case 'defensive': strength *= 0.98; break;
                case 'very_defensive': strength *= 0.95; break;
            }
        } else {
            // Se a escalação estiver incompleta ou inválida, usa os 11 melhores jogadores por overall
            strength = teamData.players.sort((a,b)=>b.overall-a.overall).slice(0, 11).reduce((acc, p) => acc + p.overall, 0) / 11;
        }
    } else {
        // Para times da IA, usa os 11 melhores jogadores por overall
        strength = teamData.players.sort((a,b)=>b.overall-a.overall).slice(0, 11).reduce((acc, p) => acc + p.overall, 0) / 11;
    }
    return strength;
}

function findNextUserMatch() {
    // Encontra a próxima partida do time do usuário que ainda não foi jogada.
    gameState.nextUserMatch = gameState.allMatches
        .filter(m => m.status === 'scheduled' && (m.home.name === gameState.userClub.name || m.away.name === gameState.userClub.name) && new Date(m.date) >= gameState.currentDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
}

// --- Funções de Tabelas e Ligas ---
function initializeLeagueTable(teams) {
    // Cria uma tabela de liga vazia para os times fornecidos.
    return teams.map(team => ({
        name: team.name, logo: team.logo, played: 0, wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
    }));
}

function updateTableWithResult(leagueId, match) {
    // Atualiza a tabela da liga com o resultado de uma partida.
    if (!leagueId || !gameState.leagueStates[leagueId] || match.round === 'Amistoso') return;
    const leagueState = gameState.leagueStates[leagueId];
    let tableToUpdate;
    // Lógica específica para a Série C fase 2 (grupos)
    if (leagueId === 'brasileirao_c' && leagueState.serieCState.phase > 1) {
        tableToUpdate = leagueState.table.filter(t => leagueState.serieCState.groups.A.includes(t.name) || leagueState.serieCState.groups.B.includes(t.name));
    } else {
        tableToUpdate = leagueState.table;
    }

    const homeTeam = tableToUpdate.find(t => t.name === match.home.name);
    const awayTeam = tableToUpdate.find(t => t.name === match.away.name);
    if (!homeTeam || !awayTeam) return;

    homeTeam.played++; awayTeam.played++;
    homeTeam.goalsFor += match.homeScore; homeTeam.goalsAgainst += match.awayScore;
    awayTeam.goalsFor += match.awayScore; awayTeam.goalsAgainst += match.homeScore;
    homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
    awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;

    if (match.homeScore > match.awayScore) { homeTeam.wins++; homeTeam.points += 3; awayTeam.losses++; }
    else if (match.awayScore > match.homeScore) { awayTeam.wins++; awayTeam.points += 3; homeTeam.losses++; }
    else { homeTeam.draws++; awayTeam.draws++; homeTeam.points += 1; awayTeam.points += 1; }
}

// --- Funções de Calendário, Jogo e Agendamento ---
function generateSchedule(teams, leagueInfo, startDate, roundOffset = 0, phase = undefined) {
    // Gera a tabela de jogos para uma liga.
    let currentMatchDate = new Date(startDate);
    let clubes = [...teams];
    if (clubes.length % 2 !== 0) {
        clubes.push({ name: "BYE", logo: "logo_default.png" });
    }
    const numTeams = clubes.length;
    const isSerieCPhase1 = phase === 1;
    const matchesPerRound = numTeams / 2;
    let allMatches = [];

    // Gerar jogos de ida e volta (ou apenas ida para Série C Fase 1)
    for (let turn = 0; turn < (isSerieCPhase1 ? 1 : 2); turn++) {
        let tempClubes = [...clubes];
        for (let r = 0; r < numTeams - 1; r++) { // Rodadas
            for (let i = 0; i < matchesPerRound; i++) { // Jogos por rodada
                const home = turn === 0 ? tempClubes[i] : tempClubes[numTeams - 1 - i];
                const away = turn === 0 ? tempClubes[numTeams - 1 - i] : tempClubes[i];
                if(home.name !== "BYE" && away.name !== "BYE") {
                    allMatches.push({home, away});
                }
            }
            // Rotação dos times para a próxima rodada (algoritmo de Round-Robin)
            tempClubes.splice(1, 0, tempClubes.pop());
        }
    }

    const schedule = [];
    for (let i = 0; i < allMatches.length; i++) {
        if (i > 0 && i % matchesPerRound === 0) {
            // Avança a data para a próxima rodada
            const gamesPerWeek = leagueInfo.gamesPerWeek || 1;
            const daysToAdd = gamesPerWeek === 2 ? (currentMatchDate.getDay() < 4 ? 3 : 4) : 7; // Ajusta para jogos no meio de semana
            currentMatchDate.setDate(currentMatchDate.getDate() + daysToAdd);
        }
        schedule.push({ ...allMatches[i], date: new Date(currentMatchDate).toISOString(), status: 'scheduled', round: Math.floor(i / matchesPerRound) + 1 + roundOffset });
    }
    return schedule;
}

function isDateAvailableForTeam(date, teamName) {
    // Verifica se um time já tem um jogo agendado em uma determinada data.
    return !gameState.allMatches.some(match =>
        (match.home.name === teamName || match.away.name === teamName) &&
        isSameDay(new Date(match.date), date)
    );
}

// --- Lógica de Fim de Temporada, Promoção e Rebaixamento ---
function triggerNewSeason() {
    // Aciona o início de uma nova temporada.
    gameState.season++;
    processPromotionRelegation(); // Processa as mudanças de divisão
    initializeSeason(); // Reinicializa a temporada com os novos times nas ligas
}

function checkSeasonEvents() {
    // Verifica e aciona eventos específicos da temporada (ex: fases da Série C).
    if (gameState.isOffSeason) return;

    // Lógica para Série C (fases)
    if (leaguesData.brasileirao_c.teams.some(t => t.name === gameState.userClub.name) || gameState.currentLeagueId === 'brasileirao_c') {
        const leagueState = gameState.leagueStates['brasileirao_c'];
        // Verifica o fim da Fase 1
        const phase1Matches = leagueState.schedule.filter(m => m.round <= 19);
        if (phase1Matches.every(m => m.status === 'played') && leagueState.serieCState.phase === 1) {
            handleEndOfSerieCFirstPhase();
            return;
        }
        // Verifica o fim da Fase 2 (quadrangular)
        const phase2Matches = leagueState.schedule.filter(m => m.round > 19 && m.round <= 25);
        if (phase2Matches.every(m => m.status === 'played') && leagueState.serieCState.phase === 2) {
            handleEndOfSerieCSecondPhase();
            return;
        }
    }
}

function handleEndOfSerieCFirstPhase() {
    // Processa o fim da primeira fase da Série C, definindo os grupos da segunda fase.
    const leagueState = gameState.leagueStates['brasileirao_c'];
    if (leagueState.serieCState.phase !== 1) return;
    leagueState.serieCState.phase = 2; // Avança para a fase 2

    const fullTable = getFullFirstPhaseTableC();
    const qualified = fullTable.slice(0, 8); // Os 8 primeiros se classificam

    // Define os grupos da segunda fase (exemplo de distribuição)
    const groupA_teams = [qualified[0], qualified[3], qualified[4], qualified[7]];
    const groupB_teams = [qualified[1], qualified[2], qualified[5], qualified[6]];

    leagueState.serieCState.groups.A = groupA_teams.map(t => t.name);
    leagueState.serieCState.groups.B = groupB_teams.map(t => t.name);

    const groupA_data = groupA_teams.map(t => findTeamInLeagues(t.name));
    const groupB_data = groupB_teams.map(t => findTeamInLeagues(t.name));

    const lastRoundPhase1 = 19;
    // Encontra a data do último jogo da fase 1 para iniciar a fase 2
    const lastMatchDate = new Date(Math.max(...leagueState.schedule.filter(m => m.round <= lastRoundPhase1).map(m => new Date(m.date))));
    const scheduleStartDate = new Date(lastMatchDate);
    scheduleStartDate.setDate(scheduleStartDate.getDate() + 7); // Começa uma semana depois

    // Gera os novos horários para a segunda fase (ida e volta dentro dos grupos)
    const scheduleA = generateSchedule(groupA_data, leaguesData.brasileirao_c.leagueInfo, scheduleStartDate, lastRoundPhase1);
    const scheduleB = generateSchedule(groupB_data, leaguesData.brasileirao_c.leagueInfo, scheduleStartDate, lastRoundPhase1);

    leagueState.schedule.push(...scheduleA, ...scheduleB); // Adiciona ao schedule geral
    gameState.allMatches.push(...scheduleA, ...scheduleB);
    gameState.allMatches.sort((a, b) => new Date(a.date) - new Date(b.date)); // Reordena todos os jogos

    leagueState.table = initializeLeagueTable([...groupA_data, ...groupB_data]); // Reinicia a tabela para a fase 2 apenas com os classificados
    findNextUserMatch();
    updateLeagueTable('brasileirao_c'); // Força atualização da UI

    const qualifiedNames = qualified.map(t => t.name).join(', ');
    const isUserTeamQualified = qualified.some(t => t.name === gameState.userClub.name);
    addNews("Definidos os classificados na Série C!", `Os 8 times que avançam para a segunda fase são: ${qualifiedNames}.`, isUserTeamQualified, qualified[0].name);
}

function handleEndOfSerieCSecondPhase() {
    // Processa o fim da segunda fase da Série C, definindo finalistas e promovidos.
    const leagueState = gameState.leagueStates['brasileirao_c'];
    if (leagueState.serieCState.phase !== 2) return;
    leagueState.serieCState.phase = 3; // Avança para a fase 3 (final)

    const tiebreakers = leaguesData.brasileirao_c.leagueInfo.tiebreakers;
    // Pega as tabelas finais dos grupos da segunda fase e as ordena
    const groupA_table = leagueState.table.filter(t => leagueState.serieCState.groups.A.includes(t.name)).sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; });
    const groupB_table = leagueState.table.filter(t => leagueState.serieCState.groups.B.includes(t.name)).sort((a, b) => { for (const key of tiebreakers) { if (a[key] > b[key]) return -1; if (a[key] < b[key]) return 1; } return 0; });

    const finalists = [groupA_table[0], groupB_table[0]]; // Campeões de cada grupo vão para a final
    leagueState.serieCState.finalists = finalists.map(t => t.name);

    const promoted = [groupA_table[0], groupA_table[1], groupB_table[0], groupB_table[1]]; // Os 2 primeiros de cada grupo sobem
    const promotedNames = promoted.map(t => t.name).join(', ');
    addNews("Acesso à Série B!", `Parabéns a ${promotedNames} pelo acesso à Série B!`, promoted.some(t => t.name === gameState.userClub.name), promoted[0].name);

    const finalistData = finalists.map(t => findTeamInLeagues(t.name));
    const lastRoundPhase2 = 25;
    const lastMatchDate = new Date(Math.max(...leagueState.schedule.filter(m => m.round > 19 && m.round <= lastRoundPhase2).map(m => new Date(m.date))));
    const finalStartDate = new Date(lastMatchDate);
    finalStartDate.setDate(finalStartDate.getDate() + 7);

    // Gera os jogos da final (ida e volta)
    const finalMatches = [
        { home: finalistData[0], away: finalistData[1], date: new Date(finalStartDate).toISOString(), status: 'scheduled', round: 26 },
        { home: finalistData[1], away: finalistData[0], date: new Date(new Date(finalStartDate).setDate(finalStartDate.getDate() + 7)).toISOString(), status: 'scheduled', round: 27 }
    ];
    leagueState.schedule.push(...finalMatches);
    gameState.allMatches.push(...finalMatches);
    gameState.allMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
    findNextUserMatch();
    addNews(`Final da Série C: ${finalists[0].name} x ${finalists[1].name}!`, "Os campeões de cada grupo disputam o título.", finalists.some(t => t.name === gameState.userClub.name), finalists[0].name);
}


function handleEndOfSeason() {
    // Gerencia os eventos que ocorrem no final do ano de jogo.
    if (gameState.isOnHoliday) stopHoliday(); // Interrompe férias se houver
    if(gameState.isOffSeason) return; // Evita executar múltiplas vezes

    awardPrizeMoney(); // Distribui o dinheiro de premiação
    gameState.isOffSeason = true; // Entra em período de entressafra
    gameState.nextUserMatch = null; // Zera o próximo jogo do usuário

    // Notícias sobre os campeões de cada liga
    const tableA = getFullSeasonTable('brasileirao_a');
    if (tableA && tableA.length > 0) { const championA = tableA[0]; addNews(`${championA.name} é o campeão do Brasileirão Série A!`, ``, championA.name === gameState.userClub.name, championA.name); }
    const tableB = getFullSeasonTable('brasileirao_b');
    if (tableB && tableB.length > 0) { const championB = tableB[0]; addNews(`${championB.name} é o campeão da Série B!`, ``, championB.name === gameState.userClub.name, championB.name); }
    const scheduleC = gameState.leagueStates['brasileirao_c'].schedule;
    const finalMatch1 = scheduleC.find(m => m.round === 26);
    const finalMatch2 = scheduleC.find(m => m.round === 27);
    if (finalMatch1 && finalMatch2 && finalMatch1.status === 'played' && finalMatch2.status === 'played') {
        const score1 = finalMatch1.homeScore + finalMatch2.awayScore;
        const score2 = finalMatch1.awayScore + finalMatch2.homeScore;
        const champC = score1 >= score2 ? findTeamInLeagues(finalMatch1.home.name) : findTeamInLeagues(finalMatch1.away.name);
        addNews(`${champC.name} é o grande campeão da Série C!`, ``, champC.name === gameState.userClub.name, champC.name);
    }
    showInfoModal("Fim de Temporada!", "A temporada chegou ao fim! Avance os dias até 1 de Janeiro para processar as promoções/rebaixamentos e iniciar a nova temporada.");
    updateContinueButton();
}

function awardPrizeMoney() {
    // Calcula e adiciona o dinheiro de premiação ao clube do usuário.
    const userClubName = gameState.userClub.name;
    const userLeagueId = gameState.currentLeagueId;
    const leagueState = gameState.leagueStates[userLeagueId];

    if (!leagueState) return;

    if (userLeagueId === 'brasileirao_a') {
        const table = getFullSeasonTable('brasileirao_a');
        const userTeamRow = table.find(t => t.name === userClubName);
        if (!userTeamRow) return;
        const position = table.indexOf(userTeamRow) + 1;
        if (prizeMoney.brasileirao_a[position]) {
            const amount = prizeMoney.brasileirao_a[position] * 1000000;
            addTransaction(amount, `Premiação (${position}º lugar) - Série A`);
        }
    } else if (userLeagueId === 'brasileirao_b') {
        const table = getFullSeasonTable('brasileirao_b');
        const userTeamRow = table.find(t => t.name === userClubName);
        if (!userTeamRow) return;
        const position = table.indexOf(userTeamRow) + 1;
        // Premiação apenas para os 4 primeiros (acesso)
        if (position <= 4 && prizeMoney.brasileirao_b[position]) {
            const amount = prizeMoney.brasileirao_b[position] * 1000000;
            addTransaction(amount, `Premiação (Acesso) - Série B`);
        }
    } else if (userLeagueId === 'brasileirao_c') {
        addTransaction(prizeMoney.brasileirao_c.participation_fee * 1000000, `Cota de participação - Série C`);
        const qualifiedForPhase2 = [...leagueState.serieCState.groups.A, ...leagueState.serieCState.groups.B];
        if (qualifiedForPhase2.includes(userClubName)) {
            addTransaction(prizeMoney.brasileirao_c.advancement_bonus * 1000000, `Bônus por avanço de fase - Série C`);
        }
    }
}

function processPromotionRelegation() {
    // Processa as promoções e rebaixamentos entre as ligas ao final da temporada.
    updatePlayerDevelopment(); // Primeiro, atualiza o desenvolvimento dos jogadores

    // Rebaixados da Série A (os 4 últimos)
    const tableA = getFullSeasonTable('brasileirao_a');
    const relegatedFromA = tableA.slice(-4).map(t => findTeamInLeagues(t.name)).filter(Boolean);

    // Promovidos da Série B (os 4 primeiros) e Rebaixados da Série B (os 4 últimos)
    const tableB = getFullSeasonTable('brasileirao_b');
    const promotedFromB = tableB.slice(0, 4).map(t => findTeamInLeagues(t.name)).filter(Boolean);
    const relegatedFromB = tableB.slice(-4).map(t => findTeamInLeagues(t.name)).filter(Boolean);

    // Promovidos da Série C (os 4 finalistas) e Rebaixados da Série C (os 4 últimos da fase 1)
    const leagueStateC = gameState.leagueStates['brasileirao_c'];
    const tiebreakersC = leaguesData.brasileirao_c.leagueInfo.tiebreakers;
    const groupA = leagueStateC.table.filter(t => leagueStateC.serieCState.groups.A.includes(t.name)).sort((a, b) => { for (const k of tiebreakersC) { if (a[k] > b[k]) return -1; if (a[k] < b[k]) return 1; } return 0; });
    const groupB = leagueStateC.table.filter(t => leagueStateC.serieCState.groups.B.includes(t.name)).sort((a, b) => { for (const k of tiebreakersC) { if (a[k] > b[k]) return -1; if (a[k] < b[k]) return 1; } return 0; });
    const promotedFromC = [...groupA.slice(0, 2), ...groupB.slice(0, 2)].map(t => findTeamInLeagues(t.name)).filter(Boolean); // Os 2 melhores de cada grupo na fase 2 sobem

    const tableCFirstPhase = getFullFirstPhaseTableC(); // Rebaixados são da primeira fase da Série C
    const relegatedFromC = tableCFirstPhase.slice(-4).map(t => findTeamInLeagues(t.name)).filter(Boolean);

    // Times que sobem da Série D para a Série C (exemplo de times genéricos)
    const promotedFromD = [
        { name: "Sampaio Corrêa", logo: "logo_sampaio_correa.png" },
        { name: "ASA", logo: "logo_asa.png" },
        { name: "Treze", logo: "logo_treze.png" },
        { name: "América-RN", logo: "logo_america_rn.png" }
    ];
    // Garante que os novos times tenham jogadores gerados e inicializados
    promotedFromD.forEach(team => {
        team.players = [];
        for (let i = 0; i < 22; i++) { team.players.push(generateNewPlayer(team)); }
        initializeAllPlayerDataForTeam(team);
    });

    // Atualiza os times em cada liga
    leaguesData.brasileirao_a.teams = leaguesData.brasileirao_a.teams.filter(t => !relegatedFromA.some(r => r.name === t.name)).concat(promotedFromB);
    leaguesData.brasileirao_b.teams = leaguesData.brasileirao_b.teams.filter(t => !promotedFromB.some(p => p.name === t.name) && !relegatedFromB.some(r => r.name === t.name)).concat(relegatedFromA).concat(promotedFromC);
    leaguesData.brasileirao_c.teams = leaguesData.brasileirao_c.teams.filter(t => !promotedFromC.some(p => p.name === t.name) && !relegatedFromC.some(r => r.name === t.name)).concat(relegatedFromB).concat(promotedFromD);

    // Atualiza a liga atual do time do usuário
    const userClubName = gameState.userClub.name;
    if (leaguesData.brasileirao_a.teams.some(t => t.name === userClubName)) {
        gameState.currentLeagueId = 'brasileirao_a';
    } else if (leaguesData.brasileirao_b.teams.some(t => t.name === userClubName)) {
        gameState.currentLeagueId = 'brasileirao_b';
    } else {
        gameState.currentLeagueId = 'brasileirao_c';
    }

    // Recalcula as despesas fixas para a nova liga
    calculateFixedMonthlyExpenses();
    // Reatribui patrocinadores com base nas novas ligas
    assignSponsors();
}

function getFullSeasonTable(leagueId) {
    // Retorna a tabela final de uma liga após todas as partidas da temporada.
    if (!leaguesData[leagueId]) return [];
    const fullTable = initializeLeagueTable(leaguesData[leagueId].teams);
    if (!gameState.leagueStates[leagueId]) return fullTable; // Não há estado de liga para calcular

    const matches = gameState.leagueStates[leagueId].schedule.filter(m => m.status === 'played');
    for (const match of matches) {
        const homeTeam = fullTable.find(t => t.name === match.home.name);
        const awayTeam = fullTable.find(t => t.name === match.away.name);
        if (!homeTeam || !awayTeam) continue; // Garante que os times existam na tabela

        homeTeam.played++; awayTeam.played++;
        homeTeam.goalsFor += match.homeScore; homeTeam.goalsAgainst += match.awayScore;
        awayTeam.goalsFor += match.awayScore; awayTeam.goalsAgainst += match.homeScore;
        homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
        awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;

        if (match.homeScore > match.awayScore) { homeTeam.wins++; homeTeam.points += 3; awayTeam.losses++; }
        else if (match.awayScore > match.homeScore) { awayTeam.wins++; awayTeam.points += 3; homeTeam.losses++; }
        else { homeTeam.draws++; awayTeam.draws++; homeTeam.points += 1; awayTeam.points += 1; }
    }
    // Ordena a tabela com base nos critérios de desempate da liga
    return fullTable.sort((a, b) => {
        for (const key of leaguesData[leagueId].leagueInfo.tiebreakers) {
            if (a[key] > b[key]) return -1;
            if (a[key] < b[key]) return 1;
        }
        return 0;
    });
}

function getFullFirstPhaseTableC() {
    // Retorna a tabela da Série C após a primeira fase (rodada 19).
    const leagueId = 'brasileirao_c';
    const allTeamsInC = leaguesData[leagueId].teams;
    const fullTable = initializeLeagueTable(allTeamsInC);
    const matches = gameState.leagueStates[leagueId].schedule.filter(m => m.status === 'played' && m.round <= 19);

    for (const match of matches) {
        const homeTeam = fullTable.find(t => t.name === match.home.name);
        const awayTeam = fullTable.find(t => t.name === match.away.name);
        if (!homeTeam || !awayTeam) continue;
        homeTeam.played++;
        awayTeam.played++;
        homeTeam.goalsFor += match.homeScore;
        homeTeam.goalsAgainst += match.awayScore;
        awayTeam.goalsFor += match.awayScore;
        awayTeam.goalsAgainst += match.homeScore;
        homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
        awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;

        if (match.homeScore > match.awayScore) {
            homeTeam.wins++;
            homeTeam.points += 3;
            awayTeam.losses++;
        } else if (match.awayScore > match.homeScore) {
            awayTeam.wins++;
            awayTeam.points += 3;
            homeTeam.losses++;
        } else {
            homeTeam.draws++;
            awayTeam.draws++;
            homeTeam.points += 1;
            awayTeam.points += 1;
        }
    }
    // Ordena a tabela com base nos critérios de desempate da Série C
    return fullTable.sort((a, b) => {
        for (const key of leaguesData[leagueId].leagueInfo.tiebreakers) {
            if (a[key] > b[key]) return -1;
            if (a[key] < b[key]) return 1;
        }
        return 0;
    });
}

// --- Funções de Contratos e Mercado de Transferências (IA e Jogador) ---

function calculatePlayerWage(player) {
    // Calcula o salário mensal do jogador com base no valor de mercado e overall.
    const wageFactor = 0.0020;
    let monthlyWage = player.marketValue * wageFactor; // Baseado no valor de mercado

    let overallMultiplier = 1.0;
    if (player.overall > 85) {
        overallMultiplier = 1.5;
    } else if (player.overall > 80) {
        overallMultiplier = 1.2;
    }

    // Garante um salário mínimo e arredonda para o milhar mais próximo.
    return Math.max(5000, Math.round((monthlyWage * overallMultiplier) / 1000) * 1000);
}


function calculateNegotiationCost(player, isRenewal) {
    // Calcula o custo total de uma negociação (luvas/taxas) para contratação ou renovação.
    let costFactor;

    if (isRenewal) {
        costFactor = 0.15; // Custo de renovação é menor
        if (player.age > 30) {
            costFactor -= 0.05;
        }
    } else {
        costFactor = 0.50; // Custo de contratação é maior
        if (player.age < 24) {
            costFactor += 0.15; // Mais caro para jovens promessas
        }
        if (player.overall > 80) {
            costFactor += 0.20; // Mais caro para jogadores de alto overall
        }
    }

    let reputationMultiplier = 1.0;
    if (player.overall >= 90) {
        reputationMultiplier = 2.5;
    } else if (player.overall >= 85) {
        reputationMultiplier = 1.75;
    }

    const finalCost = player.marketValue * Math.max(0.05, costFactor) * reputationMultiplier;

    return Math.round(finalCost / 10000) * 10000; // Arredonda para o décimo de milhar mais próximo
}

function aiTransferLogic() {
    // Lógica para a IA de outros times contratar e liberar jogadores.
    if (gameState.isOffSeason) return; // IA só contrata durante a temporada por enquanto

    for (const leagueId in leaguesData) {
        for (const team of leaguesData[leagueId].teams) {
            if (team.name === gameState.userClub.name) continue; // Pula o time do usuário
            // Chance de 10% por mês de o time tentar contratar
            if (Math.random() > 0.10) continue;

            const teamOverallAvg = team.players.reduce((sum, p) => sum + p.overall, 0) / team.players.length;
            const teamReputation = (teamOverallAvg / 85) * (leagueId === 'brasileirao_a' ? 3 : (leagueId === 'brasileirao_b' ? 2 : 1));

            // Encontra o jogador mais fraco no elenco para substituir
            const weakestPlayer = [...team.players].sort((a, b) => a.overall - b.overall)[0];
            if (!weakestPlayer) continue;

            // Busca um agente livre melhor para a mesma posição
            const potentialSignings = gameState.freeAgents
                .filter(p => p.position === weakestPlayer.position && p.overall > weakestPlayer.overall + 2) // Busca jogadores significantemente melhores
                .sort((a, b) => b.overall - a.overall);

            if (potentialSignings.length > 0) {
                const targetPlayer = potentialSignings[0]; // Tenta o melhor disponível

                // Lógica de decisão: jogador aceita o time?
                const playerReputation = targetPlayer.overall / 80;
                const reputationDiff = teamReputation - playerReputation;
                // Chance baseada na reputação. Time mais forte tem mais chance de atrair jogador forte.
                const acceptanceChance = 0.5 + (reputationDiff * 0.5);

                if (Math.random() < acceptanceChance) {
                    // CONTRATADO!
                    team.players = team.players.filter(p => p.name !== weakestPlayer.name); // Remove o jogador fraco
                    team.players.push(targetPlayer); // Adiciona o novo jogador
                    gameState.freeAgents = gameState.freeAgents.filter(p => p.name !== targetPlayer.name); // Remove do agentes livres

                    // O jogador substituído vira um agente livre
                    weakestPlayer.contractUntil = 0;
                    gameState.freeAgents.push(weakestPlayer);

                    addNews("Transferência!", `${team.name} contrata o agente livre ${targetPlayer.name} para reforçar seu elenco.`, false, team.name);
                }
            }
        }
    }
}

function checkExpiringContracts() {
    // Verifica contratos do time do usuário que estão expirando e gera notícia.
    for (const player of gameState.userClub.players) {
        // Notifica quando faltam 2 meses
        if (player.contractUntil !== null && player.contractUntil <= 2 && player.contractUntil > 0 && !player.notifiedAboutContract) {
            showUserNewsModal("Contrato Expirando!", `${player.name} tem apenas ${player.contractUntil} mes${player.contractUntil > 1 ? 'es' : ''} restantes em seu contrato. Se não for renovado, ele sairá de graça ao final do vínculo.`);
            player.notifiedAboutContract = true; // Marca como notificado para não mostrar novamente
        }
    }
}

function handleExpiredContracts() {
    // Processa contratos expirados, liberando jogadores para agentes livres.
    for (const leagueId in leaguesData) {
        for (const team of leaguesData[leagueId].teams) {
            // Filtra jogadores com contrato <= 0 meses
            const expiredPlayers = team.players.filter(p => p.contractUntil !== null && p.contractUntil <= 0);
            if (expiredPlayers.length > 0) {
                // Remove do elenco do time
                team.players = team.players.filter(p => p.contractUntil === null || p.contractUntil > 0);
                for (const player of expiredPlayers) {
                    player.contractUntil = 0; // Garante que o status de contrato seja 0
                    updateMarketValue(player); // Recalcula valor de mercado como agente livre (pode cair)
                    gameState.freeAgents.push(player); // Adiciona à lista de agentes livres
                    if (team.name === gameState.userClub.name) {
                        showUserNewsModal("Contrato Encerrado", `O contrato de ${player.name} chegou ao fim. Ele deixou o clube e agora é um agente livre.`);
                    }
                }
            }
        }
    }
    // Se o time do usuário perdeu jogadores importantes da escalação, tenta reorganizar.
    if (gameState.userClub.players.some(p => p.contractUntil <= 0)) {
        setupInitialSquad();
    }
}

function aiContractManagement() {
    // Lógica da IA para renovar ou liberar contratos de seus jogadores.
    for (const leagueId in leaguesData) {
        for (const team of leaguesData[leagueId].teams) {
            if (team.name === gameState.userClub.name) continue; // Pula o time do usuário

            const teamOverallAvg = team.players.reduce((sum, p) => sum + p.overall, 0) / team.players.length;

            for (const player of team.players) {
                // Lógica de renovação (se faltam 6 meses ou menos)
                if (player.contractUntil !== null && player.contractUntil <= 6 && player.contractUntil > 0) {
                    const isImportant = player.overall > teamOverallAvg * 0.9; // Considera importante se acima de 90% da média do time
                    const isNotTooOld = player.age < 34; // Limite de idade para renovar por muito tempo
                    const shouldRenew = Math.random() < 0.75; // Chance de 75% de tentar renovar

                    if (isImportant && isNotTooOld && shouldRenew) {
                        const newDurationMonths = player.age < 30 ? 36 : 12; // Jovens por mais tempo, velhos por menos
                        player.contractUntil += newDurationMonths;
                    }
                }
                // Lógica de liberação (se o contrato ainda é longo, mas o jogador está mal ou velho)
                else if (player.contractUntil !== null && player.contractUntil > 12) {
                    const isUnderperforming = player.overall < (teamOverallAvg - 5); // Muito abaixo da média
                    const isOld = player.age > 33;
                    const shouldRelease = Math.random() < 0.05; // Pequena chance de liberar antecipadamente

                    if (isUnderperforming && isOld && shouldRelease) {
                         player.contractUntil = 0; // Força a expiração para virar agente livre
                    }
                }
            }
        }
    }
}

// --- Funções de Patrocínio ---
function assignSponsors() {
    // Atribui patrocinadores a todos os clubes com base na divisão.
    const divisionMap = { 'brasileirao_a': 1, 'brasileirao_b': 2, 'brasileirao_c': 3 };
    for (const leagueId in leaguesData) {
        const divisionNumber = divisionMap[leagueId];
        if (!divisionNumber) continue;

        for (const team of leaguesData[leagueId].teams) {
            // Filtra patrocinadores que aceitam a divisão atual do time ou divisões inferiores (número maior)
            const availableSponsors = sponsorsData.filter(s => divisionNumber <= s.minDivision);
            if (availableSponsors.length > 0) {
                // Escolhe um patrocinador aleatório dentre os disponíveis
                const randomSponsor = availableSponsors[Math.floor(Math.random() * availableSponsors.length)];
                team.sponsor = randomSponsor;
                if (team.name === gameState.userClub.name) {
                    gameState.clubSponsor = randomSponsor; // Atribui ao clube do usuário
                }
            } else {
                team.sponsor = null; // Sem patrocinador se não houver opções
                if (team.name === gameState.userClub.name) {
                    gameState.clubSponsor = null;
                }
            }
        }
    }
}


// --- Funções de Estádio e Ingressos (NOVO) ---
function getStadiumInfo() {
    // Retorna informações do estádio do time do usuário.
    const baseCapacity = STADIUM_BASE_CAPACITY[gameState.currentLeagueId] || 20000; // Capacidade base por liga
    // Por enquanto, capacidade fixa. No futuro, pode ser personalizada ou baseada em dados reais.
    return {
        name: `${gameState.userClub.name} Stadium`, // Nome genérico por enquanto
        capacity: baseCapacity
    };
}

function calculateProbableAttendance(ticketPrice) {
    // Calcula a provável quantidade de torcedores com base em vários fatores, incluindo o preço do ingresso.
    const stadium = getStadiumInfo();
    let attendance = stadium.capacity * 0.7; // Começa com 70% da capacidade como base

    // Fator de desempenho do time (baseado na posição na tabela)
    const leagueTable = getFullSeasonTable(gameState.currentLeagueId);
    const userTeamRow = leagueTable.find(t => t.name === gameState.userClub.name);
    if (userTeamRow) {
        const totalTeams = leagueTable.length;
        const position = leagueTable.indexOf(userTeamRow) + 1;
        const performanceFactor = 1 - ((position - 1) / totalTeams); // 1.0 para 1º, 0.0 para último
        attendance *= (0.8 + performanceFactor * 0.4); // Varia de 0.8 a 1.2
    } else {
        attendance *= 1.0; // Se não estiver na tabela (ex: pré-temporada), usa fator neutro
    }

    // Fator do preço do ingresso: Quanto mais caro, menos torcedores.
    const baseTicketPriceForLeague = BASE_TICKET_PRICE[gameState.currentLeagueId] || 70;
    const priceRatio = ticketPrice / baseTicketPriceForLeague;

    if (priceRatio > 1.0) {
        // Penalidade por preço alto: 10% de queda a cada 10% de aumento no preço
        const pricePenalty = (priceRatio - 1.0) * 0.5; // Ex: 1.2 (20% mais caro) -> 0.1 de penalidade
        attendance *= Math.max(0.5, 1 - pricePenalty); // Máximo de 50% de queda
    } else if (priceRatio < 1.0) {
        // Bônus por preço baixo: 5% de aumento a cada 10% de redução no preço
        const priceBonus = (1.0 - priceRatio) * 0.25; // Ex: 0.8 (20% mais barato) -> 0.05 de bônus
        attendance *= Math.min(1.0, 1 + priceBonus); // Máximo de 100% (capacidade total)
    }

    // Aleatoriedade para simular flutuações
    attendance *= (0.9 + Math.random() * 0.2); // Varia de -10% a +10%

    return Math.max(500, Math.min(stadium.capacity, Math.round(attendance))); // Garante min 500 e max capacidade
}

function calculateTicketRevenue() {
    // Calcula a receita total de ingressos para uma partida.
    const probableAttendance = calculateProbableAttendance(gameState.userTicketPrice);
    const revenue = probableAttendance * gameState.userTicketPrice;
    return { probableAttendance, revenue };
}
