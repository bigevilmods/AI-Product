import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '../types';
import { authService, UserCredentials } from '../services/authService';
// FIX: Changed to Firebase v8 compat imports and usage to resolve module export errors.
// FIX: Corrected Firebase v9 compat imports to use the 'compat' path.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { auth, db } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: UserCredentials) => Promise<void>;
  register: (credentials: UserCredentials) => Promise<void>;
  logout: () => void;
  addCredits: (amount: number) => void;
  spendCredit: (amount?: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    // FIX: Use v8 method on auth object and v8 User type.
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser: firebase.User | null) => {
      // Clean up previous snapshot listener if a user state change occurs
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        // FIX: Use v8 syntax for Firestore doc reference.
        const userDocRef = db.collection("users").doc(firebaseUser.uid);
        
        // FIX: Use v8 onSnapshot method on doc reference.
        unsubscribeSnapshot = userDocRef.onSnapshot((docSnapshot) => {
          if (docSnapshot.exists) {
            // Profile found, this is the success path.
            const userProfile = docSnapshot.data();
            if (userProfile) {
                const currentUser: User = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email!,
                  role: userProfile.role || 'user',
                  credits: userProfile.credits ?? 0,
                  affiliateId: userProfile.affiliateId,
                  commissionRate: userProfile.commissionRate,
                  commissionEarned: userProfile.commissionEarned,
                  referredBy: userProfile.referredBy,
                };
                setUser(currentUser);
            }
            setIsLoading(false);
          } else {
            // Profile does not exist. The only valid case for this is a brand new user during registration.
            // We check metadata to differentiate a new registration from a corrupted state.
            const creationTime = new Date(firebaseUser.metadata.creationTime || 0).getTime();
            const lastSignInTime = new Date(firebaseUser.metadata.lastSignInTime || 0).getTime();

            // A user is "new" if creation and last sign-in are within a few seconds of each other.
            if (Math.abs(creationTime - lastSignInTime) < 5000) {
              // This is likely a registration in progress. We wait patiently for the profile document.
              console.warn(`New user ${firebaseUser.uid} detected. Waiting for profile creation...`);
              setIsLoading(true); // Keep loading screen while we wait.
            } else {
              // This is an existing user whose profile is missing. Attempt to self-heal by creating a default profile.
              console.warn(`Profile for existing user ${firebaseUser.uid} not found. Attempting to create a default profile.`);
              
              const defaultProfileData = {
                email: firebaseUser.email!,
                role: 'user' as const,
                credits: 0, // Start with 0 credits since this is a recovery, not a new registration.
              };

              // Use an async IIFE to handle the promise within the listener callback
              (async () => {
                try {
                  // FIX: Use v8 syntax for Firestore set.
                  await db.collection("users").doc(firebaseUser.uid).set(defaultProfileData);
                  console.log(`Successfully created default profile for ${firebaseUser.uid}. The app should now load.`);
                  // The onSnapshot listener will automatically receive the new document and update the state,
                  // so we don't need to call setUser or setIsLoading(false) here. It will be handled in the `docSnapshot.exists()` block on the next fire.
                } catch (creationError) {
                    console.error(`Failed to create default profile for ${firebaseUser.uid}. This is likely a permissions issue with Firestore security rules. Forcing logout.`, creationError);
                    authService.logout();
                    setUser(null);
                    setIsLoading(false);
                }
              })();
            }
          }
        }, (error) => {
          console.error("Error listening to user profile:", error);
          authService.logout();
          setUser(null);
          setIsLoading(false);
        });
      } else {
        // No user is signed in.
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []); // Run only once on component mount.

  const login = async (credentials: UserCredentials) => {
    // The onAuthStateChanged listener will handle all state updates.
    await authService.login(credentials);
  };
  
  const register = async (credentials: UserCredentials) => {
    // The onAuthStateChanged listener will handle all state updates.
    await authService.register(credentials);
  };

  const logout = async () => {
    // authService.logout calls signOut, which will trigger the onAuthStateChanged listener to clean up the state.
    await authService.logout();
  };

  const addCredits = (amount: number) => {
    if (user) {
      // Optimistic UI update
      const updatedUser = { ...user, credits: user.credits + amount };
      setUser(updatedUser);
      // Call atomic update function
      authService.grantCredits(user.id, amount).catch(error => {
          console.error("Failed to add credits in Firestore. Reverting local state.", error);
          // Revert optimistic update on failure
          setUser(user);
      });
    }
  };
  
  const spendCredit = (amount: number = 1) => {
      if(user && user.credits >= amount) {
          // Optimistic UI update
          const updatedUser = { ...user, credits: user.credits - amount };
          setUser(updatedUser);
          // Call the atomic update function in the service
          authService.spendUserCredits(user.id, amount).catch(error => {
              console.error("Failed to update credits in Firestore. Reverting local state.", error);
              // Revert optimistic update on failure
              setUser(user);
          });
      }
  }

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, register, logout, addCredits, spendCredit }}>
      {isLoading ? <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};