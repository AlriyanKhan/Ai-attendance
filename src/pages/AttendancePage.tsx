import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Spinner,
  useColorMode,
  Card,
  CardBody,
  Badge,
  HStack,
  Icon,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { FaCamera, FaCheckCircle, FaExclamationTriangle, FaUpload } from 'react-icons/fa';
import { useToast } from '@chakra-ui/toast';
import Camera from '../components/Camera';
import { visionAIService } from '../services/visionAI';
import { geminiAIService } from '../services/geminiAI';
import { db, storage } from '../config/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import FileUploadAttendance from '../components/FileUploadAttendance';

const AttendancePage: React.FC = () => {
  const [processing, setProcessing] = useState(false);
  const [lastInsight, setLastInsight] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const toast = useToast();
  const { colorMode } = useColorMode();
  const { currentUser } = useAuth();

  const handleImageCapture = useCallback(async (imageData: string) => {
    // Store the captured image
    setCapturedImage(imageData);
    setRecordingError(null);
  }, []);

  const recordAttendance = async () => {
    if (!capturedImage) {
      toast({
        title: 'No image captured',
        description: 'Please capture an image first',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    setProcessing(true);
    setUploadSuccess(false);
    setRecordingError(null);
    
    try {
      console.log("Starting attendance process...");
      
      // Upload image to Firebase Storage
      console.log("Uploading image to Firebase Storage...");
      const imageRef = ref(storage, `attendance/${Date.now()}.jpg`);
      
      try {
        await uploadString(imageRef, capturedImage, 'data_url');
        const imageUrl = await getDownloadURL(imageRef);
        console.log("Image uploaded successfully:", imageUrl);
        setUploadedImageUrl(imageUrl);
        
        // Show image upload success toast
        toast({
          title: 'Image uploaded successfully',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        
        // Detect faces in the image using Vision AI
        console.log("Detecting faces with Vision AI...");
        const faces = await visionAIService.detectFaces(capturedImage);
        console.log("Face detection result:", faces);

        if (!faces || faces.length === 0) {
          toast({
            title: 'No face detected',
            description: 'Please ensure your face is clearly visible',
            status: 'warning',
            duration: 3000,
          });
          setProcessing(false);
          return;
        }
        
        // Store attendance record in Firebase
        console.log("Saving attendance record to Firestore...");
        console.log("Current user ID:", currentUser?.uid || 'anonymous');
        
        const attendanceRef = collection(db, 'attendance');
        const attendanceData = {
          timestamp: Timestamp.now(),
          imageUrl,
          faceDetected: true,
          confidence: faces[0].detectionConfidence,
          userId: currentUser?.uid || 'anonymous',
          name: currentUser?.displayName || 'Unknown User',
          userName: currentUser?.displayName || undefined,
          userEmail: currentUser?.email || undefined,
          recordedAt: new Date().toISOString(),
        };
        
        console.log("Attendance data to save:", attendanceData);
        
        const attendanceDoc = await addDoc(attendanceRef, attendanceData);
        console.log("Attendance record saved successfully with ID:", attendanceDoc.id);
        
        // Set upload success flag
        setUploadSuccess(true);
        
        toast({
          title: 'Attendance recorded',
          description: 'Your attendance has been successfully recorded',
          status: 'success',
          duration: 3000,
        });
        
        // Generate attendance insights using Gemini AI
        console.log("Generating AI insights...");
        const attendanceDataForAI = [
          {
            date: new Date().toISOString(),
            status: 'present',
            confidence: faces[0].detectionConfidence,
            userId: currentUser?.uid || 'anonymous',
          },
        ];

        try {
          const insights = await geminiAIService.analyzeAttendancePatterns(attendanceDataForAI);
          console.log("AI insights generated:", insights);
          setLastInsight(insights);
        } catch (aiError) {
          console.error("Error generating AI insights:", aiError);
          setLastInsight("Attendance recorded successfully. AI insights could not be generated at this time.");
        }
        
        setCapturedImage(null);
        
      } catch (error) {
        console.error("Error in attendance process:", error);
        setRecordingError("Failed to process attendance. Please check your API keys and try again.");
        throw error;
      }
      
    } catch (error) {
      console.error('Error processing attendance:', error);
      toast({
        title: 'Error recording attendance',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setRecordingError(null);
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading 
            size="2xl" 
            bgGradient="linear(to-r, blue.400, purple.500)" 
            bgClip="text"
            mb={4}
          >
            AI Attendance System
          </Heading>
          <Text fontSize="lg" color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
            Quick and secure attendance tracking with AI
          </Text>
        </Box>

        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab><Icon as={FaCamera} mr={2} /> Webcam Capture</Tab>
            <Tab><Icon as={FaUpload} mr={2} /> File Upload</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel p={0} pt={4}>
              <Card 
                variant="outline" 
                bg={colorMode === 'light' ? 'white' : 'gray.700'}
                borderRadius="xl"
                boxShadow="xl"
              >
                <CardBody>
                  <VStack spacing={6}>
                    <HStack spacing={2}>
                      <Icon as={FaCamera} color="blue.500" />
                      <Text fontWeight="medium">Position your face in the camera and click capture</Text>
                    </HStack>
                    
                    {processing ? (
                      <Box textAlign="center" p={8}>
                        <Spinner size="xl" color="blue.500" thickness="4px" />
                        <Text mt={4} fontSize="lg">Processing attendance...</Text>
                      </Box>
                    ) : (
                      <Box w="full">
                        <Camera onCapture={handleImageCapture} />
                        
                        {capturedImage && (
                          <HStack mt={4} spacing={2} justify="center">
                            <Button 
                              colorScheme="green" 
                              onClick={recordAttendance}
                              isDisabled={processing}
                            >
                              Record Attendance
                            </Button>
                            <Button 
                              colorScheme="red" 
                              variant="outline" 
                              onClick={resetCapture}
                              isDisabled={processing}
                            >
                              Reset
                            </Button>
                          </HStack>
                        )}
                        
                        {uploadSuccess && (
                          <Box mt={4} p={3} bg="green.100" color="green.700" borderRadius="md">
                            <HStack>
                              <Icon as={FaCheckCircle} />
                              <Text>Attendance recorded successfully!</Text>
                            </HStack>
                          </Box>
                        )}
                        
                        {recordingError && (
                          <Box mt={4} p={3} bg="red.100" color="red.700" borderRadius="md">
                            <HStack>
                              <Icon as={FaExclamationTriangle} />
                              <Text>{recordingError}</Text>
                            </HStack>
                          </Box>
                        )}
                      </Box>
                    )}

                    {lastInsight && (
                      <Box 
                        mt={4} 
                        p={4} 
                        bg={colorMode === 'light' ? 'blue.50' : 'blue.900'} 
                        borderRadius="md"
                        w="full"
                      >
                        <HStack spacing={2} mb={2}>
                          <Icon as={FaCheckCircle} color="green.500" />
                          <Text fontWeight="bold">AI Insights</Text>
                        </HStack>
                        <Text>{lastInsight}</Text>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
            
            <TabPanel p={0} pt={4}>
              <FileUploadAttendance />
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Box textAlign="center">
          <Badge 
            colorScheme="blue" 
            p={2} 
            borderRadius="full"
            fontSize="sm"
          >
            Powered by Google Cloud Vision AI & Gemini
          </Badge>
        </Box>
      </VStack>
    </Container>
  );
};

export default AttendancePage; 