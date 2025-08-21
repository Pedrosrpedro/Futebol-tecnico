// Este arquivo é o ponto de entrada principal e o orquestrador de alto nível do jogo.
// Ele gerencia o fluxo de telas, a inicialização, e os event listeners globais.
// Depende de 'globals.js', 'utils.js', 'game_logic.js', 'match_engine.js' e 'ui_manager.js'.


// --- Funções de Inicialização e Setup do Jogo (MAIN FLOW) ---
function createManager() {
    const nameInput = document.getElementById('manager-name-input');
    if (nameInput.value.trim() === '') {
        showInfoModal('Atenção', 'Por favor, digite seu nome.');
        return;
    }
    gameState.managerName = nameInput.value.trim();
    showScreen('start-screen');
}

function loadLeagues() {
    const leagueSelectionDiv = document.getElementById('league-selection');
    leagueSelectionDiv.innerHTML = '';
    for (const leagueId in leaguesData) {
        const league = leaguesData[leagueId];
        const leagueCard = document.createElement('div');
        leagueCard.className = 'league-card';
        leagueCard.innerHTML = `<img src="images/${league.logo}" alt="${league.name}" onerror="this.onerror=null; this.src='images/logo_default.png';"><span>${league.name}</span>`;
        // Remove e adiciona listener para evitar duplicações
        const newLeagueCard = leagueCard.cloneNode(true);
        leagueCard.parentNode?.replaceChild(newLeagueCard, leagueCard);
        newLeagueCard.addEventListener('click', () => loadTeams(leagueId));
        leagueSelectionDiv.appendChild(newLeagueCard);
    }
}

function loadTeams(leagueId) {
    gameState.currentLeagueId = leagueId;
    const teamSelectionDiv = document.getElementById('team-selection');
    teamSelectionDiv.innerHTML = '';
    const teams = leaguesData[leagueId].teams;
    for (const team of teams) {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        teamCard.innerHTML = `<img src="images/${team.logo}" alt="${team.name}" onerror="this.onerror=null; this.src='images/logo_default.png';"><span>${team.name}</span>`;
        // Remove e adiciona listener para evitar duplicações
        const newTeamCard = teamCard.cloneNode(true);
        teamCard.parentNode?.replaceChild(newTeamCard, teamCard);
        newTeamCard.addEventListener('click', () => startGame(team));
        teamSelectionDiv.appendChild(newTeamCard);
    }
    showScreen('select-team-screen');
}

function createClub() {
    const clubName = document.getElementById('club-name-input').value;
    if (!clubName) {
        showInfoModal("Atenção", "Por favor, preencha o nome do clube.");
        return;
    }
    // Para um clube criado, ele sempre começa na Série C por padrão
    gameState.currentLeagueId = 'brasileirao_c';
    const generatedPlayers = [];
    for (let i = 0; i < 22; i++) { // Gera 22 jogadores para o novo clube
        generatedPlayers.push(generateNewPlayer({ name: clubName })); // Reusa a função de gerar jogador
    }
    const newClub = { name: clubName, logo: 'logo_default.png', players: generatedPlayers };
    startGame(newClub);
}

function startGame(team) {
    // Inicia o jogo principal após a seleção/criação do clube.
    gameState.userClub = team;

    // Garante que todos os dados dos jogadores estejam mesclados (biografia, contratos)
    mergeAllData();

    // Inicializa os agentes livres com dados completos (overall, valor de mercado)
    if (typeof freeAgents !== 'undefined' && freeAgents.players) {
        gameState.freeAgents = freeAgents.players.map(p => {
            if (!p.overall && p.attributes) p.overall = calculatePlayerOverall(p);
            if (!p.marketValue) updateMarketValue(p);
            p.contractUntil = 0; // Agentes livres não têm contrato
            return p;
        });
    }

    initializeAllPlayerData(); // Garante que todos os jogadores de *todos* os clubes tenham overall e valor
    assignSponsors(); // Atribui patrocinadores a todos os clubes
    initializeClubFinances(); // Configura as finanças do clube do usuário
    initializeSeason(); // Inicia a temporada

    // Atualiza o cabeçalho da UI
    document.getElementById('header-manager-name').innerText = gameState.managerName;
    document.getElementById('header-club-name').innerText = gameState.userClub.name;
    document.getElementById('header-club-logo').src = `images/${gameState.userClub.logo}`;
    document.getElementById('header-club-logo').onerror = function() { this.onerror=null; this.src='images/logo_default.png'; };


    populateLeagueSelectors(); // Preenche os seletores de liga na UI
    showScreen('main-game-screen'); // Mostra a tela principal do jogo
    showMainContent('home-content'); // Mostra o conteúdo da página inicial
}


