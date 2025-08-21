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
            // Se o valor inicial veio de uma string e era em EUR, converta para BRL para manter consistência
            // Verifica se a conversão de EUR para BRL faria sentido (valor alto em EUR que ficaria menor em BRL)
            // Um valor alto (ex: 1M) em EUR seria 6.42M em BRL. Se o parseMarketValue já retornou um valor em BRL assumindo M/K,
            // então não precisa converter de novo se for um número razoável.
            // A lógica aqui é garantir que todos os marketValue sejam BRL. Se a string era "1.2M", assume BRL, se era "€1.2M", converte.
            // Melhor: marketValue já é tratado para ser BRL dentro de parseMarketValue ou na sua importação de dados.
            // No updateMarketValue, ele é recalculado em BRL.
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
            simulateSingleMatch(match, isUserMatch);
            // Atualiza a tabela da liga apenas para jogos de liga (não amistosos)
            if (match.round !== 'Amistoso') {
                const leagueId = Object.keys(leaguesData).find(id => leaguesData[id].teams.some(t => t.name === match.home.name));
                updateTableWithResult(leagueId, match);
            }
        }
    }
}

function simulateSingleMatch(match, isUserMatch) {
    // Simula o resultado de uma única partida.
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

// #####################################################################
// #                                                                   #
// #                       NOVO MOTOR DE SIMULAÇÃO (PARTIDAS)          #
// #                                                                   #
// #####################################################################

let matchInterval; // Variável global para o intervalo da simulação de partida

function startMatchSimulationCore() {
    // Lógica interna para iniciar a simulação de partida (chamada por main.js).
    // Assume que gameState.nextUserMatch já foi definido e a UI de partida está ativa.
    const userTeam = gameState.userClub;
    const opponentTeam = gameState.nextUserMatch.home.name === userTeam.name ? gameState.nextUserMatch.away : gameState.nextUserMatch.home;
    const opponentSquad = setupOpponentSquad(opponentTeam); // IA escala o time adversário

    gameState.matchState = {
        home: gameState.nextUserMatch.home.name === userTeam.name
            ? { team: userTeam, ...gameState.squadManagement, formation: formationLayouts[gameState.tactics.formation], tactics: gameState.tactics }
            : { team: opponentTeam, ...opponentSquad, formation: formationLayouts[opponentSquad.formationKey], tactics: opponentSquad.tactics }, // Pega a formação da IA
        away: gameState.nextUserMatch.away.name === userTeam.name
            ? { team: userTeam, ...gameState.squadManagement, formation: formationLayouts[gameState.tactics.formation], tactics: gameState.tactics }
            : { team: opponentTeam, ...opponentSquad, formation: formationLayouts[opponentSquad.formationKey], tactics: opponentSquad.tactics },
        score: { home: 0, away: 0 },
        gameTime: 0,
        elapsedRealTime: 0,
        half: 1,
        playerPositions: new Map(), // Posições XY de cada jogador no campo
        playerRatings: new Map(), // Notas de cada jogador (in-match)
        playerIntents: new Map(), // Ação planejada para cada jogador (passar, chutar, etc.)
        aiDecisionTimer: 0, // Temporizador para decisões da IA
        lastPasser: null, // Último jogador a passar a bola
        possession: 'home', // Quem começa com a posse
        playState: 'kickoff', // Estado atual do jogo (jogando, tiro de meta, escanteio, etc.)
        stateTimer: 0, // Temporizador para estados de jogo (ex: tempo de comemoração de gol)
        ball: { y: 50, x: 50, targetY: 50, targetX: 50, speed: 0, owner: null } // Estado da bola
    };

    initializeMatchPlayers(); // Define posições iniciais dos jogadores
    updateScoreboard(); // Atualiza a UI do placar
    resizeCanvas(); // Ajusta o tamanho do canvas do campo
    setPlayState('kickoff'); // Inicia o jogo com o pontapé inicial

    // Inicia o loop principal do jogo
    matchInterval = setInterval(gameLoop, 50); // 20 frames por segundo

    // Atualiza as notas dos jogadores a cada 30 segundos reais
    setInterval(() => {
        if (gameState.isMatchLive && !gameState.isPaused) {
            updatePlayerRatings();
        }
    }, 30000);
}


function setupOpponentSquad(team) {
    // Monta a escalação e táticas de um time da IA.
    const todosJogadores = [...team.players].sort((a, b) => b.overall - a.overall);
    const startingXI = {};
    // Escolhe uma formação aleatória para a IA
    const formationKeys = Object.keys(formationLayouts);
    const formationKey = formationKeys[Math.floor(Math.random() * formationKeys.length)];
    const formation = formationLayouts[formationKey];
    const posicoesDaFormacao = Object.keys(formation);

    let jogadoresDisponiveis = [...todosJogadores];

    // Popula o time titular
    for (const posicao of posicoesDaFormacao) {
        const posicaoBase = posicao.replace(/\d/g, ''); // Ex: CB1 -> CB
        const bestPlayerForPos = jogadoresDisponiveis.find(p => p.position === posicaoBase);
        if (bestPlayerForPos) {
            startingXI[posicao] = bestPlayerForPos;
            jogadoresDisponiveis = jogadoresDisponiveis.filter(p => p.name !== bestPlayerForPos.name);
        } else if (jogadoresDisponiveis.length > 0) {
            // Se não houver jogador natural para a posição, pega o melhor disponível
            startingXI[posicao] = jogadoresDisponiveis.shift();
        }
    }
    // Preenche as vagas restantes do titular com os melhores disponíveis se não tiver 11
    while (Object.keys(startingXI).length < 11 && jogadoresDisponiveis.length > 0) {
        const availablePos = Object.keys(formation).find(pos => !startingXI[pos]);
        if (availablePos) {
             startingXI[availablePos] = jogadoresDisponiveis.shift();
        } else {
            break;
        }
    }

    const substitutes = jogadoresDisponiveis.splice(0, 7);
    const reserves = jogadoresDisponiveis;

    // Define táticas aleatórias para a IA
    const mentalityOptions = ['very_attacking', 'attacking', 'balanced', 'defensive', 'very_defensive'];
    const defensiveLineOptions = ['higher', 'standard', 'deeper'];
    const onPossessionLossOptions = ['counter_press', 'regroup'];
    const buildUpOptions = ['play_out_defence', 'pass_into_space', 'long_ball'];
    const attackingWidthOptions = ['narrow', 'normal', 'wide'];

    const tactics = {
        mentality: mentalityOptions[Math.floor(Math.random() * mentalityOptions.length)],
        defensiveLine: defensiveLineOptions[Math.floor(Math.random() * defensiveLineOptions.length)],
        onPossessionLoss: onPossessionLossOptions[Math.floor(Math.random() * onPossessionLossOptions.length)],
        buildUp: buildUpOptions[Math.floor(Math.random() * buildUpOptions.length)],
        attackingWidth: attackingWidthOptions[Math.floor(Math.random() * attackingWidthOptions.length)]
    };

    return { startingXI, substitutes, reserves, formationKey, tactics };
}

function initializeMatchPlayers() {
    // Configura as posições iniciais dos jogadores e notas para a simulação de partida.
    const { home, away } = gameState.matchState;
    const allPlayers = [...Object.values(home.startingXI), ...Object.values(away.startingXI)];

    allPlayers.forEach(player => {
        if (player) {
            gameState.matchState.playerRatings.set(player.name, 6.0); // Nota inicial
            gameState.matchState.playerPositions.set(player.name, { x: 50, y: 50 }); // Posição inicial (centro)
            gameState.matchState.playerIntents.set(player.name, { action: 'hold_position', target: null }); // Intenção inicial
        }
    });

    resetPlayersToKickoffPositions(); // Posiciona jogadores para o pontapé inicial
}

function gameLoop() {
    // O loop principal da simulação da partida.
    if (!gameState.isMatchLive) return; // Se o jogo não está ativo, para.

    const interval = 50; // Intervalo de 50ms (20 frames por segundo)

    if (!gameState.isPaused) {
        gameState.matchState.elapsedRealTime += interval;
        // Mapeia o tempo real para o tempo de jogo (90 minutos)
        gameState.matchState.gameTime = (gameState.matchState.elapsedRealTime / SIMULATION_DURATION_MS) * 90;
    }

    // Lida com temporizadores de estados de jogo (ex: celebração de gol)
    if (gameState.matchState.stateTimer > 0) {
        gameState.matchState.stateTimer -= interval;
    } else if (gameState.matchState.playState !== 'playing') {
        setPlayState('playing'); // Retorna ao estado de jogo normal
    }

    // Lógica de intervalo (fim do primeiro tempo)
    if (gameState.matchState.gameTime >= 45 && gameState.matchState.half === 1) {
        gameState.matchState.half = 2;
        gameState.matchState.gameTime = 45; // Garante que o tempo não passe de 45 durante o intervalo
        gameState.matchState.elapsedRealTime = SIMULATION_DURATION_MS / 2;
        document.getElementById('match-time-status').innerText = "INTERVALO";
        togglePause(true); // Pausa o jogo no intervalo
        setPlayState('kickoff'); // Reseta para pontapé inicial do segundo tempo
        return;
    }

    // Lógica de fim de jogo
    if (gameState.matchState.gameTime >= 90) {
        endMatch();
        return;
    }
    if (gameState.isPaused) return; // Se pausado, não atualiza a lógica do jogo.

    updateScoreboard(); // Atualiza o placar e relógio na UI

    if (gameState.matchState.playState === 'playing') {
        gameState.matchState.aiDecisionTimer -= interval;
        if (gameState.matchState.aiDecisionTimer <= 0) {
            updateAIIntents(); // IA toma decisões
            gameState.matchState.aiDecisionTimer = 1000 + Math.random() * 500; // Próxima decisão em 1 a 1.5 segundos
        }
    }

    executePlayerActions(); // Jogadores executam ações baseadas nas intenções
    movePlayers(); // Move os jogadores
    moveBall(); // Move a bola
    checkBallState(); // Verifica o estado da bola (fora, posse)
    drawMatch(); // Redesenha o campo e elementos
}

function updateAIIntents() {
    // Define as intenções de cada jogador (passar, chutar, pressionar, etc.).
    const { ball, playerIntents, home, away } = gameState.matchState;
    const allPlayers = [...Object.values(home.startingXI), ...Object.values(away.startingXI)];

    for (const player of allPlayers) {
        if (!player) continue;

        const teamKey = getPlayerTeam(player);
        const playerPos = gameState.matchState.playerPositions.get(player.name);

        if (ball.owner === player) { // Jogador com a bola
            const options = [];
            const goalX = teamKey === 'home' ? 100 : 0; // Posição do gol adversário
            const distToGoal = Math.hypot(playerPos.x - goalX, playerPos.y - 50);

            // Chance de chutar
            if (distToGoal < 25 && player.attributes.shooting > 60) { // Dentro da área ou perto
                options.push({ action: 'shoot', score: player.attributes.shooting - (distToGoal * 1.5) });
            }

            // Chance de passar
            const bestPass = findBestPassTarget(player);
            if (bestPass.target && bestPass.score > -Infinity) {
                let passScore = player.attributes.passing + bestPass.score;
                options.push({ action: 'pass', target: bestPass.target, score: passScore });
            }
            // Chance de driblar/conduzir a bola
            options.push({ action: 'dribble', score: player.attributes.dribbling - 20 }); // Score base para driblar

            const bestOption = options.sort((a, b) => b.score - a.score)[0]; // Escolhe a melhor opção
            if (bestOption) {
                playerIntents.set(player.name, { action: bestOption.action, target: bestOption.target || null });
            } else {
                playerIntents.set(player.name, { action: 'dribble', target: null }); // Fallback
            }
        } else { // Jogador sem a bola
            const isDefending = teamKey !== gameState.matchState.possession && gameState.matchState.possession !== null;
            if (isDefending) { // Time defendendo
                const closestToBall = getClosestPlayer(ball, teamKey).player;
                if (player === closestToBall) {
                    playerIntents.set(player.name, { action: 'press_ball_carrier', target: null }); // O mais próximo pressiona
                } else {
                    playerIntents.set(player.name, { action: 'hold_position', target: null }); // Outros seguram posição
                }
            } else { // Time atacando (sem a posse da bola, mas seu time tem)
                playerIntents.set(player.name, { action: 'support_play', target: null }); // Busca espaço e apoio
            }
        }
    }
}

function executePlayerActions() {
    // Executa a ação do jogador que está com a posse da bola.
    const { ball, playerIntents } = gameState.matchState;
    if (!ball.owner) return; // Ninguém com a bola, sem ação.

    const owner = ball.owner;
    const intent = playerIntents.get(owner.name);
    if (!intent) return;

    switch(intent.action) {
        case 'shoot':
            resolveShot(owner);
            playerIntents.set(owner.name, { action: 'hold_position', target: null }); // Reseta intenção
            break;
        case 'pass':
            const targetPlayer = intent.target;
            if (!targetPlayer) return;

            const targetPos = gameState.matchState.playerPositions.get(targetPlayer.name);
            ball.targetX = targetPos.x;
            ball.targetY = targetPos.y;
            ball.speed = 1.2 + (owner.attributes.passing / 200); // Velocidade do passe
            // Adiciona um pequeno erro no passe baseado no atributo de passe
            const passError = 10 - (owner.attributes.passing / 10);
            ball.targetX += (Math.random() - 0.5) * passError;
            ball.targetY += (Math.random() - 0.5) * passError;

            gameState.matchState.lastPasser = owner; // Guarda quem passou
            ball.owner = null; // Bola sem dono
            gameState.matchState.possession = null; // Posse indefinida
            playerIntents.set(owner.name, { action: 'hold_position', target: null });
            break;
        case 'dribble':
            const teamKey = getPlayerTeam(owner);
            // Define um novo target para a bola à frente do driblador
            const dribbleTarget = {
                x: ball.x + (teamKey === 'home' ? 10 : -10) * (owner.attributes.dribbling / 80), // Avança mais se for bom no drible
                y: ball.y + (Math.random() - 0.5) * 15 // Pequenas variações laterais
            };
            ball.targetX = dribbleTarget.x;
            ball.targetY = dribbleTarget.y;
            ball.speed = 0.5; // Velocidade de condução
            break;
    }
}

function findBestPassTarget(passer) {
    // Encontra o melhor companheiro de equipe para passar a bola.
    const passerPos = gameState.matchState.playerPositions.get(passer.name);
    const teamKey = getPlayerTeam(passer);
    const team = gameState.matchState[teamKey];
    const teammates = Object.values(team.startingXI).filter(p => p && p.name !== passer.name);

    let bestTarget = null;
    let maxScore = -Infinity;

    for (const teammate of teammates) {
        if (gameState.matchState.lastPasser && teammate.name === gameState.matchState.lastPasser.name) continue; // Evita passe de volta para quem acabou de passar

        const targetPos = gameState.matchState.playerPositions.get(teammate.name);
        const opponent = getClosestPlayer(targetPos, teamKey === 'home' ? 'away' : 'home'); // Oponente mais próximo do alvo

        const distToPasser = Math.hypot(passerPos.y - targetPos.y, passerPos.x - targetPos.x); // Distância do passe
        const distForward = (teamKey === 'home') ? (targetPos.x - passerPos.x) : (passerPos.x - targetPos.x); // Quão à frente o passe vai

        let score = 0;
        score += distForward * 0.5; // Premia passes para frente
        score += opponent.distance * 1.5; // Premia passe para jogador livre
        score -= distToPasser * 0.2; // Penaliza passes muito longos

        if (score > maxScore) {
            maxScore = score;
            bestTarget = teammate;
        }
    }
    return { target: bestTarget, score: maxScore };
}

function resolveShot(shooter) {
    // Resolve o resultado de um chute a gol.
    const { ball, score } = gameState.matchState;
    const teamKey = getPlayerTeam(shooter);
    const defendingTeamKey = teamKey === 'home' ? 'away' : 'home';
    const keeper = gameState.matchState[defendingTeamKey].startingXI['GK']; // Goleiro adversário

    showNotification(`Chute de ${shooter.name}!`); // Notifica na UI

    // Define o alvo da bola para o gol (aleatório dentro da área do gol)
    const goalX = teamKey === 'home' ? 100 : 0;
    ball.targetX = goalX;
    ball.targetY = 50 + (Math.random() - 0.5) * PITCH_DIMS.goalHeight; // Posição Y dentro da altura do gol
    ball.speed = 2.0; // Velocidade alta para o chute

    // Lógica de gol vs defesa do goleiro
    const shotPower = (shooter.attributes.shooting * 0.7) + (Math.random() * 30); // Poder do chute + aleatoriedade
    const savePower = (keeper.attributes.defending * 0.8) + (Math.random() * 30); // Poder de defesa + aleatoriedade

    if (shotPower > savePower) {
        if (Math.random() < 0.1) { // 10% de chance de ir na trave
            showNotification("NA TRAVE!");
            setPlayState('goalKick', defendingTeamKey); // Tiro de meta para o adversário
        } else {
            score[teamKey]++; // Gol!
            showNotification(`GOL! ${shooter.name} marca!`);
            setPlayState('goal'); // Estado de comemoração de gol
        }
    } else {
        showNotification(`Defesa do goleiro ${keeper.name}!`);
        // Se defender, pode ser escanteio ou tiro de meta
        setPlayState(Math.random() > 0.5 ? 'corner' : 'goalKick', defendingTeamKey);
    }
    ball.owner = null; // Bola sem dono após o chute
    gameState.matchState.possession = null;
    gameState.matchState.lastPasser = null; // Reseta o último passador
}

function checkBallState() {
    // Verifica o estado da bola (fora de campo, posse de jogador).
    const { ball } = gameState.matchState;
    if (gameState.matchState.stateTimer > 0) return; // Se em estado especial (ex: gol), não processa

    // Bola fora pelas laterais ou fundos
    if (ball.x < PITCH_DIMS.left) setPlayState('goalKick', 'home'); // Bola saiu pela linha de fundo do gol esquerdo (tiro de meta para o time da casa)
    else if (ball.x > PITCH_DIMS.right) setPlayState('goalKick', 'away'); // Bola saiu pela linha de fundo do gol direito (tiro de meta para o time visitante)
    else if (ball.y < PITCH_DIMS.top || ball.y > PITCH_DIMS.bottom) {
        const attackingTeam = ball.x > 50 ? 'home' : 'away'; // Determina quem estava atacando
        setPlayState('throwIn', attackingTeam === 'home' ? 'away' : 'home'); // Lateral para o time adversário
    }

    // Se a bola não tem dono e está parada ou quase parada, tenta atribuir a um jogador próximo.
    if (ball.owner === null && ball.speed < 0.1 && gameState.matchState.playState === 'playing') {
        const closest = getClosestPlayer(ball);
        if (closest.player && closest.distance < 4) { // Se um jogador está a menos de 4 unidades da bola
            ball.owner = closest.player; // Atribui a posse
            const newPossessionTeam = getPlayerTeam(closest.player);
            if (gameState.matchState.possession !== newPossessionTeam) {
                showNotification("Recuperação de bola!"); // Notifica mudança de posse
            }
            gameState.matchState.possession = newPossessionTeam;
            gameState.matchState.lastPasser = null;
        }
    }
}

function getClosestPlayer(target, teamKey = null) {
    // Encontra o jogador mais próximo de um ponto alvo, opcionalmente filtrando por time.
    let closestPlayer = null;
    let minDistance = Infinity;

    // Decide quais times escanear (todos ou apenas um específico)
    const teamsToScan = teamKey ? [gameState.matchState[teamKey]] : [gameState.matchState.home, gameState.matchState.away];
    for (const team of teamsToScan) {
        for(const player of Object.values(team.startingXI)) {
            if(!player) continue;
            const playerPos = gameState.matchState.playerPositions.get(player.name);
            const distance = Math.hypot(playerPos.y - target.y, playerPos.x - target.x);
            if (distance < minDistance) {
                minDistance = distance;
                closestPlayer = player;
            }
        }
    }
    return { player: closestPlayer, distance: minDistance };
}

function getPlayerTeam(player) {
    // Retorna 'home' ou 'away' para um dado jogador.
    if(!player) return null;
    return Object.values(gameState.matchState.home.startingXI).some(p => p && p.name === player.name) ? 'home' : 'away';
}

function moveBall() {
    // Move a bola em direção ao seu alvo.
    const { ball } = gameState.matchState;
    if (ball.speed > 0) {
        const distY = ball.targetY - ball.y;
        const distX = ball.targetX - ball.x;
        const distance = Math.hypot(distY, distX); // Distância até o alvo

        if (distance < ball.speed) {
            // Se muito perto, vai direto para o alvo e para.
            ball.y = ball.targetY;
            ball.x = ball.targetX;
            ball.speed = 0; // Bola para
        } else {
            // Move a bola na direção do alvo
            ball.y += (distY / distance) * ball.speed;
            ball.x += (distX / distance) * ball.speed;
            ball.speed *= 0.98; // Reduz a velocidade gradualmente
            if(ball.speed < 0.05) ball.speed = 0; // Se muito lenta, para
        }
    } else if (ball.owner) {
        // Se a bola tem dono e está parada, ela segue o dono.
        const ownerPos = gameState.matchState.playerPositions.get(ball.owner.name);
        ball.x = ownerPos.x;
        ball.y = ownerPos.y;
    }
}

function getPlayerHomePosition(player, playerPosId, teamKey) {
    // Calcula a posição "home" (padrão) de um jogador no campo, ajustada por táticas.
    const team = gameState.matchState[teamKey];
    const [baseY, baseX] = team.formation[playerPosId]; // Posição base da formação
    let tacticalX = baseX, tacticalY = baseY;

    // Ajustes de largura ofensiva
    if (player.position.includes('W') || player.position.includes('B') || player.position === 'CAM' || player.position === 'ST') {
        if (team.tactics.attackingWidth === 'wide') tacticalX = (tacticalX > 50) ? 95 : 5;
        else if (team.tactics.attackingWidth === 'narrow') tacticalX = (tacticalX > 50) ? 75 : 25;
    }

    // Ajustes de mentalidade (avança/recua jogadores)
    let yShift = 0;
    const mentality = team.tactics.mentality;
    if (mentality === 'very_attacking') yShift = 10;
    else if (mentality === 'attacking') yShift = 5;
    else if (mentality === 'defensive') yShift = -5;
    else if (mentality === 'very_defensive') yShift = -10;

    // Ajustes de linha defensiva (afeta defensores)
    if (player.position === 'CB' || player.position === 'LB' || player.position === 'RB' || player.position === 'CDM') {
        if(team.tactics.defensiveLine === 'higher') yShift += 5;
        if(team.tactics.defensiveLine === 'deeper') yShift -= 5;
    }

    tacticalY += yShift;

    // Inverte coordenadas para o time visitante (para que fiquem no lado oposto do campo)
    return teamKey === 'home' ? [tacticalY, tacticalX] : [100 - tacticalY, 100 - tacticalX];
}

function movePlayers() {
    // Move todos os jogadores no campo com base em suas intenções e posições padrão.
    const { ball, playerIntents, playerPositions } = gameState.matchState;
    for (const [playerName, playerPos] of playerPositions.entries()) {
        const player = findTeamInLeagues(playerName, true);
        if (!player) continue;

        const teamKey = getPlayerTeam(player);
        const team = gameState.matchState[teamKey];
        const posId = Object.keys(team.startingXI).find(key => team.startingXI[key] === player);
        if (!posId) continue;

        const [homeY, homeX] = getPlayerHomePosition(player, posId, teamKey); // Posição padrão
        let targetX = homeX, targetY = homeY;
        const intent = playerIntents.get(playerName);

        switch(intent.action) {
            case 'press_ball_carrier':
                if (ball.owner) {
                    const ownerPos = playerPositions.get(ball.owner.name);
                    targetX = ownerPos.x;
                    targetY = ownerPos.y;
                }
                break;
            case 'support_play':
                // Move-se em direção à bola, mas tentando manter a forma tática
                targetX += (ball.x - targetX) * 0.3;
                targetY += (ball.y - targetY) * 0.3;
                break;
            default: // hold_position ou outras intenções sem movimento explícito
                targetX = homeX;
                targetY = homeY;
                break;
        }

        const moveSpeed = 0.05 + (player.attributes.pace / 2000); // Velocidade baseada no ritmo do jogador
        // Move o jogador gradualmente para o alvo
        playerPos.x += (targetX - playerPos.x) * moveSpeed;
        playerPos.y += (targetY - playerPos.y) * moveSpeed;

        // Limita os jogadores aos limites do campo
        playerPos.x = Math.max(0, Math.min(100, playerPos.x));
        playerPos.y = Math.max(0, Math.min(100, playerPos.y));
    }
}

function resetPlayersToKickoffPositions() {
    // Reposiciona todos os jogadores para as posições de pontapé inicial.
    const { home, away } = gameState.matchState;
    for (const teamKey of ['home', 'away']) {
        const team = gameState.matchState[teamKey];
        for (const posId in team.startingXI) {
            const player = team.startingXI[posId];
            if (player) {
                const [y, x] = team.formation[posId];
                const playerPos = gameState.matchState.playerPositions.get(player.name);
                // Ajusta posições para o pontapé inicial (alguns jogadores mais recuados)
                if (teamKey === 'home') {
                    playerPos.y = y * 0.9;
                    playerPos.x = x;
                    if (playerPos.y >= 50) playerPos.y = 48; // Garante que não invadam o campo adversário
                } else {
                    playerPos.y = 100 - (y * 0.9);
                    playerPos.x = 100 - x;
                    if (playerPos.y < 50) playerPos.y = 52;
                }
            }
        }
    }
    // Posiciona a bola no centro com o jogador que vai dar o pontapé
    const kickoffTeamKey = gameState.matchState.possession;
    const kickoffTeam = gameState.matchState[kickoffTeamKey];
    // Tenta encontrar um atacante ou meio-campista para o pontapé
    const kicker = Object.values(kickoffTeam.startingXI).find(p => p && (p.position === 'ST' || p.position === 'CAM' || p.position === 'CM'));
    if (kicker) {
        const kickerPos = gameState.matchState.playerPositions.get(kicker.name);
        kickerPos.y = kickoffTeamKey === 'home' ? 49.5 : 50.5; // Levemente à frente ou atrás do centro
        kickerPos.x = 50;
        gameState.matchState.ball.owner = kicker;
    } else {
        // Fallback: se não encontrar um jogador adequado, a bola fica no centro sem dono
        gameState.matchState.ball.owner = null;
    }
    gameState.matchState.ball.x = 50;
    gameState.matchState.ball.y = 50;
    gameState.matchState.ball.targetX = 50;
    gameState.matchState.ball.targetY = 50;
    gameState.matchState.ball.speed = 0;
}

function setPlayState(newState, teamToAct = null) {
    // Define o estado atual da jogada (kickoff, goal, corner, throw-in, playing).
    gameState.matchState.playState = newState;
    const { ball } = gameState.matchState;
    let setupTime = 1500; // Tempo padrão para estados especiais

    switch(newState) {
        case 'kickoff':
            gameState.matchState.possession = teamToAct || (gameState.matchState.half === 1 ? 'home' : 'away');
            resetPlayersToKickoffPositions();
            showNotification(gameState.matchState.gameTime < 1 ? "Apito Inicial!" : "Bola rolando!");
            setupTime = 2500; // Mais tempo para o pontapé inicial
            break;
        case 'playing':
            gameState.matchState.stateTimer = 0; // Zera o temporizador para começar a jogar
            return; // Não define tempo, o loop continua
        case 'goal':
            setupTime = 4000; // Tempo de comemoração
            break;
        case 'goalKick':
            gameState.matchState.possession = teamToAct;
            ball.owner = gameState.matchState[teamToAct].startingXI['GK']; // Goleiro com a bola
            const ownerPosGK = gameState.matchState.playerPositions.get(ball.owner.name);
            ball.targetY = ownerPosGK.y; ball.targetX = ownerPosGK.x;
            ball.speed = 0.5; // Bola rola devagar
            showNotification(`Tiro de meta para ${gameState.matchState[teamToAct].team.name}.`);
            setupTime = 2000;
            break;
        case 'corner':
            gameState.matchState.possession = teamToAct;
            ball.owner = null;
            // Posição aleatória na área de escanteio
            ball.targetX = teamToAct === 'home' ? (Math.random() < 0.5 ? 1 : 99) : (Math.random() < 0.5 ? 1 : 99);
            ball.targetY = teamToAct === 'home' ? (ball.x < 50 ? 1 : 99) : (ball.x < 50 ? 1 : 99);
            ball.speed = 0.5;
            showNotification(`Escanteio para ${gameState.matchState[teamToAct].team.name}!`);
            setupTime = 3000;
            break;
        case 'throwIn':
            gameState.matchState.possession = teamToAct;
            ball.owner = null;
            // Bola na linha lateral onde saiu
            ball.x = ball.x < 50 ? 0.1 : 99.9; // Ajusta para a linha mais próxima
            ball.speed = 0;
            showNotification(`Lateral para ${gameState.matchState[teamToAct].team.name}.`);
            setupTime = 2000;
            break;
    }
    gameState.matchState.stateTimer = setupTime; // Define o temporizador
}

function endMatch() {
    // Finaliza a simulação da partida.
    clearInterval(matchInterval); // Para o loop de simulação
    gameState.isMatchLive = false;
    document.getElementById('match-time-status').innerText = 'FIM DE JOGO'; // Atualiza status na UI

    // Atualiza o resultado da partida no estado global (para histórico e tabela)
    const match = gameState.allMatches.find(m => isSameDay(new Date(m.date), new Date(gameState.nextUserMatch.date)));
    if (match) {
        match.status = 'played';
        match.homeScore = gameState.matchState.score.home;
        match.awayScore = gameState.matchState.score.away;
        if (match.round !== 'Amistoso') {
            const leagueId = Object.keys(leaguesData).find(id => leaguesData[id].teams.some(t => t.name === match.home.name));
            updateTableWithResult(leagueId, match); // Atualiza a tabela da liga
        }
    }
    showPostMatchReport(); // Mostra o relatório pós-jogo
    findNextUserMatch(); // Encontra o próximo jogo do usuário
}        const teamSelector = document.getElementById('market-filter-team');
        teamSelector.innerHTML = '<option value="">Clube</option>'; // Reseta o seletor de time
        const selectedLeagueId = leagueSelector.value;
        if (selectedLeagueId) {
            leaguesData[selectedLeagueId].teams.forEach(team => {
                if (team.name !== gameState.userClub.name) { // Não mostra o próprio time
                    teamSelector.innerHTML += `<option value="${team.name}">${team.name}</option>`;
                }
            });
        }
    });

    // Reanexa listener para o botão de pesquisa
    const searchBtn = document.getElementById('market-search-btn');
    const newSearchBtn = searchBtn.cloneNode(true);
    searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn);
    newSearchBtn.addEventListener('click', performMarketSearch);
}

