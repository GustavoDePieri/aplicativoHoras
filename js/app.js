class PontoApp {
    constructor() {
        this.inicializarElementos();
        this.preencherSeletorAno();
        this.configurarMesAnoAtual();
        this.adicionarEventListeners();
        this.carregarRegistrosMesAtual();
    }

    inicializarElementos() {
        // Inputs do formulário
        this.dataInput = document.getElementById('data');
        this.entradaInput = document.getElementById('entrada');
        this.almocoInput = document.getElementById('almoco');
        this.saidaInput = document.getElementById('saida');
        this.salvarBtn = document.getElementById('salvar');

        // Lista de registros
        this.listaRegistros = document.getElementById('lista-registros');
        
        // Seletor de mês e ano
        this.mesSelect = document.getElementById('mes-select');
        this.anoSelect = document.getElementById('ano-select');
        this.filtrarMesAnoBtn = document.getElementById('filtrar-mes-ano');

        // Configurar data atual
        if (this.dataInput && !this.dataInput.value) {
            this.dataInput.value = TimeUtils.obterDataAtual();
        }

        // Configurar horário de almoço inicial
        if (this.almocoInput) {
            this.almocoInput.value = TimeUtils.gerarHorarioAlmoco();
        }
        
        // Preencher automaticamente o horário de entrada com a hora atual
        if (this.entradaInput && !this.entradaInput.value) {
            this.entradaInput.value = TimeUtils.obterHoraAtual();
        }

        // Adicionar botão de exportar
        this.exportarCsvBtn = document.getElementById('exportar-csv');
    }
    
    preencherSeletorAno() {
        const anos = TimeUtils.gerarAnosDisponiveis();
        const anoAtual = TimeUtils.obterAnoAtual();
        
        // Limpar seletor
        this.anoSelect.innerHTML = '';
        
        // Adicionar opções
        anos.forEach(ano => {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            
            // Selecionar o ano atual por padrão
            if (ano === anoAtual) {
                option.selected = true;
            }
            
            this.anoSelect.appendChild(option);
        });
    }
    
    configurarMesAnoAtual() {
        // Selecionar o mês atual por padrão
        const mesAtual = TimeUtils.obterMesAtual();
        this.mesSelect.value = mesAtual;
    }

    adicionarEventListeners() {
        // Listener para salvar registro
        if (this.salvarBtn) {
            this.salvarBtn.addEventListener('click', () => this.salvarRegistro());
        }

        // Listener para entrada (gerar horário de almoço)
        if (this.entradaInput) {
            this.entradaInput.addEventListener('change', () => {
                if (this.almocoInput) {
                    this.almocoInput.value = TimeUtils.gerarHorarioAlmoco();
                }
            });
        }
        
        // Listener para filtrar por mês e ano
        if (this.filtrarMesAnoBtn) {
            this.filtrarMesAnoBtn.addEventListener('click', () => {
                this.filtrarPorMesAno();
            });
        }

        // Listener para exportar CSV
        if (this.exportarCsvBtn) {
            this.exportarCsvBtn.addEventListener('click', () => this.exportarCSV());
        }
        
        // Listener para saída (preencher automaticamente com a hora atual)
        if (this.saidaInput) {
            this.saidaInput.addEventListener('focus', () => {
                if (!this.saidaInput.value) {
                    this.saidaInput.value = TimeUtils.obterHoraAtual();
                }
            });
        }
    }
    
    async carregarRegistrosMesAtual() {
        try {
            const mes = this.mesSelect.value;
            const ano = this.anoSelect.value;
            
            // Calcular período
            const { dataInicial, dataFinal } = TimeUtils.calcularPeriodoMesAno(mes, ano);
            
            // Buscar registros
            const registros = await PontoStorage.buscarPorPeriodo(dataInicial, dataFinal);
            
            // Exibir registros
            this.exibirRegistros(registros);
            
            // Atualizar título da lista
            const nomeMes = this.mesSelect.options[this.mesSelect.selectedIndex].text;
            this.listaRegistros.insertAdjacentHTML('afterbegin', 
                `<h2 class="titulo-periodo">Registros de ${nomeMes} de ${ano}</h2>`);
                
        } catch (error) {
            console.error('Erro ao carregar registros do mês atual:', error);
            this.listaRegistros.innerHTML = '<p>Erro ao carregar registros.</p>';
        }
    }
    
    async filtrarPorMesAno() {
        try {
            const mes = this.mesSelect.value;
            const ano = this.anoSelect.value;
            
            // Calcular período
            const { dataInicial, dataFinal } = TimeUtils.calcularPeriodoMesAno(mes, ano);
            
            // Buscar registros
            const registros = await PontoStorage.buscarPorPeriodo(dataInicial, dataFinal);
            
            // Exibir registros
            this.exibirRegistros(registros);
            
            // Atualizar título da lista
            const nomeMes = this.mesSelect.options[this.mesSelect.selectedIndex].text;
            this.listaRegistros.innerHTML = `<h2 class="titulo-periodo">Registros de ${nomeMes} de ${ano}</h2>` + this.listaRegistros.innerHTML;
                
        } catch (error) {
            console.error('Erro ao filtrar por mês e ano:', error);
            alert('Erro ao filtrar registros!');
        }
    }

    async salvarRegistro() {
        try {
            if (!this.entradaInput.value && !this.saidaInput.value) {
                alert('Preencha pelo menos a entrada ou saída!');
                return;
            }

            if (!this.dataInput.value) {
                alert('Selecione uma data para o registro!');
                return;
            }

            const data = this.dataInput.value;
            const registro = {
                entrada: this.entradaInput.value,
                almoco: this.almocoInput.value,
                saida: this.saidaInput.value,
                totalHoras: TimeUtils.calcularHorasTrabalhadas(
                    this.entradaInput.value,
                    this.saidaInput.value,
                    this.almocoInput.value
                )
            };

            const sucesso = await PontoStorage.salvar(data, registro);
            if (sucesso) {
                alert('Registro salvo com sucesso!');
                this.carregarRegistrosMesAtual();
                
                // Limpar campos após salvar
                this.saidaInput.value = '';
            } else {
                alert('Erro ao salvar registro!');
            }
        } catch (error) {
            console.error('Erro ao salvar registro:', error);
            alert('Erro ao salvar registro!');
        }
    }

    exibirRegistros(registros) {
        if (Object.keys(registros).length === 0) {
            this.listaRegistros.innerHTML = '<p>Nenhum registro encontrado.</p>';
            return;
        }

        const html = Object.entries(registros).map(([data, registro]) => `
            <div class="registro-card" id="registro-${data}">
                <div class="registro-header">
                    <span class="registro-data">${TimeUtils.formatarData(data)}</span>
                    <div class="registro-acoes">
                        <button class="btn-editar" onclick="app.editarRegistro('${data}')">✏️ Editar</button>
                        <button class="btn-excluir" onclick="app.excluirRegistro('${data}')">🗑️ Excluir</button>
                    </div>
                </div>
                <div class="registro-info">
                    <p>Entrada: ${registro.entrada || '--:--'}</p>
                    <p>Almoço: ${registro.almoco || '--:--'}</p>
                    <p>Saída: ${registro.saida || '--:--'}</p>
                    <p>Total: ${registro.totalHoras || '--:--'}</p>
                </div>
                <div class="registro-form-edit" id="edit-${data}" style="display: none;">
                    <div class="input-group">
                        <label>Entrada:</label>
                        <input type="time" id="edit-entrada-${data}" value="${registro.entrada || ''}">
                    </div>
                    <div class="input-group">
                        <label>Almoço:</label>
                        <input type="time" id="edit-almoco-${data}" value="${registro.almoco || ''}">
                    </div>
                    <div class="input-group">
                        <label>Saída:</label>
                        <input type="time" id="edit-saida-${data}" value="${registro.saida || ''}">
                    </div>
                    <div class="registro-acoes">
                        <button onclick="app.salvarEdicao('${data}')">Salvar</button>
                        <button onclick="app.cancelarEdicao('${data}')">Cancelar</button>
                    </div>
                </div>
            </div>
        `).join('');

        this.listaRegistros.innerHTML = html;
    }

    async editarRegistro(data) {
        const registroCard = document.getElementById(`registro-${data}`);
        const formEdit = document.getElementById(`edit-${data}`);
        if (registroCard && formEdit) {
            formEdit.style.display = 'block';
        }
    }

    async salvarEdicao(data) {
        try {
            const entrada = document.getElementById(`edit-entrada-${data}`).value;
            const almoco = document.getElementById(`edit-almoco-${data}`).value;
            const saida = document.getElementById(`edit-saida-${data}`).value;

            const registro = {
                entrada,
                almoco,
                saida,
                totalHoras: TimeUtils.calcularHorasTrabalhadas(entrada, saida, almoco)
            };

            const sucesso = await PontoStorage.salvar(data, registro);
            if (sucesso) {
                alert('Registro atualizado com sucesso!');
                this.carregarRegistrosMesAtual();
            } else {
                alert('Erro ao atualizar registro!');
            }
        } catch (error) {
            console.error('Erro ao salvar edição:', error);
            alert('Erro ao atualizar registro!');
        }
    }

    cancelarEdicao(data) {
        const formEdit = document.getElementById(`edit-${data}`);
        if (formEdit) {
            formEdit.style.display = 'none';
        }
    }

    async excluirRegistro(data) {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            try {
                const sucesso = await PontoStorage.excluir(data);
                if (sucesso) {
                    alert('Registro excluído com sucesso!');
                    this.carregarRegistrosMesAtual();
                } else {
                    alert('Erro ao excluir registro!');
                }
            } catch (error) {
                console.error('Erro ao excluir:', error);
                alert('Erro ao excluir registro!');
            }
        }
    }

    async exportarCSV() {
        try {
            // Usar o mês e ano selecionados
            const mes = this.mesSelect.value;
            const ano = this.anoSelect.value;
            const nomeMes = this.mesSelect.options[this.mesSelect.selectedIndex].text;
            
            const periodo = TimeUtils.calcularPeriodoMesAno(mes, ano);
            const dataInicial = periodo.dataInicial;
            const dataFinal = periodo.dataFinal;
            
            const titulo = `${nomeMes}_${ano}`;
            
            const registros = await PontoStorage.buscarPorPeriodo(dataInicial, dataFinal);
            
            // Calcular resumo
            let totalMinutosNormais = 0;
            let totalMinutosExtras = 0;
            let diasTrabalhados = 0;
            
            // Calcular totais
            for (const registro of Object.values(registros)) {
                if (registro.totalHoras) {
                    diasTrabalhados++;
                    const [horas, minutos] = registro.totalHoras.split(':').map(Number);
                    const minutosTrabalhadosNoDia = horas * 60 + minutos;
                    
                    // Calcular horas extras (acima de 8h diárias = 480 minutos)
                    const minutosExtras = Math.max(0, minutosTrabalhadosNoDia - 480);
                    const minutosNormais = Math.min(480, minutosTrabalhadosNoDia);
                    
                    totalMinutosNormais += minutosNormais;
                    totalMinutosExtras += minutosExtras;
                }
            }
            
            // Converter minutos para formato HH:mm
            const totalHoras = TimeUtils.converterParaHoras(totalMinutosNormais + totalMinutosExtras);
            const totalNormal = TimeUtils.converterParaHoras(totalMinutosNormais);
            const totalExtras = TimeUtils.converterParaHoras(totalMinutosExtras);
            
            // Mostrar resumo
            const resumo = `📊 Resumo do Período\n\n` +
                          `📅 Dias trabalhados: ${diasTrabalhados}\n` +
                          `⏰ Total de horas normais: ${totalNormal}\n` +
                          `⭐ Total de horas extras: ${totalExtras}\n` +
                          `📈 Total geral: ${totalHoras}`;
            
            alert(resumo);
            
            // Exportação do CSV com horas extras
            let csv = 'Data,Dia da Semana,Entrada,Almoço,Saída,Horas Normais,Horas Extras,Total Horas\n';
            
            for (const [data, registro] of Object.entries(registros)) {
                const dataFormatada = TimeUtils.formatarData(data);
                const diaSemana = dataFormatada.split(',')[0];
                
                // Calcular horas extras do dia
                let horasNormais = "00:00";
                let horasExtras = "00:00";
                let totalHoras = registro.totalHoras || "00:00";

                if (registro.totalHoras) {
                    const [horas, minutos] = registro.totalHoras.split(':').map(Number);
                    const minutosTrabalhadosNoDia = horas * 60 + minutos;
                    const minutosExtras = Math.max(0, minutosTrabalhadosNoDia - 480);
                    const minutosNormais = Math.min(480, minutosTrabalhadosNoDia);
                    
                    horasNormais = TimeUtils.converterParaHoras(minutosNormais);
                    horasExtras = TimeUtils.converterParaHoras(minutosExtras);
                }
                
                csv += [
                    dataFormatada.split(',')[1].trim(),
                    diaSemana,
                    registro.entrada || '',
                    registro.almoco || '',
                    registro.saida || '',
                    horasNormais,
                    horasExtras,
                    totalHoras
                ].join(',') + '\n';
            }
            
            // Create and trigger download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `registro_ponto_${titulo}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert('Arquivo CSV gerado com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar CSV:', error);
            alert('Erro ao gerar arquivo CSV!');
        }
    }
}

// Inicializar a aplicação
window.app = new PontoApp();