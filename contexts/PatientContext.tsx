import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  fetchDoctors, 
  submitConsultationRequest, 
  uploadMedicalDocument, 
  getPatientIdByUserId  // Add this import
} from '../services/patient.service';
import { useAuth } from './AuthContext';

const PatientContext = createContext(null);

export const usePatient = () => useContext(PatientContext);

export function PatientProvider({ children }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { userProfile } = useAuth();

  const loadDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await fetchDoctors();
      setDoctors(docs);
      console.log('Loaded doctors:', docs.length);
    } catch (e) {
      console.error('Error loading doctors:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const requestConsultation = async (doctorId, description, medicalDocuments = []) => {
    if (!userProfile) {
      throw new Error('User not authenticated');
    }
    
    try {
      console.log('📋 Starting consultation request with', medicalDocuments.length, 'documents');
      
      // Upload medical documents if any
      const uploadedDocuments = [];
      
      if (medicalDocuments.length > 0) {
        console.log('📤 Uploading medical documents...');
        
        // Get patient ID using the imported function
        const patientId = await getPatientIdByUserId(userProfile.id);
        console.log('👤 Patient ID for upload:', patientId);
        
        for (let i = 0; i < medicalDocuments.length; i++) {
          const document = medicalDocuments[i];
          console.log(`📄 Uploading document ${i + 1}/${medicalDocuments.length}:`, document);
          
          try {
            const uploadedPath = await uploadMedicalDocument(document, patientId);
            if (uploadedPath) {
              uploadedDocuments.push(uploadedPath);
              console.log(`✅ Document ${i + 1} uploaded:`, uploadedPath);
            }
          } catch (docError) {
            console.error(`❌ Failed to upload document ${i + 1}:`, docError);
            // Continue with other documents even if one fails
          }
        }
        
        console.log('📊 Upload summary:', uploadedDocuments.length, 'of', medicalDocuments.length, 'uploaded');
      }
      
      await submitConsultationRequest({
        user_id: userProfile.id,
        doctor_id: doctorId,
        problem_description: description,
        medical_documents: uploadedDocuments
      });
      
      console.log('✅ Consultation request submitted with documents:', uploadedDocuments);
    } catch (error) {
      console.error('❌ Failed to submit consultation request:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (userProfile?.user_type === 'patient') {
      loadDoctors();
    }
  }, [userProfile]);

  return (
    <PatientContext.Provider value={{ 
      doctors, 
      loadDoctors, 
      loading, 
      error,
      requestConsultation 
    }}>
      {children}
    </PatientContext.Provider>
  );
}