function performMarketSearch() {
    // Executa a busca de jogadores em outros clubes com base nos filtros.
    const nameQuery = document.getElementById('market-search-input').value.toLowerCase();
    const leagueQuery = document.getElementById('market-filter-league').value;
    const teamQuery = document.getElementById('market-filter-team').value;
    const posQuery = document.getElementById('market-filter-position').value;

    let allPlayers = [];
    // Coleta todos os jogadores de todos os times (exceto o do usuário)
    for (const leagueId in leaguesData) {
        for (const team of leaguesData[leagueId].teams) {
            if (team.name !== gameState.userClub.name) {
                team.players.forEach(p => allPlayers.push({ ...p, teamName: team.name, leagueId: leagueId }));
            }
        }
    }

    let results = allPlayers;
    // Aplica os filtros
    if (leagueQuery) results = results.filter(p => p.leagueId === leagueQuery);
    if (teamQuery) results = results.filter(p => p.teamName === teamQuery);
    if (nameQuery) results = results.filter(p => p.name.toLowerCase().includes(nameQuery));
    if (posQuery) results = results.filter(p => p.position === posQuery);

    const resultsContainer = document.getElementById('market-search-results');
    resultsContainer.innerHTML = renderMarketPlayerList(results);

    // Reanexa listeners para os botões "Fazer Proposta"
    resultsContainer.querySelectorAll('.propose-purchase-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const playerName = e.target.dataset.playerName;
            const teamName = e.target.dataset.teamName;
            handlePurchaseOffer(playerName, teamName);
        });
    });
}

