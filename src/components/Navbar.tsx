import React from 'react';
import { Box, Flex, Heading, Button, useColorMode } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box as="nav" bg={colorMode === 'light' ? 'white' : 'gray.800'} boxShadow="sm" py={4}>
      <Flex maxW="container.xl" mx="auto" px={4} justify="space-between" align="center">
        <Link to="/">
          <Heading size="md" color={colorMode === 'light' ? 'blue.600' : 'blue.300'}>
            AI Attendance
          </Heading>
        </Link>
        <Flex gap={4} align="center">
          <Link to="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Link to="/history">
            <Button variant="ghost">History</Button>
          </Link>
          <Button onClick={toggleColorMode}>
            {colorMode === 'light' ? '🌙' : '☀️'}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar; 