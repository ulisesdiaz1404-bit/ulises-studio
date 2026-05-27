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
        if (entry.target.dataset.stagger) {
          const children = entry.target.querySelectorAll('.stagger-child');
          children.forEach((child, i) => {
            setTimeout(() => child.classList.add('visible'), i * 80);
          });
        }
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.section, .stat, .project-card, .inquiry-card, .about-card, .about-pill, .prosp-search-card, .prosp-kpi').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });

  initParallaxEffect();
  initCounterAnimations();
}

function initParallaxEffect() {
  const shapes = document.querySelector('.hero-shapes');
  if (!shapes || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (scrollY < window.innerHeight * 1.5) {
          shapes.style.transform = `translate3d(0, ${scrollY * 0.12}px, 0)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-stat]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = '1';
        const target = parseInt(entry.target.textContent.replace(/[^0-9]/g, '')) || 0;
        if (target > 0) {
          animateCounter(entry.target, target);
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => observer.observe(el));
}

function animateCounter(el, target) {
  const isMoney = el.classList.contains('money');
  const start = performance.now();
  const duration = 1200;
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(target * eased);
    el.textContent = isMoney ? fmtMoney(current) : current;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
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
  applyLockUI();
  initScrollAnimations();
  initProspeccion();
  initSecurityLayer();
  initGeoHero();
  initPlanetParticles();
})();

/* ============================================
   PROSPECCIÓN — Búsqueda de clientes
   ============================================ */

let prospCfg = {};
let prospMode = 'real';
let prospData = [];
let prospSearchCount = 0;
let prospLastSearchTime = 0;
const PROSP_RATE_LIMIT_MS = 5000;

function initProspeccion() {
  const stored = localStorage.getItem('uli_prosp_cfg');
  prospCfg = stored ? JSON.parse(stored) : {
    apifyKey: '', maxRes: 10, name: 'Ulises', agency: 'Ulisestudio (Diseño web)',
    phone: '+54 9 11 6362-3650', email: 'ulisesdiaz1404@gmail.com', web: ''
  };
  prospSearchCount = parseInt(localStorage.getItem('uli_prosp_searches') || '0');
  syncProspPill();

  document.querySelectorAll('.prosp-opt').forEach(el => {
    el.addEventListener('click', () => {
      el.classList.toggle('on');
      el.querySelector('input').checked = el.classList.contains('on');
    });
  });

  const configForm = document.getElementById('prosp-config-form');
  if (configForm) {
    configForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveProspConfig();
    });
  }
}

function syncProspPill() {
  const pill = document.getElementById('prospApiPill');
  const text = document.getElementById('prospApiText');
  if (!pill) return;
  if (prospCfg.apifyKey) {
    pill.className = 'prosp-api-pill on';
    text.textContent = 'API activa';
  } else {
    pill.className = 'prosp-api-pill off';
    text.textContent = 'Sin API key';
  }
}

function setProspMode(m, btn) {
  prospMode = m;
  document.querySelectorAll('.prosp-mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const toggle = document.getElementById('prospModeToggle');
  m === 'demo' ? toggle.classList.add('demo') : toggle.classList.remove('demo');
  const n = document.getElementById('prospNotice');
  m === 'demo' ? n.classList.add('show') : n.classList.remove('show');
}

async function openProspConfig() {
  if (!isUnlocked) {
    showToast('Desbloqueá la sección privada primero', 'error');
    document.getElementById('ingresos').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const pass = prompt('Contraseña para acceder a la configuración:');
  if (pass == null) return;
  const h = await sha256(pass);
  const stored = localStorage.getItem(STORE.passHash);
  if (h !== stored) {
    showToast('Contraseña incorrecta', 'error');
    return;
  }
  document.getElementById('prospApifyKey').value = prospCfg.apifyKey || '';
  document.getElementById('prospMaxRes').value = prospCfg.maxRes || 10;
  document.getElementById('prospCfgName').value = prospCfg.name || 'Ulises';
  document.getElementById('prospCfgAgency').value = prospCfg.agency || '';
  document.getElementById('prospCfgPhone').value = prospCfg.phone || '';
  document.getElementById('prospCfgEmail').value = prospCfg.email || '';
  document.getElementById('prospCfgWeb').value = prospCfg.web || '';
  document.getElementById('prosp-config-modal').classList.remove('hidden');
}

function closeProspConfig() {
  document.getElementById('prosp-config-modal').classList.add('hidden');
}

function saveProspConfig() {
  prospCfg = {
    apifyKey: sanitizeInput(document.getElementById('prospApifyKey').value.trim()),
    maxRes: parseInt(document.getElementById('prospMaxRes').value),
    name: sanitizeInput(document.getElementById('prospCfgName').value.trim()),
    agency: sanitizeInput(document.getElementById('prospCfgAgency').value.trim()),
    phone: sanitizeInput(document.getElementById('prospCfgPhone').value.trim()),
    email: sanitizeInput(document.getElementById('prospCfgEmail').value.trim()),
    web: sanitizeInput(document.getElementById('prospCfgWeb').value.trim()),
  };
  localStorage.setItem('uli_prosp_cfg', JSON.stringify(prospCfg));
  syncProspPill();
  closeProspConfig();
  showToast('Configuración guardada', 'success');
}

/* Rate limiting */
function canSearch() {
  const now = Date.now();
  if (now - prospLastSearchTime < PROSP_RATE_LIMIT_MS) return false;
  prospLastSearchTime = now;
  return true;
}

/* Search */
async function startProspSearch(e) {
  if (!canSearch()) {
    showToast('Esperá unos segundos antes de buscar de nuevo', 'error');
    return;
  }

  const btn = document.getElementById('prospSearchBtn');
  const zone = sanitizeInput(document.getElementById('prospZoneIn').value.trim());
  const biz = document.getElementById('prospBizType').value;

  if (!zone) {
    const input = document.getElementById('prospZoneIn');
    input.focus();
    input.style.borderColor = 'var(--danger)';
    setTimeout(() => input.style.borderColor = '', 1500);
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="prosp-spin"></span> Buscando...';
  showProspLoading();
  hideProspResults();

  try {
    const res = (prospMode === 'demo' || !prospCfg.apifyKey)
      ? await prospDemoSearch(zone, biz)
      : await prospApifySearch(zone, biz);
    prospData = res;
    prospSearchCount++;
    localStorage.setItem('uli_prosp_searches', String(prospSearchCount));
    renderProspResults(res);
  } catch (err) {
    showProspErr(err.message || 'Error desconocido');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg> Buscar clientes';
    setTimeout(() => document.getElementById('prospLoading').classList.remove('show'), 500);
  }
}

/* Apify real search */
async function prospApifySearch(zone, biz) {
  prospStep(1, 'active'); prospStatus('Conectando con Google Maps Scraper…', 12);
  const query = biz ? `${biz} en ${zone}` : `negocios locales en ${zone}`;
  const body = {
    searchStringsArray: [query],
    maxCrawledPlacesPerSearch: prospCfg.maxRes || 10,
    language: 'es', countryCode: 'ar'
  };
  const r1 = await fetch(
    `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${encodeURIComponent(prospCfg.apifyKey)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!r1.ok) throw new Error(`Apify error ${r1.status}: verificá tu API key`);
  const { data: { id: runId } } = await r1.json();
  prospStep(1, 'done'); prospStep(2, 'active'); prospStatus('Scrapeando Google Maps (30–60 s)…', 30);
  let tries = 0, ds;
  while (tries < 50) {
    await prospWait(3500);
    const rs = await fetch(`https://api.apify.com/v2/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(prospCfg.apifyKey)}`);
    const rd = await rs.json();
    const st = rd.data.status;
    ds = rd.data.defaultDatasetId;
    prospStatus(`Google Maps · estado: ${st}`, Math.min(30 + tries * 1.5, 72));
    if (st === 'SUCCEEDED') break;
    if (['FAILED', 'TIMED-OUT', 'ABORTED'].includes(st)) throw new Error(`Búsqueda: ${st}`);
    tries++;
  }
  prospStatus('Descargando resultados…', 78);
  const ri = await fetch(`https://api.apify.com/v2/datasets/${encodeURIComponent(ds)}/items?token=${encodeURIComponent(prospCfg.apifyKey)}&format=json`);
  const items = await ri.json();
  prospStep(2, 'done'); prospStep(3, 'active'); prospStatus('Analizando presencia web…', 85); await prospWait(400);
  const out = items.map((p, i) => prospProcessPlace(p, i, biz));
  prospStatus('Generando correos…', 93); await prospWait(500);
  prospStep(3, 'done'); prospStep(4, 'active'); prospStatus('¡Listo!', 100); await prospWait(350);
  return out;
}

function prospProcessPlace(p, i, biz) {
  const site = p.website || '';
  let wt = 'web';
  if (!site) wt = 'sin-web';
  else if (/instagram\.|facebook\./.test(site)) wt = 'redes';
  else if (/tiendanube|mercadoshops/.test(site)) wt = 'tienda';
  else if (/funfit|reservio|calendly/.test(site)) wt = 'app';
  else if (/wix\.|weebly\.|webnode\./.test(site)) wt = 'constructor';
  const anl = prospMakeAnalysis(p.title, wt, biz, p.totalScore);
  const svc = prospMakeSvc(biz, wt);
  return {
    idx: i + 1, name: p.title || '—', cat: (p.categories || []).join(', ') || biz,
    wt, wb: prospWBadge(wt), wc: prospWClass(wt), addr: p.address || '—',
    phone: p.phone || null, email: null, site: site || null,
    rating: p.totalScore ? parseFloat(p.totalScore).toFixed(1) : null,
    reviews: p.reviewsCount || 0, anl, svc,
    body: prospMakeEmail(p.title, biz || 'local', wt, anl, svc),
    hasEmail: false, hasPhone: !!p.phone, hasWeb: wt !== 'sin-web'
  };
}

/* Demo search */
async function prospDemoSearch(zone, biz) {
  const label = biz || 'negocios';
  prospStep(1, 'active'); prospStatus('Simulando búsqueda…', 15); await prospWait(900);
  prospStep(1, 'done'); prospStep(2, 'active'); prospStatus(`Analizando ${label} en ${zone}…`, 50); await prospWait(1100);
  prospStep(2, 'done'); prospStep(3, 'active'); prospStatus('Generando correos…', 82); await prospWait(700);
  prospStep(3, 'done'); prospStep(4, 'active'); prospStatus('¡Listo!', 100); await prospWait(300);
  return getProspDemoList(zone, biz);
}

const PROSP_DEMOS = {
  restaurante: [
    { n: 'El Rincón', cat: 'Parrilla', wt: 'redes', ph: '+54 11 4523-1234', em: 'elrincon@gmail.com', addr: 'Av. Principal 1234', rat: '4.3', rev: 87 },
    { n: 'Don Carlos Resto', cat: 'Bodegón', wt: 'sin-web', ph: '+54 11 6234-5678', em: 'doncarlosto@gmail.com', addr: 'Calle Belgrano 456', rat: '4.6', rev: 142 },
    { n: 'La Esquina Verde', cat: 'Vegetariano', wt: 'web', ph: '+54 11 5567-8901', em: 'info@esquinaverde.com.ar', addr: 'Diagonal 789', rat: '4.8', rev: 203, site: 'https://esquinaverde.com.ar' },
    { n: 'Sushi Nakamura', cat: 'Japonés', wt: 'tienda', ph: '+54 11 7234-5678', em: null, addr: 'Calle Comercio 321', rat: '4.5', rev: 96, site: 'https://sushinakamura.tiendanube.com' },
    { n: 'Pizza & Co', cat: 'Pizzería', wt: 'redes', ph: '+54 11 4567-8901', em: 'pizzaco@gmail.com', addr: 'Av. San Martín 567', rat: '4.2', rev: 54 },
  ],
  peluqueria: [
    { n: 'Studio Corte', cat: 'Peluquería Unisex', wt: 'sin-web', ph: '+54 11 5234-9012', em: 'studiocorte@gmail.com', addr: 'Calle Local 123', rat: '4.7', rev: 119 },
    { n: 'Barber Zone', cat: 'Barbería', wt: 'redes', ph: '+54 11 6345-0123', em: null, addr: 'Av. Principal 890', rat: '4.9', rev: 87 },
    { n: 'Esencia Salón', cat: 'Peluquería/Spa', wt: 'web', ph: '+54 11 7456-1234', em: 'info@esenciasalon.com', addr: 'Bulevar 234', rat: '4.4', rev: 165, site: 'https://esenciasalon.com' },
    { n: 'Tijeras de Oro', cat: 'Peluquería', wt: 'sin-web', ph: '+54 11 5678-2345', em: null, addr: 'Pasaje Flores 56', rat: '4.3', rev: 41 },
  ],
  gimnasio: [
    { n: 'Power Gym', cat: 'Gimnasio/Fitness', wt: 'app', ph: '+54 11 4789-3456', em: null, addr: 'Av. Deportes 100', rat: '4.2', rev: 73, site: 'https://powergym.funfit.app' },
    { n: 'CrossFit Sur', cat: 'CrossFit/HIIT', wt: 'redes', ph: '+54 11 5890-4567', em: 'crossfit.sur@gmail.com', addr: 'Calle Atlética 200', rat: '4.8', rev: 134 },
    { n: 'Estudio Pilates', cat: 'Pilates/Yoga', wt: 'web', ph: '+54 11 6901-5678', em: 'info@estudiopilates.com', addr: 'Pasaje Sereno 300', rat: '4.9', rev: 89, site: 'https://estudiopilates.com' },
    { n: 'Muscle Factory', cat: 'Gym/Crossfit', wt: 'sin-web', ph: '+54 11 4321-6789', em: 'musclefactory@gmail.com', addr: 'Av. Industrial 450', rat: '4.0', rev: 62 },
  ],
  'estudio contable': [
    { n: 'Díaz & Asociados', cat: 'Contable/Impositivo', wt: 'web', ph: '+54 11 4012-6789', em: 'info@diazasociados.com.ar', addr: 'Edificio Centro', rat: '4.8', rev: 27, site: 'https://diazasociados.com.ar' },
    { n: 'López CPN', cat: 'Contadora Pública', wt: 'sin-web', ph: '+54 11 5123-7890', em: 'lopez.cpn@gmail.com', addr: 'Torre Profesional 4B', rat: '4.6', rev: 14 },
    { n: 'AR Consulting', cat: 'Consultoría', wt: 'redes', ph: '+54 11 6234-8901', em: 'arconsulting@gmail.com', addr: 'Piso 3 Centro', rat: '4.5', rev: 31 },
  ],
  inmobiliaria: [
    { n: 'Propiedades del Sur', cat: 'Inmobiliaria', wt: 'web', ph: '+54 11 4345-9012', em: 'ventas@propiedad.com.ar', addr: 'Av. Central 500', rat: '4.3', rev: 63, site: 'https://propiedades.com.ar' },
    { n: 'Casa Fácil', cat: 'Alquileres', wt: 'redes', ph: '+54 11 5456-0123', em: null, addr: 'Galería Comercial', rat: '4.1', rev: 38 },
    { n: 'Más Metros', cat: 'Inmobiliaria Premium', wt: 'web', ph: '+54 11 6567-1234', em: 'info@masmetros.com.ar', addr: 'Piso 1 Torre', rat: '4.7', rev: 92, site: 'https://masmetros.com.ar' },
  ],
};
const PROSP_DEFAULT = [
  { n: 'Café del Parque', cat: 'Cafetería', wt: 'redes', ph: '+54 11 4000-1111', em: 'cafedelparque@gmail.com', addr: 'Av. Rivadavia 3200', rat: '4.4', rev: 63 },
  { n: 'Dr. Smile Odontología', cat: 'Clínica Odontológica', wt: 'sin-web', ph: '+54 11 5000-2222', em: 'drsmile@gmail.com', addr: 'Calle Mendoza 450', rat: '4.7', rev: 95 },
  { n: 'Ferretería San José', cat: 'Ferretería', wt: 'web', ph: '+54 11 6000-3333', em: 'info@ferrsjose.com.ar', addr: 'Av. San Martín 780', rat: '4.2', rev: 41, site: 'https://ferrsjose.com.ar' },
  { n: 'Kinesio Vital', cat: 'Kinesiología', wt: 'sin-web', ph: '+54 11 7111-4444', em: null, addr: 'Calle Belgrano 120', rat: '4.9', rev: 112 },
  { n: 'Almacén Natural', cat: 'Dietética', wt: 'tienda', ph: '+54 11 3222-5555', em: 'almacennatural@gmail.com', addr: 'Pasaje Flores 56', rat: '4.6', rev: 78, site: 'https://almacennatural.tiendanube.com' },
];

function getProspDemoList(zone, biz) {
  const list = (PROSP_DEMOS[biz] || PROSP_DEFAULT).map(p => ({ ...p, n: `${p.n} · ${zone}`, addr: `${p.addr}, ${zone}` }));
  return list.map((p, i) => {
    const anl = prospMakeAnalysis(p.n, p.wt, biz, p.rat);
    const svc = prospMakeSvc(biz, p.wt);
    return {
      idx: i + 1, name: p.n, cat: p.cat, wt: p.wt, wb: prospWBadge(p.wt), wc: prospWClass(p.wt),
      addr: p.addr, phone: p.ph || null, email: p.em || null, site: p.site || null,
      rating: p.rat, reviews: p.rev, anl, svc,
      body: prospMakeEmail(p.n, biz || 'local', p.wt, anl, svc),
      hasEmail: !!p.em, hasPhone: !!p.ph, hasWeb: p.wt !== 'sin-web'
    };
  });
}

/* Generators */
const PROSP_WEB_BADGE = { web: 'Web propia', tienda: 'Tienda online', redes: 'Solo redes', 'sin-web': 'Sin web', app: 'App terceros', constructor: 'Web builder' };
const PROSP_WEB_CLASS = { web: 'b-blue', tienda: 'b-green', redes: 'b-amber', 'sin-web': 'b-amber', app: 'b-red', constructor: 'b-purple' };
function prospWBadge(wt) { return PROSP_WEB_BADGE[wt] || wt; }
function prospWClass(wt) { return PROSP_WEB_CLASS[wt] || 'b-blue'; }

function prospMakeAnalysis(name, wt, biz, rat) {
  const pool = {
    'sin-web': ['Sin sitio web propio, solo redes. Pierde clientes que buscan en Google.', 'Sin dominio propio ni presencia indexable. Alta oportunidad.'],
    'redes': ['Solo en redes sociales. Sin SEO local ni reservas automáticas.', 'Depende del algoritmo de redes. Sin web propia es invisible en Google.'],
    'web': [(rat ? `${rat}★ en Google` : 'Buenas reseñas') + ' pero sitio con diseño anticuado y SEO débil.', 'Web propia pero poco responsive y sin llamadas a la acción claras.'],
    'tienda': ['Tienda online con theme estándar. Margen de mejora en CRO y SEO.', 'Vende online pero sin dominio propio ni diseño diferenciador.'],
    'app': ['Usa app genérica sin marca propia. Invisible en Google.', 'Plataforma de terceros: sin identidad online ni captación de leads.'],
    'constructor': ['Web en constructor básico: carga lenta y SEO muy limitado.', 'Wix/Weebly: difícil de posicionar y poco profesional.'],
  };
  const p = pool[wt] || pool['redes'];
  return p[Math.floor(Math.random() * p.length)];
}

function prospMakeSvc(biz, wt) {
  const m = {
    restaurante: { redes: 'Web con menú digital, reservas y delivery.', 'sin-web': 'Web con carta, reservas online y delivery.', web: 'Rediseño + carta interactiva y reservas.', tienda: 'Theme a medida + optimización de pedidos.' },
    peluqueria: { 'sin-web': 'Web con turnos online 24/7 + WhatsApp.', redes: 'Web con agenda automática integrada a WhatsApp.', web: 'Rediseño + sistema de turnos y galería.' },
    gimnasio: { 'sin-web': 'Web con grilla de clases y membresías online.', app: 'Web de marca con clases e inscripción online.', redes: 'Web propia con horarios y captación de leads.', web: 'Rediseño + pagos de cuotas y clases online.' },
    'estudio contable': { 'sin-web': 'Web profesional con agenda de consultas.', redes: 'Web + SEO local y turnos online.', web: 'Rediseño moderno + velocidad y agenda.' },
    inmobiliaria: { 'sin-web': 'Portal de propiedades + landing de tasaciones.', redes: 'Web con portal y captación de propietarios.', web: 'Rediseño + landing de tasaciones online.' },
  };
  const bm = m[biz] || {};
  return bm[wt] || bm.redes || 'Web profesional con diseño a medida y SEO local.';
}

function prospMakeEmail(name, biz, wt, anl, svc) {
  const { name: n, agency: ag, phone: ph, email: em, web: w } = prospCfg;
  const intros = {
    'sin-web': `Vi que ${name} tiene presencia en redes, pero no encontré un sitio web propio.`,
    redes: `Vi que ${name} funciona en redes, pero sin un sitio web propio.`,
    web: `Estuve revisando el sitio de ${name} y noté algunas oportunidades de mejora.`,
    tienda: `Vi que ${name} ya vende online. Hay margen para aumentar las conversiones.`,
    app: `Vi que ${name} usa una app genérica sin web propia con su marca.`,
    constructor: `Revisé la web de ${name} y veo que está sobre un constructor básico.`
  };
  const sbj = {
    'sin-web': `Una web propia para ${name}`, redes: `Más clientes online para ${name}`,
    web: `Mejorar la web de ${name}`, tienda: `Más ventas en la tienda de ${name}`,
    app: `Una web con marca propia para ${name}`, constructor: `Modernizar la web de ${name}`
  };
  return `Asunto: ${sbj[wt] || 'Propuesta para ' + name}\n\nHola, equipo de ${name}:\n\nSoy ${n || 'Ulises'}, de ${ag || 'Ulisestudio'}. ${intros[wt] || intros.web}\n\n${anl}\n\nMe gustaría proponerles ${svc.toLowerCase().replace(/\.$/, '')} para captar más clientes de forma automática.\n\n¿Tienen 15 minutos esta semana para una llamada? Les muestro ejemplos concretos y cómo quedaría para su negocio.\n\nSaludos,\n${n || 'Ulises'} — ${ag || 'Ulisestudio'}\n${ph || ''} · ${em || ''} · ${w || ''}`;
}

/* Render results */
function renderProspResults(list) {
  if (!list || !list.length) {
    showProspEmpty('Sin resultados', 'No encontramos negocios. Probá con otra zona.');
    return;
  }
  const onlyPhone = document.getElementById('prospOptPhone').classList.contains('on');
  const filtered = onlyPhone ? list.filter(d => d.hasPhone) : list;
  if (!filtered.length) {
    showProspEmpty('Sin resultados con teléfono', 'Desactivá el filtro o intentá otra zona.');
    return;
  }

  const kpis = document.getElementById('prospKpis');
  kpis.classList.add('show');
  document.querySelectorAll('.prosp-kpi').forEach((el, i) => {
    setTimeout(() => el.classList.add('vis'), i * 120);
  });
  prospAnimN('pk1', filtered.length);
  prospAnimN('pk2', filtered.filter(d => d.hasEmail).length);
  prospAnimN('pk3', filtered.filter(d => d.hasPhone).length);
  prospAnimN('pk4', filtered.filter(d => !d.hasWeb || d.wt === 'sin-web' || d.wt === 'redes').length);

  const tb = document.getElementById('prospTbody');
  tb.innerHTML = '';
  filtered.forEach((item, i) => {
    const tr = document.createElement('tr');
    tr.style.animationDelay = `${i * 70}ms`;
    tr.innerHTML = `
      <td class="idx-cell">${item.idx}</td>
      <td><div class="biz-name">${escapeHtml(item.name)}</div><div class="biz-cat">${escapeHtml(item.cat)}</div>
        ${item.rating ? `<div><span class="stars">${'★'.repeat(Math.round(parseFloat(item.rating)))}</span><span class="rat">${item.rating} (${item.reviews})</span></div>` : ''}</td>
      <td><span class="prosp-badge ${item.wc}" style="animation-delay:${i * 70 + 200}ms">${item.wb}</span></td>
      <td class="ci">${escapeHtml(item.addr)}</td>
      <td class="ci">${item.email ? `<a href="mailto:${escapeAttr(item.email)}">${escapeHtml(item.email)}</a><br>` : '<span style="color:var(--text-dim);font-size:11px">sin email</span><br>'}${item.phone || '—'}${item.site ? `<br><a href="${escapeAttr(item.site)}" target="_blank" rel="noopener" style="font-size:11px">${prospTryHost(item.site)}</a>` : ''}</td>
      <td class="anl">${escapeHtml(item.anl)}</td>
      <td class="svc">${escapeHtml(item.svc)}</td>`;
    tb.appendChild(tr);
  });

  document.getElementById('prospRCount').textContent = `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`;
  document.getElementById('prospResults').classList.add('show');

  if (document.getElementById('prospOptEmail').classList.contains('on')) {
    renderProspEmails(filtered);
    document.getElementById('prospEmails').classList.add('show');
    document.getElementById('prospECount').textContent = `${filtered.length} correo${filtered.length !== 1 ? 's' : ''}`;
  }

  setTimeout(() => {
    document.getElementById('prospResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
    const obs = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); }
    }), { threshold: 0.1 });
    const leg = document.getElementById('prospLegend');
    if (leg) obs.observe(leg);
  }, 200);
}

