import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, Zap, FileJson } from 'lucide-react';
import { Button } from '../components/UI';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6">
      {/* Background Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[120px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl text-center space-y-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold mb-4">
          <Zap size={16} />
          <span>Next Generation Security</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1]">
          Secure Every <br />
          <span className="text-transparent bg-clip-text indigo-gradient">Transaction</span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Production-ready digital signing system using asymmetric cryptography.
          Verify integrity, prevent replay attacks, and maintain a tamper-proof audit trail.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 pt-8">
          <Link to="/dashboard" className="w-full max-w-sm">
            <Button className="w-full py-6 text-xl rounded-3xl shadow-xl shadow-indigo-500/30">
              Go to Dashboard
              <ArrowRight size={24} className="ml-3" />
            </Button>
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-6xl w-full"
      >
        <FeatureCard
          icon={Lock}
          title="ECDSA Encryption"
          desc="Elliptic Curve Digital Signature Algorithm for state-of-the-art security."
        />
        <FeatureCard
          icon={ShieldCheck}
          title="Tamper Proof"
          desc="Instant detection of any data modification using SHA-256 integrity checks."
        />
        <FeatureCard
          icon={FileJson}
          title="JWT Envelopes"
          desc="Standardized signed payload structure for seamless platform integration."
        />
      </motion.div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="glass-card p-10 hover:bg-white/[0.07] transition-all duration-300 group cursor-default">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <Icon className="text-indigo-400" size={28} />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
