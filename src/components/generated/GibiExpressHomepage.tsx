import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowRight, BookOpen, Check, Menu, Pencil, Trash2, Upload, X } from 'lucide-react';
export type UserRole = 'admin' | 'admin_principal' | 'visitor';
export type AuthUser = {
  login: string;
  role: UserRole;
};
export type AdminAccount = {
  login: string;
  senha: string;
  role: 'admin' | 'admin_principal';
};
export type VisitorAccount = {
  login: string;
  senha: string;
  role: 'visitor';
};
type SectorName = 'Infantil' | '10 anos' | '14 anos';
type Sector = {
  title: SectorName;
  detail: string;
  tone: string;
  mark: string;
};
type Comic = {
  id: string;
  title: string;
  sector: SectorName;
  synopsis: string;
  tone: string;
  accent: string;
  mark: string;
  coverUrl?: string;
};
type ComicDraft = {
  id: string | null;
  title: string;
  sector: SectorName;
  synopsis: string;
  coverUrl: string;
};
type LoginDraft = {
  login: string;
  senha: string;
};
type AdminDraft = {
  login: string;
  senha: string;
};
type VisitorRegisterDraft = {
  login: string;
  senha: string;
  confirmarSenha: string;
};
type AccountPasswordDraft = {
  senhaAtual: string;
  novaSenha: string;
  confirmarNovaSenha: string;
};
type AccountFeedback = {
  kind: 'success' | 'error';
  message: string;
};
type AccountUpdateResult = {
  success: boolean;
  message: string;
};
type GibiExpressHomepageProps = {
  user: AuthUser | null;
  admins: AdminAccount[];
  onLogin: (login: string, senha: string) => AuthUser | null;
  onRegisterVisitor: (login: string, senha: string) => AuthUser | null;
  onLogout: () => void;
  onAddAdmin: (admin: AdminAccount) => void;
  onRemoveAdmin: (login: string) => void;
  onChangeAccountLogin: (newLogin: string) => AccountUpdateResult;
  onChangeAccountPassword: (currentPassword: string, newPassword: string, confirmedPassword: string) => AccountUpdateResult;
};
const GIBIS_STORAGE_KEY = 'gibi-express-gibis';
const sectors: Sector[] = [{
  title: 'Infantil',
  detail: 'Histórias leves para imaginar, rir e descobrir.',
  tone: 'bg-[#E31010]',
  mark: '01'
}, {
  title: '10 anos',
  detail: 'Gibis com aventuras mais longas, humor e descobertas.',
  tone: 'bg-[#F5F5F5]',
  mark: '02'
}, {
  title: '14 anos',
  detail: 'Aventuras com mais atitude, mistério e personalidade.',
  tone: 'bg-[#0D0D0D]',
  mark: '03'
}];
const defaultComics: Comic[] = [{
  id: 'o-heroi-das-sombras',
  title: 'O Herói das Sombras',
  sector: '14 anos',
  synopsis: 'Um jovem vigilante descobre que a cidade guarda segredos muito maiores do que suas ruas escuras.',
  tone: 'cover-black',
  accent: '#E31010',
  mark: 'SOMBRA'
}, {
  id: 'missao-galactica',
  title: 'Missão Galáctica',
  sector: 'Infantil',
  synopsis: 'Uma tripulação curiosa atravessa planetas coloridos em busca da estrela que perdeu seu brilho.',
  tone: 'cover-red',
  accent: '#0D0D0D',
  mark: 'ÓRBITA'
}, {
  id: 'clube-dos-enigmas',
  title: 'Clube dos Enigmas',
  sector: '10 anos',
  synopsis: 'Três amigos encontram pistas escondidas na biblioteca e transformam cada recreio em uma investigação.',
  tone: 'cover-paper',
  accent: '#0D0D0D',
  mark: 'CLUBE'
}, {
  id: 'a-cidade-perdida',
  title: 'A Cidade Perdida',
  sector: '14 anos',
  synopsis: 'Mapas antigos, túneis esquecidos e uma expedição que muda tudo ao chegar ao centro da lenda.',
  tone: 'cover-gray',
  accent: '#E31010',
  mark: 'MAPA 07'
}, {
  id: 'turma-do-futuro',
  title: 'Turma do Futuro',
  sector: 'Infantil',
  synopsis: 'Amigos inventores viajam para 2088 e precisam salvar uma feira de ciências cheia de surpresas.',
  tone: 'cover-paper',
  accent: '#0D0D0D',
  mark: '2088'
}];
const emptyComicDraft: ComicDraft = {
  id: null,
  title: '',
  sector: 'Infantil',
  synopsis: '',
  coverUrl: ''
};
const emptyLoginDraft: LoginDraft = {
  login: '',
  senha: ''
};
const emptyAdminDraft: AdminDraft = {
  login: '',
  senha: ''
};
const emptyVisitorRegisterDraft: VisitorRegisterDraft = {
  login: '',
  senha: '',
  confirmarSenha: ''
};
const emptyAccountPasswordDraft: AccountPasswordDraft = {
  senhaAtual: '',
  novaSenha: '',
  confirmarNovaSenha: ''
};
const sectorAnchors: Record<SectorName, string> = {
  Infantil: 'infantil',
  '10 anos': '10-anos',
  '14 anos': '14-anos'
};
const isAdminRole = (role: UserRole) => role === 'admin' || role === 'admin_principal';
const createComicId = (title: string) => {
  const normalizedTitle = title.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${normalizedTitle || 'gibi'}-${Date.now()}`;
};
const readStoredComics = () => {
  if (typeof window === 'undefined') {
    return defaultComics;
  }
  const storedComics = window.localStorage.getItem(GIBIS_STORAGE_KEY);
  if (!storedComics) {
    return defaultComics;
  }
  try {
    const parsedComics = JSON.parse(storedComics) as Comic[];
    return parsedComics;
  } catch {
    window.localStorage.removeItem(GIBIS_STORAGE_KEY);
    return defaultComics;
  }
};
export function GibiExpressHomepage({
  user,
  admins,
  onLogin,
  onRegisterVisitor,
  onLogout,
  onAddAdmin,
  onRemoveAdmin,
  onChangeAccountLogin,
  onChangeAccountPassword
}: GibiExpressHomepageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'admin' | 'visitor'>('admin');
  const [loginDraft, setLoginDraft] = useState<LoginDraft>(emptyLoginDraft);
  const [visitorLoginDraft, setVisitorLoginDraft] = useState<LoginDraft>(emptyLoginDraft);
  const [visitorRegisterDraft, setVisitorRegisterDraft] = useState<VisitorRegisterDraft>(emptyVisitorRegisterDraft);
  const [accountLoginDraft, setAccountLoginDraft] = useState('');
  const [accountPasswordDraft, setAccountPasswordDraft] = useState<AccountPasswordDraft>(emptyAccountPasswordDraft);
  const [accountFeedback, setAccountFeedback] = useState<AccountFeedback | null>(null);
  const [loginError, setLoginError] = useState('');
  const [visitorError, setVisitorError] = useState('');
  const [activeView, setActiveView] = useState<'home' | 'editor' | 'sector'>('home');
  const [activeSector, setActiveSector] = useState<SectorName>('Infantil');
  const [comics, setComics] = useState<Comic[]>(() => readStoredComics());
  const [comicDraft, setComicDraft] = useState<ComicDraft>(emptyComicDraft);
  const [previewComic, setPreviewComic] = useState<Comic | null>(null);
  const [adminDraft, setAdminDraft] = useState<AdminDraft>(emptyAdminDraft);
  const adminAuthenticated = Boolean(user && isAdminRole(user.role));
  const principalAuthenticated = user?.role === 'admin_principal';
  const visibleComics = activeView === 'sector' ? comics.filter(comic => comic.sector === activeSector) : comics;
  const previewDraftComic = useMemo<Comic | null>(() => {
    if (!comicDraft.title.trim() && !comicDraft.synopsis.trim() && !comicDraft.coverUrl.trim()) {
      return null;
    }
    return {
      id: comicDraft.id || 'preview-gibi',
      title: comicDraft.title.trim() || 'Nome do gibi',
      sector: comicDraft.sector,
      synopsis: comicDraft.synopsis.trim() || 'Sinopse do gibi para visualização antes da publicação.',
      tone: 'cover-red',
      accent: '#0D0D0D',
      mark: 'PRÉVIA',
      coverUrl: comicDraft.coverUrl.trim()
    };
  }, [comicDraft]);
  useEffect(() => {
    window.localStorage.setItem(GIBIS_STORAGE_KEY, JSON.stringify(comics));
  }, [comics]);
  useEffect(() => {
    if (!accountFeedback) {
      return undefined;
    }
    const feedbackTimer = window.setTimeout(() => {
      setAccountFeedback(null);
    }, 4000);
    return () => window.clearTimeout(feedbackTimer);
  }, [accountFeedback]);
  const openLogin = () => {
    setLoginOpen(true);
    setLoginMode('admin');
    setMenuOpen(false);
    setLoginError('');
    setVisitorError('');
  };
  const openDirectLogin = () => {
    openLogin();
  };
  const closeLogin = () => {
    setLoginOpen(false);
    setLoginMode('admin');
    setLoginError('');
    setVisitorError('');
  };
  const openAccount = () => {
    if (!user) {
      return;
    }
    setAccountOpen(true);
    setAccountLoginDraft('');
    setAccountPasswordDraft(emptyAccountPasswordDraft);
    setAccountFeedback(null);
    setMenuOpen(false);
  };
  const closeAccount = () => {
    setAccountOpen(false);
    setAccountLoginDraft('');
    setAccountPasswordDraft(emptyAccountPasswordDraft);
    setAccountFeedback(null);
  };
  const handleAccountLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = onChangeAccountLogin(accountLoginDraft);
    setAccountFeedback({
      kind: result.success ? 'success' : 'error',
      message: result.message
    });
    if (result.success) {
      setAccountLoginDraft('');
    }
  };
  const handleAccountPasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = onChangeAccountPassword(accountPasswordDraft.senhaAtual, accountPasswordDraft.novaSenha, accountPasswordDraft.confirmarNovaSenha);
    setAccountFeedback({
      kind: result.success ? 'success' : 'error',
      message: result.message
    });
    if (result.success) {
      setAccountPasswordDraft(emptyAccountPasswordDraft);
    }
  };
  const handleSectorNavigation = (sector: SectorName) => {
    setActiveSector(sector);
    setActiveView('sector');
    setMenuOpen(false);
  };
  const handleOpenEditor = () => {
    if (!adminAuthenticated) {
      return;
    }
    setActiveView('editor');
    setMenuOpen(false);
  };
  const handleBackToSite = () => {
    setActiveView('home');
    setMenuOpen(false);
  };
  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const authenticatedUser = onLogin(loginDraft.login, loginDraft.senha);
    if (!authenticatedUser || !isAdminRole(authenticatedUser.role)) {
      setLoginError('Login ou senha incorretos.');
      return;
    }
    setLoginDraft(emptyLoginDraft);
    setLoginError('');
    setLoginOpen(false);
    setActiveView('home');
  };
  const handleVisitorRegisterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!visitorRegisterDraft.login.trim() || !visitorRegisterDraft.senha) {
      setVisitorError('Informe login e senha para cadastrar.');
      return;
    }
    if (visitorRegisterDraft.senha !== visitorRegisterDraft.confirmarSenha) {
      setVisitorError('As senhas nao conferem.');
      return;
    }
    const authenticatedUser = onRegisterVisitor(visitorRegisterDraft.login, visitorRegisterDraft.senha);
    if (!authenticatedUser) {
      setVisitorError('Este login ja existe. Escolha outro identificador.');
      return;
    }
    setVisitorRegisterDraft(emptyVisitorRegisterDraft);
    setVisitorLoginDraft(emptyLoginDraft);
    setVisitorError('');
    setLoginOpen(false);
    setActiveView('home');
  };
  const handleVisitorLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const authenticatedUser = onLogin(visitorLoginDraft.login, visitorLoginDraft.senha);
    if (!authenticatedUser || authenticatedUser.role !== 'visitor') {
      setVisitorError('Login ou senha de visitante incorretos.');
      return;
    }
    setVisitorLoginDraft(emptyLoginDraft);
    setVisitorRegisterDraft(emptyVisitorRegisterDraft);
    setVisitorError('');
    setLoginOpen(false);
    setActiveView('home');
  };
  const handleLogoutClick = () => {
    onLogout();
    setActiveView('home');
    setMenuOpen(false);
    setLoginOpen(false);
    setAccountOpen(false);
    setLoginMode('admin');
    setLoginDraft(emptyLoginDraft);
    setVisitorLoginDraft(emptyLoginDraft);
    setVisitorRegisterDraft(emptyVisitorRegisterDraft);
    setAccountLoginDraft('');
    setAccountPasswordDraft(emptyAccountPasswordDraft);
    setAccountFeedback(null);
    setLoginError('');
    setVisitorError('');
  };
  const handleSaveComic = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextComic: Comic = {
      id: comicDraft.id || createComicId(comicDraft.title),
      title: comicDraft.title.trim(),
      sector: comicDraft.sector,
      synopsis: comicDraft.synopsis.trim(),
      tone: comicDraft.coverUrl.trim() ? 'cover-red' : 'cover-paper',
      accent: '#E31010',
      mark: comicDraft.title.trim().slice(0, 10).toUpperCase() || 'GIBI',
      coverUrl: comicDraft.coverUrl.trim()
    };
    setComics(currentComics => {
      if (comicDraft.id) {
        return currentComics.map(comic => comic.id === comicDraft.id ? nextComic : comic);
      }
      return [nextComic, ...currentComics];
    });
    setPreviewComic(nextComic);
    setComicDraft(emptyComicDraft);
  };
  const handlePreviewComic = () => {
    if (previewDraftComic) {
      setPreviewComic(previewDraftComic);
    }
  };
  const handleEditComic = (comic: Comic) => {
    setComicDraft({
      id: comic.id,
      title: comic.title,
      sector: comic.sector,
      synopsis: comic.synopsis,
      coverUrl: comic.coverUrl || ''
    });
    setActiveView('editor');
    setPreviewComic(null);
  };
  const handleDeleteComic = (comicId: string) => {
    setComics(currentComics => currentComics.filter(comic => comic.id !== comicId));
    if (previewComic?.id === comicId) {
      setPreviewComic(null);
    }
  };
  const handleCoverFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setComicDraft(currentDraft => ({
          ...currentDraft,
          coverUrl: reader.result as string
        }));
      }
    };
    reader.readAsDataURL(selectedFile);
  };
  const handleAddAdmin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminDraft.login.trim() || !adminDraft.senha.trim()) {
      return;
    }
    onAddAdmin({
      login: adminDraft.login.trim(),
      senha: adminDraft.senha,
      role: 'admin'
    });
    setAdminDraft(emptyAdminDraft);
  };
  return <main className="min-h-screen bg-white text-[#0D0D0D]">
      <header className="border-b border-[#E9E9E9] bg-white">
        <nav className="mx-auto flex min-h-[76px] max-w-[1240px] items-center justify-between px-6 lg:px-10" aria-label="Navegação principal">
          <a href="#inicio" className="group flex items-center gap-3 text-[18px] font-black tracking-[-0.04em]" aria-label="Gibi Express, início" onClick={event => {
          event.preventDefault();
          setActiveView('home');
          setMenuOpen(false);
        }}>
            <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#E31010] text-[11px] font-black text-white shadow-[2px_2px_0_#0D0D0D]">G</span>
            <span>Gibi Express</span>
          </a>
          <div className="hidden items-center gap-9 md:flex">
            <a className="nav-link" href="#inicio" onClick={event => {
            event.preventDefault();
            setActiveView('home');
          }}>
              <span>Inicio</span>
            </a>
            <a className="nav-link" href={`#${sectorAnchors.Infantil}`} onClick={event => {
            event.preventDefault();
            handleSectorNavigation('Infantil');
          }}>
              <span>Infantil</span>
            </a>
            <a className="nav-link" href={`#${sectorAnchors['10 anos']}`} onClick={event => {
            event.preventDefault();
            handleSectorNavigation('10 anos');
          }}>
              <span>10 anos</span>
            </a>
            <a className="nav-link" href={`#${sectorAnchors['14 anos']}`} onClick={event => {
            event.preventDefault();
            handleSectorNavigation('14 anos');
          }}>
              <span>14 anos</span>
            </a>
            {user ? <div className="flex items-center gap-3">
                {adminAuthenticated && <button className="button-primary h-[42px] px-4 text-sm" type="button" onClick={handleOpenEditor}>
                    <span>Abrir Editor</span>
                  </button>}
                <span className="max-w-[150px] truncate text-sm font-bold text-[#777777]">{user.login}</span>
                <button className="button-outline" type="button" onClick={openAccount}>
                  <span>Minha conta</span>
                </button>
                <button className="button-outline" type="button" onClick={handleLogoutClick}>
                  <span>Sair</span>
                </button>
              </div> : <button className="button-outline" type="button" onClick={openDirectLogin}>
                <span>Entrar</span>
              </button>}
          </div>
          <button className="rounded-md p-2 md:hidden" type="button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
        {menuOpen && <div className="border-t border-[#E9E9E9] px-6 py-5 md:hidden">
            <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
              <a className="nav-link" href="#inicio" onClick={event => {
            event.preventDefault();
            setActiveView('home');
            setMenuOpen(false);
          }}>
                <span>Inicio</span>
              </a>
              <a className="nav-link" href={`#${sectorAnchors.Infantil}`} onClick={event => {
            event.preventDefault();
            handleSectorNavigation('Infantil');
          }}>
                <span>Infantil</span>
              </a>
              <a className="nav-link" href={`#${sectorAnchors['10 anos']}`} onClick={event => {
            event.preventDefault();
            handleSectorNavigation('10 anos');
          }}>
                <span>10 anos</span>
              </a>
              <a className="nav-link" href={`#${sectorAnchors['14 anos']}`} onClick={event => {
            event.preventDefault();
            handleSectorNavigation('14 anos');
          }}>
                <span>14 anos</span>
              </a>
              {user ? <div className="flex flex-col items-start gap-3">
                  {adminAuthenticated && <button className="button-primary h-[42px] px-4 text-sm" type="button" onClick={handleOpenEditor}>
                      <span>Abrir Editor</span>
                    </button>}
                  <span className="text-sm font-bold text-[#777777]">{user.login}</span>
                  <button className="button-outline w-fit" type="button" onClick={openAccount}>
                    <span>Minha conta</span>
                  </button>
                  <button className="button-outline w-fit" type="button" onClick={handleLogoutClick}>
                    <span>Sair</span>
                  </button>
                </div> : <button className="button-outline w-fit" type="button" onClick={openDirectLogin}>
                  <span>Entrar</span>
                </button>}
            </div>
          </div>}
      </header>

      {activeView === 'editor' && adminAuthenticated ? <section id="editor" className="mx-auto max-w-[1240px] px-6 py-14 lg:px-10 lg:py-18">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="section-kicker">Administração</p>
              <h1 className="section-title">Editor de gibis</h1>
            </div>
            <div className="flex flex-col items-start gap-4 sm:items-end">
              <button className="button-outline" type="button" onClick={handleBackToSite}>
                <span>Voltar ao site</span>
              </button>
              <p className="max-w-[340px] text-sm leading-5 text-[#777777]">Cadastre capas, sinopses e setores do catálogo oficial da Gibi Express.</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <form className="rounded-xl border border-[#E9E9E9] bg-[#F5F5F5] p-5 sm:p-7" onSubmit={handleSaveComic}>
              <label className="block text-sm font-bold">
                <span>Capa</span>
                <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] bg-white px-3 outline-none focus:border-[#E31010]" type="url" placeholder="URL da imagem de capa" value={comicDraft.coverUrl} onChange={event => setComicDraft(currentDraft => ({
              ...currentDraft,
              coverUrl: event.target.value
            }))} />
              </label>
              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#BBBBBB] bg-white px-4 py-4 text-sm font-bold text-[#777777] transition hover:border-[#E31010] hover:text-[#E31010]">
                <Upload size={17} />
                <span>Enviar imagem</span>
                <input className="sr-only" type="file" accept="image/*" onChange={handleCoverFile} />
              </label>
              <label className="mt-5 block text-sm font-bold">
                <span>Nome do gibi</span>
                <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] bg-white px-3 outline-none focus:border-[#E31010]" type="text" value={comicDraft.title} onChange={event => setComicDraft(currentDraft => ({
              ...currentDraft,
              title: event.target.value
            }))} required />
              </label>
              <label className="mt-5 block text-sm font-bold">
                <span>Sinopse</span>
                <textarea className="mt-2 min-h-[132px] w-full resize-y rounded-md border border-[#D9D9D9] bg-white px-3 py-3 outline-none focus:border-[#E31010]" value={comicDraft.synopsis} onChange={event => setComicDraft(currentDraft => ({
              ...currentDraft,
              synopsis: event.target.value
            }))} required />
              </label>
              <label className="mt-5 block text-sm font-bold">
                <span>Setor</span>
                <select className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] bg-white px-3 outline-none focus:border-[#E31010]" value={comicDraft.sector} onChange={event => setComicDraft(currentDraft => ({
              ...currentDraft,
              sector: event.target.value as SectorName
            }))}>
                  <option value="Infantil">Infantil</option>
                  <option value="10 anos">10 anos</option>
                  <option value="14 anos">14 anos</option>
                </select>
              </label>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button className="button-primary justify-center" type="submit">
                  <Check size={18} />
                  <span>Salvar</span>
                </button>
                <button className="button-outline h-14 justify-center" type="button" onClick={handlePreviewComic} disabled={!previewDraftComic}>
                  <BookOpen size={18} />
                  <span>Publicar/Visualizar</span>
                </button>
              </div>
            </form>

            <div className="space-y-6">
              {previewComic && <section className="rounded-xl border border-[#E9E9E9] p-5" aria-label="Prévia do gibi">
                  <p className="section-kicker">Visualização</p>
                  <div className="mt-4 max-w-[310px]">
                    <article className="comic-card">
                      {previewComic.coverUrl ? <figure className="h-[230px] overflow-hidden bg-[#0D0D0D]">
                          <img className="h-full w-full object-cover" src={previewComic.coverUrl} alt={`Capa do gibi ${previewComic.title}`} />
                          <figcaption className="sr-only">Capa enviada para {previewComic.title}</figcaption>
                        </figure> : <div className={`comic-cover ${previewComic.tone}`}>
                          <span className="text-[11px] font-black tracking-[0.1em] text-white/70">GIBI EXPRESS</span>
                          <span className="mt-auto text-2xl font-black leading-none tracking-[-0.06em]" style={{
                    color: previewComic.accent
                  }}>{previewComic.mark}</span>
                        </div>}
                      <div className="p-4">
                        <span className="rounded-full bg-[#F5F5F5] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#E31010]">{previewComic.sector}</span>
                        <h3 className="mt-3 text-[16px] font-extrabold leading-tight tracking-[-0.02em]">{previewComic.title}</h3>
                        <p className="mt-2 text-[13px] leading-5 text-[#777777]">{previewComic.synopsis}</p>
                      </div>
                    </article>
                  </div>
                </section>}

              <section className="rounded-xl border border-[#E9E9E9] p-5" aria-labelledby="existing-comics-title">
                <p className="section-kicker">Catálogo</p>
                <h2 id="existing-comics-title" className="mt-2 text-2xl font-black tracking-[-0.04em]">Gibis existentes</h2>
                <div className="mt-5 space-y-3">
                  {comics.map(comic => <article key={comic.id} className="flex flex-col gap-4 rounded-lg bg-[#F5F5F5] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#E31010]">{comic.sector}</span>
                        <h3 className="mt-1 text-lg font-extrabold tracking-[-0.03em]">{comic.title}</h3>
                        <p className="mt-1 max-w-[560px] text-sm leading-5 text-[#777777]">{comic.synopsis}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="button-outline" type="button" onClick={() => handleEditComic(comic)}>
                          <Pencil size={15} />
                          <span>Editar</span>
                        </button>
                        <button className="button-outline" type="button" onClick={() => handleDeleteComic(comic.id)}>
                          <Trash2 size={15} />
                          <span>Remover</span>
                        </button>
                      </div>
                    </article>)}
                </div>
              </section>

              {principalAuthenticated && <section className="rounded-xl border border-[#E9E9E9] p-5" aria-labelledby="admin-management-title">
                  <p className="section-kicker">Admin principal</p>
                  <h2 id="admin-management-title" className="mt-2 text-2xl font-black tracking-[-0.04em]">Gerenciar admins</h2>
                  <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleAddAdmin}>
                    <label className="block text-sm font-bold">
                      <span>Login</span>
                      <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] px-3 outline-none focus:border-[#E31010]" type="text" value={adminDraft.login} onChange={event => setAdminDraft(currentDraft => ({
                  ...currentDraft,
                  login: event.target.value
                }))} />
                    </label>
                    <label className="block text-sm font-bold">
                      <span>Senha</span>
                      <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] px-3 outline-none focus:border-[#E31010]" type="password" value={adminDraft.senha} onChange={event => setAdminDraft(currentDraft => ({
                  ...currentDraft,
                  senha: event.target.value
                }))} />
                    </label>
                    <button className="button-primary mt-auto justify-center" type="submit">
                      <span>Adicionar administrador</span>
                    </button>
                  </form>
                  <div className="mt-5 space-y-2">
                    {admins.map(admin => <article key={admin.login} className="flex items-center justify-between gap-4 rounded-lg bg-[#F5F5F5] p-4">
                        <div>
                          <h3 className="text-sm font-extrabold">{admin.login}</h3>
                          <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.12em] text-[#777777]">{admin.role === 'admin_principal' ? 'admin principal' : 'admin'}</p>
                        </div>
                        {admin.role === 'admin_principal' ? <span className="text-[12px] font-bold text-[#777777]">Protegido</span> : <button className="button-outline" type="button" onClick={() => onRemoveAdmin(admin.login)}>
                            <span>Remover administrador</span>
                          </button>}
                      </article>)}
                  </div>
                </section>}
            </div>
          </div>
        </section> : <div>
          {activeView === 'sector' ? <section id={sectorAnchors[activeSector]} className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10 lg:py-20">
              <div className="mb-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="section-kicker">Setor</p>
                  <h1 className="section-title">{activeSector}</h1>
                </div>
                <p className="max-w-[320px] text-sm leading-5 text-[#777777]">Gibis selecionados para o setor {activeSector}.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                {visibleComics.map(comic => <article key={comic.id} className="comic-card">
                    {comic.coverUrl ? <figure className="h-[230px] overflow-hidden bg-[#0D0D0D]">
                        <img className="h-full w-full object-cover" src={comic.coverUrl} alt={`Capa do gibi ${comic.title}`} />
                        <figcaption className="sr-only">Capa de {comic.title}</figcaption>
                      </figure> : <div className={`comic-cover ${comic.tone}`}>
                        <span className="text-[11px] font-black tracking-[0.1em] text-white/70">GIBI EXPRESS</span>
                        <span className="mt-auto text-2xl font-black leading-none tracking-[-0.06em]" style={{
                color: comic.accent
              }}>{comic.mark}</span>
                      </div>}
                    <div className="p-4">
                      <span className="rounded-full bg-[#F5F5F5] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#E31010]">{comic.sector}</span>
                      <h2 className="mt-3 text-[16px] font-extrabold leading-tight tracking-[-0.02em]">{comic.title}</h2>
                      <p className="mt-2 line-clamp-3 text-[13px] leading-5 text-[#777777]">{comic.synopsis}</p>
                    </div>
                  </article>)}
              </div>
            </section> : <div>
              <section id="inicio" className="mx-auto grid max-w-[1240px] items-center gap-14 px-6 pb-24 pt-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20 lg:px-10 lg:pb-28 lg:pt-28">
                <div>
                  {user?.role === 'visitor' ? <p className="mb-6 text-[12px] font-bold uppercase tracking-[0.16em] text-[#E31010]">Bem-vindo, {user.login}</p> : <p className="mb-6 text-[12px] font-bold uppercase tracking-[0.16em] text-[#E31010]">GIBIS DA GIBI EXPRESS</p>}
                  <h1 className="max-w-[690px] text-[46px] font-black leading-[0.98] tracking-[-0.045em] sm:text-[58px] lg:text-[64px]">Descubra os gibis da Gibi Express.</h1>
                  <p className="mt-7 max-w-[560px] text-[18px] leading-7 text-[#777777]">Explore nossa colecao de historias em quadrinhos organizadas para voce. Infantil, 10 anos e 14 anos.</p>
                  <div className="mt-9 flex flex-wrap items-center gap-5">
                    <a className="button-primary" href="#recentes">
                      <span>Explorar gibis</span>
                      <ArrowRight size={19} strokeWidth={2.5} />
                    </a>
                  </div>
                </div>
                <div className="flex justify-center lg:justify-end">
                  <article className="promo-cover flex aspect-[3/4] w-[min(100%,360px)] flex-col overflow-hidden rounded-xl border-2 border-[#E31010] bg-[#0D0D0D] p-7 text-white shadow-[4px_4px_0_#E31010] sm:p-9" aria-label="Mostruário do catálogo Gibi Express">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex bg-[#E31010] px-3 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-white">GIBI EXPRESS</span>
                      <span className="text-[11px] font-bold text-white/45">CATÁLOGO</span>
                    </div>
                    <div className="my-auto py-12">
                      <p className="max-w-[250px] text-[49px] font-black leading-[0.86] tracking-[-0.07em] text-white sm:text-[58px]">NOSSOS<br />GIBIS</p>
                      <p className="mt-7 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#888888]">INFANTIL, 10 ANOS &amp; 14 ANOS</p>
                    </div>
                    <div className="border-t border-white/15 pt-5">
                      <p className="max-w-[250px] text-[13px] italic leading-5 text-[#D0D0D0]">Um catalogo de historias em quadrinhos da Gibi Express.</p>
                    </div>
                  </article>
                </div>
              </section>

              <section id="setores" className="border-t border-[#E9E9E9] bg-[#F5F5F5] px-6 py-20 lg:px-10 lg:py-24">
                <div className="mx-auto max-w-[1240px]">
                  <div className="mb-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                      <p className="section-kicker">Navegue por idade</p>
                      <h2 className="section-title">Explore nossos setores</h2>
                    </div>
                    <p className="max-w-[270px] text-sm leading-5 text-[#777777]">Encontre gibis organizados para cada momento de leitura.</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {sectors.map(sector => <a key={sector.title} href={`#${sectorAnchors[sector.title]}`} className={`sector-card ${sector.tone}`} onClick={event => {
                event.preventDefault();
                handleSectorNavigation(sector.title);
              }}>
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-bold opacity-60">{sector.mark}</span>
                          <ArrowRight size={21} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-extrabold tracking-[-0.03em]">{sector.title}</h3>
                          <p className="mt-2 max-w-[260px] text-sm leading-5 opacity-70">{sector.detail}</p>
                        </div>
                      </a>)}
                  </div>
                </div>
              </section>

              <section id="recentes" className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10 lg:py-24">
                <div className="mb-10 flex items-end justify-between gap-5">
                  <div>
                    <p className="section-kicker">Catálogo</p>
                    <h2 className="section-title">Gibis recentes</h2>
                  </div>
                  <a href="#setores" className="hidden text-sm font-bold text-[#E31010] sm:block">
                    <span>Ver setores</span>
                    <span aria-hidden="true"> →</span>
                  </a>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                  {visibleComics.map(comic => <article key={comic.id} className="comic-card">
                      {comic.coverUrl ? <figure className="h-[230px] overflow-hidden bg-[#0D0D0D]">
                          <img className="h-full w-full object-cover" src={comic.coverUrl} alt={`Capa do gibi ${comic.title}`} />
                          <figcaption className="sr-only">Capa de {comic.title}</figcaption>
                        </figure> : <div className={`comic-cover ${comic.tone}`}>
                          <span className="text-[11px] font-black tracking-[0.1em] text-white/70">GIBI EXPRESS</span>
                          <span className="mt-auto text-2xl font-black leading-none tracking-[-0.06em]" style={{
                  color: comic.accent
                }}>{comic.mark}</span>
                        </div>}
                      <div className="p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="rounded-full bg-[#F5F5F5] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#E31010]">{comic.sector}</span>
                        </div>
                        <h3 className="text-[16px] font-extrabold leading-tight tracking-[-0.02em]">{comic.title}</h3>
                        <p className="mt-2 line-clamp-3 text-[13px] leading-5 text-[#777777]">{comic.synopsis}</p>
                      </div>
                    </article>)}
                </div>
              </section>
            </div>}
        </div>}

      <footer className="bg-[#0D0D0D] px-6 py-12 text-white lg:px-10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 text-lg font-black tracking-[-0.04em]">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#E31010] text-[10px]">G</span>
              <span>Gibi Express</span>
            </div>
            <p className="mt-4 text-sm text-white/45">Gibis oficiais para ler e descobrir.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-[13px] font-semibold text-white/55">
            <a href="#inicio" className="hover:text-white">Inicio</a>
            <a href={`#${sectorAnchors.Infantil}`} className="hover:text-white" onClick={event => {
            event.preventDefault();
            handleSectorNavigation('Infantil');
          }}>Infantil</a>
            <a href={`#${sectorAnchors['10 anos']}`} className="hover:text-white" onClick={event => {
            event.preventDefault();
            handleSectorNavigation('10 anos');
          }}>10 anos</a>
            <a href={`#${sectorAnchors['14 anos']}`} className="hover:text-white" onClick={event => {
            event.preventDefault();
            handleSectorNavigation('14 anos');
          }}>14 anos</a>
          </div>
          <p className="text-[12px] text-white/35">© 2025 Gibi Express.</p>
        </div>
      </footer>

      {accountOpen && user && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D0D]/60 p-5" role="dialog" aria-modal="true" aria-labelledby="account-title">
          <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-xl bg-white p-7 shadow-[5px_5px_0_#E31010] sm:p-9">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="section-kicker">Minha conta</p>
                <h2 id="account-title" className="mt-2 text-3xl font-black uppercase tracking-[-0.04em]">Configurações</h2>
                <p className="mt-3 text-sm font-semibold text-[#777777]"><span>Voce esta logado como: </span><strong className="text-[#0D0D0D]">{user.login}</strong></p>
              </div>
              <button type="button" className="rounded-md p-1" aria-label="Fechar minha conta" onClick={closeAccount}>
                <X size={20} />
              </button>
            </div>

            {accountFeedback && <div className={`mt-6 flex items-center justify-between gap-4 rounded-md px-3 py-2 text-sm font-bold ${accountFeedback.kind === 'success' ? 'bg-[#16803C]/10 text-[#16803C]' : 'bg-[#E31010]/10 text-[#E31010]'}`} role="status" aria-live="polite">
                <p>{accountFeedback.message}</p>
                <button type="button" className="rounded-sm p-1" aria-label="Dispensar mensagem" onClick={() => setAccountFeedback(null)}>
                  <X size={15} />
                </button>
              </div>}

            <div className="mt-7 grid gap-6 md:grid-cols-2">
              <section aria-labelledby="change-login-title" className="rounded-lg bg-[#F5F5F5] p-5">
                <h3 id="change-login-title" className="text-xl font-black tracking-[-0.04em]">Alterar Login</h3>
                <form className="mt-5 space-y-4" onSubmit={handleAccountLoginSubmit}>
                  <label className="block text-sm font-bold">
                    <span>Login atual</span>
                    <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] bg-white px-3 text-[#777777] outline-none" type="text" value={user.login} disabled />
                  </label>
                  <label className="block text-sm font-bold">
                    <span>Novo login</span>
                    <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] bg-white px-3 outline-none focus:border-[#E31010]" type="text" value={accountLoginDraft} onChange={event => setAccountLoginDraft(event.target.value)} required />
                  </label>
                  <button className="button-primary w-full justify-center" type="submit">
                    <span>Alterar login</span>
                  </button>
                </form>
              </section>

              <section aria-labelledby="change-password-title" className="rounded-lg border border-[#E9E9E9] p-5">
                <h3 id="change-password-title" className="text-xl font-black tracking-[-0.04em]">Alterar Senha</h3>
                <form className="mt-5 space-y-4" onSubmit={handleAccountPasswordSubmit}>
                  <label className="block text-sm font-bold">
                    <span>Senha atual</span>
                    <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] px-3 outline-none focus:border-[#E31010]" type="password" value={accountPasswordDraft.senhaAtual} onChange={event => setAccountPasswordDraft(currentDraft => ({
                  ...currentDraft,
                  senhaAtual: event.target.value
                }))} required />
                  </label>
                  <label className="block text-sm font-bold">
                    <span>Nova senha</span>
                    <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] px-3 outline-none focus:border-[#E31010]" type="password" value={accountPasswordDraft.novaSenha} onChange={event => setAccountPasswordDraft(currentDraft => ({
                  ...currentDraft,
                  novaSenha: event.target.value
                }))} required />
                  </label>
                  <label className="block text-sm font-bold">
                    <span>Confirmar nova senha</span>
                    <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] px-3 outline-none focus:border-[#E31010]" type="password" value={accountPasswordDraft.confirmarNovaSenha} onChange={event => setAccountPasswordDraft(currentDraft => ({
                  ...currentDraft,
                  confirmarNovaSenha: event.target.value
                }))} required />
                  </label>
                  <button className="button-outline h-14 w-full justify-center" type="submit">
                    <span>Alterar senha</span>
                  </button>
                </form>
              </section>
            </div>
          </div>
        </div>}

      {loginOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D0D]/60 p-5" role="dialog" aria-modal="true" aria-labelledby="login-title">
          <div className="max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-xl bg-white p-7 shadow-[5px_5px_0_#E31010] sm:p-9">
            <div className="flex items-start justify-between">
              <div>
                <p className="section-kicker">Acesso</p>
                <h2 id="login-title" className="mt-2 text-3xl font-black uppercase tracking-[-0.04em]">ENTRAR</h2>
              </div>
              <button type="button" className="rounded-md p-1" aria-label="Fechar login" onClick={closeLogin}>
                <X size={20} />
              </button>
            </div>
            {loginMode === 'admin' ? <div>
                <form className="mt-7 space-y-4" onSubmit={handleLoginSubmit}>
                  <label className="block text-sm font-bold">
                    <span>Login</span>
                    <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] px-3 outline-none focus:border-[#E31010]" type="text" placeholder="felipeloko" value={loginDraft.login} onChange={event => setLoginDraft(currentDraft => ({
                ...currentDraft,
                login: event.target.value
              }))} required />
                  </label>
                  <label className="block text-sm font-bold">
                    <span>Senha</span>
                    <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] px-3 outline-none focus:border-[#E31010]" type="password" placeholder="Sua senha" value={loginDraft.senha} onChange={event => setLoginDraft(currentDraft => ({
                ...currentDraft,
                senha: event.target.value
              }))} required />
                  </label>
                  {loginError && <p className="rounded-md bg-[#E31010]/10 px-3 py-2 text-sm font-bold text-[#E31010]">{loginError}</p>}
                  <button className="button-primary mt-2 w-full justify-center" type="submit">
                    <BookOpen size={18} />
                    <span>Entrar</span>
                  </button>
                </form>
                <button className="mt-5 text-left text-sm font-bold text-[#E31010] underline underline-offset-4" type="button" onClick={() => {
            setLoginMode('visitor');
            setLoginError('');
            setVisitorError('');
          }}>
                  <span>E visitante? Clique aqui para cadastrar ou entrar</span>
                </button>
              </div> : <div className="mt-7 grid gap-6 md:grid-cols-2">
                <section aria-labelledby="visitor-register-title" className="rounded-lg bg-[#F5F5F5] p-5">
                  <h3 id="visitor-register-title" className="text-xl font-black tracking-[-0.04em]">Criar conta</h3>
                  <form className="mt-5 space-y-4" onSubmit={handleVisitorRegisterSubmit}>
                    <label className="block text-sm font-bold">
                      <span>Login</span>
                      <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] bg-white px-3 outline-none focus:border-[#E31010]" type="text" value={visitorRegisterDraft.login} onChange={event => setVisitorRegisterDraft(currentDraft => ({
                  ...currentDraft,
                  login: event.target.value
                }))} required />
                    </label>
                    <label className="block text-sm font-bold">
                      <span>Senha</span>
                      <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] bg-white px-3 outline-none focus:border-[#E31010]" type="password" value={visitorRegisterDraft.senha} onChange={event => setVisitorRegisterDraft(currentDraft => ({
                  ...currentDraft,
                  senha: event.target.value
                }))} required />
                    </label>
                    <label className="block text-sm font-bold">
                      <span>Confirmar senha</span>
                      <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] bg-white px-3 outline-none focus:border-[#E31010]" type="password" value={visitorRegisterDraft.confirmarSenha} onChange={event => setVisitorRegisterDraft(currentDraft => ({
                  ...currentDraft,
                  confirmarSenha: event.target.value
                }))} required />
                    </label>
                    <button className="button-primary w-full justify-center" type="submit">
                      <span>Cadastrar</span>
                    </button>
                  </form>
                </section>
                <section aria-labelledby="visitor-login-title" className="rounded-lg border border-[#E9E9E9] p-5">
                  <h3 id="visitor-login-title" className="text-xl font-black tracking-[-0.04em]">Ja tenho conta</h3>
                  <form className="mt-5 space-y-4" onSubmit={handleVisitorLoginSubmit}>
                    <label className="block text-sm font-bold">
                      <span>Login</span>
                      <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] px-3 outline-none focus:border-[#E31010]" type="text" value={visitorLoginDraft.login} onChange={event => setVisitorLoginDraft(currentDraft => ({
                  ...currentDraft,
                  login: event.target.value
                }))} required />
                    </label>
                    <label className="block text-sm font-bold">
                      <span>Senha</span>
                      <input className="mt-2 h-12 w-full rounded-md border border-[#D9D9D9] px-3 outline-none focus:border-[#E31010]" type="password" value={visitorLoginDraft.senha} onChange={event => setVisitorLoginDraft(currentDraft => ({
                  ...currentDraft,
                  senha: event.target.value
                }))} required />
                    </label>
                    <button className="button-outline h-14 w-full justify-center" type="submit">
                      <span>Entrar como visitante</span>
                    </button>
                  </form>
                  <button className="mt-5 text-sm font-bold text-[#E31010] underline underline-offset-4" type="button" onClick={() => {
              setLoginMode('admin');
              setVisitorError('');
            }}>
                    <span>Voltar ao acesso admin</span>
                  </button>
                </section>
                {visitorError && <p className="rounded-md bg-[#E31010]/10 px-3 py-2 text-sm font-bold text-[#E31010] md:col-span-2">{visitorError}</p>}
              </div>}
          </div>
        </div>}
    </main>;
}