class PontoStorage {
    static COLLECTION = 'registro_ponto';

    static async salvar(data, registro) {
        try {
            await db.collection(this.COLLECTION).doc(data).set(registro);
            return true;
        } catch (error) {
            console.error('Erro ao salvar registro:', error);
            return false;
        }
    }

    static async buscarPorData(data) {
        try {
            const doc = await db.collection(this.COLLECTION).doc(data).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error('Erro ao buscar registro:', error);
            return null;
        }
    }

    static async buscarPorPeriodo(dataInicial, dataFinal) {
        try {
            const registros = {};
            const snapshot = await db.collection(this.COLLECTION).get();
            
            snapshot.forEach(doc => {
                const data = doc.id;
                if (data >= dataInicial && data <= dataFinal) {
                    registros[data] = doc.data();
                }
            });

            return Object.fromEntries(
                Object.entries(registros).sort(([a], [b]) => b.localeCompare(a))
            );
        } catch (error) {
            console.error('Erro ao buscar registros:', error);
            return {};
        }
    }

    static async excluir(data) {
        try {
            await db.collection(this.COLLECTION).doc(data).delete();
            return true;
        } catch (error) {
            console.error('Erro ao excluir registro:', error);
            return false;
        }
    }

    static async obterTodosRegistros() {
        try {
            const snapshot = await db.collection(this.COLLECTION).get();
            const registros = {};
            snapshot.forEach(doc => {
                registros[doc.id] = doc.data();
            });
            return registros;
        } catch (error) {
            console.error('Erro ao obter registros:', error);
            return {};
        }
    }

    static async obterRegistrosPorPeriodo(dataInicial, dataFinal) {
        try {
            console.log(`Buscando registros entre ${dataInicial} e ${dataFinal}`);
            
            // Buscar registros usando apenas o intervalo de datas
            const snapshot = await db.collection(this.COLLECTION)
                .where(firebase.firestore.FieldPath.documentId(), '>=', dataInicial)
                .where(firebase.firestore.FieldPath.documentId(), '<=', dataFinal)
                .get();

            const registros = {};
            snapshot.forEach(doc => {
                registros[doc.id] = doc.data();
            });
            
            // Ordenar os registros por data (mais recentes primeiro)
            const registrosOrdenados = Object.fromEntries(
                Object.entries(registros).sort(([dataA], [dataB]) => dataB.localeCompare(dataA))
            );
            
            console.log(`Encontrados ${Object.keys(registros).length} registros no período`);
            return registrosOrdenados;
        } catch (error) {
            // Se houver erro com o índice, tentar uma busca mais simples
            try {
                console.log('Tentando busca alternativa...');
                const snapshot = await db.collection(this.COLLECTION).get();
                
                const registros = {};
                snapshot.forEach(doc => {
                    const data = doc.id;
                    if (data >= dataInicial && data <= dataFinal) {
                        registros[data] = doc.data();
                    }
                });

                // Ordenar os registros
                const registrosOrdenados = Object.fromEntries(
                    Object.entries(registros).sort(([dataA], [dataB]) => dataB.localeCompare(dataA))
                );

                return registrosOrdenados;
            } catch (fallbackError) {
                console.error('Erro na busca alternativa:', fallbackError);
                return {};
            }
        }
    }

    static async exportarCSV() {
        const registros = await this.obterTodosRegistros();
        let csv = 'Data,Entrada,Almoço,Saída,Total Horas,Observações\n';
        
        for (const [data, registro] of Object.entries(registros)) {
            csv += `${data},${registro.entrada},${registro.almoco},${registro.saida},${registro.totalHoras},"${registro.notas}"\n`;
        }

        return csv;
    }


    static calcularTotalHoras(entrada, saida, almocoEntrada, almocoSaida) {
        if (!entrada || !saida || !almocoEntrada || !almocoSaida) {
            return '';
        }

        try {
            // Converter horários para minutos
            const entradaMin = TimeUtils.converterParaMinutos(entrada);
            const saidaMin = TimeUtils.converterParaMinutos(saida);
            const almocoEntradaMin = TimeUtils.converterParaMinutos(almocoEntrada);
            const almocoSaidaMin = TimeUtils.converterParaMinutos(almocoSaida);

            // Calcular tempo total de almoço
            const tempoAlmoco = almocoSaidaMin - almocoEntradaMin;

            // Calcular total de horas trabalhadas
            const totalMin = saidaMin - entradaMin - tempoAlmoco;

            return TimeUtils.converterParaHoras(totalMin);
        } catch (error) {
            console.error('Erro ao calcular total de horas:', error);
            return '';
        }
    }