// --- Funções de Fluxo de Tempo ---
function advanceDay() {
    // Esta função é o coração do avanço do tempo no jogo.
    // Ela chama a lógica do game_logic e as atualizações de UI.
    const today = new Date(gameState.currentDate);

    // Lógica de fim de ano
    if (today.getMonth() === 11 && today.getDate() === 31) { // 31 de Dezembro
        handleEndOfSeason(); // Processa fim de temporada (prêmios, notícias)
        // O `triggerNewSeason()` é chamado após o `advanceDay` nesta data, dentro da própria função `advanceDay`
        // para garantir que a data avance para 1 de Janeiro antes da nova temporada.
    }

    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);
    gameState.currentDate = nextDay;

    // Lógicas mensais (executadas no primeiro dia de cada mês)
    if (today.getDate() === 1) {
        updateMonthlyContracts(); // Salários e contratos
        addTransaction(-gameState.clubFinances.fixedMonthlyExpenses, "Despesas Operacionais Fixas"); // Despesas fixas
        if (gameState.clubSponsor) { // Receita de Patrocínio
            addTransaction(gameState.clubSponsor.monthlyIncome, `Receita de Patrocínio (${gameState.clubSponsor.name})`);
        }
        handleExpiredContracts(); // Libera jogadores com contrato vencido
        aiContractManagement(); // IA gerencia contratos
        aiTransferLogic(); // IA faz transferências
        checkExpiringContracts(); // Notifica contratos expirando do usuário
    }

    simulateDayMatches(); // Simula todas as partidas do dia
    checkSeasonEvents(); // Verifica eventos de liga (fases da Série C)
    findNextUserMatch(); // Atualiza o próximo jogo do usuário
    Object.keys(leaguesData).forEach(id => updateLeagueTable(id)); // Atualiza as tabelas de todas as ligas (visível na UI)
    updateContinueButton(); // Atualiza o texto do botão de avançar dia na UI

    // Atualiza as telas abertas se o usuário estiver nelas
    if (gameState.currentMainContent === 'calendar-content') updateCalendar();
    if (gameState.currentMainContent === 'finances-content') displayFinances();
    if (gameState.currentMainContent === 'tickets-content') displayTicketsScreen();
}

function advanceDayOnHoliday() {
    // Avança os dias automaticamente durante as férias.
    if (new Date(gameState.currentDate) >= gameState.holidayEndDate) {
        stopHoliday();
        return;
    }
    // Interrompe as férias se for dia de jogo do usuário
    const matchToday = gameState.nextUserMatch && isSameDay(gameState.currentDate, new Date(gameState.nextUserMatch.date));
    if (matchToday) {
        stopHoliday();
        showInfoModal("Férias Interrompidas", "Suas férias foram interrompidas pois hoje é dia de jogo!");
        return;
    }
    advanceDay();
}

function stopHoliday() {
    // Para o modo de férias.
    clearInterval(holidayInterval);
    holidayInterval = null;
    gameState.isOnHoliday = false;
    gameState.holidayEndDate = null;
    document.getElementById('cancel-holiday-btn').style.display = 'none';
    updateContinueButton();
    findNextUserMatch();
}


// #####################################################################
// #                                                                   #
// #                       INÍCIO E FIM DA PARTIDA                     #
// #                                                                   #
// #####################################################################

function startMatchSimulation() {
    // Inicia a simulação visual da partida.
    document.getElementById('match-confirmation-modal').classList.remove('active');
    const startingXIKeys = Object.keys(gameState.squadManagement.startingXI);
    // Valida se há 11 jogadores escalados
    if (startingXIKeys.length !== 11 || startingXIKeys.some(key => !gameState.squadManagement.startingXI[key] || !gameState.squadManagement.startingXI[key].name)) {
        showInfoModal("Escalação Incompleta", "Você precisa de 11 jogadores na escalação titular para começar a partida!");
        showMainContent('tactics-content'); // Volta para a tela de táticas
        return;
    }

    showScreen('match-simulation-screen'); // Troca para a tela de simulação

    // Pequeno delay para garantir que a tela seja renderizada antes de iniciar o loop
    setTimeout(() => {
        gameState.isMatchLive = true;
        gameState.isPaused = false;
        // CHAMA A FUNÇÃO DO match_engine.js
        startMatchSimulationCore();
    }, 500);
}


