import React, { useEffect, useState } from 'react';
import { Card } from '../components/UI';
import { 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert,
  Clock,
  ExternalLink
} from 'lucide-react';
import { fintechService } from '../services/api';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0 });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await fintechService.getAuditLogs();
      setLogs(data);
      const passed = data.filter(l => l.status === 'PASS' || l.status === 'SUCCESS').length;
      const failed = data.filter(l => l.status === 'FAIL').length;
      setStats({ total: data.length, passed, failed });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h1 className="text-4xl font-black tracking-tight">System Overview</h1>
        <p className="text-slate-400 mt-2">Real-time monitoring of transaction integrity and verification events.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          title="Total Events" 
          value={stats.total} 
          icon={TrendingUp} 
          color="indigo" 
        />
        <StatsCard 
          title="Verified" 
          value={stats.passed} 
          icon={CheckCircle2} 
          color="emerald" 
        />
        <StatsCard 
          title="Rejected" 
          value={stats.failed} 
          icon={XCircle} 
          color="red" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2" title="Recent Activity" description="Latest verification and security logs.">
          <div className="space-y-4">
            {logs.slice(0, 6).map((log, index) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={log.id} 
                className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${
                    log.status === 'PASS' || log.status === 'SUCCESS' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {log.status === 'PASS' || log.status === 'SUCCESS' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">{log.reason}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Clock size={12} />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button className="p-2 text-slate-500 hover:text-indigo-400 transition-colors">
                  <ExternalLink size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-4">
            <ActionItem 
              title="Issue Signature" 
              desc="Sign new transaction payload" 
              link="/send"
            />
            <ActionItem 
              title="Verify Integrity" 
              desc="Test data for tampering" 
              link="/verify"
            />
            <ActionItem 
              title="Full Audit" 
              desc="View complete log history" 
              link="/logs"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color }) {
  const colors = {
    indigo: 'from-indigo-500/20 to-blue-500/5 text-indigo-400 border-indigo-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    red: 'from-red-500/20 to-red-500/5 text-red-400 border-red-500/20',
  };

  return (
    <div className={`glass p-8 rounded-3xl border bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold opacity-70 mb-1">{title}</p>
          <h3 className="text-4xl font-black">{value}</h3>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl">
          <Icon size={28} />
        </div>
      </div>
    </div>
  );
}

function ActionItem({ title, desc, link }) {
  return (
    <a href={link} className="block p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group">
      <h4 className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{title}</h4>
      <p className="text-sm text-slate-500 mt-1">{desc}</p>
    </a>
  );
}