function renderProspEmails(list) {
  const grid = document.getElementById('prospEmailGrid');
  grid.innerHTML = '';
  list.forEach((item, i) => {
    const c = document.createElement('div');
    c.className = 'prosp-ecard';
    c.style.animationDelay = `${i * 90}ms`;
    c.innerHTML = `
      <div class="prosp-ecard-top">
        <div style="flex:1;min-width:0"><div class="prosp-ecard-name">${escapeHtml(item.name)}</div>
          <div class="prosp-ecard-to"><svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
            ${escapeHtml(item.email || item.phone || 'Sin contacto')}</div></div>
        <div class="prosp-ecard-num">${item.idx}</div></div>
      <div class="prosp-ecard-body" id="peb${i}">${escapeHtml(item.body)}</div>
      <div class="prosp-ecard-foot"><div class="prosp-ecard-meta">${escapeHtml(item.addr)}</div>
        <div class="prosp-ecard-acts">
          <button class="prosp-btn-sm" onclick="toggleProspExp(${i})">Ver todo</button>
          <button class="prosp-btn-sm" id="pcp${i}" onclick="copyProspEmail(${i},this)">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/></svg>
            Copiar</button></div></div>`;
    grid.appendChild(c);
  });
}

function toggleProspExp(i) {
  const el = document.getElementById('peb' + i);
  const btn = el.closest('.prosp-ecard').querySelector('.prosp-btn-sm');
  el.classList.toggle('expanded');
  btn.textContent = el.classList.contains('expanded') ? 'Ver menos' : 'Ver todo';
}

