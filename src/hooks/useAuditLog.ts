// src/hooks/useAuditLog.ts
// Registo de auditoria APENAS em memória — reflete as operações efetuadas
// nesta sessão. Os logs deixaram de ser persistidos no browser.

import { useState } from "react";
import { AuditLog } from "../types";

function makeInitialLogs(): AuditLog[] {
  return [
    {
      id: "log-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      timestamp: new Date().toISOString(),
      action: "SISTEMA",
      details: "Sessão iniciada.",
    },
  ];
}

export function useAuditLog() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => makeInitialLogs());

  const addLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: "log-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      timestamp: new Date().toISOString(),
      action,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev].slice(0, 50));
  };

  return { auditLogs, addLog };
}