    static async migrarParaRegistroPonto() {
        try {
            console.log('Iniciando migração dos registros para registro_ponto...');
            
            // Buscar todos os registros antigos
            const snapshotAntigo = await db.collection('registros').get();
            
            if (snapshotAntigo.empty) {
                console.log('Nenhum registro antigo encontrado.');
                return;
            }

            // Contador para acompanhar o progresso
            let registrosMigrados = 0;
            let registrosExistentes = 0;

            // Para cada registro antigo
            for (const doc of snapshotAntigo.docs) {
                const dadosAntigos = doc.data();
                
                // Converter a data do formato DD/MM/YYYY para YYYY-MM-DD
                const [dia, mes, ano] = dadosAntigos.data.split('/');
                const dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
                
                // Verificar se já existe um registro na nova coleção
                const registroExistente = await db.collection('registro_ponto')
                    .doc(dataFormatada)
                    .get();

                if (!registroExistente.exists) {
                    // Calcular total de horas
                    let totalHoras = "";
                    
                    if (dadosAntigos.entrada && dadosAntigos.saida) {
                        // Se tiver almoço, considerar na conta
                        if (dadosAntigos.almocoEntrada && dadosAntigos.almocoSaida) {
                            const minutosTrabalhados = TimeUtils.calcularMinutosTrabalhados(
                                dadosAntigos.entrada,
                                dadosAntigos.saida,
                                dadosAntigos.almocoEntrada,
                                dadosAntigos.almocoSaida
                            );
                            totalHoras = TimeUtils.formatarMinutosEmHoras(minutosTrabalhados);
                        } else {
                            // Sem almoço, cálculo direto
                            const minutosTrabalhados = TimeUtils.calcularMinutosSemAlmoco(
                                dadosAntigos.entrada,
                                dadosAntigos.saida
                            );
                            totalHoras = TimeUtils.formatarMinutosEmHoras(minutosTrabalhados);
                        }
                    }

                    // Criar o novo formato do registro
                    const novoRegistro = {
                        entrada: dadosAntigos.entrada || "",
                        almoco: dadosAntigos.almocoEntrada || "",
                        saida: dadosAntigos.saida || "",
                        totalHoras: totalHoras,
                        notas: `Dia da semana: ${dadosAntigos.diaSemana || ""}`
                    };

                    // Salvar na nova coleção
                    await db.collection('registro_ponto')
                        .doc(dataFormatada)
                        .set(novoRegistro);

                    console.log(`Registro migrado com sucesso: ${dataFormatada}`);
                    registrosMigrados++;
                } else {
                    console.log(`Registro já existe na nova coleção: ${dataFormatada}`);
                    registrosExistentes++;
                }
            }

            console.log(`Migração concluída com sucesso! ${registrosMigrados} registros migrados, ${registrosExistentes} já existentes.`);
            return {
                migrados: registrosMigrados,
                existentes: registrosExistentes,
                total: registrosMigrados + registrosExistentes
            };
        } catch (error) {
            console.error('Erro durante a migração:', error);
            throw error;
        }
    }

    static async buscarTodosRegistros() {
        try {
            const snapshot = await db.collection(this.COLLECTION)
                .orderBy(firebase.firestore.FieldPath.documentId(), 'desc')
                .get();
            
            const registros = {};
            snapshot.forEach(doc => {
                registros[doc.id] = doc.data();
            });
            
            return registros;
        } catch (error) {
            console.error('Erro ao buscar todos os registros:', error);
            return {};
        }
    }
}

// Adicione este código temporariamente no final do app.js para teste
async function testarRegistro() {
    const registro = {
        entrada: '09:00',
        almoco: '12:00',
        saida: '18:00',
        totalHoras: '08:00',
        notas: 'Registro de teste'
    };
    
    const hoje = new Date().toISOString().split('T')[0];
    await PontoStorage.salvar(hoje, registro);
    console.log('Registro de teste adicionado');
}

// testarRegistro(); // Descomente para testar