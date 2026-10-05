import { useEffect, useState } from 'react';
import { Theme } from './settings/types';
import { GibiExpressHomepage, type AuthUser, type AdminAccount, type VisitorAccount } from './components/generated/GibiExpressHomepage';

let theme: Theme = 'light';

const AUTH_STORAGE_KEY = 'gibi-express-auth-user';
const ADMINS_STORAGE_KEY = 'gibi-express-admins';
const VISITORS_STORAGE_KEY = 'gibi-express-visitors';
const PRINCIPAL_ADMIN_STORAGE_KEY = 'gibi-express-principal-admin';

const defaultPrincipalAdmin: AdminAccount = {
  login: 'felipeloko',
  senha: 'geraldovelho',
  role: 'admin_principal',
};

const defaultVisitorAccounts: VisitorAccount[] = [
  {
    login: 'visitante',
    senha: 'visitante',
    role: 'visitor',
  },
];

function readStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedUser = window.sessionStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function readStoredAdmins(): AdminAccount[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const storedAdmins = window.localStorage.getItem(ADMINS_STORAGE_KEY);

  if (!storedAdmins) {
    return [];
  }

  try {
    const parsedAdmins = JSON.parse(storedAdmins) as AdminAccount[];
    return parsedAdmins.filter(admin => admin.role === 'admin');
  } catch {
    window.localStorage.removeItem(ADMINS_STORAGE_KEY);
    return [];
  }
}

function readStoredPrincipalAdmin(): AdminAccount {
  if (typeof window === 'undefined') {
    return defaultPrincipalAdmin;
  }

  const storedPrincipalAdmin = window.localStorage.getItem(PRINCIPAL_ADMIN_STORAGE_KEY);

  if (!storedPrincipalAdmin) {
    return defaultPrincipalAdmin;
  }

  try {
    const parsedPrincipalAdmin = JSON.parse(storedPrincipalAdmin) as AdminAccount;

    if (parsedPrincipalAdmin.role !== 'admin_principal') {
      return defaultPrincipalAdmin;
    }

    return parsedPrincipalAdmin;
  } catch {
    window.localStorage.removeItem(PRINCIPAL_ADMIN_STORAGE_KEY);
    return defaultPrincipalAdmin;
  }
}

