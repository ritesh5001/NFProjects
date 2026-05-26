import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, TouchableOpacity } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import ProjectListScreen from '../screens/ProjectListScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import AddEditProjectScreen from '../screens/AddEditProjectScreen';
import ClientListScreen from '../screens/ClientListScreen';
import AddEditClientScreen from '../screens/AddEditClientScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../theme/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ProjectsStack() {
  const theme = useTheme();
  return (
    <Stack.Navigator screenOptions={stackOptions(theme)}>
      <Stack.Screen name="ProjectList" component={ProjectListScreen} options={{ title: 'Projects' }} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: 'Project Detail' }} />
      <Stack.Screen name="AddEditProject" component={AddEditProjectScreen} options={({ route }: any) => ({
        title: route.params?.projectId ? 'Edit Project' : 'New Project',
      })} />
    </Stack.Navigator>
  );
}

function ClientsStack() {
  const theme = useTheme();
  return (
    <Stack.Navigator screenOptions={stackOptions(theme)}>
      <Stack.Screen name="ClientList" component={ClientListScreen} options={{ title: 'Clients' }} />
      <Stack.Screen name="AddEditClient" component={AddEditClientScreen} options={({ route }: any) => ({
        title: route.params?.clientId ? 'Edit Client' : 'New Client',
      })} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  const theme = useTheme();
  return (
    <Stack.Navigator screenOptions={stackOptions(theme)}>
      <Stack.Screen
        name="Dashboard"
        component={HomeScreen}
        options={({ navigation }: any) => ({
          headerTitle: () => (
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 120, height: 40 }}
              resizeMode="contain"
            />
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('ProjectsTab', { screen: 'AddEditProject', params: {} })}
              style={{ marginRight: 16 }}
            >
              <MaterialCommunityIcons name="plus" size={26} color={theme.colors.primary} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: 'Project Detail' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const theme = useTheme();
  const navigationTheme = {
    dark: theme.isDark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surfaceElevated,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '800' as const },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSubtle,
          tabBarStyle: {
            paddingBottom: 4,
            height: 60,
            backgroundColor: theme.colors.surfaceElevated,
            borderTopColor: theme.colors.border,
          },
          tabBarIcon: ({ color, size }) => {
            const icons: Record<string, string> = {
              HomeTab: 'home',
              ProjectsTab: 'briefcase',
              ClientsTab: 'account-group',
              SettingsTab: 'cog',
            };
            return <MaterialCommunityIcons name={(icons[route.name] ?? 'circle') as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Home' }} />
        <Tab.Screen name="ProjectsTab" component={ProjectsStack} options={{ title: 'Projects' }} />
        <Tab.Screen name="ClientsTab" component={ClientsStack} options={{ title: 'Clients' }} />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsScreen}
          options={{ title: 'Settings', headerShown: true, ...stackOptions(theme) }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function stackOptions(theme: ReturnType<typeof useTheme>) {
  return {
    headerStyle: {
      backgroundColor: theme.colors.surfaceElevated,
      shadowColor: 'transparent',
      borderBottomColor: theme.colors.border,
    },
    headerTintColor: theme.colors.text,
    headerTitleStyle: {
      color: theme.colors.text,
      fontWeight: '800' as const,
    },
    cardStyle: { backgroundColor: theme.colors.background },
  };
}
