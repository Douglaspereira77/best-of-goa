'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_name: string | null;
  is_admin: boolean;
  notification_preferences: {
    email_favorites: boolean;
    email_itineraries: boolean;
    email_submissions: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (firebaseUser: User) => {
    try {
      const docRef = doc(db, 'profiles', firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Profile;
        // Ensure ID and defaults are set
        return {
          ...data,
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
        };
      } else {
        // Create profile if it doesn't exist
        console.warn('[AuthContext] Profile not found, creating new profile...');
        const newProfile: Profile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          full_name: firebaseUser.displayName,
          avatar_url: firebaseUser.photoURL,
          preferred_name: null,
          is_admin: false,
          notification_preferences: {
            email_favorites: true,
            email_itineraries: true,
            email_submissions: true,
          }
        };

        // We use setDoc with merge: true for safety, though it's a new doc
        await setDoc(docRef, newProfile, { merge: true });
        return newProfile;
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching profile:', error);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const profileData = await fetchProfile(currentUser);
        setProfile(profileData);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (fullName) {
        await updateProfile(userCredential.user, {
          displayName: fullName
        });
        // We might want to manually create the profile here to ensure full_name is sync'd immediately
        // but the onAuthStateChanged listener will also trigger profile creation/fetch.
        // For robustness, let's create it here.
        const docRef = doc(db, 'profiles', userCredential.user.uid);
        await setDoc(docRef, {
          id: userCredential.user.uid,
          email: email,
          full_name: fullName,
          is_admin: false,
          notification_preferences: {
            email_favorites: true,
            email_itineraries: true,
            email_submissions: true,
          }
        }, { merge: true });
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // State updates handled by onAuthStateChanged
    } catch (error) {
      console.error('[AuthContext] Sign out failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAdmin: profile?.is_admin ?? false,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