function renderMarketPlayerList(players) {
    // Renderiza a lista de jogadores encontrados na aba "Comprar Jogadores".
    if (players.length === 0) return '<p style="padding: 20px; text-align: center;">Nenhum jogador encontrado.</p>';

    let tableHTML = `<table><thead><tr><th>Nome</th><th>Clube</th><th>Idade</th><th>Pos.</th><th>GERAL</th><th>Valor de Mercado</th><th>Contrato</th><th>Ação</th></tr></thead><tbody>`;
    for (const player of players) {
        tableHTML += `
            <tr data-player-name="${player.name}" data-team-name="${player.teamName}">
                <td>${player.name}</td>
                <td>${player.teamName}</td>
                <td>${player.age}</td>
                <td>${player.position}</td>
                <td><b>${player.overall}</b></td>
                <td>${formatCurrency(player.marketValue)}</td>
                <td>${formatContract(player.contractUntil) || 'N/A'}</td>
                <td><button class="propose-purchase-btn" data-player-name="${player.name}" data-team-name="${player.teamName}">Fazer Proposta</button></td>
            </tr>`;
    }
    tableHTML += `</tbody></table>`;
    return tableHTML;
}

function handlePurchaseOffer(playerName, teamName) {
    // Lida com a tentativa de fazer uma proposta de compra. (Funcionalidade futura)
    const player = findTeamInLeagues(playerName, true); // Procura o objeto jogador
    if (!player) return;

    // Por enquanto, apenas um modal de informação
    showInfoModal("Função em Desenvolvimento", `A lógica para fazer uma proposta de compra por ${playerName} do ${teamName} ainda não foi implementada. Fique ligado para futuras atualizações!`);
}


