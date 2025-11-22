import type { User, UserRole } from '../types';
import { auth, db } from './firebase';
// FIX: Changed to Firebase v8 compat imports and usage to resolve module export errors.
// FIX: Corrected Firebase v9 compat imports to use the 'compat' path.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';


export interface UserCredentials {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

const REFERRAL_CODE_KEY = 'referralCode';

export const authService = {
  async login(credentials: UserCredentials): Promise<void> {
    if (!credentials.password) throw new Error("Password is required for login.");
    
    // FIX: Use v8 persistence constants.
    const persistenceType = credentials.rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
    // FIX: Use v8 method on auth object.
    await auth.setPersistence(persistenceType);

    // The onAuthStateChanged listener in AuthContext is the single source of truth for user profile data.
    // This function's only responsibility is to sign the user in.
    // FIX: Use v8 method on auth object.
    await auth.signInWithEmailAndPassword(credentials.email, credentials.password);
  },
  
  async register(credentials: UserCredentials): Promise<void> {
    if (!credentials.password) throw new Error("Password is required for registration.");

    // FIX: Use v8 method on auth object.
    const userCredential = await auth.createUserWithEmailAndPassword(credentials.email, credentials.password);
    const user = userCredential.user;
    if (!user) {
        throw new Error("User creation failed.");
    }
    
    const referralCode = sessionStorage.getItem(REFERRAL_CODE_KEY);
    
    const firestoreData: { [key: string]: any } = {
        email: credentials.email,
        role: 'user',
        credits: 5, // Welcome credits
    };
    
    if (referralCode) {
      firestoreData.referredBy = referralCode;
    }
    
    // Create the user's profile document in Firestore.
    // The onAuthStateChanged listener will then pick this up and set the application state.
    // FIX: Use v8 syntax for Firestore set.
    await db.collection("users").doc(user.uid).set(firestoreData);
  },

  async logout(): Promise<void> {
    // FIX: Use v8 method on auth object.
    await auth.signOut();
  },

  async getUserProfile(uid: string): Promise<Omit<User, 'id' | 'email'>> {
    // FIX: Use v8 syntax for Firestore get.
    const docRef = db.collection("users").doc(uid);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return docSnap.data() as Omit<User, 'id' | 'email'>;
    } else {
      // This might happen in rare race conditions but the self-healing in AuthContext should handle it.
      throw new Error("User profile not found in database.");
    }
  },
  
  // FIX: Added function to atomically decrement user credits in Firestore to prevent race conditions.
  async spendUserCredits(userId: string, amount: number): Promise<void> {
    const userRef = db.collection("users").doc(userId);
    await userRef.update({
      credits: firebase.firestore.FieldValue.increment(-amount)
    });
  },

  // Admin functions that interact with Firestore
  async getAllUsers(): Promise<User[]> {
      // FIX: Use v8 syntax for Firestore collection get.
      const usersCol = db.collection("users");
      const userSnapshot = await usersCol.get();
      const userList = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      } as User));
      return userList;
  },

  async grantCredits(userId: string, amount: number): Promise<void> {
      // FIX: Use v8 syntax for Firestore update and increment.
      const userRef = db.collection("users").doc(userId);
      await userRef.update({
        credits: firebase.firestore.FieldValue.increment(amount)
      });
  },

  async setUserRole(userId: string, role: UserRole): Promise<void> {
      // FIX: Use v8 syntax for Firestore update.
      const userRef = db.collection("users").doc(userId);
      const updatePayload: { role: UserRole, affiliateId?: string, commissionRate?: number } = { role };

      // If the user is becoming an affiliate, assign a unique ID.
      if (role === 'affiliate') {
          // FIX: Use v8 syntax for Firestore get.
          const docSnap = await userRef.get();
          const userData = docSnap.data();
          if (!userData?.affiliateId) {
             updatePayload.affiliateId = `aff-${userId.substring(0, 8)}`;
             updatePayload.commissionRate = 0.10; // Default 10% rate
          }
      }
      await userRef.update(updatePayload);
  },
  
  async setCommissionRate(userId: string, rate: number): Promise<void> {
       // FIX: Use v8 syntax for Firestore update.
       const userRef = db.collection("users").doc(userId);
       await userRef.update({
           commissionRate: rate
       });
  }
};