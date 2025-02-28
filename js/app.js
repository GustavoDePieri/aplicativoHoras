class PontoApp {
    constructor() {
        this.inicializarElementos();
        this.adicionarEventListeners();
        this.periodoAtual = 'dia';
        this.carregarRegistros();
    }

    inicializarElementos() {
        // Inputs do formulário
        this.entradaInput = document.getElementById('entrada');
        this.almocoInput = document.getElementById('almoco');
        this.saidaInput = document.getElementById('saida');
        this.salvarBtn = document.getElementById('salvar');

        // Filtros e lista
        this.filtros = document.querySelectorAll('.filtro-btn');
        this.listaRegistros = document.getElementById('lista-registros');

        // Configurar horário de almoço inicial
        if (this.almocoInput) {
            this.almocoInput.value = TimeUtils.gerarHorarioAlmoco();
        }

        // Adicionar botão de exportar
        this.exportarCsvBtn = document.getElementById('exportar-csv');
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

        // Listeners para filtros
        this.filtros.forEach(filtro => {
            filtro.addEventListener('click', () => {
                this.periodoAtual = filtro.dataset.periodo;
                this.atualizarFiltroAtivo(filtro);
                this.carregarRegistros();
            });
        });

        // Listener para exportar CSV
        if (this.exportarCsvBtn) {
            this.exportarCsvBtn.addEventListener('click', () => this.exportarCSV());
        }
    }

    async salvarRegistro() {
        try {
            if (!this.entradaInput.value && !this.saidaInput.value) {
                alert('Preencha pelo menos a entrada ou saída!');
                return;
            }

            const hoje = TimeUtils.obterDataAtual();
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

            const sucesso = await PontoStorage.salvar(hoje, registro);
            if (sucesso) {
                alert('Registro salvo com sucesso!');
                this.carregarRegistros();
            } else {
                alert('Erro ao salvar registro!');
            }
        } catch (error) {
            console.error('Erro ao salvar registro:', error);
            alert('Erro ao salvar registro!');
        }
    }

    async carregarRegistros() {
        try {
            const { dataInicial, dataFinal } = TimeUtils.calcularPeriodo(this.periodoAtual);
            const registros = await PontoStorage.buscarPorPeriodo(dataInicial, dataFinal);
            this.exibirRegistros(registros);
        } catch (error) {
            console.error('Erro ao carregar registros:', error);
            this.listaRegistros.innerHTML = '<p>Erro ao carregar registros.</p>';
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

    atualizarFiltroAtivo(filtroAtivo) {
        this.filtros.forEach(filtro => {
            filtro.classList.remove('active');
        });
        filtroAtivo.classList.add('active');
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
                this.carregarRegistros();
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
                    this.carregarRegistros();
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
            const { dataInicial, dataFinal } = TimeUtils.calcularPeriodo('mes');
            const registros = await PontoStorage.buscarPorPeriodo(dataInicial, dataFinal);
            
            // Calcular resumo
            let totalMinutos = 0;
            let horasExtras = 0;
            let diasTrabalhados = 0;
            
            for (const registro of Object.values(registros)) {
                if (registro.totalHoras) {
                    diasTrabalhados++;
                    const [horas, minutos] = registro.totalHoras.split(':').map(Number);
                    const minutosTrabalhadosNoDia = horas * 60 + minutos;
                    totalMinutos += minutosTrabalhadosNoDia;
                    
                    // Calcular horas extras (acima de 8h diárias)
                    const minutosExtras = Math.max(0, minutosTrabalhadosNoDia - (8 * 60));
                    horasExtras += minutosExtras;
                }
            }
            
            // Converter minutos para formato HH:mm
            const totalHoras = TimeUtils.converterParaHoras(totalMinutos);
            const totalExtras = TimeUtils.converterParaHoras(horasExtras);
            
            // Mostrar resumo
            const resumo = `📊 Resumo do Mês\n\n` +
                          `📅 Dias trabalhados: ${diasTrabalhados}\n` +
                          `⏰ Total de horas: ${totalHoras}\n` +
                          `⭐ Horas extras: ${totalExtras}`;
            
            alert(resumo);
            
            // Continua com a exportação do CSV...
            let csv = 'Data,Dia da Semana,Entrada,Almoço,Saída,Total Horas\n';
            
            for (const [data, registro] of Object.entries(registros)) {
                const dataFormatada = TimeUtils.formatarData(data);
                const diaSemana = dataFormatada.split(',')[0];
                
                csv += [
                    dataFormatada.split(',')[1].trim(),
                    diaSemana,
                    registro.entrada || '',
                    registro.almoco || '',
                    registro.saida || '',
                    registro.totalHoras || ''
                ].join(',') + '\n';
            }
            
            // Create and trigger download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `registros_ponto_${TimeUtils.obterDataAtual()}.csv`);
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