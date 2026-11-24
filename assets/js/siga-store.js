(function (global) {
    const CHAVES = {
        notificacoes: 'siga_notificacoes',
        eventos: 'siga_eventos',
        semeado: 'siga_semeado'
    };
    const memoria = {};

    function ler(chave, padrao) {
        try {
            const bruto = localStorage.getItem(chave);
            if (bruto === null) {
                return chave in memoria ? memoria[chave] : padrao;
            }
            const valor = JSON.parse(bruto);
            return valor === null ? padrao : valor;
        } catch (erro) {
            return chave in memoria ? memoria[chave] : padrao;
        }
    }

    function gravar(chave, valor) {
        memoria[chave] = valor;
        try {
            localStorage.setItem(chave, JSON.stringify(valor));
        } catch (erro) {
            memoria[chave] = valor;
        }
        document.dispatchEvent(new CustomEvent('siga:atualizado'));
    }

    function novoId(prefixo) {
        return prefixo + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function semear() {
        if (ler(CHAVES.semeado, false)) {
            return;
        }
        gravar(CHAVES.semeado, true);
        const agora = Date.now();
        const umDia = 24 * 60 * 60 * 1000;
        gravar(CHAVES.notificacoes, [
            {
                id: 'seed-convite',
                tipo: 'convite',
                titulo: 'Reunião pré apresentação',
                remetente: 'Maria Clara Magalhães',
                descricao: 'convidou você para participar da Reunião pré apresentação.',
                lida: false,
                status: 'pendente',
                criadaEm: agora - 20 * 60 * 1000,
                evento: {
                    titulo: 'Reunião pré apresentação',
                    data: '2026-10-28',
                    inicio: '14:00',
                    termino: '16:00',
                    diaInteiro: false,
                    local: 'Biblioteca'
                }
            },
            {
                id: 'seed-semana-tecnologia',
                tipo: 'evento',
                titulo: 'Semana da Tecnologia',
                descricao: 'Confira a programação de palestras, oficinas e apresentações de projetos da unidade.',
                periodo: 'Este mês',
                lida: false,
                criadaEm: agora - 2 * umDia,
                evento: {
                    titulo: 'Semana da Tecnologia',
                    data: '2026-10-19',
                    dataFim: '2026-10-24',
                    diaInteiro: true,
                    local: 'Fatec Praia Grande'
                }
            },
            {
                id: 'seed-dia-professor',
                tipo: 'feriado',
                titulo: 'Dia do Professor',
                descricao: 'Não haverá aula.',
                periodo: 'Este mês',
                lida: true,
                criadaEm: agora - 3 * umDia,
                evento: {
                    titulo: 'Dia do Professor',
                    data: '2026-10-15',
                    diaInteiro: true,
                    local: 'Fatec Praia Grande'
                }
            }
        ]);
    }

    function listarNotificacoes() {
        semear();
        return ler(CHAVES.notificacoes, []).slice().sort((a, b) => b.criadaEm - a.criadaEm);
    }

    function listarEventos() {
        return ler(CHAVES.eventos, []);
    }

    function contarNaoLidas() {
        return listarNotificacoes().filter((n) => !n.lida).length;
    }

    function atualizarNotificacoes(alterar) {
        const lista = listarNotificacoes();
        const resultado = alterar(lista);
        gravar(CHAVES.notificacoes, lista);
        return resultado;
    }

    function marcarLida(id) {
        atualizarNotificacoes((lista) => {
            const item = lista.find((n) => n.id === id);
            if (item) {
                item.lida = true;
            }
        });
    }

    function marcarTodasLidas() {
        atualizarNotificacoes((lista) => {
            lista.forEach((n) => {
                n.lida = true;
            });
        });
    }

    function textoParticipantes(nomes) {
        if (nomes.length === 0) {
            return 'Você criou este evento no calendário acadêmico.';
        }
        if (nomes.length === 1) {
            return 'Você criou este evento e convidou ' + nomes[0] + '.';
        }
        const ultimo = nomes[nomes.length - 1];
        return 'Você criou este evento e convidou ' + nomes.slice(0, -1).join(', ') + ' e ' + ultimo + '.';
    }

    function registrarEvento(dados) {
        const evento = Object.assign({ id: novoId('ev-') }, dados);
        const eventos = listarEventos().slice();
        eventos.push(evento);
        gravar(CHAVES.eventos, eventos);

        const nomes = Array.isArray(evento.participantes) ? evento.participantes : [];
        atualizarNotificacoes((lista) => {
            lista.push({
                id: novoId('nt-'),
                tipo: 'evento',
                titulo: evento.titulo,
                descricao: textoParticipantes(nomes),
                lida: false,
                criadaEm: Date.now(),
                evento: {
                    titulo: evento.titulo,
                    data: evento.data,
                    inicio: evento.inicio,
                    termino: evento.termino,
                    diaInteiro: evento.diaInteiro,
                    local: evento.local
                }
            });
        });
        return evento;
    }

    function responderConvite(id, aceitar) {
        let resposta = null;
        atualizarNotificacoes((lista) => {
            const convite = lista.find((n) => n.id === id && n.tipo === 'convite');
            if (!convite || convite.status !== 'pendente') {
                return;
            }
            convite.status = aceitar ? 'aceito' : 'recusado';
            convite.lida = true;
            resposta = convite;
        });
        if (resposta && aceitar) {
            const idEvento = 'conv-' + resposta.id;
            const eventos = listarEventos().slice();
            if (!eventos.some((e) => e.id === idEvento)) {
                eventos.push(Object.assign({}, resposta.evento, {
                    id: idEvento,
                    compartilhado: true,
                    origem: 'convite'
                }));
                gravar(CHAVES.eventos, eventos);
            }
        }
        return resposta;
    }

    global.SigaStore = {
        listarNotificacoes: listarNotificacoes,
        listarEventos: listarEventos,
        contarNaoLidas: contarNaoLidas,
        marcarLida: marcarLida,
        marcarTodasLidas: marcarTodasLidas,
        registrarEvento: registrarEvento,
        responderConvite: responderConvite
    };
})(window);