function copyProspEmail(i, btn) {
  const txt = prospData[i]?.body || '';
  navigator.clipboard.writeText(txt).then(() => {
    btn.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor" style="width:12px;height:12px"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg> ¡Copiado!';
    btn.classList.add('ok');
    setTimeout(() => {
      btn.innerHTML = '<svg viewBox="0 0 20 20" fill="currentColor" style="width:12px;height:12px"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/></svg> Copiar';
      btn.classList.remove('ok');
    }, 1800);
  });
}

/* Loading helpers */
function showProspLoading() {
  document.getElementById('prospLoading').classList.add('show');
  [1, 2, 3, 4].forEach(n => prospStep(n, ''));
  prospProg(0);
}
function hideProspResults() {
  ['prospKpis', 'prospResults', 'prospEmails', 'prospEmpty'].forEach(id => {
    document.getElementById(id).classList.remove('show');
  });
  document.querySelectorAll('.prosp-kpi').forEach(el => el.classList.remove('vis'));
}
function prospStatus(msg, pct) {
  document.getElementById('prospLdStatus').textContent = msg;
  if (pct !== undefined) prospProg(pct);
}
function prospProg(pct) {
  document.getElementById('prospProgFill').style.width = pct + '%';
}
function prospStep(n, state) {
  const el = document.getElementById('ps' + n);
  el.classList.remove('active', 'done');
  if (state) el.classList.add(state);
}
function showProspEmpty(title, desc) {
  document.getElementById('prospEmptyTitle').textContent = title;
  document.getElementById('prospEmptyDesc').textContent = desc;
  document.getElementById('prospEmptyIc').textContent = '🔍';
  document.getElementById('prospEmpty').classList.add('show');
}
function showProspErr(msg) {
  document.getElementById('prospLoading').classList.remove('show');
  document.getElementById('prospEmptyIc').textContent = '✕';
  document.getElementById('prospEmptyTitle').textContent = 'Error en la búsqueda';
  document.getElementById('prospEmptyDesc').textContent = msg;
  document.getElementById('prospEmpty').classList.add('show');
}

