import { User, Skill } from '../types';

/**
 * Transform backend user data to frontend User interface format
 * Handles the mapping between backend skillName and frontend name properties
 */
export const transformUserData = (backendUser: any): User => {
  // Transform knownSkills from backend to skillsKnown for frontend
  const skillsKnown: Skill[] = (backendUser.knownSkills || []).map((skill: any) => ({
    id: skill._id || Math.random().toString(),
    name: skill.skillName || skill.name || '',
    level: skill.level || 'Beginner',
    verified: skill.verificationStatus === 'Verified' || skill.verified || false,
    verifiedAt: skill.verifiedAt || null
  }));

  // Transform skillsToLearn from objects to strings (extract skillName)
  const skillsToLearn: string[] = (backendUser.skillsToLearn || []).map((skill: any) => 
    typeof skill === 'string' ? skill : (skill.skillName || skill.name || '')
  ).filter((skill: string) => skill.length > 0);

  // Return transformed user object
  return {
    id: backendUser._id || backendUser.id,
    name: backendUser.name || (backendUser.email || '').split('@')[0],
    email: backendUser.email,
    avatar: backendUser.avatar || '',
    skillsKnown,
    skillsToLearn,
    bio: backendUser.bio || '',
    rating: backendUser.rating || 5,
    languages: backendUser.languages || [],
    preferredLanguage: backendUser.preferredLanguage || 'English',
    availability: backendUser.availability || [],
    discordLink: backendUser.discordLink || '',
    totalReviews: backendUser.totalReviews || 0
  };
};
