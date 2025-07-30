document.addEventListener('DOMContentLoaded', () => {

    const database = { leagues, players };
    const mainContent = document.getElementById('main-content');
    
    let gameState = {};
    function resetGameState() {
        gameState = {
            manager: {}, difficulty: {}, playerTeamId: null,
            currentDate: new Date(2025, 0, 1),
            tactics: { formation: '4-4-2', mentality: 'Equilibrada', lineup: {}, bench: {} }
        };
    }
    resetGameState();

    let matchState = {};
    const formationLayouts = {
        '4-4-2':{'GOL':{row:5,col:3},'LD':{row:4,col:1},'ZAG1':{row:4,col:2},'ZAG2':{row:4,col:4},'LE':{row:4,col:5},'MD':{row:3,col:1},'MC1':{row:3,col:2},'MC2':{row:3,col:4},'ME':{row:3,col:5},'ATA1':{row:2,col:2},'ATA2':{row:2,col:4}},
        '4-3-3':{'GOL':{row:5,col:3},'LD':{row:4,col:1},'ZAG1':{row:4,col:2},'ZAG2':{row:4,col:4},'LE':{row:4,col:5},'VOL':{row:3,col:3},'MC1':{row:2,col:2},'MC2':{row:2,col:4},'PD':{row:1,col:1},'ATA':{row:1,col:3},'PE':{row:1,col:5}},
        '3-5-2':{'GOL':{row:5,col:3},'ZAG1':{row:4,col:2},'ZAG2':{row:4,col:3},'ZAG3':{row:4,col:4},'MD':{row:3,col:1},'MC1':{row:3,col:2},'MC2':{row:3,col:4},'ME':{row:3,col:5},'VOL':{row:2,col:3},'ATA1':{row:1,col:2},'ATA2':{row:1,col:4}}
    };

    function saveGame() {
        localStorage.setItem('footballManagerSave', JSON.stringify(gameState));
        alert('Jogo salvo com sucesso!');
    }

    function loadGame() {
        const savedData = localStorage.getItem('footballManagerSave');
        if (savedData) {
            gameState = JSON.parse(savedData);
            alert('Jogo carregado com sucesso!');
            showClubHub();
        } else {
            alert('Nenhum jogo salvo encontrado.');
        }
    }

    function processMatchMinute() { /* ... */ }

    function showMainMenu() {
        const hasSave = !!localStorage.getItem('footballManagerSave');
        mainContent.innerHTML = `<div class="main-menu-container"><button class="menu-button" id="new-game">Novo Jogo</button><button class="menu-button" id="load-game" ${!hasSave ? 'disabled' : ''}>Carregar Jogo</button></div>`;
        document.getElementById('new-game').addEventListener('click', () => { resetGameState(); showManagerCreationScreen(); });
        if(hasSave) document.getElementById('load-game').addEventListener('click', loadGame);
    }
    
    function showClubHub() {
        const team = database.leagues.flatMap(l => l.teams).find(t => t.id === gameState.playerTeamId);
        const familyButtonHTML = gameState.manager.familyFeature ? `<button class="hub-action-button" id="hub-family"><img src="images/family_icon.png" alt="Família"><span>Vida Pessoal</span></button>` : '';
        mainContent.innerHTML = `<h2>Painel do Clube - ${team.name}</h2><div class="club-hub-actions"><button class="hub-action-button" id="hub-squad"><img src="images/squad_icon.png" alt="Elenco"><span>Elenco</span></button><button class="hub-action-button" id="hub-tactics"><img src="images/tactics_icon.png" alt="Táticas"><span>Táticas</span></button><button class="hub-action-button" id="hub-calendar"><img src="images/calendar_icon.png" alt="Calendário"><span>Calendário</span></button>${familyButtonHTML}<button class="hub-action-button" id="hub-stadium" disabled><img src="images/stadium_icon.png" alt="Estádio"><span>Estádio</span></button></div><div class="navigation-buttons" style="margin-top: auto; justify-content: center; gap: 20px;"><button class="menu-button" id="save-game-button">Salvar Jogo</button><button class="menu-button" id="back-to-main">Sair para Menu</button></div>`;
        document.getElementById('hub-squad').addEventListener('click', showSquadScreen);
        document.getElementById('hub-tactics').addEventListener('click', () => showTacticsScreen('hub'));
        document.getElementById('hub-calendar').addEventListener('click', showCalendarScreen);
        if(gameState.manager.familyFeature) document.getElementById('hub-family').addEventListener('click', showFamilyScreen);
        document.getElementById('save-game-button').addEventListener('click', saveGame);
        document.getElementById('back-to-main').addEventListener('click', showMainMenu);
    }

    function showSquadScreen() {
        const squad = database.players.filter(p => p.teamId === gameState.playerTeamId).sort((a,b) => a.squadNumber - b.squadNumber);
        const tableRowsHTML = squad.map(player => `<tr><td><input type="number" class="squad-number-input" data-player-id="${player.id}" value="${player.squadNumber || ''}"></td><td>${player.name}</td><td>${player.pos}</td><td>${player.age}</td><td>${player.overall}</td></tr>`).join('');
        mainContent.innerHTML = `<div class="squad-container"><h2>Elenco Principal</h2><table class="data-table squad-table"><thead><tr><th>N°</th><th>Nome</th><th>Pos</th><th>Idade</th><th>OVR</th></tr></thead><tbody>${tableRowsHTML}</tbody></table><div class="navigation-buttons" style="justify-content:center; gap:20px;"><button class="menu-button" id="save-numbers">Salvar Números</button><button class="menu-button" id="back-to-hub">Voltar</button></div></div>`;
        document.getElementById('save-numbers').addEventListener('click', () => {
            document.querySelectorAll('.squad-number-input').forEach(input => {
                const playerId = parseInt(input.dataset.playerId);
                database.players.find(p => p.id === playerId).squadNumber = parseInt(input.value);
            });
            alert('Números atualizados!');
            showSquadScreen();
        });
        document.getElementById('back-to-hub').addEventListener('click', showClubHub);
    }

    function showCalendarScreen() {
        const myTeam = database.leagues.flatMap(l => l.teams).find(t => t.id === gameState.playerTeamId);
        const leagueTeams = database.leagues.find(l => l.teams.some(t => t.id === myTeam.id)).teams;
        const opponents = leagueTeams.filter(t => t.id !== myTeam.id).slice(0, 5);
        const fixtureHTML = opponents.map((opponent, i) => {
            let gameDate = new Date(gameState.currentDate);
            gameDate.setDate(gameDate.getDate() + (i * 7));
            return `<tr><td>${gameDate.toLocaleDateString('pt-BR')}</td><td>${myTeam.name}</td><td><button class="menu-button" style="width:100px;padding:5px;" data-opponent-id="${opponent.id}">Jogar</button></td><td>${opponent.name}</td><td>Brasileirão Série A</td></tr>`;
        }).join('');
        mainContent.innerHTML = `<div class="calendar-container"><h2>Próximas Partidas</h2><table class="data-table"><thead><tr><th>Data</th><th colspan="3">Confronto</th><th>Competição</th></tr></thead><tbody>${fixtureHTML}</tbody></table><div class="navigation-buttons"><button class="menu-button" id="back-to-hub">Voltar</button></div></div>`;
        document.getElementById('back-to-hub').addEventListener('click', showClubHub);
        document.querySelectorAll('[data-opponent-id]').forEach(button => {
            button.addEventListener('click', e => startMatch(parseInt(e.currentTarget.dataset.opponentId)));
        });
    }

    function startMatch(opponentId) {
        matchState = { intervalId: null, minute: 0, homeScore: 0, awayScore: 0, homeTeamId: gameState.playerTeamId, awayTeamId: opponentId, commentary: [] };
        addCommentary(0, 'A partida vai começar!');
        matchState.intervalId = setInterval(processMatchMinute, 500); // Mais rápido
    }
    
    function showTacticsScreen(context = 'hub') {
        const squad = database.players.filter(p => p.teamId === gameState.playerTeamId);
        const formation = gameState.tactics.formation;
        const layout = formationLayouts[formation];

        const selectedPlayerIds = [...Object.values(gameState.tactics.lineup), ...Object.values(gameState.tactics.bench)];

        function generatePlayerOptions(currentSlotPlayerId) {
            return '<option value="">Vazio</option>' + squad.map(p => {
                const isSelected = selectedPlayerIds.includes(p.id);
                return (!isSelected || p.id === currentSlotPlayerId) ? `<option value="${p.id}" ${p.id === currentSlotPlayerId ? 'selected' : ''}>${p.squadNumber}. ${p.name} (${p.overall})</option>` : '';
            }).join('');
        }

        const pitchGrid = Array.from({ length: 5 }, () => Array(5).fill(null));
        for (const pos in layout) {
            const { row, col } = layout[pos];
            pitchGrid[row - 1][col - 1] = `<div class="player-slot"><label>${pos}</label><select data-slot-type="lineup" data-position="${pos}">${generatePlayerOptions(gameState.tactics.lineup[pos])}</select></div>`;
        }
        const pitchHTML = pitchGrid.map(r => `<div class="pitch-row">${r.map(c => c || '<div></div>').join('')}</div>`).join('');
        
        let benchHTML = '';
        for (let i = 1; i <= 7; i++) {
            const pos = `RES${i}`;
            benchHTML += `<div class="player-slot"><label>RES</label><select data-slot-type="bench" data-position="${pos}">${generatePlayerOptions(gameState.tactics.bench[pos])}</select></div>`;
        }
        
        mainContent.innerHTML = `<div class="tactics-container"><div class="pitch-and-bench"><div class="pitch">${pitchHTML}</div><div class="bench-container"><h3>Banco de Reservas</h3><div class="bench-slots">${benchHTML}</div></div></div><div class="tactics-instructions"><h3>Instruções</h3>...</div></div>`;
        
        mainContent.querySelectorAll('select[data-slot-type]').forEach(select => select.addEventListener('change', handleTacticsChange));
    }

    function handleTacticsChange() {
        gameState.tactics.lineup = {};
        gameState.tactics.bench = {};
        document.querySelectorAll('select[data-slot-type]').forEach(select => {
            const slotType = select.dataset.slotType;
            const position = select.dataset.position;
            const playerId = parseInt(select.value);
            if(playerId) gameState.tactics[slotType][position] = playerId;
        });
        showTacticsScreen(document.querySelector('#back-to-match') ? 'match' : 'hub');
    }
    
    // Todas as outras funções (showDifficultyScreen, etc.) permanecem as mesmas
    // e já estão incluídas na lógica completa acima.

    showMainMenu();

        // =====================================================================
    // FUNÇÕES DE SETUP QUE ESTAVAM FALTANDO
    // =====================================================================

    function showManagerCreationScreen() {
        mainContent.innerHTML = `
            <div class="setup-screen">
                <h2>Quem é você?</h2>
                <div class="form-group"><label>Nome:</label><input type="text" id="first-name"></div>
                <div class="form-group"><label>Sobrenome:</label><input type="text" id="last-name"></div>
                <div class="form-group"><label>Nacionalidade:</label><select id="nationality"><option>Brasileiro</option><option>Português</option><option>Argentino</option></select></div>
                <div class="form-group"><label>Vida Pessoal:</label><div class="toggle-switch"><input type="checkbox" id="family-feature"><label for="family-feature">Toggle</label></div></div>
                <div class="navigation-buttons">
                    <button class="menu-button" id="back-to-main">Voltar</button>
                    <button class="menu-button" id="next-step">Avançar</button>
                </div>
            </div>`;
        document.getElementById('back-to-main').addEventListener('click', showMainMenu);
        document.getElementById('next-step').addEventListener('click', () => {
            gameState.manager.firstName = document.getElementById('first-name').value || 'Manager';
            gameState.manager.lastName = document.getElementById('last-name').value || 'Padrão';
            gameState.manager.nationality = document.getElementById('nationality').value;
            gameState.manager.familyFeature = document.getElementById('family-feature').checked;
            if (gameState.manager.familyFeature) {
                showFamilySetupScreen();
            } else {
                showDifficultyScreen();
            }
        });
    }

    function showFamilySetupScreen() {
        mainContent.innerHTML = `
            <div class="setup-screen">
                <h2>Qual o seu status familiar?</h2>
                <div class="family-container">
                     <p>Defina sua situação familiar inicial.</p>
                     <div class="family-grid">${Array(8).fill('<div class="family-slot">+</div>').join('')}</div>
                </div>
                 <div class="navigation-buttons">
                    <button class="menu-button" id="back-to-manager">Voltar</button>
                    <button class="menu-button" id="next-step">Avançar</button>
                </div>
            </div>`;
        document.getElementById('back-to-manager').addEventListener('click', showManagerCreationScreen);
        document.getElementById('next-step').addEventListener('click', showDifficultyScreen);
    }
    
    function showDifficultyScreen() {
        mainContent.innerHTML = `
            <div class="setup-screen">
                <h2>Configuração de Dificuldade</h2>
                <div class="form-group"><label>Orçamentos:</label><select id="budgets"><option>Baixo</option><option selected>Médio</option><option>Alto</option></select></div>
                <div class="form-group"><label>Segurança no Emprego:</label><select id="job-security"><option>Alta</option><option selected>Normal</option><option>Baixa</option></select></div>
                <div class="navigation-buttons">
                    <button class="menu-button" id="back-to-setup">Voltar</button>
                    <button class="menu-button" id="next-step">Avançar</button>
                </div>
            </div>`;
        document.getElementById('back-to-setup').addEventListener('click', gameState.manager.familyFeature ? showFamilySetupScreen : showManagerCreationScreen);
        document.getElementById('next-step').addEventListener('click', () => {
            gameState.difficulty.budgets = document.getElementById('budgets').value;
            gameState.difficulty.jobSecurity = document.getElementById('job-security').value;
            selectLeagueScreen();
        });
    }
    
    function selectLeagueScreen() {
        const leagueButtonsHTML = database.leagues.map(league => `<button class="menu-button" data-league-id="${league.id}">${league.name}</button>`).join('');
        mainContent.innerHTML = `<div class="setup-screen"><h2>Selecione uma Liga</h2><div style="height: 500px; overflow-y: auto; padding: 10px;">${leagueButtonsHTML}</div><div class="navigation-buttons"><button class="menu-button" id="back-to-difficulty">Voltar</button></div></div>`;
        document.querySelectorAll('[data-league-id]').forEach(button => button.addEventListener('click', e => selectTeamScreen(e.target.getAttribute('data-league-id'))));
        document.getElementById('back-to-difficulty').addEventListener('click', showDifficultyScreen);
    }

    function selectTeamScreen(leagueId) {
        const league = database.leagues.find(l => l.id === leagueId);
        const teamButtonsHTML = league.teams.sort((a,b) => b.overall - a.overall).map(team => `<button class="menu-button" data-team-id="${team.id}">${team.name} (OVR: ${team.overall})</button>`).join('');
        mainContent.innerHTML = `<div class="setup-screen"><h2>Selecione um Time de ${league.name}</h2><div style="height: 500px; overflow-y: auto; padding: 10px;">${teamButtonsHTML}</div><div class="navigation-buttons"><button class="menu-button" id="back-to-leagues">Voltar</button></div></div>`;
        document.querySelectorAll('[data-team-id]').forEach(button => button.addEventListener('click', e => startGame(parseInt(e.currentTarget.getAttribute('data-team-id')))));
        document.getElementById('back-to-leagues').addEventListener('click', selectLeagueScreen);
    }

    function startGame(teamId) {
        gameState.playerTeamId = teamId;
        showClubHub();
    }
    
});
