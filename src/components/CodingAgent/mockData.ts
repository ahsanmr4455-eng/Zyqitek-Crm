import { Brain, Template, Project } from './types';

export const AI_BRAINS: Brain[] = [
  {
    id: 'atlas',
    name: 'Atlas Brain',
    role: 'Software Architect & System Designer',
    description: 'Inspired by Claude-level reasoning. Excels at planning complex roadmaps, defining relational database schemas, identifying performance bottlenecks, and reviewing code against strict standards.',
    strength: 'Architecture, schema layouts, roadmap checklists, code reviews, deep logic analysis.',
    features: ['System-wide roadmap design', 'PostgreSQL / MySQL Schema planning', 'Performance / Security audits', 'Complexity estimation']
  },
  {
    id: 'forge',
    name: 'Forge Brain',
    role: 'Expert Programmer & Debugger',
    description: 'Inspired by Codex-level coding. High precision code creation, advanced optimization, refactoring, and fixing complex syntax, TypeScript or module resolution errors.',
    strength: 'React hooks, Express middleware, API endpoints, bug patching, fast logic refactoring.',
    features: ['Precision syntax generation', 'Multi-file module connection', 'Unit test generation', 'Interactive error debugging']
  },
  {
    id: 'nova',
    name: 'Nova Brain',
    role: 'Full-App Creator',
    description: 'Inspired by Replit Agent. Specializes in turning loose descriptions into fully operational applications. Highly creative, generates fully functional styled UI cards, forms, dashboards, and APIs.',
    strength: 'Product prototyping, Tailwind layout design, dynamic dashboard charts, SaaS components.',
    features: ['Instant boilerplate generator', 'Full-stack UI mockup creation', 'Mock data population', 'Responsive layout engineering']
  }
];

