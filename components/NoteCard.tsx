
import React from 'react';
import { Note, Priority } from '../types';
import { PRIORITY_COLORS } from '../constants';
import { formatDistanceToNow } from 'date-fns';
import { ListTodo, Link as LinkIcon, Image as ImageIcon, Bell, CheckCircle2, Circle, Pin, GripVertical } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onClick: (id: string) => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  onClick, 
  onDragStart, 
  onDragOver, 
  onDragEnd,
  isDragging 
}) => {
  const completedSubTasks = note.subTasks?.filter(t => t.isCompleted).length || 0;
  const totalSubTasks = note.subTasks?.length || 0;

  const renderCollage = () => {
    const images = note.images || [];
    if (images.length === 0) return null;

    if (images.length === 1) {
      return (
        <div className="w-full aspect-video overflow-hidden">
          <img 
            src={images[0]} 
            alt="" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </div>
      );
    }

    if (images.length === 2) {
      return (
        <div className="w-full aspect-video flex gap-0.5 overflow-hidden">
          <div className="flex-1 h-full overflow-hidden">
            <img src={images[0]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
          </div>
          <div className="flex-1 h-full overflow-hidden">
            <img src={images[1]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
          </div>
        </div>
      );
    }

    if (images.length === 3) {
      return (
        <div className="w-full aspect-video flex gap-0.5 overflow-hidden">
          <div className="flex-[2] h-full overflow-hidden">
            <img src={images[0]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
          </div>
          <div className="flex-1 h-full flex flex-col gap-0.5 overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <img src={images[1]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
            </div>
            <div className="flex-1 overflow-hidden">
              <img src={images[2]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full aspect-video grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden">
        {images.slice(0, 4).map((img, i) => (
          <div key={i} className="w-full h-full overflow-hidden">
            <img 
              src={img} 
              alt="" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              loading="lazy"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, note.id)}
      onDragOver={(e) => onDragOver?.(e, note.id)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(note.id)}
      className={`masonry-item group relative bg-zinc-900/40 border border-zinc-800/50 rounded-3xl transition-all duration-300 hover:bg-zinc-800/60 hover:border-zinc-700/50 active:scale-[0.98] cursor-pointer overflow-hidden ${note.isCompleted ? 'opacity-60 grayscale' : ''} ${isDragging ? 'opacity-20 scale-95 border-dashed border-zinc-600' : ''}`}
    >
      <div className="border-b border-zinc-800/50">
        {renderCollage()}
      </div>

      <div className="absolute top-4 left-4 z-10 p-1.5 bg-black/20 rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical size={12} className="text-zinc-500" />
      </div>

      {note.isPinned && (
        <div className="absolute top-4 right-4 z-10 p-1.5 bg-indigo-500/20 rounded-lg backdrop-blur-md border border-indigo-500/30">
          <Pin size={12} className="text-indigo-400 fill-indigo-400" />
        </div>
      )}

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 px-2 py-0.5 bg-indigo-400/10 rounded-lg">
            {note.category}
          </span>
          {!note.isPinned && (
            <div className={`w-2.5 h-2.5 rounded-full ${PRIORITY_COLORS[note.priority]} shadow-lg shadow-black/50`} />
          )}
        </div>
        
        <h3 className={`text-sm font-bold text-zinc-100 mb-1.5 line-clamp-2 ${note.isCompleted ? 'line-through' : ''}`}>
          {note.title || 'Untitled Thought'}
        </h3>
        
        {totalSubTasks > 0 && (
          <div className="space-y-1 mt-2 mb-3">
            {note.subTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center gap-2 text-[10px] font-medium text-zinc-400">
                {task.isCompleted ? (
                  <CheckCircle2 size={10} className="text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle size={10} className="text-zinc-700 flex-shrink-0" />
                )}
                <span className={`truncate ${task.isCompleted ? 'line-through text-zinc-600' : ''}`}>
                  {task.text}
                </span>
              </div>
            ))}
            {totalSubTasks > 3 && (
              <div className="text-[9px] font-black text-zinc-600 uppercase pt-0.5 pl-4">
                + {totalSubTasks - 3} more
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-3 mb-4 font-medium">
          {note.content}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {totalSubTasks > 0 && (
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 bg-zinc-950/40 px-2 py-1 rounded-lg">
              <ListTodo size={10} />
              {completedSubTasks}/{totalSubTasks}
            </div>
          )}
          {note.images?.length > 0 && (
             <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-500 bg-zinc-950/40 px-2 py-1 rounded-lg">
               <ImageIcon size={10} />
               {note.images.length}
             </div>
          )}
          {note.links?.length > 0 && (
            <div className="bg-zinc-950/40 px-2 py-1 rounded-lg">
               <LinkIcon size={10} className="text-zinc-500" />
            </div>
          )}
          {note.reminder && (
            <div className="bg-zinc-950/40 px-2 py-1 rounded-lg">
               <Bell size={10} className="text-amber-500" />
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
            {formatDistanceToNow(note.updatedAt)}
          </span>
          <div className="flex -space-x-1">
            {note.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[8px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700/30">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
