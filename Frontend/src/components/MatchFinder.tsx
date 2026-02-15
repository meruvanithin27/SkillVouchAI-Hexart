import React, { useState, useEffect } from 'react';
import { User, MatchRecommendation, Skill } from '../types';
import { dbService } from '../services/dbService'; 
import { analyzeMatch } from '../services/mistralService';
import { skillMatchingEngine } from '../services/skillMatchingService';
import { RequestExchangeModal } from './RequestExchangeModal';
import { Loader2, UserPlus, Sparkles, MessageCircle, AlertCircle, Globe, CheckCircle2, Filter, Shield } from 'lucide-react';

interface MatchFinderProps {
  currentUser: User;
  onMessageUser: (userId: string) => void;
}

export const MatchFinder: React.FC<MatchFinderProps> = ({ currentUser, onMessageUser }) => {
  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserForExchange, setSelectedUserForExchange] = useState<User | null>(null);
  const [strictMode, setStrictMode] = useState(false);
  const [strictMatches, setStrictMatches] = useState<User[]>([]);

  // Simple base score calculation
  const calculateBaseScore = (me: User, candidate: User): number => {
    let score = 0;

    // Basic skill matching
    const usefulSkills = candidate.skillsKnown.filter(s =>
      me.skillsToLearn.some(want =>
        typeof want === 'string'
          ? want.toLowerCase() === s.name.toLowerCase()
          : (want.skillName || '').toLowerCase() === s.name.toLowerCase()
      )
    );

    score += usefulSkills.length * 25;
    score += Math.min(25, candidate.rating * 5);

    return Math.min(100, score);
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const allUsers = await dbService.getUsers();
      const strictMentors = skillMatchingEngine.findStrictMentors(currentUser, allUsers);
      setStrictMatches(strictMentors);

      const candidates = allUsers.filter(user => user.id !== currentUser.id);
      const filteredCandidates = strictMode ? strictMentors : candidates;

      const scoredCandidates = filteredCandidates
        .map(user => ({
          user,
          baseScore: calculateBaseScore(currentUser, user)
        }))
        .sort((a, b) => b.baseScore - a.baseScore)
        .slice(0, 6);

      const results: MatchRecommendation[] = [];

      for (const item of scoredCandidates) {
        try {
          const analysis = await analyzeMatch(currentUser, item.user);
          const finalScore = Math.round((item.baseScore * 0.4) + (analysis.score * 0.6));

          results.push({
            user: item.user,
            matchScore: finalScore,
            reasoning: analysis.reasoning,
            commonInterests: analysis.commonInterests || []
          });
        } catch (e) {
          console.error("Analysis failed for", item.user.name);
          results.push({
            user: item.user,
            matchScore: item.baseScore,
            reasoning: "High compatibility based on skill matching.",
            commonInterests: []
          });
        }
      }

      results.sort((a, b) => b.matchScore - a.matchScore);
      setRecommendations(results);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser.id !== 'temp') {
      fetchMatches();
    }
  }, [currentUser.id, strictMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mr-3" />
        <span className="text-slate-600 dark:text-slate-400">Finding perfect matches...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Find Peers</h2>
        <p className="text-slate-500 dark:text-slate-400">Connect with people who share your skills and interests.</p>
      </div>

      {/* Strict Mode Toggle */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Strict Matching Mode</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {strictMode
              ? "Only shows mentors with verified skills you want to learn"
              : "Shows all potential matches with flexible compatibility scoring"
            }
          </p>
        </div>
        <button
          onClick={() => setStrictMode(!strictMode)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            strictMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            strictMode ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Recommendations */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec, index) => (
          <div key={rec.user.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img src={rec.user.avatar} alt={rec.user.name} className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{rec.user.name}</h3>
                  <div className="flex items-center space-x-1">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < Math.floor(rec.user.rating) ? "text-yellow-400" : "text-slate-300"}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">({rec.user.rating})</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600">{rec.matchScore}%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Match</div>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
              {rec.reasoning}
            </p>

            <div className="flex space-x-2">
              <button
                onClick={() => onMessageUser(rec.user.id)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </button>
              <button
                onClick={() => setSelectedUserForExchange(rec.user)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Connect
              </button>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No matches found</h3>
          <p className="text-slate-500 dark:text-slate-400">
            {strictMode
              ? "Try disabling strict mode to see more potential matches"
              : "Update your profile to find better matches"
            }
          </p>
        </div>
      )}

      {/* Exchange Modal */}
      {selectedUserForExchange && (
        <RequestExchangeModal
          targetUser={selectedUserForExchange}
          currentUser={currentUser}
          onClose={() => setSelectedUserForExchange(null)}
        />
      )}
    </div>
  );
};
