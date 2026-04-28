import React, { useState } from 'react';
import { Card, Button } from '../components/UI';
import { ShieldCheck, Search, AlertTriangle, CheckCircle2, XCircle, Terminal } from 'lucide-react';
import { fintechService } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function VerifyTransaction() {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      let data;
      try {
        data = JSON.parse(jsonInput);
      } catch (e) {
        toast.error('Invalid JSON format');
        setLoading(false);
        return;
      }

      const res = await fintechService.verifyTransaction(
        data.payload,
        data.signature,
        data.hash
      );
      setResult(res);
      if (res.valid) {
        toast.success('Verification Passed!');
      } else {
        toast.error('Verification Failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => {
    setJsonInput(JSON.stringify({
      payload: {
        sender: "alice",
        receiver: "bob",
        amount: 100,
        timestamp: new Date().toISOString(),
        nonce: "sample-nonce-123"
      },
      signature: "base64-encoded-signature...",
      hash: "sha256-hash..."
    }, null, 2));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Security Validator</h1>
          <p className="text-slate-400 mt-2">Validate transaction integrity and detect tampering attempts.</p>
        </div>
        <Button variant="secondary" onClick={loadSample}>
          <Terminal size={18} className="mr-2" />
          Load Sample JSON
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <Card title="Signed Transaction JSON" description="Paste the full signed envelope below to verify its authenticity.">
            <textarea
              className="w-full h-80 bg-slate-950/50 border border-white/10 rounded-3xl p-6 text-indigo-400 font-mono text-sm focus:border-indigo-500/50 outline-none transition-all resize-none"
              placeholder='{ "payload": { ... }, "signature": "...", "hash": "..." }'
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
            />
            <Button className="w-full mt-6 py-4 text-lg" onClick={handleVerify} isLoading={loading}>
              <ShieldCheck size={20} className="mr-2" />
              Perform Deep Verification
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ResultCard result={result} />
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full glass-card p-12 flex flex-col items-center justify-center text-center opacity-50 border-dashed border-2"
              >
                <Search size={48} className="text-slate-600 mb-6" />
                <h3 className="text-xl font-bold mb-2">Awaiting Input</h3>
                <p className="text-slate-500 text-sm">Paste a transaction envelope and click verify to start the analysis.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result }) {
  const { valid, reason, transaction_id } = result;

  return (
    <Card 
      className={cn(
        "h-full transition-colors duration-500",
        valid ? "border-emerald-500/30 bg-emerald-500/[0.02]" : "border-red-500/30 bg-red-500/[0.02]"
      )}
      title="Verification Result"
    >
      <div className="space-y-8 py-4 text-center">
        <div className="flex justify-center">
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center shadow-2xl",
            valid ? "bg-emerald-500/20 text-emerald-400 shadow-emerald-500/20" : "bg-red-500/20 text-red-400 shadow-red-500/20"
          )}>
            {valid ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
          </div>
        </div>

        <div>
          <h4 className={cn(
            "text-2xl font-black mb-2",
            valid ? "text-emerald-400" : "text-red-400"
          )}>
            {valid ? "TRUSTED" : "REJECTED"}
          </h4>
          <p className="text-slate-300 font-medium">{reason}</p>
        </div>

        {valid && (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Transaction ID</p>
            <p className="font-mono text-xs text-indigo-400">{transaction_id}</p>
          </div>
        )}

        {!valid && reason.includes('Tamper') && (
          <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-left space-y-3">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <AlertTriangle size={16} />
              SECURITY ALERT
            </div>
            <p className="text-xs text-red-300/70 leading-relaxed">
              The payload hash provided does not match the re-computed hash of the data. 
              This indicates the transaction was modified after it was signed.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
