import React, { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://avvkksaqwexjpbkipytc.supabase.co/rest/v1";
const SUPABASE_KEY = "sb_publishable_tXhhhfUREs-gvs6457rwtw_wJLCZa0j";

const colors = {
  bg: "#FBF7F0",
  surface: "#FFFFFF",
  border: "#E5DCC7",
  borderStrong: "#D8CBA8",
  text: "#2E2A25",
  textMuted: "#8C8577",
  primary: "#C1502E",
  primarySoft: "#F4E1D8",
  primaryText: "#8A2E14",
  secondary: "#5B7A5E",
  secondarySoft: "#E6EEE3",
  secondaryText: "#33482F",
  danger: "#B3402F",
  dangerSoft: "#FBEAE5",
};

const PAPEL_LABELS = {
  ARROZ: "Arroz",
  LEGUMINOSA: "Leguminosa",
  PROTEINA: "Proteína",
  SALADA: "Salada",
  ACOMPANHAMENTO: "Acompanhamento",
  MASSA: "Massa",
  SOPA: "Sopa",
  APERITIVO: "Aperitivo",
  SOBREMESA: "Sobremesa",
};

const PAPEL_ORDEM = ["ARROZ", "LEGUMINOSA", "PROTEINA", "SALADA", "ACOMPANHAMENTO", "MASSA", "SOPA", "APERITIVO", "SOBREMESA"];

const SUBTIPO_LABELS = { CARNE: "Carne", FRANGO: "Frango", PEIXE: "Peixe", FRUTOS_DO_MAR: "Frutos do mar", OUTRO: "Outro" };

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    const err = new Error(errText);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function addDaysISO(iso, days) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function Button({ children, onClick, variant = "primary", disabled, style, type = "button" }) {
  const base = {
    height: 52,
    padding: "0 20px",
    borderRadius: 12,
    border: "none",
    fontSize: 16,
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.6 : 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "transform 0.1s",
  };
  const variants = {
    primary: { background: colors.primary, color: "#fff" },
    secondary: { background: colors.secondarySoft, color: colors.secondaryText, border: `1px solid ${colors.secondary}` },
    ghost: { background: "transparent", color: colors.text, border: `1px solid ${colors.borderStrong}` },
    danger: { background: colors.dangerSoft, color: colors.danger, border: `1px solid ${colors.danger}` },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.98)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      aria-pressed={checked}
      style={{
        width: 52,
        height: 32,
        borderRadius: 16,
        border: "none",
        background: checked ? colors.secondary : "#D8D2C4",
        position: "relative",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.15s",
        }}
      />
    </button>
  );
}

function TextField({ label, ...props }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>{label}</div>
      <input
        {...props}
        style={{
          width: "100%",
          height: 48,
          borderRadius: 10,
          border: `1px solid ${colors.borderStrong}`,
          padding: "0 14px",
          fontSize: 16,
          color: colors.text,
          boxSizing: "border-box",
          background: "#fff",
        }}
      />
    </label>
  );
}

