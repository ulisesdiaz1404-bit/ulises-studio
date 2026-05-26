/* ============================================
   ULISES STUDIO — App logic (localStorage CRUD)
   ============================================ */

const STORE = {
  proyectos: 'us_proyectos',
  clientes: 'us_clientes',
  ingresos: 'us_ingresos',
  inquiries: 'us_inquiries',
  resenias: 'us_resenias',
  passHash: 'us_pass_hash',
};

const DEFAULT_PASSWORD = 'Ulises123@';
let isUnlocked = false;

const fmtMoney = (n) =>
  '$' + Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const load = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

/* ============================================
   STATE
   ============================================ */
let state = {
  proyectos: load(STORE.proyectos),
  clientes: load(STORE.clientes),
  ingresos: load(STORE.ingresos),
  inquiries: load(STORE.inquiries),
  resenias: load(STORE.resenias),
};

let chartInstance = null;

/* ============================================
   SEED (only on first visit)
   ============================================ */
function seedIfEmpty() {
  if (state.resenias.length === 0) {
    state.resenias = [
      { id: uid(), nombre: 'Benjamín R.',  rol: 'Calzados Benjamín',   texto: 'Ulises entendió mi negocio desde el primer día. La web quedó impecable y me empezaron a llegar consultas la misma semana.', estrellas: 5, avatar: '' },
      { id: uid(), nombre: 'Zonace Barber', rol: 'Barbería · Cursos',    texto: 'Profesional, rápido y muy claro con todo. Subió la web en tiempo récord y siempre disponible para ajustes.', estrellas: 5, avatar: '' },
      { id: uid(), nombre: 'Lucía M.',      rol: 'Estudio de diseño',    texto: 'Me hizo el portfolio que necesitaba. Fue clave para conseguir mis primeros clientes grandes.', estrellas: 5, avatar: '' },
      { id: uid(), nombre: 'Martín G.',     rol: 'Tienda online',         texto: 'Conoce de SEO, de diseño y de negocios. La web no solo se ve bien — vende.', estrellas: 5, avatar: '' },
    ];
    save(STORE.resenias, state.resenias);
  }
  if (state.proyectos.length === 0 && state.clientes.length === 0 && state.ingresos.length === 0) {
    state.proyectos = [
      {
        id: uid(),
        nombre: 'Calzados Benjamín',
        cliente: 'Benjamín R.',
        descripcion: 'Tienda online de calzado con catálogo dinámico y carrito.',
        url: '',
        screenshot: '',
        tag: 'completed',
        color: '#0071e3',
      },
      {
        id: uid(),
        nombre: 'Zonace Barber',
        cliente: 'Zonace',
        descripcion: 'Web institucional para barbería con reservas y cursos.',
        url: '',
        screenshot: '',
        tag: 'active',
        color: '#34c759',
      },
    ];
    state.clientes = [
      { id: uid(), nombre: 'Benjamín R.', proyecto: 'Calzados Benjamín', contacto: 'benjamin@email.com', estado: 'completed', total: 450 },
      { id: uid(), nombre: 'Zonace', proyecto: 'Zonace Barber', contacto: 'zonace@email.com', estado: 'active', total: 600 },
    ];
    state.ingresos = [
      { id: uid(), fecha: new Date().toISOString().slice(0,10), cliente: 'Benjamín R.', concepto: 'Pago final web', estado: 'paid', monto: 450 },
      { id: uid(), fecha: new Date().toISOString().slice(0,10), cliente: 'Zonace', concepto: 'Anticipo 50%', estado: 'paid', monto: 300 },
      { id: uid(), fecha: new Date().toISOString().slice(0,10), cliente: 'Zonace', concepto: 'Saldo final', estado: 'pending', monto: 300 },
    ];
    persistAll();
  }
}

function persistAll() {
  save(STORE.proyectos, state.proyectos);
  save(STORE.clientes, state.clientes);
  save(STORE.ingresos, state.ingresos);
  save(STORE.inquiries, state.inquiries);
  save(STORE.resenias, state.resenias);
}

