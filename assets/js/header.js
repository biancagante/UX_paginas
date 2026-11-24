(function () {
    const alvo = document.getElementById('app-header');
    if (!alvo) {
        return;
    }

    const base = alvo.dataset.base || '';
    const pagina = location.pathname.split('/').pop() || 'index.html';

    const links = [
        { rotulo: 'Calendário acadêmico', href: base + 'pages/calendario.html', arquivo: 'calendario.html' },
        { rotulo: 'Disciplinas', href: '#', arquivo: '' },
        { rotulo: 'Tarefas', href: base + 'pages/tarefas.html', arquivo: 'tarefas.html' },
        { rotulo: 'Solicitações', href: base + 'index.html#solicitacoes', arquivo: '' }
    ];

    const navegacao = links.map((link) => {
        const ativo = link.arquivo && link.arquivo === pagina ? ' active' : '';
        const atual = ativo ? ' aria-current="page"' : '';
        return '<a class="hdr-link' + ativo + '" href="' + link.href + '"' + atual + '>' + link.rotulo + '</a>';
    }).join('');

    const notificacoesAtiva = pagina === 'notificacoes.html' ? ' active' : '';

    const header = document.createElement('header');
    header.className = 'app-header';
    header.innerHTML =
        '<a class="hdr-brand" href="' + base + 'index.html" aria-label="Fatec AGIR, página inicial">' +
            '<img src="' + base + 'assets/images/cps_white.png" alt="Logo Centro Paula Souza">' +
            '<span class="hdr-brand-title">Fatec AGIR</span>' +
        '</a>' +
        '<div class="hdr-unit"><i class="fa-solid fa-location-dot"></i><span>Fatec Praia Grande</span></div>' +
        '<nav class="hdr-nav" id="hdrNav" aria-label="Navegação principal">' + navegacao + '</nav>' +
        '<div class="hdr-actions">' +
            '<a class="hdr-pill' + notificacoesAtiva + '" id="hdrNotificacoes" href="' + base + 'pages/notificacoes.html">' +
                '<i class="fa-solid fa-bell"></i>' +
                '<span class="hdr-pill-label">Notificações</span>' +
                '<span class="hdr-badge" id="hdrBadge" hidden></span>' +
            '</a>' +
            '<a class="hdr-pill" href="#">' +
                '<i class="fa-solid fa-gear"></i>' +
                '<span class="hdr-pill-label">Configurações</span>' +
            '</a>' +
        '</div>' +
        '<button type="button" class="hdr-toggle" id="hdrToggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="hdrNav">' +
            '<i class="fa-solid fa-bars"></i>' +
        '</button>';

    alvo.replaceWith(header);

    const badge = header.querySelector('#hdrBadge');
    const pillNotificacoes = header.querySelector('#hdrNotificacoes');
    const toggle = header.querySelector('#hdrToggle');

    function atualizarBadge() {
        const total = window.SigaStore ? window.SigaStore.contarNaoLidas() : 0;
        badge.hidden = total === 0;
        badge.textContent = total > 9 ? '9+' : String(total);
        pillNotificacoes.setAttribute('aria-label', total > 0 ? 'Notificações, ' + total + ' não lidas' : 'Notificações');
    }

    function fecharMenu() {
        header.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menu');
    }

    toggle.addEventListener('click', () => {
        const aberto = header.classList.toggle('menu-open');
        toggle.setAttribute('aria-expanded', String(aberto));
        toggle.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });

    header.querySelectorAll('.hdr-link').forEach((link) => link.addEventListener('click', fecharMenu));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            fecharMenu();
        }
    });

    document.addEventListener('siga:atualizado', atualizarBadge);
    window.addEventListener('storage', atualizarBadge);
    atualizarBadge();
})();
