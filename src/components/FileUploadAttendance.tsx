import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  HStack,
  Image,
  Card,
  CardBody,
  Heading,
  Divider,
} from '@chakra-ui/react';
import { markAttendance } from '../utils/attendance';

const FileUploadAttendance: React.FC = () => {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !name.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both name and image',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    setLoading(true);
    setSuccess(false);
    
    try {
      const result = await markAttendance(file, name);
      
      if (result.success) {
        toast({
          title: 'Attendance recorded',
          description: 'Your attendance has been successfully recorded',
          status: 'success',
          duration: 3000,
        });
        setSuccess(true);
        
        // Reset form
        setName('');
        setFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error('Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to record attendance. Please try again.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outline" boxShadow="md" borderRadius="lg">
      <CardBody>
        <Heading size="md" mb={4}>Mark Attendance with Photo Upload</Heading>
        <Divider mb={4} />
        
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input 
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={handleNameChange}
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Photo</FormLabel>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                sx={{
                  '::file-selector-button': {
                    border: 'none',
                    outline: 'none',
                    mr: 2,
                    bg: 'blue.50',
                    py: 1,
                    px: 3,
                    borderRadius: 'md',
                    cursor: 'pointer',
                  },
                }}
              />
            </FormControl>
            
            {previewUrl && (
              <Box borderWidth={1} borderRadius="md" overflow="hidden" mt={2}>
                <Image 
                  src={previewUrl} 
                  alt="Preview" 
                  maxH="200px" 
                  mx="auto"
                />
              </Box>
            )}
            
            <HStack justify="flex-end" mt={2}>
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={loading}
                loadingText="Recording..."
                isDisabled={!file || !name.trim()}
              >
                Mark Attendance
              </Button>
            </HStack>
            
            {success && (
              <Box p={3} bg="green.100" color="green.700" borderRadius="md" mt={2}>
                <Text>Attendance recorded successfully!</Text>
              </Box>
            )}
          </VStack>
        </form>
      </CardBody>
    </Card>
  );
};

export default FileUploadAttendance; 