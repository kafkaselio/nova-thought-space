
import React from 'react';
import * as Icons from 'lucide-react';
import { Bucket } from '../types';

interface BucketCardProps {
  bucket: Bucket;
  progress: number;
  count: number;
  onClick: (id: string) => void;
}

const BucketCard: React.FC<BucketCardProps> = ({ bucket, progress, count, onClick }) => {
  const Icon = (Icons as any)[bucket.icon] || Icons.HelpCircle;

  const colorVariants: Record<string, string> = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 text-indigo-400',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400',
  };

  const barColors: Record<string, string> = {
    indigo: 'bg-indigo-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
  };

  return (
    <div 
      onClick={() => onClick(bucket.id)}
      className={`relative cursor-pointer bg-gradient-to-br border rounded-2xl p-5 overflow-hidden group transition-all duration-300 hover:scale-[1.02] active:scale-95 ${colorVariants[bucket.color] || colorVariants.indigo}`}
    >
      <div className="flex items-start justify-between mb-8">
        <div className="p-3 bg-zinc-950/40 rounded-xl backdrop-blur-sm border border-white/5 shadow-xl">
          <Icon size={24} />
        </div>
        <span className="text-2xl font-bold opacity-20">{count}</span>
      </div>
      
      <div>
        <h3 className="text-lg font-bold text-zinc-100 mb-1">{bucket.name}</h3>
        <p className="text-xs text-zinc-400 mb-4 opacity-80 line-clamp-1">{bucket.description}</p>
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
            <span className="opacity-60">Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-950/40 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${barColors[bucket.color]}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-3xl" />
    </div>
  );
};

export default BucketCard;
