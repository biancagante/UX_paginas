(function () {
    const lista = document.getElementById('listaNotificacoes');
    const abas = document.querySelectorAll('.notif-tab');
    const btnMarcarLidas = document.getElementById('btnMarcarLidas');
    const toast = document.getElementById('toast');
    const toastTexto = document.getElementById('toastTexto');
    const toastLink = document.getElementById('toastLink');

    const MENSAGENS_VAZIO = {
        'todas': 'Você não tem notificações.',
        'nao-lidas': 'Nenhuma notificação não lida.',
        'convites': 'Você não tem convites.'
    };

    let filtro = 'todas';
    let temporizadorToast = null;

    function criar(tag, classe, texto) {
        const elemento = document.createElement(tag);
        if (classe) {
            elemento.className = classe;
        }
        if (texto !== undefined) {
            elemento.textContent = texto;
        }
        return elemento;
    }

    function icone(classes) {
        const i = document.createElement('i');
        i.className = classes;
        return i;
    }

    function formatarData(iso) {
        const partes = iso.split('-');
        return partes[2] + '/' + partes[1] + '/' + partes[0];
    }

    function formatarHora(hora) {
        const partes = hora.split(':');
        return partes[1] === '00' ? Number(partes[0]) + 'h' : Number(partes[0]) + 'h' + partes[1];
    }

    function textoHorario(evento) {
        if (evento.diaInteiro) {
            return 'O dia todo';
        }
        if (evento.inicio && evento.termino) {
            return formatarHora(evento.inicio) + ' às ' + formatarHora(evento.termino);
        }
        if (evento.inicio) {
            return formatarHora(evento.inicio);
        }
        return '';
    }

    function tempoRelativo(notificacao) {
        if (notificacao.periodo) {
            return notificacao.periodo;
        }
        const minutos = Math.floor((Date.now() - notificacao.criadaEm) / 60000);
        if (minutos < 1) {
            return 'Agora';
        }
        if (minutos < 60) {
            return 'Há ' + minutos + (minutos === 1 ? ' minuto' : ' minutos');
        }
        const horas = Math.floor(minutos / 60);
        if (horas < 24) {
            return 'Há ' + horas + (horas === 1 ? ' hora' : ' horas');
        }
        if (horas < 48) {
            return 'Ontem';
        }
        const data = new Date(notificacao.criadaEm);
        return String(data.getDate()).padStart(2, '0') + '/' + String(data.getMonth() + 1).padStart(2, '0') + '/' + data.getFullYear();
    }

    function rotuloTipo(tipo) {
        if (tipo === 'convite') {
            return 'Convite';
        }
        if (tipo === 'feriado') {
            return 'Feriado';
        }
        return 'Evento';
    }

    function criarMeta(evento) {
        const meta = criar('div', 'notif-meta');
        if (evento.data) {
            const data = evento.dataFim
                ? formatarData(evento.data) + ' a ' + formatarData(evento.dataFim)
                : formatarData(evento.data);
            const item = criar('span', 'notif-meta-item');
            item.append(icone('fa-regular fa-calendar'), document.createTextNode(data));
            meta.appendChild(item);
        }
        const horario = textoHorario(evento);
        if (horario) {
            const item = criar('span', 'notif-meta-item');
            item.append(icone('fa-regular fa-clock'), document.createTextNode(horario));
            meta.appendChild(item);
        }
        if (evento.local) {
            const item = criar('span', 'notif-meta-item');
            item.append(icone('fa-solid fa-location-dot'), document.createTextNode(evento.local));
            meta.appendChild(item);
        }
        return meta;
    }

    function criarAcoes(notificacao) {
        const acoes = criar('div', 'notif-actions');

        if (notificacao.status === 'pendente') {
            const recusar = criar('button', 'btn-recusar');
            recusar.type = 'button';
            recusar.append(icone('fa-solid fa-xmark'), document.createTextNode('Recusar'));
            recusar.addEventListener('click', () => responder(notificacao.id, false));

            const aceitar = criar('button', 'btn-aceitar');
            aceitar.type = 'button';
            aceitar.append(icone('fa-solid fa-check'), document.createTextNode('Aceitar convite'));
            aceitar.addEventListener('click', () => responder(notificacao.id, true));

            acoes.append(recusar, aceitar);
            return acoes;
        }

        const aceito = notificacao.status === 'aceito';
        const status = criar('span', 'notif-status ' + (aceito ? 'status-aceito' : 'status-recusado'));
        status.append(
            icone(aceito ? 'fa-solid fa-check' : 'fa-solid fa-xmark'),
            document.createTextNode(aceito ? 'Convite aceito' : 'Convite recusado')
        );
        acoes.appendChild(status);
        return acoes;
    }

    function criarCartao(notificacao) {
        const cartao = criar('article', 'notif-card' + (notificacao.lida ? '' : ' unread'));
        cartao.dataset.id = notificacao.id;

        const caixaIcone = criar('div', 'notif-icon');
        caixaIcone.appendChild(icone('fa-regular fa-calendar-plus'));

        const corpo = criar('div', 'notif-body');

        const tipo = criar('span', 'notif-tipo');
        if (!notificacao.lida) {
            const ponto = criar('span', 'notif-dot');
            ponto.setAttribute('aria-label', 'Não lida');
            tipo.appendChild(ponto);
        }
        tipo.appendChild(document.createTextNode(rotuloTipo(notificacao.tipo)));

        const titulo = criar('h2', 'notif-titulo', notificacao.titulo);

        const texto = criar('p', 'notif-texto');
        if (notificacao.remetente) {
            texto.append(criar('strong', '', notificacao.remetente), document.createTextNode(' ' + notificacao.descricao));
        } else {
            texto.textContent = notificacao.descricao;
        }

        corpo.append(tipo, titulo, texto, criarMeta(notificacao.evento || {}));

        const tempo = criar('span', 'notif-tempo', tempoRelativo(notificacao));

        cartao.append(caixaIcone, corpo, tempo);

        if (notificacao.tipo === 'convite') {
            cartao.appendChild(criarAcoes(notificacao));
        }

        cartao.addEventListener('click', (e) => {
            if (!notificacao.lida && !e.target.closest('.notif-actions')) {
                window.SigaStore.marcarLida(notificacao.id);
            }
        });

        return cartao;
    }

    function filtrar(notificacoes) {
        if (filtro === 'nao-lidas') {
            return notificacoes.filter((n) => !n.lida);
        }
        if (filtro === 'convites') {
            return notificacoes.filter((n) => n.tipo === 'convite');
        }
        return notificacoes;
    }

    function renderizar() {
        const todas = window.SigaStore.listarNotificacoes();
        const visiveis = filtrar(todas);

        btnMarcarLidas.hidden = !todas.some((n) => !n.lida);

        if (visiveis.length === 0) {
            const vazio = criar('div', 'notif-empty');
            vazio.append(icone('fa-regular fa-bell-slash'), criar('p', '', MENSAGENS_VAZIO[filtro]));
            lista.replaceChildren(vazio);
            return;
        }
        lista.replaceChildren(...visiveis.map(criarCartao));
    }

    function mostrarToast(mensagem, comLink) {
        toastTexto.textContent = mensagem;
        toastLink.hidden = !comLink;
        toast.classList.add('show');
        clearTimeout(temporizadorToast);
        temporizadorToast = setTimeout(() => toast.classList.remove('show'), 5000);
    }

    function responder(id, aceitar) {
        const resposta = window.SigaStore.responderConvite(id, aceitar);
        if (!resposta) {
            return;
        }
        if (aceitar) {
            mostrarToast('Convite aceito. O evento foi adicionado ao seu calendário.', true);
        } else {
            mostrarToast('Convite recusado.', false);
        }
    }

    abas.forEach((aba) => {
        aba.addEventListener('click', () => {
            filtro = aba.dataset.filtro;
            abas.forEach((outra) => {
                const ativa = outra === aba;
                outra.classList.toggle('active', ativa);
                outra.setAttribute('aria-selected', String(ativa));
            });
            renderizar();
        });
    });

    btnMarcarLidas.addEventListener('click', () => window.SigaStore.marcarTodasLidas());

    document.addEventListener('siga:atualizado', renderizar);
    window.addEventListener('storage', renderizar);
    setInterval(renderizar, 60000);

    renderizar();
})();