function displayPlayerSearch() {
    // Prepara a interface para a busca de agentes livres.
    const container = document.getElementById('search-players-tab');
    container.innerHTML = `
        <div class="player-search-bar">
            <input type="text" id="player-search-input" placeholder="Nome do jogador...">
            <select id="filter-position"><option value="">Posição</option><option>GK</option><option>CB</option><option>RB</option><option>LB</option><option>CDM</option><option>CM</option><option>CAM</option><option>RW</option><option>LW</option><option>ST</option></select>
            <select id="filter-age"><option value="">Idade</option><option value="u21">Sub-21</option><option value="22-28">Auge (22-28)</option><option value="o29">Veterano (29+)</option></select>
            <select id="filter-value"><option value="">Valor</option><option value="0-1m">Até 1M</option><option value="1m-5m">1M - 5M</option><option value="5m-10m">5M - 10M</option><option value="o10m">Acima de 10M</option></select>
            <button id="search-player-btn">Pesquisar</button>
        </div>
        <div class="table-container" id="player-search-results">
            <p style="padding: 20px; text-align: center;">Use a busca e os filtros para encontrar agentes livres.</p>
        </div>
    `;
    // Reanexa listener para o botão de pesquisa de agentes livres
    const searchBtn = document.getElementById('search-player-btn');
    const newSearchBtn = searchBtn.cloneNode(true);
    searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn);
    newSearchBtn.addEventListener('click', performSearch);
}

