import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuthStore } from "../store/auth";
import { colors, typography } from "../theme";

// Auth screens
import LoginScreen from "../screens/auth/LoginScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

// Resident screens
import DashboardScreen from "../screens/resident/DashboardScreen";
import PaymentHistoryScreen from "../screens/resident/PaymentHistoryScreen";
import ExpensesScreen from "../screens/resident/ExpensesScreen";
import NotificationsScreen from "../screens/resident/NotificationsScreen";
import AnnouncementsScreen from "../screens/resident/AnnouncementsScreen";
import ProfileScreen from "../screens/resident/ProfileScreen";

// Admin screens
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import ResidentsScreen from "../screens/admin/ResidentsScreen";
import ResidentDetailScreen from "../screens/admin/ResidentDetailScreen";
import AddResidentScreen from "../screens/admin/AddResidentScreen";
import AdminExpensesScreen from "../screens/admin/AdminExpensesScreen";
import CreateExpenseScreen from "../screens/admin/CreateExpenseScreen";
import CashPaymentScreen from "../screens/admin/CashPaymentScreen";
import ReportsScreen from "../screens/admin/ReportsScreen";
import AnnouncementComposerScreen from "../screens/admin/AnnouncementComposerScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const modalHeaderOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: { ...typography.h3, color: colors.textPrimary },
  headerShadowVisible: false,
};

const tabScreenOptions = {
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textTertiary,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    height: 64,
    paddingBottom: 8,
    paddingTop: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarLabelStyle: { ...typography.smallBold, marginTop: -2 },
  headerStyle: {
    backgroundColor: colors.surface,
    shadowOpacity: 0,
    elevation: 0,
  },
  headerTitleStyle: { ...typography.h3, color: colors.textPrimary },
};

function ResidentTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentHistoryScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="credit-card-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          headerShown: false,
          title: "Expenses",
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-bar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="bell-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Residents"
        component={ResidentsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-group-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={AdminExpensesScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-bar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={NotificationsScreen}
        options={{
          headerShown: false,
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <Icon
              name="dots-horizontal-circle-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ ...modalHeaderOptions, headerTitle: "Reset Password" }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name={user?.role === "admin" ? "AdminMain" : "ResidentMain"}
              component={user?.role === "admin" ? AdminTabs : ResidentTabs}
            />

            {/* Shared screens */}
            <Stack.Screen
              name="Announcements"
              component={AnnouncementsScreen}
              options={{ ...modalHeaderOptions, headerTitle: "Announcements" }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ ...modalHeaderOptions, headerTitle: "Profile" }}
            />

            {/* Admin-only screens */}
            <Stack.Screen
              name="CashPayment"
              component={CashPaymentScreen}
              options={{ ...modalHeaderOptions, headerTitle: "Record Payment" }}
            />
            <Stack.Screen
              name="Reports"
              component={ReportsScreen}
              options={{ ...modalHeaderOptions, headerTitle: "Reports" }}
            />
            <Stack.Screen
              name="ComposeAnnouncement"
              component={AnnouncementComposerScreen}
              options={{
                ...modalHeaderOptions,
                headerTitle: "New Announcement",
              }}
            />
            <Stack.Screen
              name="CreateExpense"
              component={CreateExpenseScreen}
              options={{ ...modalHeaderOptions, headerTitle: "New Expense" }}
            />
            <Stack.Screen
              name="AddResident"
              component={AddResidentScreen}
              options={{ ...modalHeaderOptions, headerTitle: "Add Resident" }}
            />
            <Stack.Screen
              name="ResidentDetail"
              component={ResidentDetailScreen}
              options={{ ...modalHeaderOptions, headerTitle: "Resident Details" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