function readStoredVisitors(): VisitorAccount[] {
  if (typeof window === 'undefined') {
    return defaultVisitorAccounts;
  }

  const storedVisitors = window.localStorage.getItem(VISITORS_STORAGE_KEY);

  if (!storedVisitors) {
    return defaultVisitorAccounts;
  }

  try {
    const parsedVisitors = JSON.parse(storedVisitors) as VisitorAccount[];
    return parsedVisitors.filter(visitor => visitor.role === 'visitor');
  } catch {
    window.localStorage.removeItem(VISITORS_STORAGE_KEY);
    return defaultVisitorAccounts;
  }
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [principalAdmin, setPrincipalAdmin] = useState<AdminAccount>(() => readStoredPrincipalAdmin());
  const [admins, setAdmins] = useState<AdminAccount[]>(() => readStoredAdmins());
  const [visitors, setVisitors] = useState<VisitorAccount[]>(() => readStoredVisitors());

  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme);

  useEffect(() => {
    window.localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    window.localStorage.setItem(PRINCIPAL_ADMIN_STORAGE_KEY, JSON.stringify(principalAdmin));
  }, [principalAdmin]);

  useEffect(() => {
    window.localStorage.setItem(VISITORS_STORAGE_KEY, JSON.stringify(visitors));
  }, [visitors]);

  const handleLogin = (login: string, senha: string) => {
    const registeredUsers = [principalAdmin, ...admins, ...visitors];
    const matchedUser = registeredUsers.find(account => account.login === login && account.senha === senha);

    if (!matchedUser) {
      return null;
    }

    const nextUser: AuthUser = {
      login: matchedUser.login,
      role: matchedUser.role,
    };

    setUser(nextUser);
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    return nextUser;
  };

  const handleRegisterVisitor = (login: string, senha: string) => {
    const normalizedLogin = login.trim();

    if (!normalizedLogin || !senha) {
      return null;
    }

    const loginAlreadyUsed = [principalAdmin, ...admins, ...visitors].some(account => account.login === normalizedLogin);

    if (loginAlreadyUsed) {
      return null;
    }

    const nextVisitor: VisitorAccount = {
      login: normalizedLogin,
      senha,
      role: 'visitor',
    };

    setVisitors(currentVisitors => [...currentVisitors, nextVisitor]);

    const nextUser: AuthUser = {
      login: nextVisitor.login,
      role: nextVisitor.role,
    };

    setUser(nextUser);
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    return nextUser;
  };

  const handleLogout = () => {
    setUser(null);
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const handleAddAdmin = (admin: AdminAccount) => {
    setAdmins(currentAdmins => {
      const filteredAdmins = currentAdmins.filter(currentAdmin => currentAdmin.login !== admin.login);
      return [...filteredAdmins, admin];
    });
  };

  const handleRemoveAdmin = (login: string) => {
    setAdmins(currentAdmins => currentAdmins.filter(admin => admin.login !== login));
  };

  const handleChangeAccountLogin = (newLogin: string) => {
    if (!user) {
      return { success: false, message: 'Login ou senha incorretos.' };
    }

    const normalizedLogin = newLogin.trim();

    if (!normalizedLogin) {
      return { success: false, message: 'Login ou senha incorretos.' };
    }

    const allAccounts = [principalAdmin, ...admins, ...visitors];
    const loginAlreadyUsed = allAccounts.some(account => account.login === normalizedLogin && !(account.login === user.login && account.role === user.role));

    if (loginAlreadyUsed) {
      return { success: false, message: 'Esse login ja esta sendo usado.' };
    }

    if (user.role === 'admin_principal') {
      setPrincipalAdmin(currentPrincipalAdmin => ({ ...currentPrincipalAdmin, login: normalizedLogin }));
    }

    if (user.role === 'admin') {
      setAdmins(currentAdmins => currentAdmins.map(admin => admin.login === user.login ? { ...admin, login: normalizedLogin } : admin));
    }

    if (user.role === 'visitor') {
      setVisitors(currentVisitors => currentVisitors.map(visitor => visitor.login === user.login ? { ...visitor, login: normalizedLogin } : visitor));
    }

    const nextUser: AuthUser = {
      login: normalizedLogin,
      role: user.role,
    };

    setUser(nextUser);
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    return { success: true, message: 'Login alterado com sucesso.' };
  };

  const handleChangeAccountPassword = (currentPassword: string, newPassword: string, confirmedPassword: string) => {
    if (!user) {
      return { success: false, message: 'Senha atual incorreta.' };
    }

    const account = [principalAdmin, ...admins, ...visitors].find(currentAccount => currentAccount.login === user.login && currentAccount.role === user.role);

    if (!account || account.senha !== currentPassword) {
      return { success: false, message: 'Senha atual incorreta.' };
    }

    if (newPassword !== confirmedPassword) {
      return { success: false, message: 'Os campos de senha nao coincidem.' };
    }

    if (user.role === 'admin_principal') {
      setPrincipalAdmin(currentPrincipalAdmin => ({ ...currentPrincipalAdmin, senha: newPassword }));
    }

    if (user.role === 'admin') {
      setAdmins(currentAdmins => currentAdmins.map(admin => admin.login === user.login ? { ...admin, senha: newPassword } : admin));
    }

    if (user.role === 'visitor') {
      setVisitors(currentVisitors => currentVisitors.map(visitor => visitor.login === user.login ? { ...visitor, senha: newPassword } : visitor));
    }

    return { success: true, message: 'Senha alterada com sucesso.' };
  };

  return (
    <GibiExpressHomepage
      user={user}
      admins={[principalAdmin, ...admins]}
      onLogin={handleLogin}
      onRegisterVisitor={handleRegisterVisitor}
      onLogout={handleLogout}
      onAddAdmin={handleAddAdmin}
      onRemoveAdmin={handleRemoveAdmin}
      onChangeAccountLogin={handleChangeAccountLogin}
      onChangeAccountPassword={handleChangeAccountPassword}
    />
  );
}

export default App;
