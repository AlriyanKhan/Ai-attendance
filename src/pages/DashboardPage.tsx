import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Text,
  useColorModeValue,
  Flex,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Center,
  VStack,
  Spinner,
  Button,
  HStack,
} from '@chakra-ui/react';
import { FaCalendarCheck, FaUsers, FaClock, FaUserCheck, FaExclamationCircle, FaSync } from 'react-icons/fa';
import { collection, query, orderBy, limit, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AttendanceRecord {
  id: string;
  userId: string;
  userName?: string;
  name?: string;
  timestamp: Timestamp;
  confidence: number;
  imageUrl?: string;
}

const DashboardPage: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    totalAttendance: 0,
    todayAttendance: 0,
    averageConfidence: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const bgCard = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const attendanceRef = collection(db, 'attendance');
    const q = query(attendanceRef, orderBy('timestamp', 'desc'), limit(30));

    console.log("Setting up real-time attendance listener...");
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        console.log("Received snapshot update, documents:", snapshot.size);
        
        const records: AttendanceRecord[] = snapshot.docs
          .filter(doc => !doc.data().isInitialRecord) // Filter out the initial record
          .map((doc) => {
            const data = doc.data();
            console.log("Processing doc:", doc.id, data);
            
            // Use userName or name (from file upload) or userId as display name
            const displayName = data.userName || data.name || data.userId || 'Unknown';
            
            return {
              id: doc.id,
              userId: data.userId || 'Unknown',
              userName: displayName,
              name: data.name,
              timestamp: data.timestamp || Timestamp.now(),
              confidence: data.confidence || 0,
              imageUrl: data.imageUrl,
            };
          });
          
        console.log("Processed records:", records.length);
        setAttendanceRecords(records);
        
        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayRecords = records.filter(
          (record) => record.timestamp.toDate().getTime() >= today.getTime()
        );
        
        const confidenceSum = records.reduce(
          (sum, record) => sum + record.confidence,
          0
        );
        
        setStats({
          totalAttendance: records.length,
          todayAttendance: todayRecords.length,
          averageConfidence: records.length ? confidenceSum / records.length : 0,
          activeUsers: new Set(records.map(record => record.userId)).size,
        });
        
        setError(null);
      } catch (err) {
        console.error("Error processing attendance data:", err);
        setError("Error processing attendance data. Please refresh.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, (err) => {
      console.error("Error listening to attendance records:", err);
      setError("Failed to connect to database. Please check your connection.");
      setLoading(false);
      setRefreshing(false);
    });

    // Cleanup the listener when the component unmounts
    return () => {
      console.log("Cleaning up attendance listener...");
      unsubscribe();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    // The real-time listener will automatically update when new data arrives
    // This just triggers the loading spinner and clears it after 1 second
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <Container maxW="container.xl" py={8}>
      <HStack justify="space-between" mb={8}>
        <Heading as="h1" size="xl">
          Attendance Dashboard
        </Heading>
        <Button 
          leftIcon={<FaSync />} 
          onClick={handleRefresh}
          isLoading={refreshing}
          loadingText="Refreshing"
          colorScheme="blue"
          size="sm"
        >
          Refresh
        </Button>
      </HStack>

      {loading && !refreshing ? (
        <Center p={10}>
          <VStack spacing={4}>
            <Spinner size="xl" thickness="4px" color="blue.500" />
            <Text>Loading attendance data...</Text>
          </VStack>
        </Center>
      ) : error ? (
        <Box p={5} bg="red.50" color="red.600" borderRadius="md" textAlign="center">
          <Icon as={FaExclamationCircle} mr={2} />
          {error}
        </Box>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={10}>
            <Card bg={bgCard} boxShadow="md" borderRadius="lg">
              <CardBody>
                <Flex align="center">
                  <Box
                    rounded="full"
                    bg="blue.100"
                    p={3}
                    mr={4}
                    color="blue.500"
                  >
                    <Icon as={FaCalendarCheck} boxSize={6} />
                  </Box>
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.500">Total Attendance</StatLabel>
                    <StatNumber fontSize="2xl">{stats.totalAttendance}</StatNumber>
                    <StatHelpText fontSize="xs">All-time records</StatHelpText>
                  </Stat>
                </Flex>
              </CardBody>
            </Card>
            
            <Card bg={bgCard} boxShadow="md" borderRadius="lg">
              <CardBody>
                <Flex align="center">
                  <Box
                    rounded="full"
                    bg="green.100"
                    p={3}
                    mr={4}
                    color="green.500"
                  >
                    <Icon as={FaUserCheck} boxSize={6} />
                  </Box>
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.500">Today's Attendance</StatLabel>
                    <StatNumber fontSize="2xl">{stats.todayAttendance}</StatNumber>
                    <StatHelpText fontSize="xs">Records today</StatHelpText>
                  </Stat>
                </Flex>
              </CardBody>
            </Card>
            
            <Card bg={bgCard} boxShadow="md" borderRadius="lg">
              <CardBody>
                <Flex align="center">
                  <Box
                    rounded="full"
                    bg="purple.100"
                    p={3}
                    mr={4}
                    color="purple.500"
                  >
                    <Icon as={FaUsers} boxSize={6} />
                  </Box>
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.500">Active Users</StatLabel>
                    <StatNumber fontSize="2xl">{stats.activeUsers}</StatNumber>
                    <StatHelpText fontSize="xs">Unique participants</StatHelpText>
                  </Stat>
                </Flex>
              </CardBody>
            </Card>
            
            <Card bg={bgCard} boxShadow="md" borderRadius="lg">
              <CardBody>
                <Flex align="center">
                  <Box
                    rounded="full"
                    bg="orange.100"
                    p={3}
                    mr={4}
                    color="orange.500"
                  >
                    <Icon as={FaClock} boxSize={6} />
                  </Box>
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.500">Avg. Confidence</StatLabel>
                    <StatNumber fontSize="2xl">{(stats.averageConfidence * 100).toFixed(1)}%</StatNumber>
                    <StatHelpText fontSize="xs">Face detection score</StatHelpText>
                  </Stat>
                </Flex>
              </CardBody>
            </Card>
          </SimpleGrid>
          
          <Card bg={bgCard} boxShadow="md" borderRadius="lg" mb={8}>
            <CardHeader pb={0}>
              <Heading size="md">Recent Attendance Records</Heading>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Records update automatically in real-time
              </Text>
            </CardHeader>
            <CardBody>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>User ID</Th>
                      <Th>Date & Time</Th>
                      <Th>Confidence</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {attendanceRecords.length > 0 ? (
                      attendanceRecords.map((record) => (
                        <Tr key={record.id}>
                          <Td>{record.userName || record.name || record.userId}</Td>
                          <Td>{record.timestamp.toDate().toLocaleString()}</Td>
                          <Td>{(record.confidence * 100).toFixed(1)}%</Td>
                          <Td>
                            <Badge 
                              colorScheme={record.confidence > 0.7 ? 'green' : 'yellow'}
                              borderRadius="full"
                              px={2}
                            >
                              {record.confidence > 0.7 ? 'Verified' : 'Review'}
                            </Badge>
                          </Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr>
                        <Td colSpan={4} textAlign="center" py={4}>
                          No attendance records found
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        </>
      )}
    </Container>
  );
};

export default DashboardPage; 