function SelectField({ label, children, ...props }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>{label}</div>
      <select
        {...props}
        style={{
          width: "100%",
          height: 48,
          borderRadius: 10,
          border: `1px solid ${colors.borderStrong}`,
          padding: "0 14px",
          fontSize: 16,
          color: colors.text,
          background: "#fff",
          boxSizing: "border-box",
        }}
      >
        {children}
      </select>
    </label>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: "18px 18px",
        marginBottom: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function CardapioDaVovoApp() {
  const [view, setView] = useState("loading");
  const [casa, setCasa] = useState(null);
  const [tab, setTab] = useState("hoje");
  const [nomeCasa, setNomeCasa] = useState("Casa da Vovó");
  const [criandoCasa, setCriandoCasa] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [banner, setBanner] = useState("");

  const [repertorio, setRepertorio] = useState([]);
  const [bibliotecaDisponivel, setBibliotecaDisponivel] = useState([]);
  const [refeicoesHoje, setRefeicoesHoje] = useState([]);

  const [showAddBiblioteca, setShowAddBiblioteca] = useState(false);
  const [showAddPropria, setShowAddPropria] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const [novoNome, setNovoNome] = useState("");
  const [novoPapel, setNovoPapel] = useState("PROTEINA");
  const [novoSubtipo, setNovoSubtipo] = useState("FRANGO");
  const [novoAlmoco, setNovoAlmoco] = useState(true);
  const [novoJantar, setNovoJantar] = useState(true);
  const [salvandoPropria, setSalvandoPropria] = useState(false);

  const [combinacoes, setCombinacoes] = useState([]);
  const [showAddCombinacao, setShowAddCombinacao] = useState(false);
  const [itensSelecionados, setItensSelecionados] = useState([]);
  const [salvandoCombinacao, setSalvandoCombinacao] = useState(false);

  const carregarRepertorio = useCallback(async (casaId) => {
    const rows = await sb(
      `casa_preparacoes?casa_id=eq.${casaId}&select=id,ativo,preparacao:preparacoes(id,nome,papel,subtipo_proteina,is_biblioteca_global,disponivel_almoco,disponivel_jantar)&order=id`
    );
    setRepertorio(rows || []);
    const idsNoRepertorio = new Set((rows || []).map((r) => r.preparacao.id));
    const globais = await sb(`preparacoes?is_biblioteca_global=eq.true&select=id,nome,papel,subtipo_proteina`);
    setBibliotecaDisponivel((globais || []).filter((p) => !idsNoRepertorio.has(p.id)));
  }, []);

  const carregarCombinacoes = useCallback(async (casaId) => {
    const rows = await sb(
      `combinacoes?casa_id=eq.${casaId}&select=id,itens:combinacao_itens(preparacao:preparacoes(id,nome))&order=id`
    );
    setCombinacoes(rows || []);
  }, []);

  const carregarHoje = useCallback(async (casaId) => {
    const hoje = todayISO();
    const refs = await sb(
      `refeicoes?casa_id=eq.${casaId}&data=eq.${hoje}&select=id,tipo,refeicao_preparacoes(papel,preparacao:preparacoes(nome))`
    );
    setRefeicoesHoje(refs || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const casas = await sb("casas?select=*&order=id&limit=1");
        if (casas && casas.length > 0) {
          const c = casas[0];
          setCasa(c);
          await carregarRepertorio(c.id);
          await carregarHoje(c.id);
          await carregarCombinacoes(c.id);
          setView("app");
        } else {
          setView("criar_casa");
        }
      } catch (e) {
        setErrorMsg(`Erro real: ${e.message || e} ${e.status ? `(status ${e.status})` : ""}`);
        setView("erro");
      }
    })();
  }, [carregarRepertorio, carregarHoje, carregarCombinacoes]);

  async function criarCasa() {
    if (criandoCasa) return;
    setCriandoCasa(true);
    setErrorMsg("");
    try {
      const nome = nomeCasa.trim() || "Minha casa";
      const [novaCasa] = await sb("casas", { method: "POST", body: JSON.stringify({ nome }) });

      const globais = await sb(`preparacoes?is_biblioteca_global=eq.true&select=id`);
      if (globais && globais.length > 0) {
        await sb("casa_preparacoes", {
          method: "POST",
          body: JSON.stringify(globais.map((p) => ({ casa_id: novaCasa.id, preparacao_id: p.id, ativo: true }))),
        });
      }

      const hoje = todayISO();
      const [plano] = await sb("planejamentos", {
        method: "POST",
        body: JSON.stringify({ casa_id: novaCasa.id, semana_inicio: hoje, semana_fim: addDaysISO(hoje, 6) }),
      });

      const preparacoesCompletas = await sb(
        `casa_preparacoes?casa_id=eq.${novaCasa.id}&select=preparacao:preparacoes(id,nome,papel,disponivel_almoco,disponivel_jantar)`
      );
      const todas = (preparacoesCompletas || []).map((r) => r.preparacao);

      for (const [tipo, papeis, filtroDisp] of [
        ["ALMOCO", novaCasa.estrutura_almoco, "disponivel_almoco"],
        ["JANTAR", novaCasa.estrutura_jantar, "disponivel_jantar"],
      ]) {
        const [refeicao] = await sb("refeicoes", {
          method: "POST",
          body: JSON.stringify({ planejamento_id: plano.id, casa_id: novaCasa.id, data: hoje, tipo }),
        });
        const linhas = [];
        for (const papel of papeis) {
          const candidatos = todas.filter((p) => p.papel === papel && p[filtroDisp]);
          if (candidatos.length === 0) continue;
          const escolhida = pickRandom(candidatos);
          linhas.push({ refeicao_id: refeicao.id, preparacao_id: escolhida.id, papel });
        }
        if (linhas.length > 0) {
          await sb("refeicao_preparacoes", { method: "POST", body: JSON.stringify(linhas) });
        }
      }

      setCasa(novaCasa);
      await carregarRepertorio(novaCasa.id);
      await carregarHoje(novaCasa.id);
      setBanner("Pronto! Geramos um cardápio de exemplo pra você sentir o app. Agora vamos ensinar o Cardápio da Vovó a cozinhar como a sua casa.");
      setTab("hoje");
      setView("app");
    } catch (e) {
      setErrorMsg("Não foi possível criar a casa. Tente novamente em alguns segundos.");
    } finally {
      setCriandoCasa(false);
    }
  }

  async function toggleAtivo(casaPrepId, novoValor) {
    setSavingId(casaPrepId);
    try {
      await sb(`casa_preparacoes?id=eq.${casaPrepId}`, {
        method: "PATCH",
        body: JSON.stringify({ ativo: novoValor }),
        prefer: "return=minimal",
      });
      setRepertorio((prev) => prev.map((r) => (r.id === casaPrepId ? { ...r, ativo: novoValor } : r)));
    } catch (e) {
      setErrorMsg("Não foi possível salvar essa alteração agora.");
    } finally {
      setSavingId(null);
    }
  }

  async function adicionarDaBiblioteca(preparacao) {
    if (savingId) return;
    setSavingId(`bib-${preparacao.id}`);
    try {
      await sb("casa_preparacoes", {
        method: "POST",
        body: JSON.stringify({ casa_id: casa.id, preparacao_id: preparacao.id, ativo: true }),
      });
      await carregarRepertorio(casa.id);
    } catch (e) {
      setErrorMsg(e.status === 409 ? "Essa preparação já está no seu repertório." : "Não foi possível adicionar agora.");
    } finally {
      setSavingId(null);
    }
  }

  async function salvarPropria() {
    if (salvandoPropria) return;
    if (!novoNome.trim()) {
      setErrorMsg("Digite um nome para a preparação.");
      return;
    }
    setSalvandoPropria(true);
    setErrorMsg("");
    try {
      const [nova] = await sb("preparacoes", {
        method: "POST",
        body: JSON.stringify({
          casa_id: casa.id,
          nome: novoNome.trim(),
          papel: novoPapel,
          subtipo_proteina: novoPapel === "PROTEINA" ? novoSubtipo : null,
          is_biblioteca_global: false,
          disponivel_almoco: novoAlmoco,
          disponivel_jantar: novoJantar,
        }),
      });
      await sb("casa_preparacoes", {
        method: "POST",
        body: JSON.stringify({ casa_id: casa.id, preparacao_id: nova.id, ativo: true }),
      });
      await carregarRepertorio(casa.id);
      setNovoNome("");
      setShowAddPropria(false);
    } catch (e) {
      setErrorMsg("Não foi possível salvar essa preparação. Tente novamente.");
    } finally {
      setSalvandoPropria(false);
    }
  }

  function toggleItemSelecionado(preparacaoId) {
    setItensSelecionados((prev) =>
      prev.includes(preparacaoId) ? prev.filter((id) => id !== preparacaoId) : [...prev, preparacaoId]
    );
  }

  async function salvarCombinacao() {
    if (salvandoCombinacao) return;
    if (itensSelecionados.length < 2) {
      setErrorMsg("Escolha pelo menos 2 preparações para formar uma combinação.");
      return;
    }
    setSalvandoCombinacao(true);
    setErrorMsg("");
    try {
      const [nova] = await sb("combinacoes", { method: "POST", body: JSON.stringify({ casa_id: casa.id }) });
      await sb("combinacao_itens", {
        method: "POST",
        body: JSON.stringify(itensSelecionados.map((preparacao_id) => ({ combinacao_id: nova.id, preparacao_id }))),
      });
      await carregarCombinacoes(casa.id);
      setItensSelecionados([]);
      setShowAddCombinacao(false);
    } catch (e) {
      setErrorMsg("Não foi possível salvar essa combinação. Tente novamente.");
    } finally {
      setSalvandoCombinacao(false);
    }
  }

  const repertorioPorPapel = PAPEL_ORDEM.map((papel) => ({
    papel,
    itens: repertorio.filter((r) => r.preparacao.papel === papel),
  })).filter((g) => g.itens.length > 0 || true);

  if (view === "loading") {
    return (
      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", padding: "3rem 1rem", textAlign: "center", color: colors.textMuted }}>
        Carregando...
      </div>
    );
  }

  if (view === "erro") {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem 1rem", background: colors.dangerSoft, color: colors.danger, borderRadius: 12, margin: 12 }}>
        {errorMsg}
      </div>
    );
  }

  const wrapStyle = {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    background: colors.bg,
    color: colors.text,
    minHeight: 400,
    maxWidth: 480,
    margin: "0 auto",
    paddingBottom: 24,
  };

  if (view === "criar_casa") {
    return (
      <div style={wrapStyle}>
        <div style={{ padding: "2.5rem 1.5rem 1rem", textAlign: "center" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, margin: 0, color: colors.primaryText }}>
            Cardápio da Vovó
          </h1>
          <p style={{ color: colors.textMuted, fontSize: 16, marginTop: 8 }}>
            Vamos começar criando a sua casa.
          </p>
        </div>
        <Card style={{ margin: "0 1.5rem" }}>
          <TextField
            label="Nome da casa"
            value={nomeCasa}
            onChange={(e) => setNomeCasa(e.target.value)}
            placeholder="Casa da Vovó"
          />
          {errorMsg && (
            <div style={{ background: colors.dangerSoft, color: colors.danger, padding: "10px 12px", borderRadius: 8, fontSize: 14, marginBottom: 12 }}>
              {errorMsg}
            </div>
          )}
          <Button onClick={criarCasa} disabled={criandoCasa} style={{ width: "100%" }}>
            {criandoCasa ? "Criando..." : "Criar minha casa e ver um exemplo"}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      <div style={{ padding: "1.5rem 1.25rem 0.5rem" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, margin: 0, color: colors.primaryText }}>
          Cardápio da Vovó
        </h1>
        <p style={{ color: colors.textMuted, fontSize: 14, margin: "4px 0 0" }}>{casa?.nome}</p>
      </div>

      {banner && (
        <div style={{ margin: "0.75rem 1.25rem", background: colors.secondarySoft, color: colors.secondaryText, borderRadius: 12, padding: "12px 14px", fontSize: 14, display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span>{banner}</span>
          <button onClick={() => setBanner("")} style={{ background: "none", border: "none", color: colors.secondaryText, fontWeight: 700, cursor: "pointer" }}>×</button>
        </div>
      )}

      {errorMsg && (
        <div style={{ margin: "0.75rem 1.25rem", background: colors.dangerSoft, color: colors.danger, borderRadius: 10, padding: "10px 14px", fontSize: 14 }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, padding: "0.5rem 1.25rem 1rem", overflowX: "auto" }}>
        {[
          { id: "hoje", label: "Hoje" },
          { id: "preparacoes", label: "Minhas preparações" },
          { id: "combinacoes", label: "Minhas combinações" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 10,
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: "nowrap",
              cursor: "pointer",
              background: tab === t.id ? colors.primary : colors.surface,
              color: tab === t.id ? "#fff" : colors.textMuted,
              border: `1px solid ${tab === t.id ? colors.primary : colors.border}`,
            }}
          >
            {t.label}
          </button>
        ))}
        {["Semana", "Histórico"].map((label) => (
          <div key={label} style={{ height: 40, padding: "0 16px", borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 14, color: colors.textMuted, display: "flex", alignItems: "center", opacity: 0.5, whiteSpace: "nowrap" }}>
            {label} <span style={{ fontSize: 11, marginLeft: 6 }}>em breve</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "0 1.25rem" }}>
        {tab === "hoje" && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, margin: "4px 0" }}>Hoje</p>
            {refeicoesHoje.length === 0 && (
              <Card>
                <p style={{ color: colors.textMuted, margin: 0 }}>Nenhuma refeição planejada ainda para hoje.</p>
              </Card>
            )}
            {refeicoesHoje.map((r) => (
              <Card key={r.id}>
                <p style={{ fontWeight: 700, margin: "0 0 10px", fontSize: 16 }}>{r.tipo === "ALMOCO" ? "Almoço" : "Jantar"}</p>
                {r.refeicao_preparacoes.map((rp, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: i > 0 ? `1px solid ${colors.border}` : "none" }}>
                    <span style={{ color: colors.textMuted, fontSize: 14 }}>{PAPEL_LABELS[rp.papel]}</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{rp.preparacao?.nome}</span>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        )}

        {tab === "preparacoes" && (
          <div>
            <p style={{ color: colors.textMuted, fontSize: 14, margin: "4px 0 14px" }}>
              O que a sua família costuma cozinhar. Desative o que não usa e adicione o que falta.
            </p>

            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <Button variant="secondary" onClick={() => { setShowAddBiblioteca((v) => !v); setShowAddPropria(false); }}>
                + Da biblioteca
              </Button>
              <Button variant="secondary" onClick={() => { setShowAddPropria((v) => !v); setShowAddBiblioteca(false); }}>
                + Criar minha preparação
              </Button>
            </div>

            {showAddBiblioteca && (
              <Card>
                <p style={{ fontWeight: 700, margin: "0 0 10px" }}>Adicionar da biblioteca</p>
                {bibliotecaDisponivel.length === 0 && (
                  <p style={{ color: colors.textMuted, fontSize: 14 }}>Você já adicionou tudo da biblioteca ao seu repertório.</p>
                )}
                {bibliotecaDisponivel.map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${colors.border}` }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{p.nome}</div>
                      <div style={{ fontSize: 12, color: colors.textMuted }}>{PAPEL_LABELS[p.papel]}{p.subtipo_proteina ? ` · ${SUBTIPO_LABELS[p.subtipo_proteina]}` : ""}</div>
                    </div>
                    <Button variant="ghost" disabled={savingId === `bib-${p.id}`} onClick={() => adicionarDaBiblioteca(p)}>
                      {savingId === `bib-${p.id}` ? "..." : "Adicionar"}
                    </Button>
                  </div>
                ))}
              </Card>
            )}

            {showAddPropria && (
              <Card>
                <p style={{ fontWeight: 700, margin: "0 0 10px" }}>Criar minha preparação</p>
                <TextField label="Nome" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex.: Salmão com batata" />
                <SelectField label="Papel na refeição" value={novoPapel} onChange={(e) => setNovoPapel(e.target.value)}>
                  {PAPEL_ORDEM.map((p) => (
                    <option key={p} value={p}>{PAPEL_LABELS[p]}</option>
                  ))}
                </SelectField>
                {novoPapel === "PROTEINA" && (
                  <SelectField label="Tipo de proteína" value={novoSubtipo} onChange={(e) => setNovoSubtipo(e.target.value)}>
                    {Object.entries(SUBTIPO_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </SelectField>
                )}
                <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                    <input type="checkbox" checked={novoAlmoco} onChange={(e) => setNovoAlmoco(e.target.checked)} style={{ width: 20, height: 20 }} />
                    Aparece no almoço
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                    <input type="checkbox" checked={novoJantar} onChange={(e) => setNovoJantar(e.target.checked)} style={{ width: 20, height: 20 }} />
                    Aparece no jantar
                  </label>
                </div>
                <Button onClick={salvarPropria} disabled={salvandoPropria} style={{ width: "100%" }}>
                  {salvandoPropria ? "Salvando..." : "Salvar preparação"}
                </Button>
              </Card>
            )}

            {repertorioPorPapel.map((grupo) => grupo.itens.length > 0 && (
              <div key={grupo.papel} style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, margin: "4px 0" }}>
                  {PAPEL_LABELS[grupo.papel]}
                </p>
                <Card style={{ padding: 0 }}>
                  {grupo.itens.map((r, i) => (
                    <div
                      key={r.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 18px",
                        borderTop: i > 0 ? `1px solid ${colors.border}` : "none",
                        opacity: r.ativo ? 1 : 0.5,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{r.preparacao.nome}</div>
                        {!r.preparacao.is_biblioteca_global && (
                          <div style={{ fontSize: 12, color: colors.secondaryText }}>própria da casa</div>
                        )}
                      </div>
                      <Toggle checked={r.ativo} disabled={savingId === r.id} onChange={(v) => toggleAtivo(r.id, v)} />
                    </div>
                  ))}
                </Card>
              </div>
            ))}
          </div>
        )}

        {tab === "combinacoes" && (
          <div>
            <p style={{ color: colors.textMuted, fontSize: 14, margin: "4px 0 14px" }}>
              O que a sua família costuma comer junto. O gerador vai priorizar essas combinações, sem torná-las obrigatórias.
            </p>

            <Button
              variant="secondary"
              onClick={() => { setShowAddCombinacao((v) => !v); setItensSelecionados([]); }}
              style={{ marginBottom: 16 }}
            >
              + Nova combinação
            </Button>

            {showAddCombinacao && (
              <Card>
                <p style={{ fontWeight: 700, margin: "0 0 10px" }}>Escolha 2 ou mais preparações</p>
                {repertorio.filter((r) => r.ativo).map((r) => (
                  <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", fontSize: 15 }}>
                    <input
                      type="checkbox"
                      checked={itensSelecionados.includes(r.preparacao.id)}
                      onChange={() => toggleItemSelecionado(r.preparacao.id)}
                      style={{ width: 20, height: 20 }}
                    />
                    {r.preparacao.nome}
                    <span style={{ fontSize: 12, color: colors.textMuted }}>({PAPEL_LABELS[r.preparacao.papel]})</span>
                  </label>
                ))}
                <Button onClick={salvarCombinacao} disabled={salvandoCombinacao} style={{ width: "100%", marginTop: 12 }}>
                  {salvandoCombinacao ? "Salvando..." : "Salvar combinação"}
                </Button>
              </Card>
            )}

            {combinacoes.length === 0 && !showAddCombinacao && (
              <Card>
                <p style={{ color: colors.textMuted, margin: 0 }}>Nenhuma combinação cadastrada ainda.</p>
              </Card>
            )}

            {combinacoes.map((c) => (
              <Card key={c.id}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>
                  {c.itens.map((it) => it.preparacao.nome).join(" + ")}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