export const STATIC_TEMPLATES: Template[] = [
  {
    id: 'react-crm-dashboard',
    name: 'Tailwind CRM Analytics Dashboard',
    description: 'A premium client dashboard featuring visual KPI widgets, quick activity tracker, lead generator form, and a responsive bento grid structure.',
    techStack: 'React, TypeScript, Tailwind CSS',
    files: [
      {
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SaaS Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-[var(--crm-text)] min-h-screen">
  <div id="root"></div>
</body>
</html>`
      },
      {
        path: 'src/App.tsx',
        language: 'typescript',
        content: `// Dynamic CRM Dashboard Mockup
import React, { useState } from 'react';

export default function App() {
  const [metricMultiplier, setMetricMultiplier] = useState(1);
  const [leads, setLeads] = useState([
    { id: 1, name: 'Acme Corp', value: 12400, category: 'Enterprise' },
    { id: 2, name: 'Hooli Ltd', value: 8900, category: 'Mid-Market' },
    { id: 3, name: 'Stark Industries', value: 45000, category: 'Enterprise' }
  ]);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
      {/* SaaS Dashboard Title bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--crm-heading)] ">Zyqro Dashboard Hub</h1>
          <p className="text-sm text-slate-500 ">Real-time mock analytics and active client lead values</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setMetricMultiplier(prev => prev === 1 ? 1.25 : 1)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {metricMultiplier === 1 ? 'Simulate 25% Growth' : 'Reset Multiplier'}
          </button>
        </div>
      </div>

      {/* KPI Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[var(--crm-card)] border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-400 block">Total Pipeline Value</span>
          <div className="text-3xl font-semibold text-[var(--crm-heading)] mt-2">
            \${(leads.reduce((sum, l) => sum + l.value, 0) * metricMultiplier).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-emerald-600 font-medium block mt-2">↑ 14.2% from previous quarter</span>
        </div>

        <div className="p-6 bg-[var(--crm-card)] border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-400 block">Active Leads</span>
          <div className="text-3xl font-semibold text-[var(--crm-heading)] mt-2">{leads.length} Contracts</div>
          <span className="text-xs text-blue-600 font-medium block mt-2">3 pending negotiation</span>
        </div>

        <div className="p-6 bg-[var(--crm-card)] border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-400 block">System Health</span>
          <div className="text-3xl font-semibold text-emerald-600 mt-2">100% Online</div>
          <span className="text-xs text-slate-500 block mt-2">Latency: 12ms (Vite server)</span>
        </div>
      </div>

      {/* Leads Table Card */}
      <div className="bg-[var(--crm-card)] border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/55 /55">
          <h2 className="font-semibold text-[var(--crm-text)] text-sm">Active Workspace Opportunities</h2>
          <span className="text-[10px] font-mono font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full ">React Sandbox</span>
        </div>
        <div className="p-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold font-mono text-[10px]">
                <th className="pb-3">Client Company</th>
                <th className="pb-3 text-right">Estimated Value</th>
                <th className="pb-3 text-right">Tier Category</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 font-medium text-[var(--crm-heading)] ">{lead.name}</td>
                  <td className="py-3.5 text-right font-mono font-semibold text-slate-700 ">
                    \${(lead.value * metricMultiplier).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3.5 text-right">
                    <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600 ">
                      {lead.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}`
      },
      {
        path: 'src/index.css',
        language: 'css',
        content: `body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: #f8fafc;
}`
      }
    ]
  },
  {
    id: 'express-auth-service',
    name: 'Node/Express API with Auth Router',
    description: 'Boilerplate back-end server providing JWT validation, safe hashing simulation, and client user database schemas.',
    techStack: 'Node.js, Express, JavaScript',
    files: [
      {
        path: 'server.js',
        language: 'javascript',
        content: `// Express Back-end Authentication Server Mockup
const express = require('express');
const app = express();
app.use(express.json());

const MOCK_USERS = [
  { id: 1, email: "admin@zyqro.com", passwordHash: "$2b$10$xyz...", role: "admin" }
];

// Authorization Middleware Simulation
function checkAuth(req, res, next) {
  const token = req.headers.authorization;
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }
  next();
}

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = MOCK_USERS.find(u => u.email === email);
  if (!user) {
    return res.status(400).json({ error: "Invalid credentials" });
  }
  res.json({
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken",
    role: user.role,
    email: user.email
  });
});

app.get('/api/users/profile', checkAuth, (req, res) => {
  res.json({
    id: 1,
    email: "admin@zyqro.com",
    role: "admin",
    verified: true,
    activityLog: ["Login successful from localhost"]
  });
});

app.listen(3000, () => {
  console.log("Mock Auth API Server running on port 3000");
});`
      }
    ]
  },
  {
    id: 'python-db-seed',
    name: 'Python SQLite Database Seed Script',
    description: 'Standalone automation script to initialize SQLite databases, design tables, insert metrics, and export CRM analytics.',
    techStack: 'Python, SQLite',
    files: [
      {
        path: 'seed_db.py',
        language: 'python',
        content: `# Python Database Initialization & Metrics Export
import sqlite3
import json

def init_database():
    conn = sqlite3.connect('zyqro_crm.db')
    cursor = conn.cursor()
    
    # Create Table Structure
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL,
            annual_revenue REAL,
            stage TEXT DEFAULT 'Prospect'
        )
    ''')
    
    # Pre-populate rows
    mock_leads = [
        ('Initech LLC', 550000.0, 'Closed Won'),
        ('Globex Corp', 1200000.0, 'Negotiation'),
        ('Umbrella Co', 98000.0, 'Prospect')
    ]
    
    cursor.executemany(
        'INSERT INTO leads (company_name, annual_revenue, stage) VALUES (?, ?, ?)',
        mock_leads
    )
    
    conn.commit()
    print("[SUCCESS] SQLite Database created and populated with leads snapshot.")
    
    # Export metrics JSON
    cursor.execute('SELECT SUM(annual_revenue) FROM leads')
    total_rev = cursor.fetchone()[0]
    
    metrics = {
        "total_estimated_pipeline": total_rev,
        "active_companies_count": len(mock_leads)
    }
    
    with open('metrics_export.json', 'w') as f:
        json.dump(metrics, f, indent=2)
    print("[EXPORT] Exported metrics_export.json successfully.")
    
    conn.close()

if __name__ == '__main__':
    init_database()`
      }
    ]
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-demo-saas',
    name: 'SaaS Client Billing Platform',
    description: 'An interactive multi-tier subscription and transaction monitor.',
    techStack: 'React + TypeScript + Tailwind CSS',
    createdAt: '2026-07-16',
    files: STATIC_TEMPLATES[0].files
  },
  {
    id: 'proj-auth-node',
    name: 'Corporate Auth Microservice',
    description: 'Express microservice providing authentication routines, profile requests, and safety token validators.',
    techStack: 'Node.js + Express',
    createdAt: '2026-07-15',
    files: STATIC_TEMPLATES[1].files
  }
];
