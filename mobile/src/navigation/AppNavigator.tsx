import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuthStore } from '../store/auth';

import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/resident/DashboardScreen';
import PaymentHistoryScreen from '../screens/resident/PaymentHistoryScreen';
import ExpensesScreen from '../screens/resident/ExpensesScreen';
import NotificationsScreen from '../screens/resident/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ResidentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4361ee',
        tabBarInactiveTintColor: '#6c757d',
        tabBarStyle: { paddingBottom: 6, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '700', color: '#1a1a2e' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'🏠'}</Text>,
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentHistoryScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'💳'}</Text>,
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          title: 'Building Expenses',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'📊'}</Text>,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'🔔'}</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4361ee',
        tabBarInactiveTintColor: '#6c757d',
        tabBarStyle: { paddingBottom: 6, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'🏠'}</Text>,
        }}
      />
      <Tab.Screen
        name="Residents"
        component={PaymentHistoryScreen}
        options={{
          title: 'Manage Residents',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'👥'}</Text>,
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'📊'}</Text>,
        }}
      />
      <Tab.Screen
        name="More"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{'⚙️'}</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : user?.role === 'admin' ? (
          <Stack.Screen name="AdminMain" component={AdminTabs} />
        ) : (
          <Stack.Screen name="ResidentMain" component={ResidentTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