/* ============================================
   RENDER — PROYECTOS
   ============================================ */
function renderProyectos() {
  const grid = document.getElementById('proyectos-grid');
  const empty = document.getElementById('proyectos-empty');

  if (state.proyectos.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  grid.innerHTML = state.proyectos.map(p => {
    const colorBg = p.color || '#0071e3';
    const tagLabel = { active: 'Activo', completed: 'Terminado', paused: 'Pausado' }[p.tag] || 'Activo';
    const hasShot = !!p.screenshot;
    const shotBlock = hasShot ? `
      <div class="project-screenshot" onclick="openPreview('${p.id}')">
        <img src="${escapeAttr(p.screenshot)}" alt="${escapeAttr(p.nombre)}" loading="lazy" />
        <div class="project-screenshot-overlay">
          <span class="preview-pill">Ver preview</span>
        </div>
      </div>
    ` : '';
    const cardStyle = hasShot ? '' : `style="background: linear-gradient(145deg, ${colorBg}15, ${colorBg}05);"`;
    return `
      <article class="project-card ${hasShot ? 'with-screenshot' : ''}" ${cardStyle}>
        ${shotBlock}
        <div class="project-card-content">
          <span class="project-tag ${p.tag}">${tagLabel}</span>
          <h3 class="project-title">${escapeHtml(p.nombre)}</h3>
          <p class="project-client">${escapeHtml(p.cliente || '—')}</p>
          <p class="project-desc">${escapeHtml(p.descripcion || '')}</p>
        </div>
        <div class="project-actions">
          ${p.url ? `<a href="${escapeAttr(p.url)}" target="_blank" rel="noopener" class="project-link">Ver sitio →</a>` : '<span></span>'}
          <div style="margin-left:auto; display:flex; gap:4px;">
            <button class="btn-icon" onclick="editProyecto('${p.id}')" title="Editar">✎</button>
            <button class="btn-icon danger" onclick="deleteProyecto('${p.id}')" title="Eliminar">🗑</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function openPreview(id) {
  const p = state.proyectos.find(x => x.id === id);
  if (!p) return;
  const modal = document.getElementById('modal');
  const body = document.getElementById('modal-body');
  const title = document.getElementById('modal-title');
  modal.classList.add('preview-modal');
  title.textContent = p.nombre;
  const urlBlock = p.url ? `
    <div class="preview-modal-header">
      <span class="url">${escapeHtml(p.url)}</span>
      <a href="${escapeAttr(p.url)}" target="_blank" rel="noopener" class="btn btn-light" style="padding:8px 16px;font-size:13px;">Abrir ↗</a>
    </div>
    <iframe src="${escapeAttr(p.url)}" loading="lazy"
      onload="this.dataset.loaded=1"
      onerror="this.style.display='none'"></iframe>
    <div class="preview-modal-fallback">Si la web no se ve, hacé clic en <b>Abrir ↗</b> — algunos sitios bloquean la vista previa embebida.</div>
  ` : `
    <div class="preview-modal-fallback">
      <p>Este proyecto no tiene URL pública cargada.</p>
      ${p.screenshot ? `<img src="${escapeAttr(p.screenshot)}" alt="" style="max-width:100%;border-radius:12px;margin-top:16px"/>` : ''}
    </div>
  `;
  body.innerHTML = urlBlock;
  modal.classList.remove('hidden');
}

function deleteProyecto(id) {
  if (!confirm('¿Eliminar este proyecto?')) return;
  state.proyectos = state.proyectos.filter(p => p.id !== id);
  save(STORE.proyectos, state.proyectos);
  renderProyectos();
  renderStats();
}

function editProyecto(id) {
  const p = state.proyectos.find(x => x.id === id);
  openModal('proyecto', p);
}

/* ============================================
   RENDER — CLIENTES
   ============================================ */
function renderClientes() {
  const tbody = document.querySelector('#clientes-table tbody');
  const empty = document.getElementById('clientes-empty');

  if (state.clientes.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    document.getElementById('clientes-table').classList.add('hidden');
    return;
  }
  empty.classList.add('hidden');
  document.getElementById('clientes-table').classList.remove('hidden');

  tbody.innerHTML = state.clientes.map(c => `
    <tr>
      <td><strong>${escapeHtml(c.nombre)}</strong></td>
      <td>${escapeHtml(c.proyecto || '—')}</td>
      <td>${escapeHtml(c.contacto || '—')}</td>
      <td>
        <div class="row-actions">
          <button class="btn-icon" onclick="editCliente('${c.id}')" title="Editar">✎</button>
          <button class="btn-icon danger" onclick="deleteCliente('${c.id}')" title="Eliminar">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function deleteCliente(id) {
  if (!confirm('¿Eliminar este cliente?')) return;
  state.clientes = state.clientes.filter(c => c.id !== id);
  save(STORE.clientes, state.clientes);
  renderClientes();
  renderStats();
}

function editCliente(id) {
  const c = state.clientes.find(x => x.id === id);
  openModal('cliente', c);
}

/* ============================================
   RENDER — INGRESOS
   ============================================ */
function renderIngresos() {
  const tbody = document.querySelector('#ingresos-table tbody');
  const empty = document.getElementById('ingresos-empty');

  if (state.ingresos.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    document.getElementById('ingresos-table').classList.add('hidden');
  } else {
    empty.classList.add('hidden');
    document.getElementById('ingresos-table').classList.remove('hidden');

    const sorted = [...state.ingresos].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    tbody.innerHTML = sorted.map(i => `
      <tr>
        <td>${fmtDate(i.fecha)}</td>
        <td>${escapeHtml(i.cliente || '—')}</td>
        <td>${escapeHtml(i.concepto || '—')}</td>
        <td><span class="badge ${i.estado === 'paid' ? 'badge-paid' : 'badge-pending'}">${i.estado === 'paid' ? 'Cobrado' : 'Pendiente'}</span></td>
        <td><strong>${fmtMoney(i.monto)}</strong></td>
        <td>
          <div class="row-actions">
            <button class="btn-icon" onclick="editIngreso('${i.id}')" title="Editar">✎</button>
            <button class="btn-icon danger" onclick="deleteIngreso('${i.id}')" title="Eliminar">🗑</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Summary numbers
  const cobrado = state.ingresos.filter(i => i.estado === 'paid').reduce((a, b) => a + Number(b.monto || 0), 0);
  const pendiente = state.ingresos.filter(i => i.estado === 'pending').reduce((a, b) => a + Number(b.monto || 0), 0);
  const total = cobrado + pendiente;
  const promedio = state.ingresos.length ? total / state.ingresos.length : 0;

  document.querySelector('[data-sum="cobrado"]').textContent = fmtMoney(cobrado);
  document.querySelector('[data-sum="pendiente"]').textContent = fmtMoney(pendiente);
  document.querySelector('[data-sum="promedio"]').textContent = fmtMoney(promedio);
  document.querySelector('[data-sum="total"]').textContent = fmtMoney(total);

  renderChart();
}

function deleteIngreso(id) {
  if (!confirm('¿Eliminar este ingreso?')) return;
  state.ingresos = state.ingresos.filter(i => i.id !== id);
  save(STORE.ingresos, state.ingresos);
  renderIngresos();
  renderStats();
}

function editIngreso(id) {
  const i = state.ingresos.find(x => x.id === id);
  openModal('ingreso', i);
}

/* ============================================
   CHART
   ============================================ */
function renderChart() {
  const ctx = document.getElementById('ingresos-chart');
  if (!ctx) return;

  // Group by YYYY-MM
  const byMonth = {};
  state.ingresos.forEach(i => {
    if (!i.fecha) return;
    const m = i.fecha.slice(0, 7);
    if (!byMonth[m]) byMonth[m] = { paid: 0, pending: 0 };
    byMonth[m][i.estado] = (byMonth[m][i.estado] || 0) + Number(i.monto || 0);
  });

  // Last 6 months including current
  const labels = [];
  const paid = [];
  const pending = [];
  const now = new Date();
  for (let k = 5; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('es-AR', { month: 'short' });
    labels.push(label);
    paid.push(byMonth[key]?.paid || 0);
    pending.push(byMonth[key]?.pending || 0);
  }

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Cobrado', data: paid, backgroundColor: '#10b981', borderRadius: 6, barThickness: 22 },
        { label: 'Pendiente', data: pending, backgroundColor: '#f59e0b', borderRadius: 6, barThickness: 22 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#8a8275', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,240,218,0.06)' }, ticks: { color: '#8a8275', font: { size: 11 }, callback: v => '$' + v } },
      },
    },
  });
}

/* ============================================
   STATS BAR
   ============================================ */
function renderStats() {
  const proyectos = state.proyectos.length;
  const clientesActivos = state.clientes.filter(c => c.estado === 'active').length;

  document.querySelector('[data-stat="proyectos"]').textContent = proyectos;
  document.querySelector('[data-stat="clientes"]').textContent = clientesActivos;

  // Money stats only when unlocked (DOM also hidden via .locked body class)
  if (isUnlocked) {
    const total = state.ingresos.filter(i => i.estado === 'paid').reduce((a, b) => a + Number(b.monto || 0), 0);
    const thisMonth = new Date().toISOString().slice(0, 7);
    const mes = state.ingresos
      .filter(i => i.estado === 'paid' && (i.fecha || '').startsWith(thisMonth))
      .reduce((a, b) => a + Number(b.monto || 0), 0);
    document.querySelector('[data-stat="ingresos-mes"]').textContent = fmtMoney(mes);
    document.querySelector('[data-stat="ingresos-total"]').textContent = fmtMoney(total);
  }
}

/* ============================================
   RESEÑAS (marquee auto-scroll)
   ============================================ */
function renderResenias() {
  const track = document.getElementById('resenias-track');
  if (!track) return;
  if (state.resenias.length === 0) {
    track.innerHTML = '<div class="resenias-empty">Todavía no hay reseñas. Agregá la primera.</div>';
    track.style.animation = 'none';
    return;
  }

  const cardHtml = (r, dup) => {
    const initials = (r.nombre || '?').split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<span class="star ${i < Number(r.estrellas || 5) ? 'fill' : ''}">★</span>`
    ).join('');
    const avatarStyle = r.avatar ? `style="background-image:url('${escapeAttr(r.avatar)}'); background-color:transparent;"` : '';
    const inner = r.avatar ? '' : initials;
    return `
      <article class="testimonial">
        ${!dup ? `
          <div class="testimonial-actions">
            <button class="btn-icon" onclick="editResenia('${r.id}')" title="Editar">✎</button>
            <button class="btn-icon danger" onclick="deleteResenia('${r.id}')" title="Eliminar">🗑</button>
          </div>
        ` : ''}
        <div class="testimonial-stars">${stars}</div>
        <p class="testimonial-text">"${escapeHtml(r.texto || '')}"</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar" ${avatarStyle}>${inner}</div>
          <div class="testimonial-meta">
            <div class="testimonial-name">${escapeHtml(r.nombre || '')}</div>
            <div class="testimonial-role">${escapeHtml(r.rol || '')}</div>
          </div>
        </div>
      </article>
    `;
  };

  // Duplicate the set for seamless infinite scroll
  track.innerHTML =
    state.resenias.map(r => cardHtml(r, false)).join('') +
    state.resenias.map(r => cardHtml(r, true)).join('');

  // Adjust speed: ~10s per card
  const duration = Math.max(30, state.resenias.length * 10);
  track.style.animation = `scroll-left ${duration}s linear infinite`;
}

function deleteResenia(id) {
  if (!confirm('¿Eliminar esta reseña?')) return;
  state.resenias = state.resenias.filter(r => r.id !== id);
  save(STORE.resenias, state.resenias);
  renderResenias();
}

function editResenia(id) {
  const r = state.resenias.find(x => x.id === id);
  openModal('resenia', r);
}

/* ============================================
   INQUIRIES (consultas de nuevos clientes)
   ============================================ */
function renderInquiries() {
  const list = document.getElementById('inquiries-list');
  const empty = document.getElementById('inquiries-empty');

  if (state.inquiries.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const sorted = [...state.inquiries].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  list.innerHTML = sorted.map(q => `
    <div class="inquiry-card">
      <div class="inquiry-header">
        <div>
          <div class="inquiry-name">${escapeHtml(q.nombre)}</div>
          <div class="inquiry-date">${fmtDate(q.fecha)} · ${escapeHtml(q.email)}</div>
        </div>
        <button class="btn-icon danger" onclick="deleteInquiry('${q.id}')" title="Eliminar">🗑</button>
      </div>
      <div class="inquiry-meta">
        ${q.tipo ? `<span class="meta-chip">${escapeHtml(q.tipo)}</span>` : ''}
        ${q.objetivo ? `<span class="meta-chip">${escapeHtml(q.objetivo)}</span>` : ''}
        ${q.presupuesto ? `<span class="meta-chip">${escapeHtml(q.presupuesto)}</span>` : ''}
        ${q.plazo ? `<span class="meta-chip">${escapeHtml(q.plazo)}</span>` : ''}
      </div>
      <div class="inquiry-body">
        ${q.telefono ? `<div><b>Teléfono</b> ${escapeHtml(q.telefono)}</div>` : ''}
        ${q.negocio ? `<div><b>Negocio</b> ${escapeHtml(q.negocio)}</div>` : ''}
        ${q.referencias ? `<div><b>Referencias</b> ${escapeHtml(q.referencias)}</div>` : ''}
        ${q.contenido ? `<div><b>Contenido</b> ${escapeHtml(q.contenido)}</div>` : ''}
        ${q.dominio ? `<div><b>Dominio</b> ${escapeHtml(q.dominio)}</div>` : ''}
        ${q.mensaje ? `<div><b>Mensaje</b> ${escapeHtml(q.mensaje)}</div>` : ''}
      </div>
    </div>
  `).join('');
}

function deleteInquiry(id) {
  if (!confirm('¿Eliminar esta consulta?')) return;
  state.inquiries = state.inquiries.filter(q => q.id !== id);
  save(STORE.inquiries, state.inquiries);
  renderInquiries();
}

/* ============================================
   MODAL — Forms para crear/editar
   ============================================ */
function openModal(type, data = null) {
  const modal = document.getElementById('modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  if (type === 'proyecto') {
    title.textContent = data ? 'Editar proyecto' : 'Nuevo proyecto';
    const currentShot = data?.screenshot || '';
    body.innerHTML = `
      <form id="modal-form" class="form-card" style="padding:0; box-shadow:none; max-width:none;">
        <label><span>Nombre del proyecto *</span>
          <input name="nombre" required value="${escapeAttr(data?.nombre || '')}"/></label>
        <label><span>Cliente</span>
          <input name="cliente" value="${escapeAttr(data?.cliente || '')}"/></label>
        <label><span>Descripción</span>
          <textarea name="descripcion" rows="3">${escapeHtml(data?.descripcion || '')}</textarea></label>
        <label><span>URL del sitio (opcional)</span>
          <input name="url" type="url" placeholder="https://..." value="${escapeAttr(data?.url || '')}"/></label>
        <label>
          <span>Captura / Preview de la web</span>
          <div class="screenshot-picker">
            <input name="screenshot" type="url" placeholder="URL de imagen (https://...)" value="${escapeAttr(currentShot.startsWith('data:') ? '' : currentShot)}"/>
            <label class="file-btn">
              <span>📷 Subir</span>
              <input type="file" accept="image/*" onchange="handleScreenshotUpload(event)"/>
            </label>
          </div>
          <img id="shot-preview" class="screenshot-preview ${currentShot ? 'show' : ''}" src="${escapeAttr(currentShot)}" alt=""/>
        </label>
        <div class="form-row">
          <label><span>Estado</span>
            <select name="tag">
              <option value="active" ${data?.tag === 'active' ? 'selected' : ''}>Activo</option>
              <option value="completed" ${data?.tag === 'completed' ? 'selected' : ''}>Terminado</option>
              <option value="paused" ${data?.tag === 'paused' ? 'selected' : ''}>Pausado</option>
            </select></label>
          <label><span>Color (sin captura)</span>
            <input name="color" type="color" value="${data?.color || '#0071e3'}" style="height:46px; padding:4px;"/></label>
        </div>
        <button type="submit" class="btn btn-primary btn-block">${data ? 'Guardar cambios' : 'Crear proyecto'}</button>
      </form>
    `;
    // Sync URL input → preview
    const urlInput = body.querySelector('input[name="screenshot"]');
    const prev = body.querySelector('#shot-preview');
    urlInput.addEventListener('input', (e) => {
      const v = e.target.value.trim();
      if (v) {
        prev.src = v;
        prev.classList.add('show');
        delete prev.dataset.fileLoaded;
      } else {
        prev.classList.remove('show');
      }
    });
    document.getElementById('modal-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target).entries());
      // If a file was uploaded, prefer the data URL from the preview
      const prevEl = document.getElementById('shot-preview');
      if (prevEl && prevEl.dataset.fileLoaded === '1') {
        fd.screenshot = prevEl.src;
      }
      if (data) {
        Object.assign(data, fd);
      } else {
        state.proyectos.push({ id: uid(), ...fd });
      }
      save(STORE.proyectos, state.proyectos);
      renderProyectos();
      renderStats();
      closeModal();
    };
  }

  if (type === 'cliente') {
    title.textContent = data ? 'Editar cliente' : 'Nuevo cliente';
    body.innerHTML = `
      <form id="modal-form" class="form-card" style="padding:0; box-shadow:none; max-width:none;">
        <label><span>Nombre *</span>
          <input name="nombre" required value="${escapeAttr(data?.nombre || '')}"/></label>
        <label><span>Proyecto asociado</span>
          <input name="proyecto" value="${escapeAttr(data?.proyecto || '')}"/></label>
        <label><span>Contacto (email o teléfono)</span>
          <input name="contacto" value="${escapeAttr(data?.contacto || '')}"/></label>
        <div class="form-row">
          <label><span>Estado</span>
            <select name="estado">
              <option value="active" ${data?.estado === 'active' ? 'selected' : ''}>Activo</option>
              <option value="completed" ${data?.estado === 'completed' ? 'selected' : ''}>Terminado</option>
              <option value="paused" ${data?.estado === 'paused' ? 'selected' : ''}>Pausado</option>
            </select></label>
          <label><span>Total facturado ($)</span>
            <input name="total" type="number" min="0" step="any" value="${escapeAttr(data?.total || '0')}"/></label>
        </div>
        <button type="submit" class="btn btn-primary btn-block">${data ? 'Guardar cambios' : 'Crear cliente'}</button>
      </form>
    `;
    document.getElementById('modal-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target).entries());
      fd.total = Number(fd.total) || 0;
      if (data) {
        Object.assign(data, fd);
      } else {
        state.clientes.push({ id: uid(), ...fd });
      }
      save(STORE.clientes, state.clientes);
      renderClientes();
      renderStats();
      closeModal();
    };
  }

  if (type === 'resenia') {
    title.textContent = data ? 'Editar reseña' : 'Nueva reseña';
    body.innerHTML = `
      <form id="modal-form" class="form-card" style="padding:0; box-shadow:none; max-width:none;">
        <div class="form-row">
          <label><span>Nombre *</span>
            <input name="nombre" required value="${escapeAttr(data?.nombre || '')}"/></label>
          <label><span>Rol / Negocio</span>
            <input name="rol" placeholder="Ej: CEO de Calzados Benjamín" value="${escapeAttr(data?.rol || '')}"/></label>
        </div>
        <label><span>Reseña *</span>
          <textarea name="texto" rows="4" required placeholder="Qué dijo el cliente sobre tu trabajo">${escapeHtml(data?.texto || '')}</textarea></label>
        <div class="form-row">
          <label><span>Estrellas</span>
            <select name="estrellas">
              ${[5,4,3,2,1].map(n => `<option value="${n}" ${Number(data?.estrellas) === n ? 'selected' : ''}>${'★'.repeat(n)}${'☆'.repeat(5-n)} (${n})</option>`).join('')}
            </select></label>
          <label><span>Avatar (URL opcional)</span>
            <input name="avatar" type="url" placeholder="https://..." value="${escapeAttr(data?.avatar || '')}"/></label>
        </div>
        <button type="submit" class="btn btn-primary btn-block">${data ? 'Guardar cambios' : 'Publicar reseña'}</button>
      </form>
    `;
    document.getElementById('modal-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target).entries());
      fd.estrellas = Number(fd.estrellas) || 5;
      if (data) {
        Object.assign(data, fd);
      } else {
        state.resenias.push({ id: uid(), ...fd });
      }
      save(STORE.resenias, state.resenias);
      renderResenias();
      closeModal();
    };
  }

  if (type === 'ingreso') {
    title.textContent = data ? 'Editar ingreso' : 'Nuevo ingreso';
    const today = new Date().toISOString().slice(0, 10);
    body.innerHTML = `
      <form id="modal-form" class="form-card" style="padding:0; box-shadow:none; max-width:none;">
        <div class="form-row">
          <label><span>Fecha *</span>
            <input name="fecha" type="date" required value="${data?.fecha || today}"/></label>
          <label><span>Monto ($) *</span>
            <input name="monto" type="number" min="0" step="any" required value="${escapeAttr(data?.monto || '')}"/></label>
        </div>
        <label><span>Cliente</span>
          <input name="cliente" value="${escapeAttr(data?.cliente || '')}"/></label>
        <label><span>Concepto</span>
          <input name="concepto" placeholder="Ej: Anticipo 50%, Saldo final, Mantenimiento..." value="${escapeAttr(data?.concepto || '')}"/></label>
        <label><span>Estado</span>
          <select name="estado">
            <option value="paid" ${data?.estado === 'paid' ? 'selected' : ''}>Cobrado</option>
            <option value="pending" ${data?.estado === 'pending' ? 'selected' : ''}>Pendiente</option>
          </select></label>
        <button type="submit" class="btn btn-primary btn-block">${data ? 'Guardar cambios' : 'Registrar ingreso'}</button>
      </form>
    `;
    document.getElementById('modal-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target).entries());
      fd.monto = Number(fd.monto) || 0;
      if (data) {
        Object.assign(data, fd);
      } else {
        state.ingresos.push({ id: uid(), ...fd });
      }
      save(STORE.ingresos, state.ingresos);
      renderIngresos();
      renderStats();
      closeModal();
    };
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
  modal.classList.remove('preview-modal');
}

function handleScreenshotUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 1.5 * 1024 * 1024) {
    alert('La imagen es muy grande (máx 1.5MB). Usá una URL externa o comprimila antes.');
    e.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    const prev = document.getElementById('shot-preview');
    prev.src = ev.target.result;
    prev.classList.add('show');
    prev.dataset.fileLoaded = '1';
    // Clear the URL input so the file takes priority on submit
    const urlInput = document.querySelector('#modal-form input[name="screenshot"]');
    if (urlInput) urlInput.value = '';
  };
  reader.readAsDataURL(file);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* ============================================
   FORM COTIZACIÓN (consultas de nuevos clientes)
   ============================================ */
const FORMSUBMIT_EMAIL = 'ulisesdiaz1404@gmail.com';

function showToast(message, type = 'success') {
  const t = document.getElementById('toast');
  t.className = `toast ${type}`;
  t.textContent = message;
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => t.classList.remove('show'), 4200);
}

async function sendToEmail(payload) {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${FORMSUBMIT_EMAIL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

document.getElementById('cotizar-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const fd = Object.fromEntries(new FormData(form).entries());

  // 1. Save locally
  const { _subject, _template, _captcha, _honey, ...clean } = fd;
  state.inquiries.push({ id: uid(), fecha: new Date().toISOString(), ...clean });
  save(STORE.inquiries, state.inquiries);
  renderInquiries();

  // 2. Send to email
  const original = btn.textContent;
  btn.textContent = 'Enviando…';
  btn.disabled = true;
  const ok = await sendToEmail(fd);
  btn.disabled = false;

  if (ok) {
    btn.textContent = '✓ Consulta enviada';
    form.reset();
    showToast('Consulta enviada — te respondo en menos de 24h', 'success');
  } else {
    btn.textContent = '✓ Guardada (sin email)';
    form.reset();
    showToast('Guardada localmente. El email se activa la 1ª vez (revisá tu inbox).', 'error');
  }

  setTimeout(() => { btn.textContent = original; }, 3500);
});

/* ============================================
   UTILS
   ============================================ */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  return escapeHtml(str);
}

/* ============================================
   SCROLL ANIMATIONS
   ============================================ */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.section, .stat, .project-card, .inquiry-card').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
}

/* ============================================
   PASSWORD LOCK (sección de ingresos)
   ============================================ */
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function ensurePassword() {
  if (!localStorage.getItem(STORE.passHash)) {
    const h = await sha256(DEFAULT_PASSWORD);
    localStorage.setItem(STORE.passHash, h);
  }
}

function applyLockUI() {
  const locked = document.getElementById('ingresos-locked');
  const content = document.getElementById('ingresos-content');
  if (isUnlocked) {
    locked.classList.add('hidden');
    content.classList.remove('hidden');
    document.body.classList.remove('locked');
  } else {
    locked.classList.remove('hidden');
    content.classList.add('hidden');
    document.body.classList.add('locked');
  }
  renderStats();
}

async function tryUnlock(input) {
  const h = await sha256(input);
  const stored = localStorage.getItem(STORE.passHash);
  if (h === stored) {
    isUnlocked = true;
    applyLockUI();
    renderIngresos();
    return true;
  }
  return false;
}

function lockIngresos() {
  isUnlocked = false;
  applyLockUI();
}

async function changePassword() {
  const current = prompt('Contraseña actual:');
  if (current == null) return;
  const currentHash = await sha256(current);
  if (currentHash !== localStorage.getItem(STORE.passHash)) {
    alert('Contraseña actual incorrecta.');
    return;
  }
  const nueva = prompt('Nueva contraseña (mínimo 4 caracteres):');
  if (nueva == null) return;
  if (nueva.length < 4) {
    alert('Muy corta. Usá al menos 4 caracteres.');
    return;
  }
  const confirma = prompt('Confirmá la nueva contraseña:');
  if (confirma !== nueva) {
    alert('Las contraseñas no coinciden.');
    return;
  }
  localStorage.setItem(STORE.passHash, await sha256(nueva));
  alert('✓ Contraseña actualizada.');
}

document.getElementById('lock-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('lock-input');
  const err = document.getElementById('lock-error');
  const ok = await tryUnlock(input.value);
  if (!ok) {
    err.classList.remove('hidden');
    input.value = '';
    input.focus();
    setTimeout(() => err.classList.add('hidden'), 2500);
  } else {
    input.value = '';
    err.classList.add('hidden');
  }
});

/* ============================================
   INIT
   ============================================ */
document.getElementById('year').textContent = new Date().getFullYear();

(async () => {
  await ensurePassword();
  seedIfEmpty();
  renderProyectos();
  renderClientes();
  renderResenias();
  renderInquiries();
  applyLockUI(); // sets isUnlocked=false, hides money stats + ingresos + inquiries
  initScrollAnimations();
})();