function performSearch() {
    // Executa a busca de agentes livres com base nos filtros.
    const nameQuery = document.getElementById('player-search-input').value.toLowerCase();
    const posQuery = document.getElementById('filter-position').value;
    const ageQuery = document.getElementById('filter-age').value;
    const valueQuery = document.getElementById('filter-value').value;

    let results = [...gameState.freeAgents];

    if (nameQuery) {
        results = results.filter(p => p.name.toLowerCase().includes(nameQuery));
    }
    if (posQuery) {
        results = results.filter(p => p.position === posQuery);
    }
    if (ageQuery) {
        if (ageQuery === 'u21') results = results.filter(p => p.age <= 21);
        else if (ageQuery === '22-28') results = results.filter(p => p.age >= 22 && p.age <= 28);
        else if (ageQuery === 'o29') results = results.filter(p => p.age >= 29);
    }
    if (valueQuery) {
        // Assume que os valores de mercado já estão em BRL após a inicialização
        const base = 1000000;
        if (valueQuery === '0-1m') results = results.filter(p => p.marketValue <= base);
        else if (valueQuery === '1m-5m') results = results.filter(p => p.marketValue > base && p.marketValue <= base * 5);
        else if (valueQuery === '5m-10m') results = results.filter(p => p.marketValue > base * 5 && p.marketValue <= base * 10);
        else if (valueQuery === 'o10m') results = results.filter(p => p.marketValue > base * 10);
    }

    const resultsContainer = document.getElementById('player-search-results');
    resultsContainer.innerHTML = renderPlayerList(results);
    addPlayerListEventListeners(resultsContainer);
}

function renderPlayerList(players) {
    // Renderiza a lista de agentes livres.
    if (players.length === 0) return '<p style="padding: 20px; text-align: center;">Nenhum jogador encontrado.</p>';
    let tableHTML = `<table><thead><tr><th>Nome</th><th>Idade</th><th>Pos.</th><th>GERAL</th><th>Valor de Mercado</th><th>Ação</th></tr></thead><tbody>`;
    for (const player of players) {
        tableHTML += `
            <tr data-player-name="${player.name}">
                <td>${player.name}</td>
                <td>${player.age}</td>
                <td>${player.position}</td>
                <td><b>${player.overall}</b></td>
                <td>${formatCurrency(player.marketValue)}</td>
                <td><button class="propose-contract-btn" data-player-name="${player.name}">Propor Contrato</button></td>
            </tr>`;
    }
    tableHTML += `</tbody></table>`;
    return tableHTML;
}

function addPlayerListEventListeners(container) {
    // Adiciona listeners aos botões "Propor Contrato" na lista de jogadores.
    container.querySelectorAll('.propose-contract-btn').forEach(btn => {
        // Clone e substitua para garantir que listeners antigos sejam removidos
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const playerName = e.target.dataset.playerName;
            const player = gameState.freeAgents.find(p => p.name === playerName);
            if (player) {
                openNegotiationModal(player, 'hire');
            }
        });
    });
}