// --- Event Listeners Globais ---
function initializeEventListeners() {
    // Managers e telas iniciais
    document.getElementById('confirm-manager-name-btn').addEventListener('click', createManager);
    document.getElementById('go-to-new-club-btn').addEventListener('click', () => showScreen('new-club-screen'));
    document.getElementById('go-to-select-league-btn').addEventListener('click', () => { loadLeagues(); showScreen('select-league-screen'); });
    document.getElementById('create-new-club-btn').addEventListener('click', createClub);
    document.getElementById('new-club-back-btn').addEventListener('click', () => showScreen('start-screen'));
    document.getElementById('select-league-back-btn').addEventListener('click', () => showScreen('start-screen'));
    document.getElementById('select-team-back-btn').addEventListener('click', () => { loadLeagues(); showScreen('select-league-screen'); }); // Recarrega ligas

    // Botões de cabeçalho
    document.getElementById('exit-game-btn').addEventListener('click', () => window.location.reload());
    document.getElementById('settings-btn').addEventListener('click', openSettingsModal);

    // Sidebar
    document.querySelectorAll('#sidebar li').forEach(item => {
        // Clonar e substituir o item para remover listeners antigos
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        newItem.addEventListener('click', () => showMainContent(newItem.dataset.content));
    });

    // Calendário e Férias
    document.getElementById('calendar-container')?.addEventListener('click', handleCalendarDayClick);
    document.getElementById('confirm-holiday-btn')?.addEventListener('click', startHoliday);
    document.getElementById('cancel-holiday-btn')?.addEventListener('click', stopHoliday);
    document.getElementById('close-holiday-modal-btn')?.addEventListener('click', () => document.getElementById('holiday-confirmation-modal').classList.remove('active'));
    document.getElementById('cancel-holiday-btn-modal')?.addEventListener('click', () => document.getElementById('holiday-confirmation-modal').classList.remove('active'));

    // Modais de Notícias e Info
    document.getElementById('close-user-news-modal-btn')?.addEventListener('click', () => document.getElementById('user-news-modal').classList.remove('active'));
    document.getElementById('confirm-user-news-btn')?.addEventListener('click', () => document.getElementById('user-news-modal').classList.remove('active'));
    document.getElementById('close-info-modal-btn')?.addEventListener('click', () => document.getElementById('info-modal').classList.remove('active'));
    document.getElementById('confirm-info-modal-btn')?.addEventListener('click', () => document.getElementById('info-modal').classList.remove('active'));
    document.getElementById('close-friendly-result-modal-btn')?.addEventListener('click', () => document.getElementById('friendly-result-modal').classList.remove('active'));
    document.getElementById('confirm-friendly-result-btn')?.addEventListener('click', () => document.getElementById('friendly-result-modal').classList.remove('active'));

    // Configurações (modal)
    document.getElementById('close-modal-btn')?.addEventListener('click', closeSettingsModal);
    document.getElementById('fullscreen-btn')?.addEventListener('click', toggleFullScreen);
    document.getElementById('settings-modal')?.addEventListener('click', (e) => { if (e.target.id === 'settings-modal') { closeSettingsModal(); } });
    document.getElementById('currency-selector')?.addEventListener('change', (e) => {
        gameState.currency = e.target.value;
        // Atualiza as telas que mostram moeda
        if (gameState.currentMainContent === 'finances-content') displayFinances();
        if (gameState.currentMainContent === 'squad-content') loadSquadTable();
        if (gameState.currentMainContent === 'contracts-content') displayContractsScreen();
        if (gameState.currentMainContent === 'transfer-market-content') displayTransferMarket();
        if (gameState.currentMainContent === 'sponsorship-content') displaySponsorshipScreen();
        if (gameState.currentMainContent === 'tickets-content') displayTicketsScreen();
    });

    // Amistosos
    document.getElementById('open-friendly-modal-btn')?.addEventListener('click', openFriendlyModal);
    document.getElementById('close-friendly-modal-btn')?.addEventListener('click', () => document.getElementById('schedule-friendly-modal').classList.remove('active'));
    document.getElementById('cancel-schedule-friendly-btn')?.addEventListener('click', () => document.getElementById('schedule-friendly-modal').classList.remove('active'));
    document.getElementById('confirm-schedule-friendly-btn')?.addEventListener('click', scheduleFriendlyMatch);

    // Táticas
    document.getElementById('tactics-content')?.addEventListener('click', handleTacticsInteraction);
    document.querySelectorAll('#tactics-content select, #tactics-content input[type="checkbox"]').forEach(element => {
        // Clonar e substituir o elemento para remover listeners antigos
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        newElement.addEventListener('change', (e) => {
            e.stopPropagation();
            const tacticKey = e.target.id.replace('tactic-', '').replace(/-([a-z])/g, g => g[1].toUpperCase());
            if (e.target.type === 'checkbox') {
                gameState.tactics[tacticKey] = e.target.checked;
            } else {
                gameState.tactics[tacticKey] = e.target.value;
            }
            if (tacticKey === 'formation') { // Se a formação mudar, reorganiza o time
                setupInitialSquad();
            }
            loadTacticsScreen(); // Recarrega a tela de táticas
        });
    });

    // Botões de minimizar/maximizar painéis de táticas (CORREÇÃO DE BOTOES)
    document.querySelectorAll('.panel-toggle-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true); // Clone para remover listeners antigos
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const panelName = e.currentTarget.dataset.panel;
            const container = document.getElementById('tactics-layout-container');
            container.classList.toggle(`${panelName}-collapsed`);

            // Atualiza a visibilidade dos botões de abrir/fechar
            if (panelName === 'instructions') {
                document.querySelector('.panel-toggle-btn.open-instructions-btn').style.display = container.classList.contains('instructions-collapsed') ? 'flex' : 'none';
            } else if (panelName === 'squad') {
                document.querySelector('.panel-toggle-btn.open-squad-btn').style.display = container.classList.contains('squad-collapsed') ? 'flex' : 'none';
            }
        });
    });

    // Modal de confirmação de partida
    document.getElementById('confirm-and-play-btn')?.addEventListener('click', startMatchSimulation);
    document.getElementById('cancel-play-btn')?.addEventListener('click', () => {
        document.getElementById('match-confirmation-modal').classList.remove('active');
        showMainContent('tactics-content'); // Volta para as táticas
    });
    document.getElementById('close-confirmation-modal-btn')?.addEventListener('click', () => {
        document.getElementById('match-confirmation-modal').classList.remove('active');
    });

    // Controles de partida (em jogo)
    document.getElementById('pause-match-btn')?.addEventListener('click', () => togglePause());
    document.getElementById('resume-match-btn')?.addEventListener('click', () => togglePause());
    document.getElementById('close-post-match-btn')?.addEventListener('click', () => {
        document.getElementById('post-match-report-modal').classList.remove('active');
        showScreen('main-game-screen'); // Volta para a tela principal
        updateContinueButton(); // Atualiza o botão de avançar dia
    });

    // Listeners do modal de negociação
    document.getElementById('close-negotiation-modal-btn')?.addEventListener('click', () => document.getElementById('negotiation-modal').classList.remove('active'));
    document.getElementById('submit-offer-btn')?.addEventListener('click', handleNegotiationOffer);
    document.getElementById('accept-demand-btn')?.addEventListener('click', () => {
        const { desiredDuration, desiredBonus } = gameState.negotiationState;
        finalizeDeal(desiredDuration * 12, desiredBonus); // Aceita a demanda do jogador
    });
    document.getElementById('walk-away-btn')?.addEventListener('click', () => document.getElementById('negotiation-modal').classList.remove('active'));
}


