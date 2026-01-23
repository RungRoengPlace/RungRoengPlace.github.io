import { useState } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import type { UserRole } from './types';

function App() {
  const [role, setRole] = useState<UserRole>(null);

  if (!role) {
    return <Login onLogin={setRole} />;
  }

  return <Dashboard role={role} onLogout={() => setRole(null)} />;
}

export default App;
