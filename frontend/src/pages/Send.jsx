import React, { useState } from 'react';
import { Card, InputField, Button } from '../components/UI';
import { Send, Key, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { fintechService } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function SendTransaction() {
  const [formData, setFormData] = useState({
    sender: 'alice',
    password: 'password123',
    receiver: 'bob',
    amount: 100
  });
  const [loading, setLoading] = useState(false);
  const [signedData, setSignedData] = useState(null);

  const handleSign = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await fintechService.signTransaction(
        formData.sender,
        formData.password,
        formData.receiver,
        formData.amount
      );
      setSignedData(data);
      toast.success('Transaction signed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to sign transaction');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Issue Signature</h1>
        <p className="text-slate-400 mt-2">Generate a cryptographically signed transaction envelope.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Transaction Details" description="Fill in the details to generate a signature.">
          <form onSubmit={handleSign} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField 
                label="Sender Username" 
                value={formData.sender} 
                onChange={e => setFormData({...formData, sender: e.target.value})}
                placeholder="e.g. alice"
              />
              <InputField 
                label="Passphrase" 
                type="password"
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Secret key password"
              />
            </div>
            <InputField 
              label="Receiver Username" 
              value={formData.receiver} 
              onChange={e => setFormData({...formData, receiver: e.target.value})}
              placeholder="e.g. bob"
            />
            <InputField 
              label="Amount" 
              type="number"
              value={formData.amount} 
              onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
              placeholder="0.00"
            />
            <Button className="w-full py-4 text-lg" isLoading={loading}>
              <Key size={20} className="mr-2" />
              Sign Transaction
            </Button>
          </form>
        </Card>

        <AnimatePresence>
          {signedData ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="h-full border-indigo-500/30 bg-indigo-500/[0.02]" title="Signed Envelope">
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400">
                    <CheckCircle size={20} />
                    <span className="text-sm font-semibold">Signature Generated Successfully</span>
                  </div>

                  <div className="space-y-4">
                    <PayloadBlock 
                      title="Payload Hash (SHA-256)" 
                      content={signedData.hash} 
                      onCopy={() => copyToClipboard(signedData.hash)}
                    />
                    <PayloadBlock 
                      title="Digital Signature (ECDSA)" 
                      content={signedData.signature} 
                      onCopy={() => copyToClipboard(signedData.signature)}
                    />
                    <PayloadBlock 
                      title="Full JSON Package" 
                      content={JSON.stringify(signedData, null, 2)} 
                      onCopy={() => copyToClipboard(JSON.stringify(signedData))}
                      isCode
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 glass-card opacity-50 border-dashed border-2">
              <AlertCircle size={48} className="text-slate-600 mb-4" />
              <p className="text-slate-500 font-medium">Generate a signature to view output</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PayloadBlock({ title, content, onCopy, isCode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</span>
        <button onClick={onCopy} className="text-slate-500 hover:text-indigo-400 transition-colors">
          <Copy size={14} />
        </button>
      </div>
      <div className={cn(
        "p-4 rounded-xl bg-slate-950/50 border border-white/5 text-xs break-all font-mono text-slate-300",
        isCode && "max-h-48 overflow-y-auto"
      )}>
        {isCode ? <pre className="whitespace-pre-wrap">{content}</pre> : content}
      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
