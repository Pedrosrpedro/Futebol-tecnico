document.addEventListener('DOMContentLoaded', () => {

    // =====================================================================
    // ESTADO E BANCO DE DADOS
    // =====================================================================

    const database = { leagues, players };
    const mainContent = document.getElementById('main-content');
    
    let gameState = {
        manager: {
            firstName: '',
            lastName: '',
            nationality: '',
            familyFeature: false,
        },
        difficulty: {
            budgets: 'Médio',
            jobSecurity: 'Normal',
        },
        playerTeamId: null,
        currentDate: new Date(2025, 0, 1),
        tactics: {
            formation: '4-4-2',
            mentality: 'Equilibrada',
            lineup: {}
        }
    };

    let matchState = {
        intervalId: null,
        minute: 0,
        homeScore: 0,
        awayScore: 0,
        homeTeamId: null,
        awayTeamId: null,
        commentary: [],
    };

    const formationLayouts = {
        '4-4-2': {
            'GOL': { row: 5, col: 3 }, 'LD': { row: 4, col: 1 }, 'ZAG1': { row: 4, col: 2 }, 'ZAG2': { row: 4, col: 4 }, 'LE': { row: 4, col: 5 },
            'MD': { row: 3, col: 1 }, 'MC1': { row: 3, col: 2 }, 'MC2': { row: 3, col: 4 }, 'ME': { row: 3, col: 5 },
            'ATA1': { row: 2, col: 2 }, 'ATA2': { row: 2, col: 4 }
        },
        '4-3-3': {
            'GOL': { row: 5, col: 3 }, 'LD': { row: 4, col: 1 }, 'ZAG1': { row: 4, col: 2 }, 'ZAG2': { row: 4, col: 4 }, 'LE': { row: 4, col: 5 },
            'VOL': { row: 3, col: 3 }, 'MC1': { row: 2, col: 2 }, 'MC2': { row: 2, col: 4 },
            'PD': { row: 1, col: 1 }, 'ATA': { row: 1, col: 3 }, 'PE': { row: 1, col: 5 }
        },
        '3-5-2': {
            'GOL': { row: 5, col: 3 }, 'ZAG1': { row: 4, col: 2 }, 'ZAG2': { row: 4, col: 3 }, 'ZAG3': { row: 4, col: 4 },
            'MD': { row: 3, col: 1 }, 'MC1': { row: 3, col: 2 }, 'MC2': { row: 3, col: 4 }, 'ME': { row: 3, col: 5 },
            'VOL': { row: 2, col: 3 }, 'ATA1': { row: 1, col: 2 }, 'ATA2': { row: 1, col: 4 }
        }
    };

    // =====================================================================
    // MOTOR DE SIMULAÇÃO DE PARTIDAS
    // =====================================================================

    function calculateTeamRatings(teamId, teamLineup, teamMentality) {
        let attack = 0;
        let defense = 0;
        const lineupPlayers = Object.values(teamLineup).map(playerId => database.players.find(p => p.id === playerId)).filter(p => p);

        if (lineupPlayers.length < 11) return { attack: 30, defense: 30 };

        lineupPlayers.forEach(player => {
            const att = player.att;
            attack += (att.PAS + att.DRI + att.FIN + att.RIT) / 4;
            defense += (att.DEF + att.RIT + att.PAS) / 3;
        });

        if (teamMentality === 'Ofensiva') { attack *= 1.15; defense *= 0.9; }
        if (teamMentality === 'Retrancada') { attack *= 0.85; defense *= 1.1; }

        return {
            attack: attack / lineupPlayers.length,
            defense: defense / lineupPlayers.length
        };
    }

    function processMatchMinute() {
        matchState.minute++;
        if (matchState.minute > 90) {
            clearInterval(matchState.intervalId);
            matchState.intervalId = null;
            addCommentary(90, `Fim de Jogo!`);
            document.getElementById('match-tactics').disabled = true; // Desabilita botão de táticas no fim
            return;
        }

        const homeRatings = calculateTeamRatings(matchState.homeTeamId, gameState.tactics.lineup, gameState.tactics.mentality);
        const awayTeam = database.leagues.flatMap(l => l.teams).find(t => t.id === matchState.awayTeamId);
        const awayRatings = { attack: awayTeam.overall * 0.9, defense: awayTeam.overall * 0.9 }; // IA simples

        const eventChance = Math.random() * 100;
        if (eventChance > 60) {
            const homePower = homeRatings.attack - awayRatings.defense;
            const awayPower = awayRatings.attack - homeRatings.defense;
            
            if (Math.random() * (homePower + awayPower) > awayPower) {
                const attackers = Object.keys(gameState.tactics.lineup).filter(pos => pos.includes('ATA'));
                const chosenAttackerPos = attackers[Math.floor(Math.random() * attackers.length)];
                const attacker = database.players.find(p => p.id === gameState.tactics.lineup[chosenAttackerPos]);

                if (attacker && Math.random() * 100 < attacker.att.FIN - 20) {
                    matchState.homeScore++;
                    addCommentary(matchState.minute, `GOL! ${attacker.name} finaliza com precisão!`);
                } else {
                    addCommentary(matchState.minute, `${attacker ? attacker.name : 'O ataque'} tenta, mas a defesa adversária corta.`);
                }
            } else {
                if (Math.random() * 100 < 15) { // Chance do adversário marcar
                    matchState.awayScore++;
                    addCommentary(matchState.minute, `GOL DO ADVERSÁRIO! Falha na marcação permite o gol.`);
                } else {
                    addCommentary(matchState.minute, `Pressão do time visitante, mas nossa defesa se segura.`);
                }
            }
        }
        updateMatchScreen();
    }

    function addCommentary(minute, text) {
        matchState.commentary.unshift({ minute, text });
        if (matchState.commentary.length > 100) matchState.commentary.pop();
        updateMatchScreen();
    }

    // =====================================================================
    // TELAS E FLUXO DE JOGO
    // =====================================================================

    function showMainMenu() {
        mainContent.innerHTML = `
            <div class="main-menu-container">
                <button class="menu-button" id="new-game">Novo Jogo</button>
                <button class="menu-button" id="load-game" disabled>Carregar Jogo</button>
                <button class="menu-button" id="credits">Créditos</button>
            </div>
        `;
        document.getElementById('new-game').addEventListener('click', showManagerCreationScreen);
        document.getElementById('credits').addEventListener('click', () => alert('Jogo criado por você com a ajuda da IA!'));
    }

    function showManagerCreationScreen() {
        mainContent.innerHTML = `
            <div class="setup-screen">
                <h2>Quem é você?</h2>
                <div class="form-group"><label for="first-name">Nome:</label><input type="text" id="first-name"></div>
                <div class="form-group"><label for="last-name">Sobrenome:</label><input type="text" id="last-name"></div>
                <div class="form-group"><label for="nationality">Nacionalidade:</label><select id="nationality"><option>Brasileiro</option><option>Português</option><option>Argentino</option></select></div>
                <div class="form-group"><label>Vida Pessoal:</label><div class="toggle-switch"><input type="checkbox" id="family-feature"><label for="family-feature">Toggle</label></div></div>
                <div class="navigation-buttons">
                    <button class="menu-button" id="back-to-main">Voltar</button>
                    <button class="menu-button" id="next-step">Avançar</button>
                </div>
            </div>
        `;
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
                     <div class="family-grid"><div class="family-slot">+</div><div class="family-slot">+</div><div class="family-slot">+</div><div class="family-slot">+</div></div>
                </div>
                 <div class="navigation-buttons">
                    <button class="menu-button" id="back-to-manager">Voltar</button>
                    <button class="menu-button" id="next-step">Avançar</button>
                </div>
            </div>
        `;
        document.getElementById('back-to-manager').addEventListener('click', showManagerCreationScreen);
        document.getElementById('next-step').addEventListener('click', showDifficultyScreen);
    }

    function showDifficultyScreen() {
        mainContent.innerHTML = `
            <div class="setup-screen">
                <h2>Configuração de Dificuldade</h2>
                <div class="form-group"><label for="budgets">Orçamentos:</label><select id="budgets"><option>Baixo</option><option selected>Médio</option><option>Alto</option></select></div>
                <div class="form-group"><label for="job-security">Segurança no Emprego:</label><select id="job-security"><option>Alta</option><option selected>Normal</option><option>Baixa</option></select></div>
                <div class="navigation-buttons">
                    <button class="menu-button" id="back-to-manager">Voltar</button>
                    <button class="menu-button" id="next-step">Avançar</button>
                </div>
            </div>
        `;
        document.getElementById('back-to-manager').addEventListener('click', showManagerCreationScreen);
        document.getElementById('next-step').addEventListener('click', () => {
            gameState.difficulty.budgets = document.getElementById('budgets').value;
            gameState.difficulty.jobSecurity = document.getElementById('job-security').value;
            selectLeagueScreen();
        });
    }

    function selectLeagueScreen() {
        const leagueButtonsHTML = database.leagues.map(league => `<button class="menu-button" data-league-id="${league.id}">${league.name}</button>`).join('');
        mainContent.innerHTML = `
            <div class="setup-screen">
                <h2>Selecione uma Liga</h2>
                <div style="height: 500px; overflow-y: auto; padding: 10px;">${leagueButtonsHTML}</div>
                <div class="navigation-buttons"><button class="menu-button" id="back-to-difficulty">Voltar</button></div>
            </div>
        `;
        document.querySelectorAll('[data-league-id]').forEach(button => button.addEventListener('click', e => selectTeamScreen(e.target.getAttribute('data-league-id'))));
        document.getElementById('back-to-difficulty').addEventListener('click', showDifficultyScreen);
    }
    
    function selectTeamScreen(leagueId) {
        const league = database.leagues.find(l => l.id === leagueId);
        const teamButtonsHTML = league.teams.sort((a,b) => b.overall - a.overall).map(team => `<button class="menu-button" data-team-id="${team.id}">${team.name} (OVR: ${team.overall})</button>`).join('');
        mainContent.innerHTML = `
            <div class="setup-screen">
                <h2>Selecione um Time de ${league.name}</h2>
                <div style="height: 500px; overflow-y: auto; padding: 10px;">${teamButtonsHTML}</div>
                <div class="navigation-buttons"><button class="menu-button" id="back-to-leagues">Voltar</button></div>
            </div>
        `;
        document.querySelectorAll('[data-team-id]').forEach(button => button.addEventListener('click', e => startGame(parseInt(e.currentTarget.getAttribute('data-team-id')))));
        document.getElementById('back-to-leagues').addEventListener('click', selectLeagueScreen);
    }

    function startGame(teamId) {
        gameState.playerTeamId = teamId;
        showClubHub();
    }

    function showClubHub() {
        const team = database.leagues.flatMap(l => l.teams).find(t => t.id === gameState.playerTeamId);
        const familyButtonHTML = gameState.manager.familyFeature ? `<button class="hub-action-button" id="hub-family"><img src="images/family_icon.png" alt="Família"><span>Vida Pessoal</span></button>` : '';

        mainContent.innerHTML = `
            <h2>Painel do Clube - ${team.name}</h2>
            <div class="club-hub-actions">
                <button class="hub-action-button" id="hub-squad"><img src="images/squad_icon.png" alt="Elenco"><span>Elenco</span></button>
                <button class="hub-action-button" id="hub-tactics"><img src="images/tactics_icon.png" alt="Táticas"><span>Táticas</span></button>
                <button class="hub-action-button" id="hub-calendar"><img src="images/calendar_icon.png" alt="Calendário"><span>Calendário</span></button>
                ${familyButtonHTML}
                <button class="hub-action-button" id="hub-stadium" disabled><img src="images/stadium_icon.png" alt="Estádio"><span>Estádio</span></button>
            </div>
            <div class="navigation-buttons" style="margin-top: 40px;"><button class="menu-button" id="back-to-main">Sair para Menu</button></div>
        `;

        document.getElementById('hub-squad').addEventListener('click', showSquadScreen);
        document.getElementById('hub-tactics').addEventListener('click', () => showTacticsScreen('hub'));
        document.getElementById('hub-calendar').addEventListener('click', showCalendarScreen);
        if (gameState.manager.familyFeature) {
            document.getElementById('hub-family').addEventListener('click', showFamilyScreen);
        }
        document.getElementById('back-to-main').addEventListener('click', showMainMenu);
    }

    function showSquadScreen() {
        const squad = database.players.filter(p => p.teamId === gameState.playerTeamId);
        const tableRowsHTML = squad.map(player => `<tr><td>${player.name}</td><td>${player.pos}</td><td>${player.age}</td><td>${player.overall}</td></tr>`).join('');
        mainContent.innerHTML = `
            <div class="squad-container">
                <h2>Elenco Principal</h2>
                <table class="data-table"><thead><tr><th>Nome</th><th>Pos</th><th>Idade</th><th>OVR</th></tr></thead><tbody>${tableRowsHTML}</tbody></table>
                <div class="navigation-buttons"><button class="menu-button" id="back-to-hub">Voltar</button></div>
            </div>
        `;
        document.getElementById('back-to-hub').addEventListener('click', showClubHub);
    }
    
    function showCalendarScreen() {
        const myTeam = database.leagues.flatMap(l => l.teams).find(t => t.id === gameState.playerTeamId);
        const leagueTeams = database.leagues.find(l => l.teams.some(t => t.id === myTeam.id)).teams;
        const opponents = leagueTeams.filter(t => t.id !== myTeam.id).slice(0, 5);
        let fixtureHTML = '';
        for (let i = 0; i < opponents.length; i++) {
            let gameDate = new Date(gameState.currentDate);
            gameDate.setDate(gameDate.getDate() + (i * 7));
            fixtureHTML += `<tr><td>${gameDate.toLocaleDateString('pt-BR')}</td><td>${myTeam.name}</td><td><button class="menu-button" style="width:100px;padding:5px;" data-opponent-id="${opponents[i].id}">Jogar</button></td><td>${opponents[i].name}</td><td>Brasileirão Série A</td></tr>`;
        }
        mainContent.innerHTML = `<div class="calendar-container"><h2>Próximas Partidas</h2><table class="data-table"><thead><tr><th>Data</th><th colspan="3">Confronto</th><th>Competição</th></tr></thead><tbody>${fixtureHTML}</tbody></table><div class="navigation-buttons"><button class="menu-button" id="back-to-hub">Voltar</button></div></div>`;
        document.getElementById('back-to-hub').addEventListener('click', showClubHub);
        document.querySelectorAll('[data-opponent-id]').forEach(button => {
            button.addEventListener('click', (e) => startMatch(parseInt(e.currentTarget.getAttribute('data-opponent-id'))));
        });
    }

    function showFamilyScreen() {
        mainContent.innerHTML = `<div class="family-container"><h2>Vida Pessoal</h2><p>Status da sua família.</p><div class="family-grid"><div class="family-slot">+</div><div class="family-slot">+</div><div class="family-slot">+</div><div class="family-slot">+</div></div><div class="navigation-buttons"><button class="menu-button" id="back-to-hub">Voltar</button></div></div>`;
        document.querySelectorAll('.family-slot').forEach(slot => slot.addEventListener('click', () => alert('Funcionalidade em desenvolvimento!')));
        document.getElementById('back-to-hub').addEventListener('click', showClubHub);
    }

    function showTacticsScreen(context = 'hub') {
        const squad = database.players.filter(p => p.teamId === gameState.playerTeamId);
        const formation = gameState.tactics.formation;
        const layout = formationLayouts[formation];
        const pitchGrid = Array.from({ length: 5 }, () => Array(5).fill(null));

        for (const pos in layout) {
            const { row, col } = layout[pos];
            const selectedPlayerId = gameState.tactics.lineup[pos] || '';
            pitchGrid[row - 1][col - 1] = `<div class="player-slot" id="slot-${pos}"><label>${pos}</label><select data-position="${pos}"><option value="">Vazio</option>${squad.map(p => `<option value="${p.id}" ${p.id == selectedPlayerId ? 'selected' : ''}>${p.name} (${p.overall})</option>`).join('')}</select></div>`;
        }
        const pitchHTML = pitchGrid.map(r => `<div class="pitch-row">${r.map(c => c || '<div></div>').join('')}</div>`).join('');

        const backButtonHTML = context === 'match'
            ? `<button class="menu-button" id="back-to-match">Voltar ao Jogo</button>`
            : `<button class="menu-button" id="back-to-hub">Voltar</button>`;

        mainContent.innerHTML = `
            <div class="tactics-container">
                <div class="pitch">${pitchHTML}</div>
                <div class="tactics-instructions">
                    <h3>Instruções Táticas</h3>
                    <div class="instruction-group"><label for="formation-select">Formação</label><select id="formation-select"><option>4-4-2</option><option>4-3-3</option><option>3-5-2</option></select></div>
                    <div class="instruction-group"><label>Mentalidade</label><select id="mentality-select"><option>Retrancada</option><option>Equilibrada</option><option>Ofensiva</option></select></div>
                    <div class="navigation-buttons" style="flex-direction: column; gap: 10px; margin-top: auto;">
                        <button class="menu-button" id="save-tactics">Salvar Táticas</button>${backButtonHTML}
                    </div>
                </div>
            </div>`;
        
        document.getElementById('formation-select').value = formation;
        document.getElementById('mentality-select').value = gameState.tactics.mentality;

        document.getElementById('formation-select').addEventListener('change', e => {
            saveCurrentTactics();
            gameState.tactics.formation = e.target.value;
            showTacticsScreen(context);
        });
        document.getElementById('save-tactics').addEventListener('click', () => { saveCurrentTactics(); alert('Táticas salvas!'); });
        
        if (context === 'match') {
            document.getElementById('back-to-match').addEventListener('click', () => {
                saveCurrentTactics();
                if(matchState.minute <= 90) matchState.intervalId = setInterval(processMatchMinute, 1000);
            });
        } else {
            document.getElementById('back-to-hub').addEventListener('click', showClubHub);
        }
    }

    function updateMatchScreen() {
        if (!document.querySelector('.match-container')) return;
        const homeTeam = database.leagues.flatMap(l => l.teams).find(t => t.id === matchState.homeTeamId);
        const awayTeam = database.leagues.flatMap(l => l.teams).find(t => t.id === matchState.awayTeamId);
        const commentaryHTML = matchState.commentary.map(e => `<div class="commentary-entry"><span class="minute">${e.minute}'</span><span class="text">${e.text}</span></div>`).join('');
        document.querySelector('.scoreboard').innerText = `${homeTeam.name} ${matchState.homeScore} x ${matchState.awayScore} ${awayTeam.name}`;
        document.querySelector('.match-time').innerText = `${matchState.minute}'`;
        document.querySelector('.commentary-box').innerHTML = commentaryHTML;
    }

    function saveCurrentTactics() {
        gameState.tactics.mentality = document.getElementById('mentality-select').value;
        const formation = gameState.tactics.formation;
        const layout = formationLayouts[formation];
        const newLineup = {};
        for (const pos in layout) {
            const select = document.querySelector(`#slot-${pos} select`);
            if (select && select.value) newLineup[pos] = parseInt(select.value);
        }
        gameState.tactics.lineup = newLineup;
    }

    // --- INICIALIZAÇÃO DO JOGO ---
    showMainMenu();
});
