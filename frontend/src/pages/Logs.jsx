import React, { useEffect, useState } from 'react';
import { Card, Button } from '../components/UI';
import { 
  Filter, 
  Download, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert,
  Search,
  ChevronLeft,
  ChevronRight,
  History
} from 'lucide-react';
import { fintechService } from '../services/api';
import { motion } from 'framer-motion';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, PASS, FAIL
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await fintechService.getAuditLogs();
      setLogs(data);
    } catch (e) { console.error(e); }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'ALL' || log.status === filter || (filter === 'PASS' && log.status === 'SUCCESS');
    const matchesSearch = log.reason.toLowerCase().includes(search.toLowerCase()) || 
                          (log.transaction_id && log.transaction_id.includes(search));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Audit Trail</h1>
          <p className="text-slate-400 mt-2">Historical record of all system verification events.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">
            <Download size={18} className="mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchLogs}>
            <History size={18} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-indigo-500/50 outline-none transition-all"
              placeholder="Search by reason or transaction ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center bg-slate-950/50 border border-white/10 rounded-2xl p-1 gap-1">
            <FilterButton active={filter === 'ALL'} onClick={() => setFilter('ALL')}>All</FilterButton>
            <FilterButton active={filter === 'PASS'} onClick={() => setFilter('PASS')}>Passed</FilterButton>
            <FilterButton active={filter === 'FAIL'} onClick={() => setFilter('FAIL')}>Failed</FilterButton>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-4 pt-0 font-bold text-slate-500 text-xs uppercase tracking-widest px-4">Status</th>
                <th className="pb-4 pt-0 font-bold text-slate-500 text-xs uppercase tracking-widest px-4">Reason / Event</th>
                <th className="pb-4 pt-0 font-bold text-slate-500 text-xs uppercase tracking-widest px-4">Transaction ID</th>
                <th className="pb-4 pt-0 font-bold text-slate-500 text-xs uppercase tracking-widest px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.map((log, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  key={log.id} 
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-5 px-4">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="py-5 px-4">
                    <span className="font-semibold text-slate-200">{log.reason}</span>
                  </td>
                  <td className="py-5 px-4">
                    <span className="font-mono text-xs text-slate-500">{log.transaction_id || 'N/A'}</span>
                  </td>
                  <td className="py-5 px-4 text-right">
                    <span className="text-sm text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="py-20 text-center text-slate-500">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>No audit logs found matching your filters.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-8 pt-8 border-t border-white/5">
          <p className="text-sm text-slate-500">Showing {filteredLogs.length} entries</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="p-2 h-10 w-10">
              <ChevronLeft size={18} />
            </Button>
            <Button variant="secondary" className="p-2 h-10 w-10">
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-xs font-bold transition-all",
        active ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:text-slate-200"
      )}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const isPass = status === 'PASS' || status === 'SUCCESS' || status === 'KEY_GENERATED';
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
      isPass ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
    )}>
      {isPass ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
      {status}
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
