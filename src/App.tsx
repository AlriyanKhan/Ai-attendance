import React, { useEffect, useState } from 'react';
import { ChakraProvider, ColorModeScript, useToast, Center, Spinner, Text, VStack } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AttendancePage from './pages/AttendancePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme';
import { initFirestore } from './utils/initFirestore';

function AppContent() {
  const [initializing, setInitializing] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize Firestore collections
        await initFirestore();
        console.log('Firestore initialized successfully');
      } catch (error) {
        console.error('Error initializing app:', error);
        toast({
          title: 'Initialization Error',
          description: 'There was a problem setting up the application. Please refresh the page.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setInitializing(false);
      }
    };

    initializeApp();
  }, [toast]);

  if (initializing) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" thickness="4px" color="blue.500" />
          <Text>Initializing application...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AttendancePage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ChakraProvider>
    </>
  );
}

export default App;