function displayContractsScreen() {
    // Exibe a tela de contratos, mostrando a situação contratual dos jogadores do time do usuário.
    const container = document.getElementById('contracts-content');
    container.innerHTML = '<h3>Situação Contratual do Elenco</h3>';

    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';

    // Ordena jogadores pelos meses restantes de contrato (os que expiram primeiro aparecem no topo)
    const sortedPlayers = [...gameState.userClub.players].sort((a, b) => {
        const contractA = a.contractUntil === undefined ? 999 : a.contractUntil; // Joga indefinidos para o final
        const contractB = b.contractUntil === undefined ? 999 : b.contractUntil;
        return contractA - contractB;
    });

    let tableHTML = `<table><thead><tr><th>Nome</th><th>Idade</th><th>Pos.</th><th>GERAL</th><th>Contrato Restante</th><th>Salário Mensal</th><th>Ações</th></tr></thead><tbody>`;
    for (const player of sortedPlayers) {
        let contractClass = '';
        if (player.contractUntil !== null && player.contractUntil <= 6) contractClass = 'negative';
        else if (player.contractUntil !== null && player.contractUntil <= 12) contractClass = 'text-secondary';

        tableHTML += `
            <tr data-player-name="${player.name}">
                <td>${player.name}</td>
                <td>${player.age}</td>
                <td>${player.position}</td>
                <td><b>${player.overall}</b></td>
                <td class="${contractClass}">${formatContract(player.contractUntil) || 'N/A'}</td>
                <td>${formatCurrency(calculatePlayerWage(player))}</td>
                <td>
                    <button class="renew-btn" data-player-name="${player.name}">Renovar</button>
                    <button class="terminate-btn secondary" data-player-name="${player.name}">Rescindir</button>
                </td>
            </tr>`;
    }
    tableHTML += `</tbody></table>`;
    tableContainer.innerHTML = tableHTML;
    container.appendChild(tableContainer);

    // Reanexa listeners para os botões "Renovar" e "Rescindir"
    container.querySelectorAll('.renew-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            const player = gameState.userClub.players.find(p => p.name === newBtn.dataset.playerName);
            openNegotiationModal(player, 'renew');
        });
    });
    container.querySelectorAll('.terminate-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            const player = gameState.userClub.players.find(p => p.name === newBtn.dataset.playerName);
            handleContractTermination(player);
        });
    });
}

function handleContractTermination(player) {
    // Lida com a rescisão de contrato de um jogador do time do usuário.
    const yearsLeft = Math.max(0, (player.contractUntil || 0) / 12);
    // Custo de rescisão: 50% do valor de mercado por ano restante de contrato
    const terminationFee = (player.marketValue || 0) * 0.5 * yearsLeft;

    showConfirmationModal(
        'Rescindir Contrato',
        `Rescindir o contrato de ${player.name} custará ${formatCurrency(terminationFee)}. Deseja continuar?`,
        () => { // Callback de confirmação
            if (gameState.clubFinances.balance < terminationFee) {
                showInfoModal("Fundos Insuficientes", "Você não tem dinheiro suficiente para pagar a cláusula de rescisão.");
                return;
            }
            addTransaction(-terminationFee, `Rescisão de contrato de ${player.name}`);
            gameState.userClub.players = gameState.userClub.players.filter(p => p.name !== player.name); // Remove do elenco
            
            player.contractUntil = 0; // Marca como contrato encerrado
            gameState.freeAgents.push(player); // Torna-o agente livre

            setupInitialSquad(); // Reorganiza a escalação se necessário
            showInfoModal("Contrato Rescindido", `${player.name} não é mais jogador do seu clube.`);
            displayContractsScreen(); // Atualiza a tela de contratos
        }
    );
}

function openNegotiationModal(player, type) {
    // Abre o modal de negociação de contrato (renovação ou contratação).
    gameState.negotiationState = {
        player,
        type,
        rounds: 0,
        // Cálculos iniciais da demanda do jogador
        minAcceptableBonus: (player.marketValue || 50000) * 0.10 * (player.overall / 80),
        desiredBonus: (player.marketValue || 50000) * 0.20 * (player.overall / 75),
        desiredDuration: player.age < 25 ? 5 : (player.age < 32 ? 3 : 2)
    };

    // Adiciona aleatoriedade às demandas do jogador
    gameState.negotiationState.desiredBonus *= (0.9 + Math.random() * 0.2);
    gameState.negotiationState.minAcceptableBonus = Math.max(10000, gameState.negotiationState.desiredBonus * 0.7);

    document.getElementById('negotiation-title').innerText = type === 'renew' ? 'Renovação de Contrato' : 'Contratar Jogador';
    document.getElementById('negotiation-player-name').innerText = player.name;
    document.getElementById('negotiation-player-age').innerText = player.age;
    document.getElementById('negotiation-player-pos').innerText = player.position;
    document.getElementById('negotiation-player-ovr').innerText = player.overall;

    document.getElementById('player-demand-duration').innerText = gameState.negotiationState.desiredDuration;
    document.getElementById('player-demand-bonus').innerText = formatCurrency(gameState.negotiationState.desiredBonus);
    document.getElementById('player-feedback').innerText = "Aguardando sua proposta...";

    // Preenche os campos da proposta com valores iniciais
    document.getElementById('offer-duration').value = type === 'renew' ? Math.round(player.contractUntil / 12) : gameState.negotiationState.desiredDuration;
    document.getElementById('offer-bonus').value = ''; // Limpa o campo de luvas
    document.getElementById('negotiation-modal').classList.add('active');
}

function handleNegotiationOffer() {
    // Processa a proposta do usuário no modal de negociação.
    const { player, type, minAcceptableBonus, desiredDuration } = gameState.negotiationState;
    const feedbackEl = document.getElementById('player-feedback');

    let offerDuration = parseInt(document.getElementById('offer-duration').value, 10);
    let offerBonusStr = document.getElementById('offer-bonus').value.trim();

    if (isNaN(offerDuration) || offerDuration <= 0) {
        feedbackEl.innerText = "Por favor, insira uma duração de contrato válida.";
        return;
    }

    let offerBonusRaw = 0;
    if (offerBonusStr.toLowerCase().endsWith('m')) {
        offerBonusRaw = parseFloat(offerBonusStr.slice(0, -1)) * 1000000;
    } else if (offerBonusStr.toLowerCase().endsWith('k')) {
        offerBonusRaw = parseFloat(offerBonusStr.slice(0, -1)) * 1000;
    } else {
        offerBonusRaw = parseFloat(offerBonusStr);
    }

    if (isNaN(offerBonusRaw)) {
        feedbackEl.innerText = "Por favor, insira um valor de luvas válido (ex: 500k, 1.2M).";
        return;
    }

    const offerBonus = offerBonusRaw;
    gameState.negotiationState.rounds++; // Incrementa o contador de rodadas

    const bonusRatio = offerBonus / minAcceptableBonus; // Quão boa a oferta de bônus é
    const durationDiff = Math.abs(offerDuration - desiredDuration); // Diferença na duração proposta

    // Score de aceitação: Mais peso para o bônus, penalidade para a diferença de duração
    let acceptanceScore = (bonusRatio * 0.8) - (durationDiff * 0.1);

    if (acceptanceScore >= 0.95) { // Se o score for alto o suficiente, o acordo é fechado
        finalizeDeal(offerDuration * 12, offerBonus);
    } else if (gameState.negotiationState.rounds >= 4) { // Limite de 4 rodadas de negociação
        feedbackEl.innerText = "Sua proposta final não me agrada. Vou procurar outras oportunidades.";
        setTimeout(() => document.getElementById('negotiation-modal').classList.remove('active'), 2000);
    } else { // Feedback para o usuário sobre a proposta
        if (bonusRatio < 0.8) {
            feedbackEl.innerText = "As luvas que você ofereceu estão muito abaixo do que eu esperava. Precisa melhorar bastante.";
        } else if (durationDiff > 1) {
            feedbackEl.innerText = `Um contrato de ${offerDuration} anos não é o ideal para mim. Mas podemos conversar se as luvas compensarem.`;
        } else {
            feedbackEl.innerText = "Estamos quase lá. Melhore um pouco a proposta e podemos fechar negócio.";
        }
    }
}

