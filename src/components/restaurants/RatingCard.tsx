'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils'; // Adjust based on your utils location

interface RatingCardProps {
    ratings: {
        overall_score: number;
        score_label: string;
        food_quality_score: number;
        service_score: number;
        ambience_score: number;
        value_score: number;
        accessibility_score: number;
        total_review_count: number;
    };
}

export const RatingCard = ({ ratings }: RatingCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const {
        overall_score = 0,
        score_label = 'Good',
        food_quality_score = 0,
        service_score = 0,
        ambience_score = 0,
        value_score = 0,
        accessibility_score = 0,
        total_review_count = 0,
    } = ratings;

    // Color mapping based on score
    const getScoreColor = (score: number) => {
        if (score >= 9) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (score >= 8) return 'text-teal-600 bg-teal-50 border-teal-200';
        if (score >= 7) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (score >= 6) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getBarColor = (score: number) => {
        if (score >= 9) return 'bg-emerald-500';
        if (score >= 8) return 'bg-teal-500';
        if (score >= 7) return 'bg-blue-500';
        if (score >= 6) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const scoreColorClass = getScoreColor(overall_score);
    const barColorClass = getBarColor(overall_score);

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Best of Goa Rating</h3>
                    <p className="text-sm text-slate-500">Based on {total_review_count.toLocaleString()} reviews</p>
                </div>
                <div className={cn("flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2", scoreColorClass)}>
                    <span className="text-2xl font-bold">{overall_score.toFixed(1)}</span>
                </div>
            </div>

            <div className="flex items-center justify-between mb-6">
                <div className={cn("px-3 py-1 rounded-full text-sm font-bold border", scoreColorClass)}>
                    {score_label}
                </div>
            </div>

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
                <span>View Detailed Breakdown</span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-6 space-y-4">
                            <RatingBar label="Food Quality" score={food_quality_score} color={getBarColor(food_quality_score)} />
                            <RatingBar label="Service" score={service_score} color={getBarColor(service_score)} />
                            <RatingBar label="Ambience" score={ambience_score} color={getBarColor(ambience_score)} />
                            <RatingBar label="Value for Money" score={value_score} color={getBarColor(value_score)} />
                            <RatingBar label="Accessibility" score={accessibility_score} color={getBarColor(accessibility_score)} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const RatingBar = ({ label, score, color }: { label: string, score: number, color: string }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-sm">
            <span className="text-slate-600 font-medium">{label}</span>
            <span className="text-slate-900 font-bold">{score.toFixed(1)}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(score / 10) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn("h-full rounded-full", color)}
            />
        </div>
    </div>
);
