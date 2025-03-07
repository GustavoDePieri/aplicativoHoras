class TimeUtils {
    static gerarHorarioAlmoco() {
        const min = this.converterParaMinutos("11:30");
        const max = this.converterParaMinutos("13:30");
        const almocoMinutos = Math.floor(Math.random() * (max - min + 1)) + min;
        return this.converterParaHoras(almocoMinutos);
    }

    static converterParaMinutos(horario) {
        if (!horario) return 0;
        const [horas, minutos] = horario.split(":").map(Number);
        return horas * 60 + minutos;
    }

    static converterParaHoras(minutos) {
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    static calcularHorasTrabalhadas(entrada, saida, almoco) {
        if (!entrada || !saida || !almoco) return '';
        
        const entradaMin = this.converterParaMinutos(entrada);
        const saidaMin = this.converterParaMinutos(saida);
        const almocoMin = 60; // 1 hora fixa de almoço

        const totalMin = saidaMin - entradaMin - almocoMin;
        return this.converterParaHoras(totalMin);
    }

    static formatarData(dataISO) {
        try {
            const [ano, mes, dia] = dataISO.split('-');
            const data = new Date(ano, mes - 1, dia);
            return data.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return dataISO;
        }
    }

    static obterDataAtual() {
        const hoje = new Date();
        return hoje.toISOString().split('T')[0];
    }

    static calcularPeriodo(tipo) {
        const hoje = new Date();
        let dataInicial, dataFinal;

        switch (tipo) {
            case 'dia':
                dataInicial = dataFinal = hoje.toISOString().split('T')[0];
                break;

            case 'semana':
                dataInicial = new Date(hoje);
                dataInicial.setDate(hoje.getDate() - hoje.getDay());
                dataFinal = new Date(dataInicial);
                dataFinal.setDate(dataInicial.getDate() + 6);
                dataInicial = dataInicial.toISOString().split('T')[0];
                dataFinal = dataFinal.toISOString().split('T')[0];
                break;

            case 'mes':
                dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                dataFinal = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
                dataInicial = dataInicial.toISOString().split('T')[0];
                dataFinal = dataFinal.toISOString().split('T')[0];
                break;

            default:
                dataInicial = dataFinal = hoje.toISOString().split('T')[0];
        }

        return { dataInicial, dataFinal };
    }

    static calcularMinutosTrabalhados(entrada, saida, almocoEntrada, almocoSaida) {
        if (!entrada || !saida) return 0;
        
        const entradaMin = this.converterParaMinutos(entrada);
        const saidaMin = this.converterParaMinutos(saida);
        
        // Se tiver horário de almoço, descontar
        if (almocoEntrada && almocoSaida) {
            const almocoEntradaMin = this.converterParaMinutos(almocoEntrada);
            const almocoSaidaMin = this.converterParaMinutos(almocoSaida);
            const almocoTotal = almocoSaidaMin - almocoEntradaMin;
            
            return (saidaMin - entradaMin) - almocoTotal;
        }
        
        // Sem almoço
        return saidaMin - entradaMin;
    }
    
    static calcularMinutosSemAlmoco(entrada, saida) {
        if (!entrada || !saida) return 0;
        
        const entradaMin = this.converterParaMinutos(entrada);
        const saidaMin = this.converterParaMinutos(saida);
        
        return saidaMin - entradaMin;
    }
    
    static formatarMinutosEmHoras(minutos) {
        if (minutos <= 0) return "00:00";
        
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        
        return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
    
    static calcularPeriodoMesAno(mes, ano) {
        // Mês é baseado em zero (0 = Janeiro, 11 = Dezembro)
        const dataInicial = new Date(ano, mes, 1);
        const dataFinal = new Date(ano, parseInt(mes) + 1, 0);
        
        return {
            dataInicial: dataInicial.toISOString().split('T')[0],
            dataFinal: dataFinal.toISOString().split('T')[0]
        };
    }
    
    static obterHoraAtual() {
        const agora = new Date();
        return agora.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
    
    static obterMesAtual() {
        return new Date().getMonth();
    }
    
    static obterAnoAtual() {
        return new Date().getFullYear();
    }
    
    static gerarAnosDisponiveis() {
        const anoAtual = this.obterAnoAtual();
        const anos = [];
        
        // Gerar lista de anos (ano atual - 2 até ano atual + 1)
        for (let i = anoAtual - 2; i <= anoAtual + 1; i++) {
            anos.push(i);
        }
        
        return anos;
    }
}