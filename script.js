document.addEventListener('DOMContentLoaded', () => {

    const database = { leagues, players };
    const mainContent = document.getElementById('main-content');
    
    let gameState = {
        manager: {},
        difficulty: {},
        playerTeamId: null,
        currentDate: new Date(2025, 0, 1),
        // NOVO: Estrutura para salvar as táticas
        tactics: {
            formation: '4-4-2',
            mentality: 'Equilibrada',
            passing: 'Misto',
            pressing: 'Médio',
            lineup: {} // Ex: { 'GOL': 11001, 'LD': 11005, ... }
        }
    };

    // Objeto para definir as posições de cada formação no campo
    const formationLayouts = {
        '4-4-2': {
            'GOL': { row: 5, col: 3 },
            'LD': { row: 4, col: 1 }, 'ZAG1': { row: 4, col: 2 }, 'ZAG2': { row: 4, col: 4 }, 'LE': { row: 4, col: 5 },
            'MD': { row: 3, col: 1 }, 'MC1': { row: 3, col: 2 }, 'MC2': { row: 3, col: 4 }, 'ME': { row: 3, col: 5 },
            'ATA1': { row: 2, col: 2 }, 'ATA2': { row: 2, col: 4 }
        },
        '4-3-3': {
            'GOL': { row: 5, col: 3 },
            'LD': { row: 4, col: 1 }, 'ZAG1': { row: 4, col: 2 }, 'ZAG2': { row: 4, col: 4 }, 'LE': { row: 4, col: 5 },
            'VOL': { row: 3, col: 3 }, 'MC1': { row: 2, col: 2 }, 'MC2': { row: 2, col: 4 },
            'PD': { row: 1, col: 1 }, 'ATA': { row: 1, col: 3 }, 'PE': { row: 1, col: 5 }
        },
        '3-5-2': {
            'GOL': { row: 5, col: 3 },
            'ZAG1': { row: 4, col: 2 }, 'ZAG2': { row: 4, col: 3 }, 'ZAG3': { row: 4, col: 4 },
            'MD': { row: 3, col: 1 }, 'MC1': { row: 3, col: 2 }, 'MC2': { row: 3, col: 4 }, 'ME': { row: 3, col: 5 },
            'VOL': { row: 2, col: 3 },
            'ATA1': { row: 1, col: 2 }, 'ATA2': { row: 1, col: 4 }
        }
    };

    // =====================================================================
    // FLUXO DE NOVO JOGO (ATUALIZADO)
    // =====================================================================

    function showMainMenu() { /* ... (sem alterações) ... */ }
    
    function showManagerCreationScreen() {
        // ...
        document.getElementById('next-step').addEventListener('click', () => {
            // ... (salva dados do manager) ...
            if (gameState.manager.familyFeature) {
                showFamilySetupScreen(); // VAI PARA A FAMÍLIA SE ATIVADO
            } else {
                showDifficultyScreen(); // PULA PARA DIFICULDADE
            }
        });
    }

    // NOVA TELA DE SETUP DA FAMÍLIA
    function showFamilySetupScreen() {
        mainContent.innerHTML = `
            <div class="setup-screen">
                <h2>Qual o seu status familiar?</h2>
                <div class="family-container">
                     <p>Por enquanto, esta tela é apenas para definir o início. As funcionalidades virão depois.</p>
                     <div class="family-grid">
                        <div class="family-slot">+</div> <div class="family-slot">+</div>
                        <div class="family-slot">+</div> <div class="family-slot">+</div>
                     </div>
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
        // ...
        document.getElementById('back-to-manager').addEventListener('click', showManagerCreationScreen); // CORRIGIDO PARA VOLTAR CERTO
        // ...
    }

    function selectLeagueScreen() { /* ... */ }
    function selectTeamScreen(leagueId) { /* ... */ }
    function startGame(teamId) { /* ... */ }

    // =====================================================================
    // TELAS PRINCIPAIS DO JOGO
    // =====================================================================

    function showClubHub() {
        // ...
        const familyButtonHTML = gameState.manager.familyFeature ? `...` : '';

        mainContent.innerHTML = `
            <h2>Painel do Clube - ${team.name}</h2>
            <div class="club-hub-actions">
                <button class="hub-action-button" id="hub-squad"><img src="images/squad_icon.png"><span>Elenco</span></button>
                <button class="hub-action-button" id="hub-tactics"><img src="images/tactics_icon.png"><span>Táticas</span></button>
                <button class="hub-action-button" id="hub-calendar"><img src="images/calendar_icon.png"><span>Calendário</span></button>
                ${familyButtonHTML}
                <button class="hub-action-button" id="hub-stadium" disabled><img src="images/stadium_icon.png"><span>Estádio</span></button>
            </div>
            ...
        `;

        document.getElementById('hub-squad').addEventListener('click', showSquadScreen);
        document.getElementById('hub-tactics').addEventListener('click', showTacticsScreen); // HABILITADO
        // ...
    }

    function showSquadScreen() { /* ... (sem alterações) ... */ }
    function showCalendarScreen() { /* ... (sem alterações) ... */ }
    function showFamilyScreen() { /* ... (sem alterações) ... */ }

    // NOVA FUNÇÃO: TELA DE TÁTICAS
    function showTacticsScreen() {
        const squad = database.players.filter(p => p.teamId === gameState.playerTeamId);
        const formation = gameState.tactics.formation;
        const layout = formationLayouts[formation];

        // Gera as opções de jogador para os dropdowns
        const playerOptions = squad.map(p => `<option value="${p.id}">${p.name} (${p.pos})</option>`).join('');

        // Cria as divs para os slots dos jogadores
        let pitchHTML = Array(5).fill(0).map(() => Array(5).fill('<div></div>')).flat().join('');
        const pitchGrid = Array.from({ length: 5 }, () => Array(5).fill(null));

        for (const pos in layout) {
            const { row, col } = layout[pos];
            const selectedPlayerId = gameState.tactics.lineup[pos] || '';
            pitchGrid[row - 1][col - 1] = `
                <div class="player-slot" id="slot-${pos}">
                    <label>${pos}</label>
                    <select data-position="${pos}">
                        <option value="">Vazio</option>
                        ${squad.map(p => `<option value="${p.id}" ${p.id == selectedPlayerId ? 'selected' : ''}>${p.name} (${p.overall})</option>`).join('')}
                    </select>
                </div>
            `;
        }
        pitchHTML = pitchGrid.map(r => `<div class="pitch-row">${r.map(c => c || '<div></div>').join('')}</div>`).join('');

        mainContent.innerHTML = `
            <div class="tactics-container">
                <div class="pitch">${pitchHTML}</div>
                <div class="tactics-instructions">
                    <h3>Instruções Táticas</h3>
                    <div class="instruction-group">
                        <label for="formation-select">Formação</label>
                        <select id="formation-select">
                            <option ${formation === '4-4-2' ? 'selected' : ''}>4-4-2</option>
                            <option ${formation === '4-3-3' ? 'selected' : ''}>4-3-3</option>
                            <option ${formation === '3-5-2' ? 'selected' : ''}>3-5-2</option>
                        </select>
                    </div>
                    <div class="instruction-group">
                        <label>Mentalidade</label>
                        <select id="mentality-select">
                            <option>Retrancada</option>
                            <option selected>Equilibrada</option>
                            <option>Ofensiva</option>
                        </select>
                    </div>
                    <!-- Mais instruções aqui (Passe, Pressão, etc.) -->
                    <div class="navigation-buttons" style="flex-direction: column; gap: 10px;">
                        <button class="menu-button" id="save-tactics">Salvar Táticas</button>
                        <button class="menu-button" id="back-to-hub">Voltar</button>
                    </div>
                </div>
            </div>
        `;
        
        // Listeners
        document.getElementById('formation-select').addEventListener('change', (e) => {
            saveCurrentTactics(); // Salva antes de mudar para não perder a escalação
            gameState.tactics.formation = e.target.value;
            showTacticsScreen(); // Recarrega a tela com a nova formação
        });
        document.getElementById('save-tactics').addEventListener('click', () => {
            saveCurrentTactics();
            alert('Táticas salvas com sucesso!');
            showClubHub();
        });
        document.getElementById('back-to-hub').addEventListener('click', showClubHub);
    }
    
    // NOVA FUNÇÃO para salvar os dados da tela de táticas no gameState
    function saveCurrentTactics() {
        // Salva as instruções gerais
        gameState.tactics.mentality = document.getElementById('mentality-select').value;
        
        // Salva a escalação
        const formation = gameState.tactics.formation;
        const layout = formationLayouts[formation];
        const newLinup = {};
        for (const pos in layout) {
            const selectElement = document.querySelector(`#slot-${pos} select`);
            if (selectElement && selectElement.value) {
                newLinup[pos] = parseInt(selectElement.value);
            }
        }
        gameState.tactics.lineup = newLinup;
    }


    // --- INICIALIZAÇÃO DO JOGO ---
    showMainMenu();
});
