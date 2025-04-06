import React, { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Box, Button, Image, VStack } from '@chakra-ui/react';
import { useToast } from '@chakra-ui/toast';

interface CameraProps {
  onCapture: (imageData: string) => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture }) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const toast = useToast();

  const capture = useCallback(() => {
    setIsCapturing(true);
    try {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        onCapture(imageSrc);
        toast({
          title: 'Image captured successfully!',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to capture image');
      }
    } catch (error) {
      toast({
        title: 'Capture Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCapturing(false);
    }
  }, [onCapture, toast]);

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const handleUserMedia = useCallback(() => {
    console.log('Camera access granted');
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    console.error('Camera access error:', error);
    toast({
      title: 'Camera Access Error',
      description: 'Please allow camera access in your browser settings.',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
  }, [toast]);

  return (
    <VStack spacing={4}>
      {capturedImage ? (
        <Box borderWidth={1} borderRadius="lg" overflow="hidden">
          <Image src={capturedImage} alt="Captured Image" />
        </Box>
      ) : (
        <Box borderWidth={1} borderRadius="lg" overflow="hidden">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            width={640}
            height={480}
            mirrored
            imageSmoothing
            screenshotQuality={1}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            disablePictureInPicture={false}
            forceScreenshotSourceSize={false}
          />
        </Box>
      )}
      
      <Button
        colorScheme="blue"
        onClick={capturedImage ? retakePhoto : capture}
        isLoading={isCapturing}
        loadingText="Capturing..."
      >
        {capturedImage ? 'Retake Photo' : 'Capture Photo'}
      </Button>
    </VStack>
  );
};

export default Camera;
