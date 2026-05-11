import { localDb, localUser } from './localPlatform';

export const db = localDb;

export const auth = {
  currentUser: localUser
};

export const googleProvider = null;

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  };
}

export const handleFirestoreError = (
  error: any,
  operationType: FirestoreErrorInfo['operationType'],
  path: string | null = null
) => {
  const user = auth.currentUser;
  const errorInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      providerInfo: user.providerData
    }
  };

  console.error('Local platform operation failed', errorInfo);
  throw error;
};

export const signInWithGoogle = async () => {
  console.info('Local test mode uses the built-in Local Tester account.');
};

export const logout = async () => {
  console.info('Local test mode keeps the Local Tester account signed in.');
};

