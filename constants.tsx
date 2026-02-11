
import React from 'react';
import { Briefcase, User, Lightbulb, GraduationCap, Target } from 'lucide-react';
import { Priority, Bucket, Note } from './types';

export const PRIORITY_COLORS = {
  [Priority.HIGH]: 'bg-rose-500',
  [Priority.MEDIUM]: 'bg-amber-500',
  [Priority.LOW]: 'bg-emerald-500',
  [Priority.SOMEDAY]: 'bg-sky-500',
};

export const PRIORITY_TEXT_COLORS = {
  [Priority.HIGH]: 'text-rose-400',
  [Priority.MEDIUM]: 'text-amber-400',
  [Priority.LOW]: 'text-emerald-400',
  [Priority.SOMEDAY]: 'text-sky-400',
};

export const INITIAL_BUCKETS: Bucket[] = [
  { id: 'work', name: 'Work', icon: 'Briefcase', color: 'indigo', description: 'Professional tasks & projects' },
  { id: 'personal', name: 'Personal', icon: 'User', color: 'rose', description: 'Private life and hobbies' },
  { id: 'ideas', name: 'Ideas', icon: 'Lightbulb', color: 'amber', description: 'Quick sparks of inspiration' },
  { id: 'study', name: 'Study', icon: 'GraduationCap', color: 'emerald', description: 'Learning and research' },
  { id: 'goals', name: 'Goals', icon: 'Target', color: 'violet', description: 'Long-term aspirations' },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: '1',
    title: 'Project Zen Layout',
    content: 'Review the masonry grid layout for the new dashboard. Focus on mobile responsiveness and smooth animations.',
    bucketId: 'work',
    priority: Priority.HIGH,
    category: 'Design',
    tags: ['UI', 'UX'],
    images: [],
    links: [],
    subTasks: [],
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    isCompleted: false,
    order: 0,
  },
  {
    id: '2',
    title: 'Grocery List',
    content: 'Milk, Eggs, Avocado, Bread, Spinach, Coffee beans.',
    bucketId: 'personal',
    priority: Priority.LOW,
    category: 'Shopping',
    tags: ['Food'],
    images: [],
    links: [],
    subTasks: [],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    isCompleted: false,
    order: 1,
  },
  {
    id: '3',
    title: 'AI Startup Pitch',
    content: 'Focus on the minimalist interface as a key differentiator. The calming UI helps reduce decision fatigue.',
    bucketId: 'ideas',
    priority: Priority.MEDIUM,
    category: 'Business',
    tags: ['AI', 'Pitch'],
    images: [],
    links: [],
    subTasks: [],
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
    isCompleted: false,
    order: 2,
  }
];