function prospAnimN(id, target) {
  const el = document.getElementById(id);
  let cur = 0;
  const step = Math.max(1, Math.ceil(target / 20));
  const t = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target) {
      clearInterval(t);
      el.style.animation = 'prospCountPop .3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
  }, 40);
}

function prospWait(ms) { return new Promise(r => setTimeout(r, ms)); }
function prospTryHost(u) { try { return new URL(u).hostname; } catch { return u; } }

/* Export */
function exportProspHTML() {
  const section = document.getElementById('prospResults');
  if (!section) return;
  const clone = section.cloneNode(true);
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Prospección — Ulises Studio</title><style>body{font-family:system-ui;background:#0c0a10;color:#fff;padding:24px}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:12px;border-bottom:1px solid rgba(255,255,255,.1)}th{background:rgba(255,255,255,.05);font-size:11px;text-transform:uppercase;letter-spacing:.1em}</style></head><body>${clone.innerHTML}</body></html>`;
  const b = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = `prospeccion-${new Date().toISOString().split('T')[0]}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ============================================
   HERO GEOMÉTRICO — Animaciones JS
   ============================================ */
function initGeoHero() {
  animateShapes();
  animateHeroContent();
}

function animateShapes() {
  var shapes = [
    { el: document.querySelector('.geo-entry-1'), delay: 300,  rotFrom: -3,  rotTo: 12  },
    { el: document.querySelector('.geo-entry-2'), delay: 500,  rotFrom: -30, rotTo: -15 },
    { el: document.querySelector('.geo-entry-3'), delay: 400,  rotFrom: -23, rotTo: -8  },
    { el: document.querySelector('.geo-entry-4'), delay: 600,  rotFrom: 5,   rotTo: 20  },
    { el: document.querySelector('.geo-entry-5'), delay: 700,  rotFrom: -40, rotTo: -25 },
  ];

  shapes.forEach(function(s) {
    if (!s.el) return;
    var outer = s.el;
    var inner = outer.querySelector('.geo-shape');

    // Set initial state
    outer.style.opacity = '0';
    outer.style.transform = 'translateY(-150px) rotate(' + s.rotFrom + 'deg)';

    // Entry animation after delay
    setTimeout(function() {
      var start = performance.now();
      var duration = 2400;

      function tickEntry(now) {
        var elapsed = now - start;
        var t = Math.min(elapsed / duration, 1);
        // Custom ease: cubic-bezier(0.23, 0.86, 0.39, 0.96) approximation
        var ease = 1 - Math.pow(1 - t, 3);

        var y = -150 * (1 - ease);
        var rot = s.rotFrom + (s.rotTo - s.rotFrom) * ease;
        var opacity = Math.min(t / 0.5, 1); // fade in during first half

        outer.style.opacity = String(opacity);
        outer.style.transform = 'translateY(' + y + 'px) rotate(' + rot + 'deg)';

        if (t < 1) {
          requestAnimationFrame(tickEntry);
        } else {
          // Entry done — start infinite float on inner
          startFloat(inner);
        }
      }
      requestAnimationFrame(tickEntry);
    }, s.delay);
  });
}

function startFloat(el) {
  if (!el) return;
  var start = performance.now();
  var duration = 12000;

  function tickFloat(now) {
    var elapsed = (now - start) % duration;
    var t = elapsed / duration;
    // sine wave: 0 → 15 → 0
    var y = Math.sin(t * Math.PI * 2) * 15;
    el.style.transform = 'translateY(' + y + 'px)';
    requestAnimationFrame(tickFloat);
  }
  requestAnimationFrame(tickFloat);
}

function animateHeroContent() {
  var items = document.querySelectorAll('.geo-fade-up');
  items.forEach(function(el, i) {
    var delay = 500 + i * 200;
    setTimeout(function() {
      el.classList.add('geo-visible');
    }, delay);
  });
}

/* ============================================
   PLANETA — Partículas JS + Pulso
   ============================================ */
function initPlanetParticles() {
  var particles = document.querySelectorAll('.particle-container .particle');
  if (!particles.length) return;

  // Planet glow pulse via JS
  var planet = document.querySelector('.planet');
  if (planet) {
    var pulseStart = performance.now();
    function pulsePlanet(now) {
      var t = ((now - pulseStart) % 8000) / 8000;
      var intensity = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
      var s1 = 45 + intensity * 15;
      var s2 = 90 + intensity * 30;
      var s3 = 170 + intensity * 30;
      var o1 = 0.55 + intensity * 0.15;
      var o2 = 0.4 + intensity * 0.1;
      planet.style.boxShadow =
        '0 0 0 1px rgba(255,255,255,' + (0.95 + intensity * 0.05) + '),' +
        '0 0 ' + (3 + intensity * 5) + 'px 0.5px rgba(255,255,255,' + (0.8 + intensity * 0.2) + '),' +
        '0 0 ' + (10 + intensity * 14) + 'px 1px rgba(200,235,255,' + (0.7 + intensity * 0.15) + '),' +
        '0 0 ' + s1 + 'px 4px rgba(0,200,255,' + o1 + '),' +
        '0 0 ' + s2 + 'px 10px rgba(0,160,255,' + o2 + '),' +
        '0 0 ' + s3 + 'px 24px rgba(0,128,255,' + (0.2 + intensity * 0.1) + '),' +
        '0 0 260px 50px rgba(0,100,220,' + (0.12 + intensity * 0.06) + ')';
      requestAnimationFrame(pulsePlanet);
    }
    requestAnimationFrame(pulsePlanet);
  }

  // Animate each particle with JS
  particles.forEach(function(p, i) {
    var isSurface = p.classList.contains('surface');
    var duration = isSurface ? (8000 + Math.random() * 5000) : (18000 + Math.random() * 12000);
    var rangeX = isSurface ? (30 + Math.random() * 30) : (100 + Math.random() * 160);
    var rangeY = isSurface ? (20 + Math.random() * 25) : (80 + Math.random() * 160);
    var dirX = Math.random() > 0.5 ? 1 : -1;
    var dirY = Math.random() > 0.5 ? 1 : -1;
    var phaseX = Math.random() * Math.PI * 2;
    var phaseY = Math.random() * Math.PI * 2;
    var phaseO = Math.random() * Math.PI * 2;
    var startTime = performance.now() + i * 200;

    function tickParticle(now) {
      var elapsed = now - startTime;
      if (elapsed < 0) { requestAnimationFrame(tickParticle); return; }
      var t = (elapsed % duration) / duration;
      var x = Math.sin(t * Math.PI * 2 + phaseX) * rangeX * dirX;
      var y = Math.sin(t * Math.PI * 2 + phaseY) * rangeY * dirY;
      var opacity = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 2 + phaseO));

      if (isSurface) {
        var scale = 0.7 + 0.6 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 3 + phaseO));
        p.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(' + scale + ')';
      } else {
        p.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      }
      p.style.opacity = String(opacity);
      requestAnimationFrame(tickParticle);
    }
    requestAnimationFrame(tickParticle);
  });
}

/* ============================================
   SEGURIDAD ANTI-MALWARE
   ============================================ */
function initSecurityLayer() {
  sanitizeAllInputsOnBlur();
  preventClickjacking();
  monitorDOMTampering();
  blockSuspiciousPatterns();
}

function sanitizeInput(str) {
  if (str == null) return '';
  return String(str)
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
}

function sanitizeAllInputsOnBlur() {
  document.addEventListener('blur', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (e.target.type !== 'password' && e.target.type !== 'file') {
        const val = e.target.value;
        const clean = sanitizeInput(val);
        if (val !== clean) e.target.value = clean;
      }
    }
  }, true);
}

function preventClickjacking() {
  if (window.self !== window.top) {
    try {
      if (window.top.location.hostname !== window.self.location.hostname) {
        document.body.innerHTML = '<div style="padding:40px;text-align:center;color:#fda4af;font-size:18px;">Esta página no puede mostrarse en un iframe externo.</div>';
      }
    } catch {
      document.body.innerHTML = '<div style="padding:40px;text-align:center;color:#fda4af;font-size:18px;">Esta página no puede mostrarse en un iframe externo.</div>';
    }
  }
}

function monitorDOMTampering() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          if (node.tagName === 'SCRIPT' && !node.src?.includes('cdn.jsdelivr.net') && !node.src?.includes('chart.js')) {
            node.remove();
          }
          if (node.tagName === 'IFRAME' || node.tagName === 'OBJECT' || node.tagName === 'EMBED') {
            node.remove();
          }
          const attrs = node.attributes;
          if (attrs) {
            for (let i = attrs.length - 1; i >= 0; i--) {
              if (attrs[i].name.startsWith('on') && attrs[i].name !== 'onclick') {
                node.removeAttribute(attrs[i].name);
              }
            }
          }
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function blockSuspiciousPatterns() {
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    const allowed = ['formsubmit.co', 'api.apify.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.origin !== window.location.origin && !allowed.some(d => parsed.hostname.includes(d))) {
        console.warn('[Security] Blocked XHR to:', url);
        return;
      }
    } catch {}
    return origOpen.apply(this, arguments);
  };
}