function finalizeDeal(contractMonths, bonus) {
    // Finaliza o processo de negociação de contrato, aplicando as mudanças ao jogador e às finanças.
    const { player, type } = gameState.negotiationState;
    const isRenewal = type === 'renew';

    const cost = calculateNegotiationCost(player, isRenewal); // Calcula o custo de negociação

    if (gameState.clubFinances.balance < cost) {
        showInfoModal("Dinheiro Insuficiente", `Você não tem verba suficiente para pagar as taxas de contrato (${formatCurrency(cost)}).`);
        document.getElementById('negotiation-modal').classList.remove('active');
        return;
    }

    addTransaction(-cost, `Taxas de Contrato: ${player.name} (${isRenewal ? 'Renovação' : 'Nova Contratação'})`);
    addTransaction(-bonus, `Bônus de Contrato (Luvas): ${player.name}`); // Adiciona o custo do bônus/luvas

    if (type === 'renew') {
        const playerInClub = gameState.userClub.players.find(p => p.name === player.name);
        if (playerInClub) {
             playerInClub.contractUntil = contractMonths;
             playerInClub.notifiedAboutContract = false; // Reseta notificação após renovação
        }
        showInfoModal("Contrato Renovado!", `${player.name} renovou seu contrato por ${formatContract(contractMonths)}!`);
    } else { // Contratar jogador livre
        player.contractUntil = contractMonths;
        // Garante que o jogador contratado tenha atributos e valor calculados, se não tiver (caso de agentes livres gerados)
        if (!player.attributes || Object.keys(player.attributes).length === 0) {
            player.attributes = { pace: 80, shooting: 80, passing: 80, dribbling: 80, defending: 50, physical: 65 }; // Atributos default
            player.overall = calculatePlayerOverall(player);
        }
        updateMarketValue(player, true); // Garante que o valor de mercado esteja atualizado em BRL

        gameState.userClub.players.push(player); // Adiciona ao elenco do usuário
        gameState.freeAgents = gameState.freeAgents.filter(p => p.name !== player.name); // Remove dos agentes livres
        setupInitialSquad(); // Reorganiza a escalação após a nova contratação
        showInfoModal("Contratação Realizada!", `Bem-vindo ao clube, ${player.name}!`);
        if(gameState.currentMainContent === 'transfer-market-content') displayTransferMarket(); // Atualiza a tela de mercado
    }

    document.getElementById('negotiation-modal').classList.remove('active');
    if(gameState.currentMainContent === 'contracts-content') displayContractsScreen(); // Atualiza a tela de contratos
}

// --- Funções de Patrocínio (UI) ---
function displaySponsorshipScreen() {
    // Exibe a tela de patrocínios.
    const container = document.getElementById('sponsorship-content');
    const sponsor = gameState.clubSponsor;

    if (!sponsor) {
        container.innerHTML = '<h3>Patrocínios</h3><p>Seu clube ainda não possui um patrocinador principal ou não há patrocinadores disponíveis para sua divisão.</p>';
        return;
    }

    const divisionMap = { 'brasileirao_a': 1, 'brasileirao_b': 2, 'brasileirao_c': 3 };
    const currentDivision = divisionMap[gameState.currentLeagueId];
    // Filtra outros patrocinadores que o clube poderia ter (da mesma divisão ou superiores).
    const otherSponsors = sponsorsData.filter(s => s.minDivision >= currentDivision && s.name !== sponsor.name);

    let otherSponsorsHTML = '';
    if (otherSponsors.length > 0) {
        otherSponsorsHTML = otherSponsors.map(s => `
            <div class="other-sponsor-card">
                <img src="images/sponsors/${s.logo}" alt="${s.name}" class="other-sponsor-logo" onerror="this.onerror=null; this.src='images/logo_default.png';">
                <div class="other-sponsor-info">
                    <h4>${s.name}</h4>
                    <p>${formatCurrency(s.monthlyIncome)} / mês</p>
                </div>
            </div>
        `).join('');
    } else {
        otherSponsorsHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhum outro patrocinador disponível para sua divisão no momento.</p>';
    }

    container.innerHTML = `
        <h3>Patrocinador Principal</h3>
        <div class="main-sponsor-card">
            <div class="sponsor-logo-container">
                <img src="images/sponsors/${sponsor.logo}" alt="Logo ${sponsor.name}" class="sponsor-logo" onerror="this.onerror=null; this.src='images/logo_default.png';">
            </div>
            <div class="sponsor-details">
                <h2>${sponsor.name}</h2>
                <p class="sponsor-description">${sponsor.description}</p>
                <div class="sponsor-finance">
                    <span>Receita Mensal</span>
                    <span class="sponsor-income">${formatCurrency(sponsor.monthlyIncome)}</span>
                </div>
            </div>
        </div>
        <h3 style="margin-top: 30px;">Outros Patrocinadores da Divisão</h3>
        <div class="other-sponsors-grid">
            ${otherSponsorsHTML}
        </div>
    `;
}

// --- Funções de Ingressos (UI) (NOVO) ---
function displayTicketsScreen() {
    // Exibe a tela de ingressos, mostrando informações do estádio, público e receita.
    const container = document.getElementById('tickets-content');
    const stadium = getStadiumInfo(); // Pega info do estádio
    const { probableAttendance, revenue } = calculateTicketRevenue(); // Calcula público e receita

    container.innerHTML = `
        <h3>Informações do Estádio e Ingressos</h3>
        <div class="stadium-info-card">
            <h4>${stadium.name}</h4>
            <p>Capacidade Máxima: <b>${stadium.capacity.toLocaleString('pt-BR')}</b> Torcedores</p>
            <div class="ticket-price-control">
                <label for="ticket-price-input">Valor do Ingresso:</label>
                <input type="number" id="ticket-price-input" min="1" step="1" value="${gameState.userTicketPrice}">
                <span>${formatCurrency(1).replace('1,00', '')}</span> <!-- Exibe o símbolo da moeda -->
            </div>
        </div>

        <div class="match-day-projections-card">
            <h4>Projeção para o Próximo Jogo em Casa</h4>
            <p>Público Provável: <b id="probable-attendance-display">${probableAttendance.toLocaleString('pt-BR')}</b> Torcedores</p>
            <p>Receita Estimada: <b id="estimated-revenue-display">${formatCurrency(revenue)}</b></p>
            <div class="attendance-feedback">
                <!-- Feedback sobre o preço do ingresso e público -->
                <p id="ticket-price-feedback"></p>
            </div>
        </div>
    `;

    const ticketPriceInput = document.getElementById('ticket-price-input');
    const probableAttendanceDisplay = document.getElementById('probable-attendance-display');
    const estimatedRevenueDisplay = document.getElementById('estimated-revenue-display');
    const ticketPriceFeedback = document.getElementById('ticket-price-feedback');

    // Listener para atualizar a projeção ao mudar o preço do ingresso
    ticketPriceInput.addEventListener('input', () => {
        let newPrice = parseInt(ticketPriceInput.value, 10);
        if (isNaN(newPrice) || newPrice <= 0) {
            newPrice = 1; // Preço mínimo
        }
        gameState.userTicketPrice = newPrice; // Atualiza o preço no gameState

        const { probableAttendance: newAttendance, revenue: newRevenue } = calculateTicketRevenue();
        probableAttendanceDisplay.innerText = newAttendance.toLocaleString('pt-BR');
        estimatedRevenueDisplay.innerText = formatCurrency(newRevenue);

        // Feedback visual sobre o preço
        const baseTicketPriceForLeague = BASE_TICKET_PRICE[gameState.currentLeagueId] || 70;
        const priceRatio = newPrice / baseTicketPriceForLeague;
        if (priceRatio > 1.5) {
            ticketPriceFeedback.className = 'negative';
            ticketPriceFeedback.innerText = 'Preço muito alto! Isso pode afastar muitos torcedores.';
        } else if (priceRatio > 1.1) {
            ticketPriceFeedback.className = 'text-secondary';
            ticketPriceFeedback.innerText = 'Preço um pouco alto, pode reduzir o público.';
        } else if (priceRatio < 0.8) {
            ticketPriceFeedback.className = 'positive';
            ticketPriceFeedback.innerText = 'Preço baixo! Atrairá mais torcedores, mas a receita por torcedor será menor.';
        } else {
            ticketPriceFeedback.className = '';
            ticketPriceFeedback.innerText = 'Preço equilibrado para sua divisão. Bom público esperado.';
        }
    });
}


