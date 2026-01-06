import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export const createDemoUser = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'demo@prabastore.com', 
      'demo123'
    );
    console.log('Demo user created:', userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Demo user already exists');
      return null;
    }
    console.error('Error creating demo user:', error);
    throw error;
  }
};

// Call this function once to set up the demo user
// createDemoUser();