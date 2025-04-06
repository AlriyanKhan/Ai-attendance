import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * This function initializes the Firestore database with required collections
 * to ensure they exist before we try to write to them
 */
export const initFirestore = async () => {
  try {
    console.log('Initializing Firestore collections...');
    
    // Check if attendance collection exists
    const attendanceRef = collection(db, 'attendance');
    const attendanceSnapshot = await getDocs(attendanceRef);
    
    // If it doesn't, create a sample record to initialize it
    if (attendanceSnapshot.empty) {
      console.log('Creating initial attendance record...');
      
      // Create a sample document to initialize the collection
      const initialDocRef = doc(attendanceRef, 'initial');
      await setDoc(initialDocRef, {
        isInitialRecord: true,
        createdAt: new Date(),
        note: 'This is a system-generated record to initialize the attendance collection'
      });
      
      console.log('Attendance collection initialized successfully');
    } else {
      console.log('Attendance collection already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    return false;
  }
};

export default initFirestore; 