// Event listeners para elementos dentro do painel principal que podem ser recarregados
// e precisam de listeners reanexados (ex: seletores de liga, botões de rodada)
function addMainScreenEventListeners() {
    document.getElementById('league-table-selector')?.addEventListener('change', (e) => {
        gameState.tableView.leagueId = e.target.value;
        updateLeagueTable(gameState.tableView.leagueId);
    });
    document.getElementById('matches-league-selector')?.addEventListener('change', (e) => {
        gameState.matchesView.leagueId = e.target.value;
        gameState.matchesView.round = findCurrentRound(e.target.value);
        displayRound(gameState.matchesView.leagueId, gameState.matchesView.round);
    });
    document.getElementById('prev-round-btn')?.addEventListener('click', () => {
        if (gameState.matchesView.round > 1) {
            gameState.matchesView.round--;
            displayRound(gameState.matchesView.leagueId, gameState.matchesView.round);
        }
    });
    document.getElementById('next-round-btn')?.addEventListener('click', () => {
        gameState.matchesView.round++;
        displayRound(gameState.matchesView.leagueId, gameState.matchesView.round);
    });
}


// Inicia o jogo quando o DOM é completamente carregado.
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners(); // Inicializa todos os listeners fixos
    loadLeagues(); // Carrega as opções de liga na tela inicial
    window.addEventListener('resize', resizeCanvas); // Responde a redimensionamento da janela

    // Observer para reanexar listeners quando a tela principal do jogo fica ativa
    const observer = new MutationObserver((mutations) => {
        for(let mutation of mutations) {
            if (mutation.attributeName === 'class' && mutation.target.id === 'main-game-screen' && mutation.target.classList.contains('active')) {
                addMainScreenEventListeners(); // Adiciona listeners para elementos do painel principal
                break;
            }
        }
    });
    observer.observe(document.getElementById('main-game-screen'), { attributes: true });
});