// --- Funções de Match UI ---
function promptMatchConfirmation() {
    // Exibe um modal de confirmação antes de iniciar uma partida do usuário.
    if (!gameState.nextUserMatch) return;
    document.getElementById('match-confirmation-modal').classList.add('active');
}

function updateScoreboard() {
    // Atualiza o placar e o relógio na tela de simulação de partida.
    if (!gameState.matchState) return;
    const { score, gameTime } = gameState.matchState;
    document.getElementById('match-score-display').innerText = `${score.home} - ${score.away}`;

    const minutes = Math.floor(gameTime);
    const seconds = Math.floor((gameTime * 60) % 60);
    document.getElementById('match-clock').innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const statusEl = document.getElementById('match-time-status');
    if (statusEl.innerText === 'FIM DE JOGO') return; // Não atualiza se o jogo já acabou

    if (gameState.isPaused) {
       if (gameState.matchState.half === 2 && gameTime >= 45) statusEl.innerText = 'INTERVALO';
       else statusEl.innerText = "PAUSA";
    } else {
        statusEl.innerText = gameState.matchState.half === 1 ? 'PRIMEIRO TEMPO' : 'SEGUNDO TEMPO';
    }
}

function togglePause(forcePause = null) {
    // Alterna o estado de pausa da simulação da partida.
    if (gameState.isMatchLive === false) return; // Só funciona se a partida estiver ativa
    gameState.isPaused = forcePause !== null ? forcePause : !gameState.isPaused;
    document.getElementById('pause-overlay').classList.toggle('active', gameState.isPaused);
    document.getElementById('pause-match-btn').innerText = gameState.isPaused ? '▶' : '❚❚';
    updateScoreboard(); // Atualiza o placar para refletir o estado de pausa
}

function showNotification(message) {
    // Exibe uma notificação temporária na tela da partida.
    const area = document.getElementById('match-notification-area');
    area.innerHTML = ''; // Limpa notificações anteriores
    const notification = document.createElement('div');
    notification.className = 'match-notification';
    notification.innerText = message;
    area.appendChild(notification);
    setTimeout(() => { if(notification) notification.remove(); }, 3500); // Remove após 3.5 segundos
}

function updatePlayerRatings() {
    // (Funcionalidade de Match Engine) Atualiza as notas de desempenho dos jogadores durante a partida.
    // Esta função é chamada periodicamente, a lógica real de cálculo de rating está no game_logic.
    if(!gameState.matchState) return;
    for (const [playerName, currentRating] of gameState.matchState.playerRatings.entries()) {
        const performanceChange = (Math.random() - 0.47) * 0.2; // Pequena flutuação aleatória
        let newRating = Math.max(0, Math.min(10, currentRating + performanceChange));
        gameState.matchState.playerRatings.set(playerName, newRating);
    }
}

function showPostMatchReport() {
    // Exibe o modal de relatório pós-partida.
    const { home, away, score } = gameState.matchState;
    const modal = document.getElementById('post-match-report-modal');
    const headline = document.getElementById('post-match-headline');
    const summary = document.getElementById('post-match-summary');
    let winner, loser, winnerScore, loserScore;

    if (score.home > score.away) {
        winner = home.team.name; loser = away.team.name;
        winnerScore = score.home; loserScore = score.away;
        headline.innerText = `${winner} vence ${loser} por ${winnerScore} a ${loserScore}!`;
    } else if (score.away > score.home) {
        winner = away.team.name; loser = home.team.name;
        winnerScore = score.away; loserScore = score.home;
        headline.innerText = `${winner} surpreende e vence ${loser} fora de casa!`;
    } else {
        headline.innerText = `${home.team.name} e ${away.team.name} empatam em jogo disputado.`;
        summary.innerText = `A partida terminou com o placar de ${score.home} a ${score.away}. Ambos os times tiveram suas chances, mas a igualdade prevaleceu no placar final.`;
        modal.classList.add('active');
        return;
    }

    // Gerador de resumo aleatório pós-jogo
    const performanceFactor = Math.random();
    if (performanceFactor > 0.7) {
        summary.innerText = `Apesar da vitória do ${winner}, foi o ${loser} que dominou a maior parte das ações, criando mais chances. No entanto, a eficiência do ${winner} na finalização fez a diferença, garantindo o resultado de ${winnerScore} a ${loserScore}.`;
    } else if (performanceFactor < 0.3) {
        summary.innerText = `Uma partida eletrizante! O ${winner} conseguiu a vitória nos últimos minutos, mostrando garra e determinação. O ${loser} lutou bravamente, mas não foi o suficiente.`;
    }
    else {
        summary.innerText = `Com uma performance sólida, o ${winner} controlou a partida e mereceu a vitória sobre o ${loser}. O placar final de ${winnerScore} a ${loserScore} refletiu a superioridade vista em campo.`;
    }
    modal.classList.add('active');
}

function resizeCanvas() {
    // Ajusta o tamanho do canvas do campo para ser responsivo.
    const canvas = document.getElementById('match-pitch-canvas');
    const container = document.getElementById('match-pitch-container');
    if (!canvas || !container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const canvasAspectRatio = 7 / 5; // Proporção do campo (altura/largura)

    let newWidth = containerWidth;
    let newHeight = newWidth / canvasAspectRatio;

    // Se a altura calculada for maior que a do contêiner, ajusta pela altura
    if (newHeight > containerHeight) {
        newHeight = containerHeight;
        newWidth = newHeight * canvasAspectRatio;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;

    // Redesenha a partida se já estiver ativa para se adaptar ao novo tamanho
    if(gameState.isMatchLive) drawMatch();
}

function drawMatch() {
    // Desenha o campo, jogadores e bola no canvas.
    const canvas = document.getElementById('match-pitch-canvas');
    if (!canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height); // Limpa o canvas

    // Desenha o campo e linhas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // Cor das linhas
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height); // Linhas externas
    ctx.beginPath(); ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height); ctx.stroke(); // Linha do meio
    ctx.beginPath(); ctx.arc(width / 2, height / 2, height * 0.15, 0, 2 * Math.PI); ctx.stroke(); // Círculo central

    // Desenha os gols
    const goalY = (100 - PITCH_DIMS.goalHeight) / 2 / 100 * height;
    const goalH = PITCH_DIMS.goalHeight / 100 * height;
    const goalW = 2 / 100 * width; // Largura do gol (2% da largura do campo)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, goalY, goalW, goalH); // Gol da esquerda
    ctx.strokeRect(width - goalW, goalY, goalW, goalH); // Gol da direita

    // Raio dos jogadores
    const playerRadius = Math.min(width / 50, height / 35);
    const drawPlayer = (pos, color, hasBall) => {
        // Converte coordenadas de 0-100% para pixels do canvas
        const x = (pos.x / 100) * width;
        const y = (pos.y / 100) * height;
        ctx.beginPath();
        ctx.arc(x, y, playerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        // Desenha uma borda especial se o jogador tiver a bola
        if (hasBall) {
            ctx.strokeStyle = '#3DDC97'; // Cor de destaque para quem tem a bola
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
        }
        ctx.stroke();
    };

    // Desenha todos os jogadores
    for (const teamKey of ['home', 'away']) {
        const team = gameState.matchState[teamKey];
        const color = teamKey === 'home' ? '#c0392b' : '#f1c40f'; // Cores dos times
        for (const player of Object.values(team.startingXI)) {
            if (!player) continue;
            const pos = gameState.matchState.playerPositions.get(player.name);
            if(pos) drawPlayer(pos, color, gameState.matchState.ball.owner === player);
        }
    }

    // Desenha a bola
    const ballRadius = playerRadius / 2;
    const ballPos = gameState.matchState.ball;
    const ballX = (ballPos.x / 100) * width;
    const ballY = (ballPos.y / 100) * height;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
}
